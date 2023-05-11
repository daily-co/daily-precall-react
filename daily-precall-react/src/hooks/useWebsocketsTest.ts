import { useCallback, useEffect, useRef, useState } from 'react';
import { startWebsocketTests, TestRegion } from '../utils/WebSocketTester.ts';
import { TestState } from '../DailyTest.tsx';
import { useDailyTest } from '../useDailyTest.ts';
import { WebsocketsTestReport } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';
import { useCatchErrors } from '../utils/useCatchErrors.ts';
import { useTimeout } from '../utils/useTimeout.tsx';

type Regions = {
	[key in TestRegion]?: {
		result?: string | null;
	};
};

/* Test will automatically time out after 10 seconds*/
const TIME_OUT_IN_SECONDS = 10;

const defaultWebsocketData = {
	'eu-central-1': {
		result: '',
	},
	'eu-west-2': {
		result: '',
	},
	'us-east-1': {
		result: '',
	},
	'ap-south-1': {
		result: '',
	},
	'af-south-1': {
		result: '',
	},
	'us-west-2': {
		result: '',
	},
	'ap-southeast-1': {
		result: '',
	},
	'sa-east-1': {
		result: '',
	},
	'ap-northeast-2': {
		result: '',
	},
	'ap-southeast-2': {
		result: '',
	},
};

export const useWebsocketsTest = () => {
	const { addTestData } = useDailyTest();
	const { errors } = useCatchErrors();

	const [websocketsTestState, setWebsocketsTestState] =
		useState<TestState>('idle');
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
			websocketsTestState === 'running' &&
			setWebsocketsTestState('stopping');
	}, [hasTimeElapsed, websocketsTestState]);

	const [websocketRegionTestData, setWebsocketRegionTestData] =
		useState<Regions>(defaultWebsocketData);

	useEffect(() => {
		const isDone = Object.keys(websocketRegionTestData).every(
			(key) => websocketRegionTestData[key]?.result !== '',
		);
		if (isDone) setWebsocketsTestState('finished');
	}, [websocketRegionTestData]);

	const setWebsocketResults = useCallback(() => {
		const passed = Object.keys(websocketRegionTestData).filter(
			(key) => websocketRegionTestData[key]?.result === 'passed',
		);

		const failed = Object.keys(websocketRegionTestData).filter(
			(key) => websocketRegionTestData[key]?.result === 'failed',
		);

		let verdict = '';
		const allWebsocketCount = Object.values(websocketRegionTestData).length;

		if (failed.length === allWebsocketCount) {
			verdict = 'failed';
		} else if (failed.length > 0) {
			verdict = 'warning';
		} else {
			verdict = 'passed';
		}

		const results: WebsocketsTestReport = {
			errors: errors,
			failed: failed,
			id: uuidv4(),
			passed: passed,
			result: verdict,
			startedAt: new Date(),
		};

		addTestData('websockets', results);
	}, [addTestData, errors, websocketRegionTestData]);

	useEffect(() => {
		const handleNewState = async () => {
			switch (websocketsTestState) {
				case 'idle':
					break;
				case 'starting':
					startWebsocketTests().forEach((test) => {
						test.then(
							(passedRegion) => {
								setWebsocketRegionTestData((prevState) => ({
									...prevState,
									[passedRegion]: {
										result: 'passed',
									},
								}));
								return;
							},
							(failedRegion) => {
								setWebsocketRegionTestData((prevState) => ({
									...prevState,
									[failedRegion]: {
										result: 'failed',
									},
								}));
								return;
							},
						);
					});
					setWebsocketsTestState('running');
					break;
				case 'running':
					break;
				case 'stopping':
					setWebsocketsTestState('finished');
					break;
				case 'finished':
					if (prevState.current === 'finished') return;
					setAbortTimeout(true);
					setWebsocketResults();
					setWebsocketRegionTestData(defaultWebsocketData);
					break;
			}
			prevState.current = websocketsTestState;
		};
		handleNewState();
	}, [setWebsocketResults, websocketsTestState]);

	const startWebsocketsTest = useCallback(() => {
		setWebsocketsTestState('starting');
	}, []);

	const stopWebsocketsTest = useCallback(() => {
		if (websocketsTestState === 'finished') {
			return;
		}
		setWebsocketsTestState('stopping');
	}, [websocketsTestState]);

	return {
		startWebsocketsTest,
		stopWebsocketsTest,
		websocketsTestState,
	};
};
