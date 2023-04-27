import React from 'react';
import { useDailyTest, useNetworkTest } from '@daily-co/daily-precall-react';

export const NetworkCheck: React.FC = () => {
	const { startNetworkTest, stopNetworkTest, networkTestState } =
		useNetworkTest();
	const { testData } = useDailyTest();

	return (
		<div>
			<button role="submit" onClick={() => startNetworkTest(10)}>
				Start Test
			</button>
			<button role="submit" onClick={() => stopNetworkTest()}>
				Stop Test
			</button>
			<h1>STATE: {networkTestState}</h1>
			Results: <pre>{JSON.stringify(testData?.network, null, 2)}</pre>
		</div>
	);
};
