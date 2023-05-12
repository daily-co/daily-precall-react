/* Loopback test that checks the users internet connection. Uses the NetworkTester for this. */
import { RTCStatsReportStat, Throughput } from '../types.ts';
import ConnectionTester from './ConnectionTester.ts';

export default class ConnectionStats {
	intervalId: string;
	timeoutId: string;
	roundTripTimes: number[];
	iceServers: RTCIceServer[];
	mediaStream: MediaStream;
	networkTester: ConnectionTester | undefined;
	peerConnection: RTCPeerConnection | undefined | null;

	constructor({
		iceServers,
		mediaStream,
	}: {
		iceServers: RTCIceServer[];
		mediaStream: MediaStream;
	}) {
		this.intervalId = '';
		this.timeoutId = '';
		this.roundTripTimes = [];
		this.iceServers = iceServers;
		this.mediaStream = mediaStream;
	}

	/**
	 * Sets up the RTCPeerConnection for the network test
	 * @returns {Promise<void>} Resolves when the RTCPeerConnection is successfully set up
	 */
	async setupPeerConnection() {
		this.networkTester = new ConnectionTester({
			iceServers: this.iceServers,
			mediaStream: this.mediaStream,
		});

		await this.networkTester.setupRTCPeerConnection();
		this.peerConnection = this.networkTester.localPeer;
	}

	/**
	 * Set up the peer connection and initialize roundTripTimes array.
	 * @returns {Promise<void>} A Promise that resolves when the connection is set up and the array is initialized.
	 */
	async startContinuouslySampling() {
		await this.setupPeerConnection();
		this.roundTripTimes = [];
	}

	/**
	 * Periodically retrieves the current round trip time and returns an object containing the maximum round trip time and packet loss.
	 * @returns {{ maxRTT: number, packetLoss: number }}
	 */
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

	/**
	 * Samples the current round trip time and adds it to the `roundTripTimes` array.
	 */
	async getRoundTripTimePeriodically() {
		const rtt = await this.sampleRoundTripTime();
		rtt && this.roundTripTimes.push(rtt);
	}

	/**
	 * Samples the current round trip time by retrieving stats from the peer connection.
	 * @returns {Promise<number>} A Promise that resolves with the current round trip time in seconds.
	 */
	sampleRoundTripTime() {
		return this.peerConnection?.getStats().then((statsMap: RTCStatsReport) => {
			const statsObject = this.mapToObj(statsMap);
			const stats: RTCStatsReportStat = Object.values(statsObject);

			// Filter out stats that don't have currentRoundTripTime property
			const currentRoundTripTimeStats = stats.filter((stat) => {
				return stat.currentRoundTripTime;
			});

			// Firefox is not yet spec compliant so will need this until they are
			if (currentRoundTripTimeStats.length === 0) {
				// Find the first stat with a roundTripTime property
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
				// Get the current round trip time of the nominated candidate if available
				const nominatedCurrentRoundTripTimeStats =
					currentRoundTripTimeStats.find((stat) => stat.nominated);

				return nominatedCurrentRoundTripTimeStats
					? nominatedCurrentRoundTripTimeStats.currentRoundTripTime
					: currentRoundTripTimeStats[0].currentRoundTripTime;
			}
		});
	}

	/**
	 * Retrieves the packet loss percentage from the PeerConnection
	 * @returns {Promise<number>} A Promise that resolves with the packet loss percentage as a number between 0 and 100
	 */
	async getPacketLoss() {
		return this.peerConnection?.getStats().then((statsMap: RTCStatsReport) => {
			const statsObject = this.mapToObj(statsMap);
			// Filter the stats to only include inbound RTP streams
			const stats: RTCInboundRtpStreamStats[] = Object.values(statsObject);
			// Find the video inbound RTP stream stats
			const videoPacketLossStats = stats.find((stat) => {
				return stat.kind === 'video';
			});
			// Calculate the number of packets that were lost and received
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
				// Calculate the packet loss percentage
				return (lost / lostAndReceived) * 100;
			} else {
				// If no packets were received, the packet loss percentage is 0
				return 0;
			}
		});
	}

	/**
	 * Returns the maximum round trip time from the roundTripTimes array.
	 * @returns {number} - The maximum round trip time.
	 */
	getMaxRtt() {
		return Math.max(...this.roundTripTimes);
	}

	closeConnection() {
		this.networkTester?.stop();
	}

	/**
	 * Stops the network quality sampling process by clearing the interval and timeout, and closing the connection.
	 */
	stopSampling() {
		clearInterval(this.intervalId);
		clearTimeout(this.timeoutId);
		this.closeConnection();
	}

	/**
	 * Convert RTCStatsReport to an object
	 * @param {RTCStatsReport} statsReport - The stats report to convert
	 * @returns {Object} An object containing the stats report
	 */
	mapToObj(statsReport: RTCStatsReport) {
		if (!statsReport.entries) {
			return statsReport;
		}

		const newObject: { [key: string]: string } = {};
		statsReport.forEach((value, key) => {
			newObject[key] = value;
		});

		return newObject;
	}
}

const RTT_LIMIT = 1.0;
const RTT_WARNING = 0.7;
const PACKETLOSS_LIMIT = 10;
const PACKETLOSS_WARNING = 5;

/**
 * Determine network test result based on network statistics.
 * @param {Throughput} networkStats - Object containing maxRTT and packetLoss properties.
 * @returns {string} - Test result ('good', 'warning', or 'bad') or 'failed' if required properties are missing.
 */
export const getResultFromNetworkTest = (networkStats: Throughput) => {
	if (!networkStats) {
		// connection failed so no stats available
		return 'failed';
	}

	let rtt = '';
	let quality = '';

	if (networkStats.maxRTT !== null && networkStats.maxRTT >= RTT_LIMIT) {
		rtt = 'bad';
	} else if (
		networkStats.maxRTT !== null &&
		networkStats.maxRTT >= RTT_WARNING
	) {
		rtt = 'warning';
	} else {
		rtt = 'good';
	}

	if (
		networkStats.packetLoss !== null &&
		typeof networkStats.packetLoss !== 'undefined' &&
		networkStats.packetLoss >= PACKETLOSS_LIMIT
	) {
		quality = 'bad';
	} else if (
		networkStats.packetLoss !== null &&
		typeof networkStats.packetLoss !== 'undefined' &&
		networkStats.packetLoss >= PACKETLOSS_WARNING
	) {
		quality = 'warning';
	} else {
		quality = 'good';
	}

	if (rtt === 'good' && quality === 'good') {
		return 'good';
	} else if (rtt === 'bad' || quality === 'bad') {
		return 'bad';
	} else {
		return 'warning';
	}
};
