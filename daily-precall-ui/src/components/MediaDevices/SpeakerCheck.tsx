import React, { useEffect } from 'react';
import { useDailyTest, useMediaTest } from '@daily-co/daily-precall-react';

export const SpeakerCheck: React.FC = () => {
	const { captureSpeakerReport } = useMediaTest();
	const { testData } = useDailyTest();

	const getSpeakerResults = () => {
		captureSpeakerReport();
	};

	useEffect(() => {
		getSpeakerResults();
	}, []);

	return (
		<div>
			<button onClick={getSpeakerResults}>Retry</button>
			Results: <pre>{JSON.stringify(testData?.speaker, null, 2)}</pre>
		</div>
	);
};
