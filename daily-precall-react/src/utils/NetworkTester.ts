// @ts-nocheck
import {
	CONNECTION_MODES,
	CONNECTION_STATUS,
	NAT_SERVICES,
} from './constants.js';

interface RTCPeerConnectionWithCandidates extends RTCPeerConnection {
	iceCandidates: any[];
	bufferedIceCandidates: RTCIceCandidate[];
}

export default class NetworkTester {
	private readonly iceServers: any;

	private readonly connectionMode: string;

	private readonly natService: any;

	localPeer: RTCPeerConnectionWithCandidates;

	private remotePeer: RTCPeerConnectionWithCandidates;

	private readonly constraints: {
		video: {
			facingMode: string;
			width: number;
			deviceId: string;
			height: number;
		};
		audio: { deviceId: string };
	};

	private readonly offerOptions: {
		offerToReceiveAudio: boolean;
		offerToReceiveVideo: boolean;
	};

	private connectionTimeout: any;

	private flushTimeout: any;

	private _connectionState: RTCPeerConnectionState;

	private _event: Event;

	private resolve: (value: { iceCandidates: any[]; status: string }) => void;

	private reject: (reason?: any) => void;

	constructor({
		natService,
		connectionMode = CONNECTION_MODES.ALL,
		iceServers,
	}) {
		if (natService === NAT_SERVICES.TWILIO) {
			switch (connectionMode) {
				case 'all':
					this.iceServers = iceServers;
					break;
				case 'stun':
					this.iceServers = iceServers.filter(
						(url) =>
							Boolean(url?.url.startsWith('stun:')) ||
							url?.urls.startsWith('stun:'),
					);
					break;
				case 'turn-udp':
					this.iceServers = iceServers.filter(
						(url) =>
							Boolean(url?.url.startsWith('turn:')) && url?.url.endsWith('udp'),
					);
					break;
				case 'turn-tcp':
					this.iceServers = iceServers.filter(
						(url) =>
							Boolean(url?.url.startsWith('turn:')) && url?.url.endsWith('tcp'),
					);
					break;
				case 'turn-tls':
					this.iceServers = iceServers.filter((url) =>
						url?.url.includes('443'),
					);
					break;
				default:
					this.iceServers = iceServers;
			}
		} else {
			switch (connectionMode) {
				case 'all':
					// Xirsys returns an object when we need an array
					this.iceServers = [iceServers];
					break;
				case 'stun':
					this.iceServers = [
						{
							...iceServers,
							urls: iceServers.urls.filter((url) => url.startsWith('stun:')),
						},
					];
					break;
				case 'turn-udp':
					this.iceServers = [
						{
							...iceServers,
							urls: iceServers.urls.filter(
								(url) =>
									Boolean(url.startsWith('turn:')) && url.endsWith('udp'),
							),
						},
					];
					break;
				case 'turn-tcp':
					this.iceServers = [
						{
							...iceServers,
							urls: iceServers.urls.filter(
								(url) =>
									Boolean(url.startsWith('turn:')) && url.endsWith('tcp'),
							),
						},
					];
					break;
				case 'turn-tls':
					this.iceServers = [
						{
							...iceServers,
							urls: iceServers.urls.filter((url) => url.startsWith('turns:')),
						},
					];
					break;
				default:
					this.iceServers = [iceServers];
			}
		}
		this.connectionMode = connectionMode;
		this.natService = natService;
		this.localPeer = null;
		this.remotePeer = null;

		// maybe make these configurable?
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
			iceServers: this.iceServers,
			iceTransportPolicy,
		};

		this.localPeer = <RTCPeerConnectionWithCandidates>(
			new RTCPeerConnection(rtcConfig)
		);
		this.remotePeer = <RTCPeerConnectionWithCandidates>(
			new RTCPeerConnection(rtcConfig)
		);

		global.localPeer = this.localPeer;

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
			this.localPeer.iceCandidates.push(event.candidate);
			this.remotePeer.bufferedIceCandidates.push(event.candidate);
		};

		this.remotePeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.localPeer);
				return;
			}
			this.localPeer.bufferedIceCandidates.push(event.candidate);
		};

		// We need this for FF
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (this.localPeer.connectionState) {
			this.localPeer.onconnectionstatechange = () =>
				this.onConnectionStateChange(this.localPeer.connectionState);
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

	flushIceCandidates(peer) {
		for (const c of peer.bufferedIceCandidates) {
			peer.addIceCandidate(c);
		}
		peer.bufferedIceCandidates = [];
	}

	async createOffer() {
		return this.localPeer
			.createOffer(this.offerOptions)
			.then(async (desc) =>
				this.setDescription(desc, this.localPeer, this.remotePeer),
			);
	}

	async setDescription(desc, local, remote) {
		await local.setLocalDescription(desc);
		await remote.setRemoteDescription(desc);
	}

	async createAnswer() {
		return this.remotePeer
			.createAnswer(this.offerOptions)
			.then(async (desc) =>
				this.setDescription(desc, this.remotePeer, this.localPeer),
			);
	}

	getConnectionInfo() {
		const { iceCandidates, connectionState, iceConnectionState } =
			this.localPeer;
		return {
			iceCandidates,
			status:
				// need to check both because of Firefox
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				connectionState || iceConnectionState === 'connected'
					? CONNECTION_STATUS.CONNECTED
					: CONNECTION_STATUS.FAILED,
		};
	}

	onConnectionStateChange(connectionState: RTCPeerConnectionState) {
		this._connectionState = connectionState;
		if (
			this.localPeer.connectionState === 'failed' ||
			this.localPeer.connectionState === 'connected'
		) {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			this.stop();
		}
	}

	// We need this for Firefox, since it doesn't support connectionState, only iceConnectionState.
	onIceConnectionStateChange(event: Event) {
		this._event = event;
		const { iceConnectionState } = this.localPeer;
		if (iceConnectionState === 'failed') {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			this.stop();
		}
		if (
			iceConnectionState === 'connected' ||
			iceConnectionState === 'completed'
		) {
			const connectionInfo = this.getConnectionInfo();
			this.resolve(connectionInfo);
			global.clearTimeout(this.connectionTimeout);
			global.clearTimeout(this.flushTimeout);
		}
	}

	stop() {
		try {
			this.localPeer.close();
			this.remotePeer.close();
			global.clearTimeout(this.connectionTimeout);
			global.clearTimeout(this.flushTimeout);
		} catch {
			// ignore errors from close
		}
	}
}
