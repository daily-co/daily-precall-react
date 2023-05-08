import React, { createContext, useContext } from 'react';
import { atom, useRecoilCallback, useRecoilValue } from 'recoil';
import { DailyCall } from '@daily-co/daily-js';

import {
	ConnectionTestReport,
	NetworkTestReport,
	WebsocketsTestReport,
} from './types.ts';

export type TestState =
	| 'idle'
	| 'starting'
	| 'running'
	| 'stopping'
	| 'finished'
	| 'error'
	| 'aborted';

type TestDataKey =
	| 'camera'
	| 'speaker'
	| 'mic'
	| 'network'
	| 'connection'
	| 'websockets';

interface DailyTestData {
	network?: NetworkTestReport;
	connection?: ConnectionTestReport;
	websockets?: WebsocketsTestReport;
}

export interface ContextValue {
	testData: DailyTestData;
	callObject: DailyCall | null;
	addTestData(
		key: TestDataKey,
		data: NetworkTestReport | ConnectionTestReport | WebsocketsTestReport,
	): void;
}

const DailyTestContext = createContext<ContextValue>({
	testData: {},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	addTestData: () => {},
	callObject: null,
});

const testDataState = atom<DailyTestData>({
	key: 'test-data-state',
	default: {},
});

type Props = {
	callObject: DailyCall | null;
	children: React.ReactNode;
};
export const DailyTest: React.FC<React.PropsWithChildren<Props>> = ({
	children,
	callObject,
}) => {
	const testData = useRecoilValue(testDataState);
	const addTestData = useRecoilCallback(
		({ set }) =>
			(key: TestDataKey, data) => {
				set(testDataState, (prevData) => ({
					...prevData,
					[key]: data,
				}));
			},
		[],
	);

	return (
		<DailyTestContext.Provider value={{ testData, addTestData, callObject }}>
			{children}
		</DailyTestContext.Provider>
	);
};
export const useDailyTest = () => useContext(DailyTestContext);
DailyTestContext.displayName = 'DailyTestContext';
