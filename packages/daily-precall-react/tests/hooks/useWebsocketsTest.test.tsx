import { useWebsocketsTest } from '../../src/hooks/useWebsocketsTest.ts';
import { act, renderHook, waitFor } from '@testing-library/react';

const fakeFetchResults = {
	privacy: null,
	needToRequest: false,
	sigAuthz:
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtIjoidGVzdC1yb29tcy9ldS1jZW50cmFsLTEiLCJpYXQiOjE2ODM3MjcxMzMsImV4cCI6MTY4MzcyNzQzM30.m8mnih5pL4ZCE45atOpiorioFHZ_GDm-GXjDvpM8LqE',
	dialInPIN: '----',
	orgMember: false,
	roomId: 'da528d6e-90db-464c-9fe6-dc6f2f5bc91c',
	roomName: 'eu-central-1',
	apiCreated: true,
	participantsInMeeting: 0,
	dialInParticipantsInMeeting: 0,
	domainProps: {
		api_plan_expires: '1680591660',
		api_plan_id: 'PLAN_FREE',
		enable_metered_billing: true,
		enable_new_call_ui: true,
		signaling_impl: 'ws',
	},
	roomProps: {
		enable_advanced_chat: '1',
		enable_breakout_rooms: '1',
		enable_chat: '1',
		enable_emoji_reactions: '1',
		enable_hand_raising: '1',
		enable_network_ui: '1',
		enable_pip_ui: '1',
		enable_prejoin_ui: '0',
		enable_video_processing_ui: '1',
		geo: 'eu-central-1',
		start_audio_off: '1',
		start_video_off: '1',
	},
	joinProps: {},
	permissions: { hasPresence: true, canSend: true },
	stun: 'twilio,xirsys',
	worker: {
		dnsName: 'ip-10-75-10-62-eu-central-1.wss.daily.co',
		workerId: 'ip-10-75-10-62-eu-central-1',
		group: 'eu-central-1',
		versionInfo: {
			app_name: 'sfu',
			git_hash: '56b351d418c606617428a07e56c831193633079b',
			git_ref: 'refs/heads/main',
			environment_name: 'service/soup-prod',
		},
		env: 'prod',
		dv: 1683577329,
		wssUri: 'wss://ip-10-75-10-62-eu-central-1.wss.daily.co:443',
		sendBitrate: 134109400,
		recvBitrate: 72057848,
		memory: 1.76,
		cpu: 81.92,
		nodeCpu: 13.44,
		signaling_rooms: 147,
		signaling_peers: 438,
		rooms: 70,
		producers: 377,
		consumers: 976,
		peers: 342,
		ingests: 0,
		uptime: 149557.199309244,
		scalingWeight: 12,
	},
	geoGroup: 'eu-central-1',
};

describe('useWebsocketsTest', () => {
	global.fetch = jest.fn();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore -- data can be `any`
	function createFetchResponse(data) {
		return { json: () => new Promise((resolve) => resolve(data)) };
	}
	it('the test state returns idle by default', async () => {
		const { result } = renderHook(() => useWebsocketsTest(), {});
		expect(result.current.websocketsTestState).toBe('idle');
	});
	it('returns functions to start and stop tests', async () => {
		const { result } = renderHook(() => useWebsocketsTest(), {});
		expect(typeof result.current.startWebsocketsTest).toBe('function');
		expect(typeof result.current.stopWebsocketsTest).toBe('function');
	});
	it('calling startWebsocketsTest calls startWebsocketsTest', async () => {
		const { result } = renderHook(() => useWebsocketsTest(), {});
		(fetch as jest.Mock).mockResolvedValue(
			createFetchResponse(fakeFetchResults),
		);

		const spy = await jest.spyOn(result.current, 'startWebsocketsTest');

		act(() => {
			result.current.startWebsocketsTest();
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.websocketsTestState).toBe('running');
		});
	});
	it('calling stopWebsocketsTest calls stopWebsocketsTest', async () => {
		const { result } = renderHook(() => useWebsocketsTest(), {});
		const spy = await jest.spyOn(result.current, 'stopWebsocketsTest');

		act(() => {
			result.current.stopWebsocketsTest();
		});

		await waitFor(() => {
			expect(spy).toBeCalled();
			expect(result.current.websocketsTestState).toBe('finished');
		});
	});
});
