import React from 'react';
import { useDailyTest, useWebsocketsTest } from '@daily-co/daily-precall-react';

export const WebsocketCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const { startWebsocketsTest, stopWebsocketsTest, websocketsTestState } =
		useWebsocketsTest();
	return (
		<div>
			<button role="submit" onClick={() => startWebsocketsTest(5)}>
				Start Test
			</button>
			<button role="submit" onClick={() => stopWebsocketsTest()}>
				Stop Test
			</button>
			<h1>STATE: {websocketsTestState}</h1>
			Results: <pre>{JSON.stringify(testData?.websockets, null, 2)}</pre>
		</div>
	);
};
