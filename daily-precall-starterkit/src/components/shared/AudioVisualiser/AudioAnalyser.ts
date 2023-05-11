const elementMap = new WeakMap<HTMLAudioElement, MediaElementAudioSourceNode>();
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
	private readonly analyser: AnalyserNode;
	private readonly bufferLength: number;

	audioSrc: AudioSrc;
	sum = 0;
	frameId = 0;

	constructor(
		private readonly audioContext: AudioContextAnalyser = globalThis.audioContext ??
			new globalThis.AudioContext(),
	) {
		this.analyser = this.audioContext.createAnalyser();
		this.bufferLength = this.analyser.frequencyBinCount;
		this.audioSrc = null;
	}

	analyseStream(stream: MediaStreamTrack) {
		const newStream = new MediaStream([stream]);
		this.audioSrc = this.audioContext.createMediaStreamSource(newStream);
		this.audioSrc?.connect(this.analyser);
	}

	analyseAudioElement(audioElement: HTMLAudioElement) {
		const audioSrc =
			elementMap.get(audioElement) ??
			this.audioContext.createMediaElementSource(audioElement);
		elementMap.set(audioElement, audioSrc);
		this.audioSrc = audioSrc;
		this.audioSrc?.connect(this.analyser);
	}

	setSinkId(deviceId: string) {
		if (this.audioContext.setSinkId) {
			this.audioContext.setSinkId(deviceId);
		}
	}

	startSamplingSound() {
		this.frameId = 0;
		this.sum = 0;
		const sampleAudio = () => {
			this.frameId = requestAnimationFrame(() => sampleAudio());
			const dataArray = new Uint8Array(this.bufferLength);
			this.analyser.getByteFrequencyData(dataArray);
			this.sum += dataArray.reduce((a, b) => a + b, 0);
		};
		sampleAudio();
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
