import React, { useEffect } from 'react';
import { useDailyTest, useMediaTest } from '@daily-co/daily-precall-react';

export const VideoCheck: React.FC = () => {
	const { captureCameraReport } = useMediaTest();
	const { testData } = useDailyTest();

	const getCameraReport = () => {
		captureCameraReport();
	};

	useEffect(() => {
		getCameraReport();
	}, []);

	return (
		<div>
			<button onClick={getCameraReport}>Retry</button>
			Results: <pre>{JSON.stringify(testData?.camera, null, 2)}</pre>
		</div>
	);
};
