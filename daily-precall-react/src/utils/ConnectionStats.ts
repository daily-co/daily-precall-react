import ConnectionTester from './ConnectionTester.ts';

export default class ConnectionStats {
	private readonly intervalId: string;
	private readonly timeoutId: string;
	private roundTripTimes: any[];
	private readonly iceServers: any;
	private readonly mediaStream: MediaStream;
	private readonly limitSamples: boolean;
	private networkTester: ConnectionTester | undefined;
	private peerConnection: RTCPeerConnection | undefined;

	// @ts-ignore
	constructor({ iceServers, mediaStream, limitSamples = true }) {
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
		// @ts-ignore
		this.peerConnection = this.networkTester.localPeer;
	}

	async startContinuouslySampling() {
		console.log('startContinuouslySampling');
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

		this.roundTripTimes.push(rtt);
	}

	sampleRoundTripTime() {
		// @ts-ignore
		return this.peerConnection.getStats().then((statsMap: any) => {
			const statsObject = this.mapToObj(statsMap);
			const stats = Object.values(statsObject);

			const currentRoundTripTimeStats = stats.filter(
				(stat: any) => stat.currentRoundTripTime,
			);

			if (currentRoundTripTimeStats.length === 0) {
				//Firefox is not spec compliant so will need this until they are

				const roundTripTimeStats: any = stats.find(
					(stat: any) => typeof stat.roundTripTime === 'number',
				);

				if (!roundTripTimeStats) {
					return 0;
				}

				return roundTripTimeStats.roundTripTime / 1000;
			} else {
				//Safari does not support nominated

				const nominatedCurrentRoundTripTimeStats =
					currentRoundTripTimeStats.find((stat: any) => stat.nominated);

				return nominatedCurrentRoundTripTimeStats
					? // @ts-ignore
					  nominatedCurrentRoundTripTimeStats.currentRoundTripTime
					: // @ts-ignore
					  currentRoundTripTimeStats[0].currentRoundTripTime;
			}
		});
	}

	async getPacketLoss() {
		// @ts-ignore
		return this.peerConnection.getStats().then((statsMap: any) => {
			const statsObject = this.mapToObj(statsMap);
			const stats = Object.values(statsObject);

			let packetLossStats = stats.find(
				(stat: any) =>
					typeof stat.packetsLost === 'number' && stat.mediaType === 'video',
			);

			if (!packetLossStats) {
				//Safari does not support media type
				packetLossStats = stats.find(
					(stat: any) => typeof stat.packetsLost === 'number',
				);
			}

			// @ts-ignore
			return packetLossStats && packetLossStats.packetsReceived > 0
				? // @ts-ignore
				  (packetLossStats.packetsLost /
						// @ts-ignore
						(packetLossStats.packetsLost + packetLossStats.packetsReceived)) *
						100
				: 0;
		});
	}

	getMaxRtt() {
		return Math.max.apply(Math, this.roundTripTimes);
	}

	closeConnection() {
		// @ts-ignore
		this.networkTester.stop();
	}

	stopSampling() {
		clearInterval(this.intervalId);
		clearTimeout(this.timeoutId);
		this.closeConnection();
	}

	mapToObj(m: any[]) {
		if (!m.entries) {
			return m;
		}
		const o = {};
		m.forEach(function (v: any, k: string | number) {
			// @ts-ignore
			o[k] = v;
		});
		return o;
	}
}

export const resultTypes = {
	BAD: 'bad',
	WARNING: 'warning',
	GOOD: 'good',
	CONNECTION_FAILED: 'failed',
};

const RTT_LIMIT = 1.0;
const RTT_WARNING = 0.7;
const PACKETLOSS_LIMIT = 10;
const PACKETLOSS_WARNING = 5;

export const getResultFromNetworkTest = (networkStats: {
	maxRTT: number;
	packetLoss: number;
}) => {
	if (!networkStats) {
		// connection failed so no stats available
		return resultTypes.CONNECTION_FAILED;
	}

	interface ResultInterface {
		rtt?: string;
		packetLoss?: string;
	}

	const result: ResultInterface = {};

	switch (true) {
		case networkStats.maxRTT >= RTT_LIMIT:
			result.rtt = resultTypes.BAD;
			break;
		case networkStats.maxRTT >= RTT_WARNING:
			result.rtt = resultTypes.WARNING;
			break;

		case networkStats.maxRTT < RTT_WARNING:
			result.rtt = resultTypes.GOOD;
			break;
	}

	switch (true) {
		case networkStats.packetLoss >= PACKETLOSS_LIMIT:
			result.packetLoss = resultTypes.BAD;
			break;
		case networkStats.packetLoss >= PACKETLOSS_WARNING:
			result.packetLoss = resultTypes.WARNING;
			break;

		case networkStats.packetLoss < PACKETLOSS_WARNING:
			result.packetLoss = resultTypes.GOOD;
			break;
	}

	const good =
		result.packetLoss === resultTypes.GOOD && result.rtt === resultTypes.GOOD;

	const bad =
		result.packetLoss === resultTypes.BAD ||
		result.rtt === resultTypes.BAD ||
		(result.rtt === resultTypes.WARNING &&
			result.packetLoss === resultTypes.WARNING);

	if (good) {
		return resultTypes.GOOD;
	}

	if (bad) {
		return resultTypes.BAD;
	}

	return resultTypes.WARNING;
};
