import { useNetworkTest } from '../../src/hooks/useNetworkTest.ts';
import { act, renderHook, waitFor } from '@testing-library/react';

const fakeFetchResults = [
	{
		url: 'stun:global.stun.site.com:3478',
		urls: 'stun:global.stun.site.com:3478',
	},
	{
		url: 'turn:global.turn.site.com:3478?transport=udp',
		username: 'hello',
		urls: 'turn:global.turn.site.com:3478?transport=udp',
		credential: 'hello',
	},
	{
		url: 'turn:global.turn.site.com:3478?transport=tcp',
		username: 'hello',
		urls: 'turn:global.turn.hello.com:3478?transport=tcp',
		credential: 'hello',
	},
	{
		url: 'turn:global.turn.hello.com:443?transport=tcp',
		username: 'hello',
		urls: 'turn:global.turn.hello.com:443?transport=tcp',
		credential: 'hello',
	},
	{
		url: 'turns:global.turn.hello.com:443?transport=tcp',
		username: 'hello',
		urls: 'turns:global.turn.hello.com:443?transport=tcp',
		credential: 'hello',
	},
];
describe('useNetworkTest', () => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore -- data can be `any`
	function createFetchResponse(data) {
		return { json: () => new Promise((resolve) => resolve(data)) };
	}
	it('the test state returns idle by default', async () => {
		const { result } = renderHook(() => useNetworkTest(), {});
		expect(result.current.networkTestState).toBe('idle');
	});
	it('returns functions to start and stop tests', async () => {
		const { result } = renderHook(() => useNetworkTest(), {});
		expect(typeof result.current.startNetworkTest).toBe('function');
		expect(typeof result.current.stopNetworkTest).toBe('function');
	});
	it('calling startNetworkTest calls startNetworkTest', async () => {
		const { result } = renderHook(() => useNetworkTest(), {});
		(fetch as jest.Mock).mockResolvedValue(
			createFetchResponse(fakeFetchResults),
		);

		const spy = await jest.spyOn(result.current, 'startNetworkTest');

		act(() => {
			result.current.startNetworkTest();
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.networkTestState).toBe('running');
		});
	});
	it('calling stopConnectionTest calls stopConnectionTest', async () => {
		const { result } = renderHook(() => useNetworkTest(), {});
		const spy = await jest.spyOn(result.current, 'stopNetworkTest');

		act(() => {
			result.current.stopNetworkTest();
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.networkTestState).toBe('finished');
		});
	});
});
