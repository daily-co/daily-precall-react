import { CONNECTION_MODES, CONNECTION_STATUS } from './constants.ts';
import { IceServerInterface, RTCPeerConnectionWithBuffers } from '../types.ts';

export default class NetworkTester {
	/**
	 * Contains the STUN or TURN servers for the connection.
	 */
	iceServers: RTCIceServer[] | IceServerInterface[];
	connectionMode: string;
	natService: string;

	localPeer: RTCPeerConnectionWithBuffers | null;
	remotePeer: RTCPeerConnectionWithBuffers | null;

	constraints: {
		video: {
			facingMode: string;
			width: number;
			deviceId: string;
			height: number;
		};
		audio: { deviceId: string };
	};

	offerOptions: {
		offerToReceiveAudio: boolean;
		offerToReceiveVideo: boolean;
	};

	connectionTimeout: ReturnType<typeof setTimeout>;
	flushTimeout: ReturnType<typeof setTimeout>;
	connectionState: RTCPeerConnectionState | undefined;
	event: Event;

	resolve: (value: {
		iceCandidates?: IceServerInterface[];
		status: string;
	}) => void;
	reject: () => void;

	/**
	 * Constructor for the NetworkTester class.
	 * @constructor
	 * @param {string} natService - The NAT service to use for the connection.
	 * @param {string} connectionMode - The connection mode to use for the connection.
	 * @param {IceServerInterface[]} iceServers - The array of STUN or TURN servers to use for the connection.
	 */
	constructor({
		natService,
		connectionMode = CONNECTION_MODES.ALL,
		iceServers,
	}: {
		natService: string;
		connectionMode: string;
		iceServers: IceServerInterface[];
	}) {
		switch (connectionMode) {
			case 'all':
				this.iceServers = iceServers;
				break;
			case 'stun':
				this.iceServers = iceServers.filter(
					(url) =>
						url?.url?.startsWith('stun:') || url?.urls?.startsWith('stun:'),
				);
				break;
			case 'turn-udp':
				this.iceServers = iceServers.filter(
					(url) => url?.url?.startsWith('turn:') && url?.url?.endsWith('udp'),
				);
				break;
			case 'turn-tcp':
				this.iceServers = iceServers.filter(
					(url) => url?.url?.startsWith('turn:') && url?.url?.endsWith('tcp'),
				);
				break;
			case 'turn-tls':
				this.iceServers = iceServers.filter((url) => url?.url?.includes('443'));
				break;
			default:
				this.iceServers = iceServers;
		}
		this.connectionMode = connectionMode;
		this.natService = natService;
		this.localPeer = null;
		this.remotePeer = null;
		this.constraints = {
			video: {
				deviceId: 'default',
				facingMode: 'user',
				width: 1280,
				height: 720,
			},
			audio: {
				deviceId: 'default',
			},
		};
		this.offerOptions = {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true,
		};
	}

	/**
	 * Sets up an RTCPeerConnection with the given ICE servers and ice transport policy.
	 * @returns {Promise<unknown>} A promise that resolves when the RTCPeerConnection is established.
	 */
	async setupRTCPeerConnection(): Promise<unknown> {
		const iceTransportPolicy = this.connectionMode.startsWith('turn')
			? 'relay'
			: 'all';

		const rtcConfig: RTCConfiguration = {
			iceServers: this.iceServers as RTCIceServer[],
			iceTransportPolicy,
		};

		this.localPeer = <RTCPeerConnectionWithBuffers>(
			new RTCPeerConnection(rtcConfig)
		);
		this.remotePeer = <RTCPeerConnectionWithBuffers>(
			new RTCPeerConnection(rtcConfig)
		);

		// There is a bug where if you add ice candidates before setRemoteDescription, the PC fails.
		this.localPeer.bufferedIceCandidates = [];
		this.remotePeer.bufferedIceCandidates = [];
		this.localPeer.iceCandidates = [];

		this.setupPeerListeners();
		await this.start();

		return new Promise((resolve, reject) => {
			// Set up a timeout to resolve the promise after 15 seconds.
			this.resolve = resolve;
			this.reject = reject;
			this.connectionTimeout = global.setTimeout(() => {
				const connectionInfo = this.getConnectionInfo();
				this.resolve(connectionInfo);
			}, 15000); //@TODO variable?

			// Set up a timeout to flush the ice candidates after 7.5 seconds of gathering.
			this.flushTimeout = global.setTimeout(() => {
				this.flushIceCandidates(this.localPeer);
				this.flushIceCandidates(this.remotePeer);
			}, 7500);
		});
	}

