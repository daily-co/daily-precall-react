import { useCallback, useEffect, useRef, useState } from 'react';
import { ConnectionTestReport } from '../types.ts';
import { TestState } from '../DailyTest.tsx';
import { useDailyTest } from '../useDailyTest.ts';
import ConnectionStats, {
	getResultFromNetworkTest,
} from '../utils/ConnectionStats.ts';
import { NAT_SERVICES_LINKS } from '../utils/constants.ts';
import { v4 as uuidv4 } from 'uuid';
import { useCatchErrors } from '../utils/useCatchErrors.ts';

const initialThroughputTestData: ConnectionTestReport['throughput'] = {
	maxRTT: null,
	packetLoss: null,
};
const initialThroughputTestResult: ConnectionTestReport['result'] = '';

export const useConnectionTest = () => {
	const { addTestData } = useDailyTest();

	const prevState = useRef<TestState>('idle');
	const [connectionTestState, setConnectionTestState] =
		useState<TestState>('idle');
	const testDuration = useRef<number>(0);
	const networkInterval = useRef<ReturnType<typeof setInterval>>();
	const [timeElapsed, setTimeElapsed] = useState<number>(
		0 - testDuration.current,
	);

	const mediaStreamRef = useRef<MediaStream>();

	const connectionStatsTester = useRef<ConnectionStats>();
	const throughputTestData = useRef(initialThroughputTestData);
	const throughputTestResult = useRef<ConnectionTestReport['result']>(
		initialThroughputTestResult,
	);

	const { addError, errors } = useCatchErrors();

	useEffect(() => {
		if (timeElapsed < testDuration.current || !timeElapsed) return;
		setConnectionTestState('stopping');
	}, [timeElapsed]);

	const setConnectionTestResults = useCallback(() => {
		const results: ConnectionTestReport = {
			errors: errors,
			id: uuidv4(),
			result: throughputTestResult.current,
			startedAt: new Date(),
			throughput: throughputTestData.current,
		};
		addTestData('connection', results);
	}, [addTestData, errors]);

	useEffect(() => {
		const handleNewState = async () => {
			switch (connectionTestState) {
				case 'idle':
					break;
				case 'starting':
					if (!mediaStreamRef.current) return;
					const hasAudioTracks =
						mediaStreamRef.current?.getAudioTracks().length;
					const hasVideoTracks =
						mediaStreamRef.current?.getVideoTracks().length;
					if (!hasAudioTracks) {
						addError(
							'No audio track found: this may affect the throughput test results.',
						);
					}
					if (!hasVideoTracks) {
						addError(
							'No video track found: this may affect the throughput test results.',
						);
					}

					if (!hasVideoTracks && !hasAudioTracks) {
						addError(
							'No audio and video tracks found: cannot measure throughput.',
						);
						setConnectionTestState('stopping');
						return;
					}

					const service = NAT_SERVICES_LINKS.TWILIO;
					const svcResp = await fetch(service);
					const iceServers = await svcResp.json();

					connectionStatsTester.current = new ConnectionStats({
						iceServers: iceServers,
						mediaStream: mediaStreamRef.current,
					});

					await connectionStatsTester.current.startContinuouslySampling();
					setConnectionTestState('running');
					break;
				case 'running':
					networkInterval.current = setInterval(async () => {
						if (!connectionStatsTester.current) return;

						const sample = await connectionStatsTester.current.getSample();
						throughputTestData.current = sample;
						setTimeElapsed((count) => count + 1);

						throughputTestResult.current = getResultFromNetworkTest(sample);
					}, 1000);
					break;
				case 'stopping':
					connectionStatsTester.current?.stopSampling();
					clearInterval(networkInterval.current);
					testDuration.current = 0;
					setConnectionTestState('finished');
					break;
				case 'finished': {
					if (prevState.current === 'finished') return;
					setConnectionTestResults();
					delete connectionStatsTester.current;
					throughputTestData.current = initialThroughputTestData;
					throughputTestResult.current = initialThroughputTestResult;
					setTimeElapsed(0);
					break;
				}
			}
			prevState.current = connectionTestState;
		};
		handleNewState();

		return () => {
			clearInterval(networkInterval.current);
		};
	}, [addError, connectionTestState, setConnectionTestResults]);

	/**
	 * Starts the connection test.
	 * @param duration The duration of the test in seconds.
	 */
	const startConnectionTest = useCallback(
		async (mediaStream: MediaStream, duration = 15) => {
			mediaStreamRef.current = mediaStream;
			testDuration.current = duration;
			setConnectionTestState('starting');
		},
		[],
	);

	/**
	 * Stops the connection test.
	 */
	const stopConnectionTest = useCallback(() => {
		if (connectionTestState === 'finished') {
			// it's already finished so no need to do anything!
			return;
		}
		setConnectionTestState('stopping');
	}, [connectionTestState]);

	return {
		connectionTestState,
		startConnectionTest,
		stopConnectionTest,
		timeElapsed,
	};
};
