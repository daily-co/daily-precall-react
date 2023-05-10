import '@testing-library/jest-dom';

class MediaStream {
	tracks: MediaStreamTrack[] = [];

	constructor(tracks: MediaStreamTrack[]) {
		this.tracks = tracks;
	}

	getAudioTracks() {
		return this.tracks.filter((t) => t.kind === 'audio');
	}

	getVideoTracks() {
		return this.tracks.filter((t) => t.kind === 'video');
	}

	getTracks() {
		return this.tracks;
	}
}

class RTCPeerConnection {
	async createOffer() {
		return;
	}
	async createAnswer() {
		return;
	}
	setLocalDescription() {
		return;
	}
	setRemoteDescription() {
		return;
	}
}

Object.defineProperty(window, 'MediaStream', {
	value: MediaStream,
});

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
	value: () => {},
});

Object.defineProperty(window, 'RTCPeerConnection', {
	value: RTCPeerConnection,
});

global.fetch = jest.fn();
