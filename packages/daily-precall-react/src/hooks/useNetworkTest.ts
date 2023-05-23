import { useCallback, useEffect, useRef, useState } from 'react';

import { TestState } from '../DailyTest.tsx';
import { useDailyTest } from '../useDailyTest.ts';
import { NetworkTestReport } from '../types.ts';
import {
	CONNECTION_MODES,
	ConnectionModes,
	NAT_SERVICES_LINKS,
} from '../utils/constants.ts';
import NetworkTester from '../utils/NetworkTester.ts';
import { useCatchErrors } from '../utils/useCatchErrors.ts';
import { useTimeout } from '../utils/useTimeout.tsx';

type Protocols = {
	[key in ConnectionModes]?: {
		iceCandidates: RTCIceCandidate[] | null;
		result: string;
	};
};

interface TestResults {
	iceCandidates: RTCIceCandidate[];
	result: string;
}

/* Test will automatically time out after 15 seconds*/
const TIME_OUT_IN_SECONDS = 15;

const initialProtocolTestData = {
	[CONNECTION_MODES.RELAY_ONLY]: {
		result: '',
		iceCandidates: [],
	},
};

export const useNetworkTest = () => {
	const { addTestData } = useDailyTest();
	const [networkTestState, setNetworkTestState] = useState<TestState>('idle');
	const prevState = useRef<TestState>('idle');
	const mediaStreamRef = useRef<MediaStream>();

	const [abortTimeout, setAbortTimeout] = useState(false);
	const [hasTimeElapsed, setHasTimeElapsed] = useState(false);
	useTimeout(
		() => {
			setHasTimeElapsed(true);
		},
		abortTimeout ? null : TIME_OUT_IN_SECONDS * 1000,
	);

	useEffect(() => {
		hasTimeElapsed &&
			networkTestState === 'running' &&
			setNetworkTestState('stopping');
	}, [hasTimeElapsed, networkTestState]);

	const protocolTesters = useRef<NetworkTester[]>();
	const [protocolTestData, setProtocolTestData] = useState<Protocols>(
		initialProtocolTestData,
	);
	const { addError, errors } = useCatchErrors();

	useEffect(() => {
		const isDone = Object.keys(protocolTestData).every(
			(key) => protocolTestData[key]?.result !== '',
		);
		if (isDone) setNetworkTestState('stopping');
	}, [protocolTestData]);

	const setNetworkTestResults = useCallback(() => {
		const results: NetworkTestReport = {
			errors: errors,
			result: protocolTestData?.[CONNECTION_MODES.RELAY_ONLY]
				?.result as NetworkTestReport['result'],
		};

		addTestData('network', results);
	}, [addTestData, errors, protocolTestData]);

	useEffect(() => {
		const handleNewState = async () => {
			switch (networkTestState) {
				case 'idle':
					break;
				case 'starting':
					const hasAudioTracks =
						mediaStreamRef.current?.getAudioTracks().length;
					const hasVideoTracks =
						mediaStreamRef.current?.getVideoTracks().length;
					if (!hasAudioTracks) {
						addError(
							'No audio track found: this may affect the network test results in Safari.',
						);
					}
					if (!hasVideoTracks) {
						addError(
							'No video track found: this may affect the network test results in Safari.',
						);
					}

					if (!hasVideoTracks && !hasAudioTracks) {
						addError(
							'No audio and video tracks found. This may affect the network test results in Safari.',
						);
					}

					console.log('hi :)');
					const svcResp = await fetch(NAT_SERVICES_LINKS.TWILIO);
					const iceServers = await svcResp.json();
					const testers = await Promise.all(
						Object.keys(protocolTestData).map((test) =>
							initiateProtocolTester(test, iceServers, mediaStreamRef.current),
						),
					);
					protocolTesters.current = testers;
					setNetworkTestState('running');
					break;
				case 'running':
					break;
				case 'stopping':
					if (protocolTesters.current) {
						await Promise.all(
							protocolTesters.current.map((test: NetworkTester) => {
								test.stop();
							}),
						);
					}

					setNetworkTestState('finished');
					break;
				case 'finished':
					if (prevState.current === 'finished') return;
					setNetworkTestResults();
					delete protocolTesters.current;
					setAbortTimeout(true);
					setProtocolTestData(initialProtocolTestData);
					break;
			}
			prevState.current = networkTestState;
		};
		handleNewState();
	}, [addError, networkTestState, protocolTestData, setNetworkTestResults]);

	async function initiateProtocolTester(
		connectionMode: ConnectionModes,
		iceServers: RTCIceServer[],
		mediaStream?: MediaStream,
	) {
		const instance: NetworkTester = new NetworkTester({
			natService: 'twilio',
			connectionMode,
			iceServers,
			mediaStream,
		});

		instance.setupRTCPeerConnection().then((result) => {
			const testResults = result as TestResults;
			setProtocolTestData((prevState) => ({
				...prevState,
				[connectionMode]: {
					result: testResults.result,
					iceCandidates: testResults.iceCandidates,
				},
			}));
		});

		return instance;
	}

	const startNetworkTest = useCallback(async (mediaStream?: MediaStream) => {
		if (mediaStream) {
			mediaStreamRef.current = mediaStream;
		}
		setNetworkTestState('starting');
	}, []);

	const stopNetworkTest = useCallback(() => {
		if (networkTestState === 'finished') {
			return;
		}
		setNetworkTestState('stopping');
	}, [networkTestState]);

	return {
		startNetworkTest,
		stopNetworkTest,
		networkTestState,
	};
};
