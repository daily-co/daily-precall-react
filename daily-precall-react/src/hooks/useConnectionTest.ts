import { useCallback, useEffect, useState } from 'react';
import { ConnectionTestReport } from '../types.ts';
import { TestState, useDailyTest } from '../DailyTest.tsx';
import { ErrorEvent } from '../types.ts';
import ConnectionStats, {
	getResultFromNetworkTest,
} from '../utils/ConnectionStats.ts';
import { NAT_SERVICES_LINKS } from '../utils/constants.ts';
import { v4 as uuidv4 } from 'uuid';

export const useConnectionTest = () => {
	const { addTestData, callObject } = useDailyTest();

	const [errors, setErrors] = useState<ErrorEvent[]>([]);
	const [connectionTestState, setConnectionTestState] =
		useState<TestState>('idle');
	const [testDuration, setTestDuration] = useState<number>(0);
	const [testTimeout, setTestTimeout] = useState<ReturnType<
		typeof setTimeout
	> | null>();
	const [networkInterval, setNetworkInterval] = useState<ReturnType<
		typeof setTimeout
	> | null>();
	const [timeElapsed, setTimeElapsed] = useState<number>(0 - testDuration);

	const localParticipant = callObject?.participants().local;
	const audioTrack = localParticipant?.tracks?.audio;
	const videoTrack = localParticipant?.tracks?.video;

	const [connectionStatsTester, setConnectionStatsTester] =
		useState<ConnectionStats | null>();
	const [throughputTestData, setThroughputTestData] = useState<
		ConnectionTestReport['throughput']
	>({
		maxRTT: 0,
		packetLoss: 0,
	});
	const [throughputTestResult, setThroughputTestResult] =
		useState<ConnectionTestReport['result']>('');

	useEffect(() => {
		if (testTimeout) clearTimeout(testTimeout);
		if (testDuration > 0) {
			const newTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
				setConnectionTestState('stopping');
			}, testDuration * 1000);
			setTestTimeout(newTimeout);
		}
	}, [testDuration]);

	const addError = useCallback((error: any) => {
		const newError: ErrorEvent = {
			timestamp: new Date(),
			error,
		};
		setErrors((prevState) => [...prevState, newError]);
	}, []);

	useEffect(() => {
		if (!callObject) return;
		callObject.on('error', addError);
		callObject.on('nonfatal-error', addError);

		return function cleanup() {
			callObject.off('error', addError);
			callObject.off('nonfatal-error', addError);
		};
	}, [addError, callObject]);

	const setConnectionTestResults = () => {
		const results: ConnectionTestReport = {};
		results.errors = errors;
		results.id = uuidv4();
		results.result = throughputTestResult;
		results.startedAt = new Date();
		results.throughput = throughputTestData;

		addTestData('connection', results);
	};

	useEffect(() => {
		const handleNewState = async () => {
			switch (connectionTestState) {
				case 'idle':
					break;
				case 'starting':
					const stream = new MediaStream();
					if (audioTrack?.persistentTrack) {
						stream.addTrack(audioTrack.persistentTrack);
					} else {
						addError(
							'No audio track found: this may affect the throughput test results.',
						);
					}
					if (videoTrack?.persistentTrack) {
						stream.addTrack(videoTrack.persistentTrack);
					} else {
						addError(
							'No video track found: this may affect the throughput test results.',
						);
					}

					if (!videoTrack?.persistentTrack && !audioTrack?.persistentTrack) {
						addError(
							'No audio and video tracks found: cannot create media stream needed to measure throughput.',
						);
						setConnectionTestState('stopping');
						return;
					}

					const service = NAT_SERVICES_LINKS.TWILIO;
					const svcResp = await fetch(service);
					const iceServers = await svcResp.json();

					const connectionTester = new ConnectionStats({
						iceServers: iceServers,
						mediaStream: stream,
						limitSamples: false,
					});

					await connectionTester.startContinuouslySampling();
					setConnectionStatsTester(connectionTester);
					setConnectionTestState('running');
					break;
				case 'running':
					const n = setInterval(async () => {
						const sample = await connectionStatsTester?.getSample();

						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						setThroughputTestData(sample);
						setTimeElapsed((count) => count + 1);

						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						const verdict = getResultFromNetworkTest(sample);
						setThroughputTestResult(verdict);
					}, 1000);
					setNetworkInterval(n);
					break;
				case 'stopping':
					connectionStatsTester?.stopSampling();
					if (networkInterval) {
						clearInterval(networkInterval);
					}
					if (testTimeout) {
						clearTimeout(testTimeout);
					}
					setTestDuration(0);
					setTestTimeout(null);
					setConnectionStatsTester(null);
					setConnectionTestState('finished');
					setTimeElapsed(0);
					break;
				case 'finished':
					setConnectionTestResults();
					break;
			}
		};
		handleNewState();

		return () => {
			if (networkInterval) clearInterval(networkInterval);
		};
		// @TODO: fix dependencies
	}, [
		connectionTestState,
		addError,
		videoTrack?.persistentTrack,
		audioTrack?.persistentTrack,
	]);

	/**
	 * Starts the connection test.
	 * @param duration The duration of the test in seconds.
	 */
	const startConnectionTest = async (duration = 15) => {
		setTestDuration(duration);
		setConnectionTestState('starting');
	};

	/**
	 * Stops the connection test.
	 */
	const stopConnectionTest = () => {
		if (connectionTestState === 'finished') {
			// it's already finished so no need to do anything!
			return;
		}
		setConnectionTestState('stopping');
	};

	const hasStreams = videoTrack?.persistentTrack && audioTrack?.persistentTrack;

	return {
		connectionTestState,
		startConnectionTest,
		stopConnectionTest,
		hasStreams,
		timeElapsed,
	};
};