	/**
	 * Sets up the listeners for the local and remote peers, including
	 * handling of ICE candidates and connection state changes.
	 */
	setupPeerListeners() {
		if (!this.localPeer) return;

		// Handle local peer ICE candidates.
		this.localPeer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (
				this.connectionMode === CONNECTION_MODES.STUN &&
				event.candidate?.type === 'host'
			) {
				// Don't allow host candidates in STUN mode.
				return;
			}

			if (!event.candidate || !event.candidate.candidate) {
				// Flush ICE candidates if no candidate is available.
				this.flushIceCandidates(this.remotePeer);
				return;
			}

			// Add the candidate to the local peer's ICE candidates and the
			// remote peer's buffered ICE candidates.
			this.localPeer?.iceCandidates?.push(event.candidate);
			this.remotePeer?.bufferedIceCandidates?.push(event.candidate);
		};

		if (!this.remotePeer) return;

		// Handle remote peer ICE candidates.
		this.remotePeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.localPeer);
				return;
			}
			this.localPeer?.bufferedIceCandidates?.push(event.candidate);
		};

		// Handle connection state changes for the local peer.
		if (this.localPeer.connectionState) {
			this.localPeer.onconnectionstatechange = () =>
				this.onConnectionStateChange(this.localPeer?.connectionState);
		} else {
			// Legacy connection state
			this.localPeer.oniceconnectionstatechange = (event) =>
				this.onIceConnectionStateChange(event);
		}
	}

	async start() {
		await this.createOffer();
		await this.createAnswer();
	}

	flushIceCandidates(peer: RTCPeerConnectionWithBuffers | null) {
		peer?.bufferedIceCandidates?.forEach((c) => peer.addIceCandidate(c));
		if (peer?.bufferedIceCandidates) {
			peer.bufferedIceCandidates = [];
		}
	}

	async createOffer() {
		return this.localPeer?.createOffer(this.offerOptions).then(async (desc) => {
			const description = desc as RTCSessionDescription;
			return this.setDescription(description, this.localPeer, this.remotePeer);
		});
	}

	async setDescription(
		desc: RTCSessionDescription,
		local: RTCPeerConnectionWithBuffers | null,
		remote: RTCPeerConnectionWithBuffers | null,
	) {
		await local?.setLocalDescription(desc);
		await remote?.setRemoteDescription(desc);
	}

	/**
	 * Creates an answer to the remote peer's offer and sets it as the local peer's description.
	 * @returns {Promise<void>} A promise that resolves once the local peer's description is set.
	 */
	async createAnswer(): Promise<void> {
		try {
			const description = await this.remotePeer?.createAnswer(
				this.offerOptions,
			);
			await this.setDescription(
				description as RTCSessionDescription,
				this.remotePeer,
				this.localPeer,
			);
		} catch (error) {
			console.error('Failed to create answer:', error);
		}
	}

	/**
	 * Returns information about the current WebRTC connection.
	 * @returns {Object} An object with `candidates` and `status` properties.
	 */
	getConnectionInfo() {
		// Get local ice candidates, connection state, and ice connection state.
		const candidates = this.localPeer?.iceCandidates;
		const state = this.localPeer?.connectionState;
		const iceState = this.localPeer?.iceConnectionState;

		// Determine the connection status based on the connection and ice connection states.
		const status =
			state || iceState === 'connected'
				? CONNECTION_STATUS.CONNECTED
				: CONNECTION_STATUS.FAILED;

		// Return an object with the candidates and status.
		return {
			candidates,
			status,
		};
	}

	/**
	 * Handler for RTCPeerConnection's connection state change event.
	 * @param {RTCPeerConnectionState|undefined} connectionState - The new connection state.
	 * @return {void}
	 */
	onConnectionStateChange(connectionState: RTCPeerConnectionState | undefined) {
		this.connectionState = connectionState;
		if (
			this.localPeer?.connectionState === 'failed' ||
			this.localPeer?.connectionState === 'connected'
		) {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			this.stop();
		}
	}

	/**
	 * Callback for when the iceConnectionState changes. Used for Firefox, since it doesn't support connectionState, only iceConnectionState.
	 * @param {Event} event - The event object containing the state change information.
	 */
	onIceConnectionStateChange(event: Event) {
		this.event = event;
		const iceState = this.localPeer?.iceConnectionState;
		if (iceState === 'failed') {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			this.stop();
		}
		if (iceState === 'connected' || iceState === 'completed') {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			global.clearTimeout(this.connectionTimeout);
			global.clearTimeout(this.flushTimeout);
		}
	}

	/**
	 * Stops the RTCPeerConnections and clears connectionTimeout and flushTimeout timeouts.
	 */
	stop(): void {
		try {
			this.localPeer?.close();
			this.remotePeer?.close();
			global.clearTimeout(this.connectionTimeout);
			global.clearTimeout(this.flushTimeout);
		} catch {
			// Failed to close RTCPeerConnections
		}
	}
}
