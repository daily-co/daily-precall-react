import { useCallback, useEffect, useState } from 'react';
import { startWebsocketTests, TestRegions } from '../utils/WebSocketTester.ts';

import { TestState, useDailyTest } from '../DailyTest.tsx';

import { ErrorEvent } from '../types.ts';
import { v4 as uuidv4 } from 'uuid';

export interface WebsocketsTestReport {
	passed?: string[];
	failed?: string[];
	result?: string | 'passed' | 'failed' | 'warning' | '';
	errors?: any;
	id?: string;
	startedAt?: Date;
}

type Regions = {
	[key in TestRegions]?: {
		result?: string | null;
	};
};

export const useWebsocketsTest = () => {
	const { addTestData, callObject } = useDailyTest();
	const [errors, setErrors] = useState<ErrorEvent[]>([]);
	const [websocketsTestState, setWebsocketsTestState] =
		useState<TestState>('idle');
	const [testDuration, setTestDuration] = useState<number>(0);
	const [testTimeout, setTestTimeout] = useState<ReturnType<
		typeof setTimeout
	> | null>();
	const [networkInterval, setNetworkInterval] = useState<any>();
	const [websocketRegionTestData, setWebsocketRegionTestData] =
		useState<Regions>({
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
		});

	useEffect(() => {
		if (testTimeout) {
			clearTimeout(testTimeout);
		}
		if (testDuration > 0) {
			const newTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
				setWebsocketsTestState('stopping');
			}, testDuration * 1000);
			setTestTimeout(newTimeout);
		}
	}, [testDuration]);

	useEffect(() => {
		const isDone = Object.keys(websocketRegionTestData).every(
			(key) => websocketRegionTestData[key]?.result !== '',
		);
		if (isDone) setWebsocketsTestState('finished');
	}, [websocketRegionTestData]);

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
	}, [callObject]);

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
					const n = setInterval(async () => {}, 1000);
					setNetworkInterval(n);
					break;
				case 'stopping':
					if (networkInterval) {
						clearInterval(networkInterval);
					}
					if (testTimeout) {
						clearTimeout(testTimeout);
					}
					setTestDuration(0);
					setTestTimeout(null);
					setWebsocketsTestState('finished');
					break;
				case 'finished':
					if (networkInterval) clearInterval(networkInterval);
					if (testTimeout) clearTimeout(testTimeout);
					setWebsocketResults();
					break;
				case 'aborted':
					if (networkInterval) clearInterval(networkInterval);
					if (testTimeout) clearTimeout(testTimeout);
					setWebsocketsTestState('idle');
					break;
			}
		};
		handleNewState();

		return () => {
			clearInterval(networkInterval);
		};
	}, [websocketsTestState]);

	const setWebsocketResults = () => {
		const results: WebsocketsTestReport = {};

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

		results.errors = errors;
		results.failed = failed;
		results.id = uuidv4();
		results.passed = passed;
		results.result = verdict;
		results.startedAt = new Date();

		addTestData('websockets', results);
	};

	const startWebsocketsTest = async (timeout = 10): Promise<any> => {
		setTestDuration(timeout);
		setWebsocketsTestState('starting');
	};

	const stopWebsocketsTest = () => {
		setWebsocketsTestState('aborted');
	};

	return {
		startWebsocketsTest,
		stopWebsocketsTest,
		websocketsTestState,
	};
};
