const elementMap = new WeakMap();
declare global {
	var audioContext: AudioContext;
}

interface AudioContextAnalyser extends AudioContext {
	setSinkId?: (deviceId: string) => void;
}

type AudioSrc =
	| MediaStream
	| MediaStreamAudioSourceNode
	| MediaElementAudioSourceNode
	| null;

export class AudioAnalyser {
	private readonly audioContext: AudioContextAnalyser;
	private readonly bufferLength: number;

	private readonly analyser: AnalyserNode;

	audioSrc: AudioSrc;

	sum!: number;
	frameId!: number;

	constructor() {
		this.audioContext = globalThis.audioContext
			? globalThis.audioContext
			: new globalThis.AudioContext();

		this.analyser = this.audioContext.createAnalyser();
		this.bufferLength = this.analyser.frequencyBinCount;
		this.audioSrc = null;
	}

	analyseStream(stream: MediaStreamTrack) {
		const newStream = new MediaStream([stream]);
		this.audioSrc = this.audioContext.createMediaStreamSource(newStream);
		this.audioSrc.connect(this.analyser);
	}

	analyseAudioElement(audioElement: HTMLAudioElement) {
		if (elementMap.has(audioElement)) {
			this.audioSrc = elementMap.get(audioElement);
		} else {
			this.audioSrc = this.audioContext.createMediaElementSource(audioElement);
			elementMap.set(audioElement, this.audioSrc);
		}
		if (this.audioSrc && 'connect' in this.audioSrc) {
			this.audioSrc.connect(this.analyser);
		}
	}

	setSinkId(deviceId: string) {
		if (this.audioContext.setSinkId) {
			this.audioContext.setSinkId(deviceId);
		}
	}

	startSamplingSound() {
		this.frameId = 0;
		this.sum = 0;
		const testSound = () => {
			this.frameId = requestAnimationFrame(() => testSound());
			const dataArray = new Uint8Array(this.bufferLength);
			this.analyser.getByteFrequencyData(dataArray);
			this.sum += dataArray.reduce((a, b) => a + b, 0);
		};
		testSound();
	}

	isMakingSound() {
		if (this.sum > 0) {
			// we can stop looking for audio
			globalThis.cancelAnimationFrame(this.frameId);
			return true;
		}
		return false;
	}

	getByteFrequencyData() {
		const dataArray = new Uint8Array(this.bufferLength);
		this.analyser.getByteFrequencyData(dataArray);
		return dataArray;
	}

	createOutput() {
		this.analyser.connect(this.audioContext.destination);
	}

	disconnectAnalyser() {
		this.analyser.disconnect();
	}

	close() {
		if (this.frameId !== 0) {
			globalThis.cancelAnimationFrame(this.frameId);
		}
		if (this.audioContext.state !== 'closed') {
			void this.audioContext.close();
		}
	}
}
