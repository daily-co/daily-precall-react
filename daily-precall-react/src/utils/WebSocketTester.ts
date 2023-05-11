/**
 * List of available regions for websocket tests.
 */
const testRegions = [
	'af-south-1',
	'ap-northeast-2',
	'ap-southeast-1',
	'ap-southeast-2',
	'ap-south-1',
	'eu-central-1',
	'eu-west-2',
	'sa-east-1',
	'us-east-1',
	'us-west-2',
];

export type TestRegion = (typeof testRegions)[number];

/**
 * Starts a websocket test for the specified region.
 * @param region The region to test.
 * @returns A Promise that resolves with the region if the test succeeds, or rejects with the region if it fails.
 */
export const startWebsocketTest = async (region: TestRegion) => {
	try {
		const apiResponse = await fetch(
			`https://gs.daily.co/rooms/check/test-rooms/${region}`,
		);
		const apiJson = await apiResponse.json();
		const wssUri = apiJson.worker.wssUri;

		// Try to connect to the websocket.
		await tryWebsocket(wssUri);
		return region;
	} catch (e) {
		console.error(`[${region}] Caught error:`, e);
		throw region;
	}
};

/**
 * Tries to connect to the specified websocket URL.
 * @param wss The websocket URL to connect to.
 * @param timeout The timeout in seconds for the connection attempt.
 * @returns A Promise that resolves if the connection succeeds, or rejects if it fails.
 */
const tryWebsocket = (wss: URL, timeout = 10) => {
	return new Promise<void>((resolve, reject) => {
		const testSocket = new WebSocket(wss);

		const failedTimeout = setTimeout(() => {
			testSocket.close();
			reject(`Connection to ${wss} timed out`);
		}, timeout * 1000);

		testSocket.addEventListener('open', () => {
			clearTimeout(failedTimeout);
			testSocket.close();
			resolve();
		});

		testSocket.addEventListener('error', (event) => {
			clearTimeout(failedTimeout);
			testSocket.close();
			reject(`Error connecting to ${wss}: ${event}`);
		});
	});
};

/**
 * Starts websocket tests for all available regions.
 * @returns An array of Promises that resolve with the region if the test succeeds, or reject with the region if it fails.
 */
export const startWebsocketTests = (): Promise<TestRegion>[] => {
	return testRegions.map((region) => {
		return startWebsocketTest(region);
	});
};
