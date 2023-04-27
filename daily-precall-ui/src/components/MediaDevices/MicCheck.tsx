import React, { useEffect } from 'react';
import { useDailyTest, useMediaTest } from '@daily-co/daily-precall-react';

export const MicCheck: React.FC = () => {
	const { captureMicReport } = useMediaTest();
	const { testData } = useDailyTest();

	const getMicReport = () => {
		captureMicReport();
	};

	useEffect(() => {
		getMicReport();
	}, []);

	return (
		<div>
			<button onClick={getMicReport}>Retry</button>
			<b>
				Results: <pre>{JSON.stringify(testData?.mic, null, 2)}</pre>
			</b>
		</div>
	);
};
