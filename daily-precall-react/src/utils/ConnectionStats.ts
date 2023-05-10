import ConnectionTester from './ConnectionTester.ts';
import {
	IceServerInterface,
	RTCStatsReportStat,
	Throughput,
} from '../types.ts';

export default class ConnectionStats {
	intervalId: string;
	timeoutId: string;
	roundTripTimes: number[];
	iceServers: IceServerInterface[];
	mediaStream: MediaStream;
	limitSamples: boolean;
	networkTester: ConnectionTester | undefined;
	peerConnection: RTCPeerConnection | undefined | null;

	constructor({
		iceServers,
		mediaStream,
		limitSamples = true,
	}: {
		iceServers: IceServerInterface[];
		mediaStream: MediaStream;
		limitSamples: boolean;
	}) {
		this.intervalId = '';
		this.timeoutId = '';
		this.roundTripTimes = [];
		this.iceServers = iceServers;
		this.mediaStream = mediaStream;
		this.limitSamples = limitSamples;
	}

	async setupPeerConnection() {
		this.networkTester = new ConnectionTester({
			iceServers: this.iceServers,
			mediaStream: this.mediaStream,
		});

		await this.networkTester.setupRTCPeerConnection();
		this.peerConnection = this.networkTester.localPeer;
	}

	async startContinuouslySampling() {
		await this.setupPeerConnection();
		this.roundTripTimes = [];
	}

	async getSample() {
		if (!this.peerConnection) {
			throw new Error('You need at peerConnection to continue');
		}

		await this.getRoundTripTimePeriodically();

		return {
			maxRTT: this.getMaxRtt(),
			packetLoss: await this.getPacketLoss(),
		};
	}

	async getRoundTripTimePeriodically() {
		const rtt = await this.sampleRoundTripTime();

		// We need to shift in the network debugger, but not in the media device selector page/network tester.
		// In the debugger it's not helpful to keep older results around (especially if you're moving around or
		// trying different things), but in the network tester you probably won't be doing this.
		if (this.roundTripTimes.length > 9 && this.limitSamples) {
			this.roundTripTimes.shift();
		}

		rtt && this.roundTripTimes.push(rtt);
	}

	sampleRoundTripTime() {
		return this.peerConnection?.getStats().then((statsMap: RTCStatsReport) => {
			const statsObject = this.mapToObj(statsMap);
			const stats: RTCStatsReportStat = Object.values(statsObject);

			const currentRoundTripTimeStats = stats.filter((stat) => {
				return stat.currentRoundTripTime;
			});

			// Firefox is not yet spec compliant so will need this until they are
			if (currentRoundTripTimeStats.length === 0) {
				const roundTripTimeStats = stats.find((stat) => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore - it exists!
					return typeof stat.roundTripTime === 'number';
				});

				if (!roundTripTimeStats) {
					return 0;
				}

				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore - it exists!
				return roundTripTimeStats.roundTripTime / 1000;
			} else {
				const nominatedCurrentRoundTripTimeStats =
					currentRoundTripTimeStats.find((stat) => stat.nominated);

				return nominatedCurrentRoundTripTimeStats
					? nominatedCurrentRoundTripTimeStats.currentRoundTripTime
					: currentRoundTripTimeStats[0].currentRoundTripTime;
			}
		});
	}

	async getPacketLoss() {
		return this.peerConnection?.getStats().then((statsMap: RTCStatsReport) => {
			const statsObject = this.mapToObj(statsMap);
			const stats: RTCInboundRtpStreamStats[] = Object.values(statsObject);

			const videoPacketLossStats = stats.find((stat) => {
				return stat.kind === 'video';
			});

			const lost =
				videoPacketLossStats && videoPacketLossStats.packetsLost
					? videoPacketLossStats.packetsLost
					: 0;
			const received =
				videoPacketLossStats && videoPacketLossStats.packetsReceived
					? videoPacketLossStats.packetsReceived
					: 0;
			const lostAndReceived = lost + received;

			if (received > 0) {
				return (lost / lostAndReceived) * 100;
			} else {
				return 0;
			}
		});
	}

	getMaxRtt() {
		return Math.max(...this.roundTripTimes);
	}

	closeConnection() {
		this.networkTester?.stop();
	}

	stopSampling() {
		clearInterval(this.intervalId);
		clearTimeout(this.timeoutId);
		this.closeConnection();
	}

	mapToObj(m: RTCStatsReport) {
		if (!m.entries) {
			return m;
		}

		const o = {};
		m.forEach((v, k) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			o[k] = v;
		});
		return o;
	}
}

const RTT_LIMIT = 1.0;
const RTT_WARNING = 0.7;
const PACKETLOSS_LIMIT = 10;
const PACKETLOSS_WARNING = 5;

export const getResultFromNetworkTest = (networkStats: Throughput) => {
	const result = {
		rtt: '',
		packetLoss: '',
	};

	if (!networkStats) {
		// connection failed so no stats available
		return 'failed';
	}

	switch (true) {
		case networkStats.maxRTT >= RTT_LIMIT:
			result.rtt = 'bad';
			break;
		case networkStats.maxRTT >= RTT_WARNING:
			result.rtt = 'warning';
			break;

		case networkStats.maxRTT < RTT_WARNING:
			result.rtt = 'good';
			break;
		default:
			break;
	}

	if (typeof networkStats.packetLoss !== 'undefined') {
		if (networkStats.packetLoss >= PACKETLOSS_LIMIT) {
			result.packetLoss = 'bad';
		} else if (networkStats.packetLoss >= PACKETLOSS_WARNING) {
			result.packetLoss = 'warning';
		} else if (networkStats.packetLoss < PACKETLOSS_WARNING) {
			result.packetLoss = 'good';
		}
	}
	const good = result.packetLoss === 'good' && result.rtt === 'good';

	const bad =
		result.packetLoss === 'bad' ||
		result.rtt === 'bad' ||
		(result.rtt === 'warning' && result.packetLoss === 'warning');

	if (good) {
		return 'good';
	}

	if (bad) {
		return 'bad';
	}

	return 'warning';
};
