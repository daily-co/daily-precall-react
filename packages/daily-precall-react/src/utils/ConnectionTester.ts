import { RTCPeerConnectionWithBuffers } from '../types.ts';

export default class ConnectionTester {
	iceServers: RTCIceServer[];
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

	/**
	 * Creates a new WebRTC connection object
	 * @param {{iceServers: RTCIceServer[] | mediaStream: MediaStream;}} options
	 */
	constructor({
		iceServers,
		mediaStream,
	}: {
		iceServers: RTCIceServer[];
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

	/**
	 * Sets up an RTCPeerConnection for establishing a WebRTC connection
	 * @returns {Promise<void>} - A Promise that resolves once the RTCPeerConnection is set up
	 */
	async setupRTCPeerConnection() {
		/**
		 * Do nothing if the RTCPeerConnection API is not available
		 */
		if (!global.RTCPeerConnection) {
			return;
		}
		const rtcConfig: RTCConfiguration = {
			iceServers: this.iceServers as RTCIceServer[],
			iceTransportPolicy: 'relay',
		};

		this.localPeer = new RTCPeerConnection(rtcConfig);
		this.remotePeer = new RTCPeerConnection(rtcConfig);

		/**
		 * Workaround for a bug where if you add ICE candidates before setRemoteDescription,
		 * the RTCPeerConnection fails
		 */
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

	/**
	 * Sets up event listeners for the local and remote peers.
	 */
	setupPeerListeners() {
		// Make sure there is a local peer before adding listeners
		if (!this.localPeer) return;
		// Add listener for when the local peer generates an ICE candidate
		this.localPeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				// If there are no more ICE candidates, send any buffered candidates to the remote peer
				this.flushIceCandidates(this.remotePeer);
			} else {
				if (this.remotePeer?.bufferedIceCandidates) {
					// If there are buffered ICE candidates, add the new candidate to the buffer
					this.remotePeer.bufferedIceCandidates.push(event.candidate);
				} else {
					// Otherwise, add the new candidate directly to the remote peer
					this.remotePeer?.addIceCandidate(event.candidate);
				}
			}
		};

		// Make sure there is a remote peer before adding listeners
		if (!this.remotePeer) return;

		this.remotePeer.onicecandidate = (event) => {
			if (!event.candidate || !event.candidate.candidate) {
				// If there are no more ICE candidates, send any buffered candidates to the local peer
				this.flushIceCandidates(this.localPeer);
			} else {
				if (this.localPeer?.bufferedIceCandidates) {
					// If there are buffered ICE candidates, add the new candidate to the buffer
					this.localPeer.bufferedIceCandidates.push(event.candidate);
				} else {
					// Otherwise, add the new candidate directly to the local peer
					this.localPeer?.addIceCandidate(event.candidate);
				}
			}
		};

		// Add listener for changes to the local peer's connection state
		if (this.localPeer.connectionState) {
			this.localPeer.onconnectionstatechange = () =>
				this.onConnectionStateChange();
		} else {
			// Legacy connection state
			this.localPeer.oniceconnectionstatechange = () =>
				this.onIceConnectionStateChange();
		}
	}

	/**
	 * Starts the WebRTC connection process by adding the local media stream,
	 * creating an offer, creating an answer, and flushing ICE candidates to both peers.
	 * @returns {Promise<void>} - A Promise that resolves when the connection process is complete.
	 */
	async start() {
		if (this.mediaStream) {
			this.addStream();
		}

		await this.createOffer();
		await this.createAnswer();
		/* Flushing ICE candidates to both the local and remote peers ensures that
		 * any previously buffered ICE candidates are sent before the connection process is complete.
		 * This helps to ensure that the WebRTC connection is established successfully.
		 * */
		await this.flushIceCandidates(this.localPeer);
		await this.flushIceCandidates(this.remotePeer);
	}

	/**
	 * Sends any buffered ICE candidates to the specified peer, and clears the buffer.
	 *
	 * @param {RTCPeerConnectionWithBuffers | null} peer - The peer to send the ICE candidates to.
	 * @returns {void} - Returns nothing.
	 */
	flushIceCandidates(peer: RTCPeerConnectionWithBuffers | null) {
		peer?.bufferedIceCandidates?.forEach((c) => peer.addIceCandidate(c));
		if (peer?.bufferedIceCandidates) {
			peer.bufferedIceCandidates = null;
		}
	}

	addStream() {
		if (!this.mediaStream) return;
		this.mediaStream.getTracks().forEach((track) => {
			this.localPeer?.addTrack(track);
			this.remotePeer?.addTrack(track);
		});
	}

	/**
	 * Creates an offer to start a WebRTC session, and sets it as the local peer's local session description.
	 * @returns {Promise<void>} - Returns a promise that resolves when the local session description has been set.
	 */
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

	/**
	 * Creates an answer to an offer received from the remote peer, and sets it as the remote peer's local session description.
	 * @returns {Promise<void>} - Returns a promise that resolves when the remote session description has been set.
	 */
	createAnswer() {
		return this.remotePeer?.createAnswer(this.offerOptions).then((desc) => {
			const description = desc as RTCSessionDescription;
			return this.setDescription(description, this.remotePeer, this.localPeer);
		});
	}

	/**
	 * Callback function called when the local ICE connection state changes.
	 * @returns {void}
	 */
	onIceConnectionStateChange(): void {
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

	/**
	 * Legacy callback function called when the local connection state changes.
	 * @returns {void}
	 */
	onConnectionStateChange(): void {
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
	/**
	 * Stops the WebRTC connection by closing the local and remote peer connections.
	 * @returns {void}
	 */
	stop(): void {
		try {
			this.localPeer?.close();
			this.remotePeer?.close();
		} catch (e) {
			// ignore errors from close
		}
	}
}
