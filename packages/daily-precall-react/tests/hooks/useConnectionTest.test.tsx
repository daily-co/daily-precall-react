import { useConnectionTest } from '../../src/hooks/useConnectionTest.ts';
import { act, renderHook, waitFor } from '@testing-library/react';

describe('useConnectionTest', () => {
	it('the test state returns idle by default', async () => {
		const { result } = renderHook(() => useConnectionTest(), {});
		expect(result.current.connectionTestState).toBe('idle');
	});
	it('returns functions to start and stop tests', async () => {
		const { result } = renderHook(() => useConnectionTest(), {});
		expect(typeof result.current.startConnectionTest).toBe('function');
		expect(typeof result.current.stopConnectionTest).toBe('function');
	});
	it('calling startConnectionTest calls startConnectionTest', async () => {
		const { result } = renderHook(() => useConnectionTest(), {});
		const fakeStream = new MediaStream([]);
		const spy = await jest.spyOn(result.current, 'startConnectionTest');

		act(() => {
			result.current.startConnectionTest(fakeStream, 2);
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.connectionTestState).toBe('finished');
		});
	});
	it('calling stopConnectionTest calls stopConnectionTest', async () => {
		const { result } = renderHook(() => useConnectionTest(), {});
		const spy = await jest.spyOn(result.current, 'stopConnectionTest');

		act(() => {
			result.current.stopConnectionTest();
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.connectionTestState).toBe('finished');
		});
	});
});
