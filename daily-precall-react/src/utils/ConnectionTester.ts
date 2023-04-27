export default class ConnectionTester {
  private readonly iceServers: any;
  private localPeer: null;
  private remotePeer: null;
  private readonly mediaStream: MediaStream;
  private offerOptions: {
    offerToReceiveAudio: boolean;
    offerToReceiveVideo: boolean;
  };
  // @ts-ignore
  private connectionEstablished: (
    value: PromiseLike<unknown> | unknown
  ) => void;
  private connectionFailed: ((reason?: any) => void) | undefined;
  private connectionTimeout: number | undefined;

  // @ts-ignore
  constructor({ iceServers, mediaStream }) {
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
    const rtcConfig = {
      iceServers: this.iceServers,
      iceTransportPolicy: "relay",
    };

    // @ts-ignore
    this.localPeer = new RTCPeerConnection(rtcConfig);
    // @ts-ignore
    this.remotePeer = new RTCPeerConnection(rtcConfig);

    // @ts-ignore
    global.localPeer = this.localPeer;

    // There is a bug where if you add ice candidates before setRemoteDEscription, the PC fails.
    // @ts-ignore
    this.localPeer.bufferedIceCandidates = [];
    // @ts-ignore
    this.remotePeer.bufferedIceCandidates = [];

    this.setupPeerListeners();
    await this.start();
    return new Promise((resolve, reject) => {
      this.connectionEstablished = resolve;
      this.connectionFailed = reject;
      // @ts-ignore
      this.connectionTimeout = global.setTimeout(this.connectionFailed, 15000);
    });
  }

  setupPeerListeners() {
    // @ts-ignore
    this.localPeer.onicecandidate = (event) => {
      if (!event.candidate || !event.candidate.candidate) {
        this.flushIceCandidates(this.remotePeer);
      } else {
        // @ts-ignore
        if (this.remotePeer.bufferedIceCandidates) {
          // @ts-ignore
          this.remotePeer.bufferedIceCandidates.push(event.candidate);
        } else {
          // @ts-ignore
          this.remotePeer.addIceCandidate(event.candidate);
        }
      }
    };

    // @ts-ignore
    this.remotePeer.onicecandidate = (event) => {
      if (!event.candidate || !event.candidate.candidate) {
        this.flushIceCandidates(this.localPeer);
      } else {
        // @ts-ignore
        if (this.localPeer.bufferedIceCandidates) {
          // @ts-ignore
          this.localPeer.bufferedIceCandidates.push(event.candidate);
        } else {
          // @ts-ignore
          this.localPeer.addIceCandidate(event.candidate);
        }
      }
    };

    // @ts-ignore
    if (this.localPeer.connectionState) {
      // @ts-ignore
      this.localPeer.onconnectionstatechange = () =>
        // @ts-ignore
        this.onConnectionStateChange(this.localPeer.connectionState);
    } else {
      // Legacy connection state
      // @ts-ignore
      this.localPeer.oniceconnectionstatechange = (event) =>
        // @ts-ignore
        this.onIceConnectionStateChange(event);
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

  flushIceCandidates(
    peer: {
      bufferedIceCandidates: any[] | null;
      addIceCandidate: (arg0: any) => any;
    } | null
  ) {
    // @ts-ignore
    peer.bufferedIceCandidates?.forEach((c) => peer.addIceCandidate(c));
    // @ts-ignore
    peer.bufferedIceCandidates = null;
  }

  addStream() {
    this.mediaStream.getTracks().forEach((track) => {
      // @ts-ignore
      this.localPeer.addTrack(track);
      // @ts-ignore
      this.remotePeer.addTrack(track);
    });
  }

  createOffer() {
    // @ts-ignore
    return this.localPeer
      .createOffer(this.offerOptions)
      .then((desc: any) =>
        this.setDescription(desc, this.localPeer, this.remotePeer)
      );
  }

  async setDescription(
    desc: any,
    local: { setLocalDescription: (arg0: any) => any } | null,
    remote: { setRemoteDescription: (arg0: any) => any } | null
  ) {
    // @ts-ignore
    await local.setLocalDescription(desc);
    // @ts-ignore
    await remote.setRemoteDescription(desc);
  }

  createAnswer() {
    // @ts-ignore
    return this.remotePeer
      .createAnswer(this.offerOptions)
      .then((desc: any) =>
        this.setDescription(desc, this.remotePeer, this.localPeer)
      );
  }

  // Legacy
  onIceConnectionStateChange() {
    // @ts-ignore
    const { iceConnectionState } = this.localPeer;
    if (iceConnectionState === "failed") {
      // @ts-ignore
      this.connectionFailed();
      this.stop();
    }
    if (
      iceConnectionState === "connected" ||
      iceConnectionState === "completed"
    ) {
      // @ts-ignore
      this.connectionEstablished();
      global.clearTimeout(this.connectionTimeout);
    }
  }

  onConnectionStateChange() {
    // @ts-ignore
    const { connectionState } = this.localPeer;
    if (connectionState === "failed") {
      // @ts-ignore
      this.connectionFailed();
      this.stop();
    }
    if (connectionState === "connected") {
      // @ts-ignore
      this.connectionEstablished();
      global.clearTimeout(this.connectionTimeout);
    }
  }

  stop() {
    try {
      // @ts-ignore
      this.localPeer.close();
      // @ts-ignore
      this.remotePeer.close();
    } catch (e) {
      // ignore errors from close
    }
  }
}
