import React from 'react';
import { useConnectionTest, useDailyTest } from '@daily-co/daily-precall-react';

export const ConnectionCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const { startConnectionTest, stopConnectionTest, connectionTestState } =
		useConnectionTest();
	return (
		<div>
			<button role="submit" onClick={() => startConnectionTest(5)}>
				Start Test
			</button>
			<button role="submit" onClick={() => stopConnectionTest()}>
				Stop Test
			</button>
			<h1>STATE: {connectionTestState}</h1>
			Results: <pre>{JSON.stringify(testData?.connection, null, 2)}</pre>
		</div>
	);
};
