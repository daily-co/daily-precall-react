import { useCallback, useEffect, useRef, useState } from 'react';

import { TestState, useDailyTest } from '../DailyTest.tsx';
import { IceServerInterface, NetworkTestReport } from '../types.ts';
import {
	CONNECTION_MODES,
	CONNECTION_STATUS,
	ConnectionModes,
	NAT_SERVICES_LINKS,
} from '../utils/constants.ts';
import NetworkTester from '../utils/NetworkTester.ts';
import { v4 as uuidv4 } from 'uuid';
import { useCatchErrors } from '../utils/useCatchErrors.ts';
import { useTimeout } from '../utils/useTimeout.tsx';

type Protocols = {
	[key in ConnectionModes]?: {
		result: string | null;
		iceCandidates?: RTCIceCandidate[] | null;
	};
};

interface TestResults {
	candidates: RTCIceCandidate[];
	status: string;
}

/* Test will automatically time out after 30 seconds*/
const TIME_OUT_IN_SECONDS = 30;

const initialProtocolTestData = {
	[CONNECTION_MODES.ALL]: {
		result: null,
		iceCandidates: null,
	},
	[CONNECTION_MODES.RELAY_ONLY]: {
		result: null,
		iceCandidates: null,
	},
	[CONNECTION_MODES.STUN]: {
		result: null,
		iceCandidates: null,
	},
	[CONNECTION_MODES.TURN_UDP]: {
		result: null,
		iceCandidates: null,
	},
	[CONNECTION_MODES.TURN_TCP]: {
		result: null,
		iceCandidates: null,
	},
	[CONNECTION_MODES.TURN_TLS]: {
		result: null,
		iceCandidates: null,
	},
};

export const useNetworkTest = () => {
	const { addTestData } = useDailyTest();
	const [networkTestState, setNetworkTestState] = useState<TestState>('idle');
	const prevState = useRef<TestState>('idle');

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

	useEffect(() => {
		const isDone = Object.keys(protocolTestData).every(
			(key) => protocolTestData[key]?.result !== null,
		);
		if (isDone) setNetworkTestState('stopping');
	}, [protocolTestData]);

	const { errors } = useCatchErrors();

	const setNetworkTestResults = useCallback(() => {
		const results: NetworkTestReport = {
			connected: Object.keys(protocolTestData).filter(
				(key) => protocolTestData[key]?.result === 'connected',
			),
			failed: Object.keys(protocolTestData).filter(
				(key) => protocolTestData[key]?.result === 'failed',
			),
			id: uuidv4(),
			startedAt: new Date(),
			errors: errors,
			result:
				protocolTestData?.[CONNECTION_MODES.RELAY_ONLY]?.result ===
				CONNECTION_STATUS.CONNECTED
					? 'passed'
					: protocolTestData?.[CONNECTION_MODES.RELAY_ONLY]?.result ===
					  CONNECTION_STATUS.FAILED
					? 'failed'
					: 'warning',
		};

		addTestData('network', results);
	}, [addTestData, errors, protocolTestData]);

	useEffect(() => {
		const handleNewState = async () => {
			switch (networkTestState) {
				case 'idle':
					break;
				case 'starting':
					const svcResp = await fetch(NAT_SERVICES_LINKS.TWILIO);
					const iceServers = await svcResp.json();
					const testers = await Promise.all(
						Object.keys(protocolTestData).map((test) =>
							initiateProtocolTester(test, iceServers),
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
	}, [networkTestState, protocolTestData, setNetworkTestResults]);

	async function initiateProtocolTester(
		connectionMode: ConnectionModes,
		iceServers: IceServerInterface[],
	) {
		const instance: NetworkTester = new NetworkTester({
			natService: 'twilio',
			connectionMode,
			iceServers,
		});

		instance.setupRTCPeerConnection().then((result) => {
			const testResults = result as TestResults;
			setProtocolTestData((prevState) => ({
				...prevState,
				[connectionMode]: {
					result: testResults.status,
					iceCandidates: testResults.candidates,
				},
			}));
		});

		return instance;
	}

	const startNetworkTest = useCallback(() => {
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
