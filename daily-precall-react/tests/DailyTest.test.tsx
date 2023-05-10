import { useDailyTest, DailyTest } from '../src/DailyTest.tsx';
import { act, renderHook, waitFor } from '@testing-library/react';
import { RecoilRoot } from 'recoil';
import {
	ConnectionTestReport,
	NetworkTestReport,
	WebsocketsTestReport,
} from '../src/types.ts';

const connectionTestResults: ConnectionTestReport = {
	errors: [],
	id: '123',
	result: 'good',
	startedAt: new Date(),
	throughput: {
		maxRTT: 0,
		packetLoss: 0,
	},
};

const networkTestResults: NetworkTestReport = {
	errors: [],
	id: '123',
	result: 'warning',
	startedAt: new Date(),
	connected: [],
	failed: [],
};

const websocketsTestResults: WebsocketsTestReport = {
	errors: [],
	id: '123',
	result: 'warning',
	startedAt: new Date(),
	passed: [],
	failed: [],
};

const createWrapper =
	(): React.FC =>
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	({ children }) =>
		(
			<RecoilRoot>
				<DailyTest callObject={null}>{children}</DailyTest>
			</RecoilRoot>
		);

describe('DailyTest', () => {
	it('It renders', async () => {
		const { result } = renderHook(() => useDailyTest(), {
			wrapper: createWrapper(),
		});
		await waitFor(() => {
			expect(result.current.testData).toStrictEqual({});
		});
	});
	it('calling addTestData with key "connection" adds connection test data', async () => {
		const { result } = renderHook(() => useDailyTest(), {
			wrapper: createWrapper(),
		});
		const spy = await jest.spyOn(result.current, 'addTestData');

		act(() => {
			result.current.addTestData('connection', connectionTestResults);
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.testData).toStrictEqual({
				connection: connectionTestResults,
			});
		});
	});
	it('calling addTestData with key "network" adds network test data', async () => {
		const { result } = renderHook(() => useDailyTest(), {
			wrapper: createWrapper(),
		});
		const spy = await jest.spyOn(result.current, 'addTestData');

		act(() => {
			result.current.addTestData('network', networkTestResults);
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.testData).toStrictEqual({
				network: networkTestResults,
			});
		});
	});
	it('calling addTestData with key "websockets" adds websockets test data', async () => {
		const { result } = renderHook(() => useDailyTest(), {
			wrapper: createWrapper(),
		});
		const spy = await jest.spyOn(result.current, 'addTestData');

		act(() => {
			result.current.addTestData('websockets', websocketsTestResults);
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.testData).toStrictEqual({
				websockets: websocketsTestResults,
			});
		});
	});
});
