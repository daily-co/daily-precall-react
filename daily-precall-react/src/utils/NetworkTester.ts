import { CONNECTION_MODES, CONNECTION_STATUS } from './constants.ts';
import { IceServerInterface, RTCPeerConnectionWithBuffers } from '../types.ts';

export default class NetworkTester {
	iceServers: RTCIceServer[] | IceServerInterface[];
	connectionMode: string;
	natService: string;

	localPeer: null | RTCPeerConnectionWithBuffers;
	remotePeer: null | RTCPeerConnectionWithBuffers;

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
	_connectionState: RTCPeerConnectionState | undefined;
	_event: Event;

	resolve: (value: {
		iceCandidates?: IceServerInterface[];
		status: string;
	}) => void;
	reject: () => void;

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
			this.resolve = resolve;
			this.reject = reject;
			this.connectionTimeout = global.setTimeout(() => {
				const connectionInfo = this.getConnectionInfo();
				this.resolve(connectionInfo);
			}, 15000);
			this.flushTimeout = global.setTimeout(() => {
				// always flush candidates after 7 seconds of gathering
				this.flushIceCandidates(this.localPeer);
				this.flushIceCandidates(this.remotePeer);
			}, 7500);
		});
	}

	setupPeerListeners() {
		if (!this.localPeer) return;
		this.localPeer.onicecandidate = (event) => {
			if (
				this.connectionMode === CONNECTION_MODES.STUN &&
				event.candidate?.type === 'host'
			) {
				// Don't allow host candidates in STUN mode.
				return;
			}

			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.remotePeer);
				return;
			}
			this.localPeer?.iceCandidates?.push(event.candidate);
			this.remotePeer?.bufferedIceCandidates?.push(event.candidate);
		};

		if (!this.remotePeer) return;
		this.remotePeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.localPeer);
				return;
			}
			this.localPeer?.bufferedIceCandidates?.push(event.candidate);
		};

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

	async createAnswer() {
		return this.remotePeer
			?.createAnswer(this.offerOptions)
			.then(async (desc) => {
				const description = desc as RTCSessionDescription;
				return this.setDescription(
					description,
					this.remotePeer,
					this.localPeer,
				);
			});
	}

	getConnectionInfo() {
		const candidates = this.localPeer?.iceCandidates;
		const state = this.localPeer?.connectionState;
		const iceState = this.localPeer?.iceConnectionState;

		return {
			candidates,
			status:
				state || iceState === 'connected'
					? CONNECTION_STATUS.CONNECTED
					: CONNECTION_STATUS.FAILED,
		};
	}

	onConnectionStateChange(connectionState: RTCPeerConnectionState | undefined) {
		this._connectionState = connectionState;
		if (
			this.localPeer?.connectionState === 'failed' ||
			this.localPeer?.connectionState === 'connected'
		) {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			this.stop();
		}
	}

	// We need this for Firefox, since it doesn't support connectionState, only iceConnectionState.
	onIceConnectionStateChange(event: Event) {
		this._event = event;
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

	stop() {
		try {
			this.localPeer?.close();
			this.remotePeer?.close();
			global.clearTimeout(this.connectionTimeout);
			global.clearTimeout(this.flushTimeout);
		} catch {
			// ignore errors from close
		}
	}
}
