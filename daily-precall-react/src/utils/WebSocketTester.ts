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

export type TestRegions = (typeof testRegions)[number];

export const startWebsocketTest = async (region: TestRegions) => {
	try {
		const apiResponse = await fetch(
			`https://gs.daily.co/rooms/check/test-rooms/${region}`,
		);
		const apiJson = await apiResponse.json();
		const wss = apiJson.worker.wssUri;
		await tryWebsocket(wss);
		return region;
	} catch (e) {
		console.error(`[${region}] Caught error:`, e);
		throw region;
	}
};

const tryWebsocket = (wss: URL, timeout = 10) => {
	return new Promise<void>((resolve, reject) => {
		const testSocket = new WebSocket(wss);

		const failedTimeout = setTimeout(() => {
			testSocket.close();
			reject(`Connection to ${wss} timed out`);
		}, timeout * 1000);
		try {
			testSocket.addEventListener('open', () => {
				clearTimeout(failedTimeout);
				testSocket.close();
				resolve();
			});
		} catch (e) {
			reject(`Caught error while trying to open websocket: ${e}`);
		}
	});
};

export const startWebsocketTests = () => {
	return testRegions.map((r) => {
		return startWebsocketTest(r);
	});
};
