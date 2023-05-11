import { IceServerInterface, RTCPeerConnectionWithBuffers } from '../types.ts';

export default class ConnectionTester {
	iceServers: RTCIceServer[] | IceServerInterface[];
	localPeer: RTCPeerConnectionWithBuffers | null;
	remotePeer: RTCPeerConnectionWithBuffers | null;
	mediaStream: MediaStream;
	offerOptions: {
		offerToReceiveAudio: boolean;
		offerToReceiveVideo: boolean;
	};

	connectionEstablished: () => void;
	connectionFailed: () => void;
	connectionTimeout: ReturnType<typeof setTimeout>;

	constructor({
		iceServers,
		mediaStream,
	}: {
		iceServers: RTCIceServer[] | IceServerInterface[];
		mediaStream: MediaStream;
	}) {
		this.iceServers = iceServers;
		this.localPeer = null;
		this.remotePeer = null;
		this.mediaStream = mediaStream;
		this.offerOptions = {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true,
		};
	}

	async setupRTCPeerConnection() {
		if (!global.RTCPeerConnection) {
			return;
		}
		const rtcConfig: RTCConfiguration = {
			iceServers: this.iceServers as RTCIceServer[],
			iceTransportPolicy: 'relay',
		};

		this.localPeer = new RTCPeerConnection(rtcConfig);
		this.remotePeer = new RTCPeerConnection(rtcConfig);

		// There is a bug where if you add ice candidates before setRemoteDescription, the PC fails.
		this.localPeer.bufferedIceCandidates = [];
		this.remotePeer.bufferedIceCandidates = [];

		this.setupPeerListeners();
		await this.start();
		return new Promise<void>((resolve, reject) => {
			this.connectionEstablished = resolve;
			this.connectionFailed = reject;
			this.connectionTimeout = global.setTimeout(this.connectionFailed, 15000);
		});
	}

	setupPeerListeners() {
		if (!this.localPeer) return;
		this.localPeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.remotePeer);
			} else {
				if (this.remotePeer?.bufferedIceCandidates) {
					this.remotePeer.bufferedIceCandidates.push(event.candidate);
				} else {
					this.remotePeer?.addIceCandidate(event.candidate);
				}
			}
		};

		if (!this.remotePeer) return;
		this.remotePeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				this.flushIceCandidates(this.localPeer);
			} else {
				if (this.localPeer?.bufferedIceCandidates) {
					this.localPeer.bufferedIceCandidates.push(event.candidate);
					console.log(event.candidate);
				} else {
					this.localPeer?.addIceCandidate(event.candidate);
				}
			}
		};

		if (this.localPeer.connectionState) {
			this.localPeer.onconnectionstatechange = () =>
				this.onConnectionStateChange();
		} else {
			// Legacy connection state
			this.localPeer.oniceconnectionstatechange = () =>
				this.onIceConnectionStateChange();
		}
	}

	async start() {
		if (this.mediaStream) {
			this.addStream();
		}

		await this.createOffer();
		await this.createAnswer();
		await this.flushIceCandidates(this.localPeer);
		await this.flushIceCandidates(this.remotePeer);
	}

	flushIceCandidates(peer: RTCPeerConnectionWithBuffers | null) {
		peer?.bufferedIceCandidates?.forEach((c) => peer.addIceCandidate(c));
		if (peer?.bufferedIceCandidates) {
			peer.bufferedIceCandidates = null;
		}
	}

	addStream() {
		this.mediaStream.getTracks().forEach((track) => {
			this.localPeer?.addTrack(track);
			this.remotePeer?.addTrack(track);
		});
	}

	createOffer() {
		return this.localPeer?.createOffer(this.offerOptions).then((desc) => {
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

	createAnswer() {
		return this.remotePeer?.createAnswer(this.offerOptions).then((desc) => {
			const description = desc as RTCSessionDescription;
			return this.setDescription(description, this.remotePeer, this.localPeer);
		});
	}

	// Legacy
	onIceConnectionStateChange() {
		const state = this.localPeer?.iceConnectionState;
		if (state === 'failed') {
			this.connectionFailed();
			this.stop();
		}
		if (state === 'connected' || state === 'completed') {
			this.connectionEstablished();
			global.clearTimeout(this.connectionTimeout);
		}
	}

	onConnectionStateChange() {
		const state = this.localPeer?.connectionState;
		if (state === 'failed') {
			this.connectionFailed();
			this.stop();
		}
		if (state === 'connected') {
			this.connectionEstablished();
			global.clearTimeout(this.connectionTimeout);
		}
	}

	stop() {
		try {
			this.localPeer?.close();
			this.remotePeer?.close();
		} catch (e) {
			// ignore errors from close
		}
	}
}
