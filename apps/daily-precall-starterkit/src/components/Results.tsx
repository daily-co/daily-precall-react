import { Card } from './shared/Card/Card';
import { useDailyTest, DailyTestData } from 'daily-precall-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';

function isEmpty(obj: DailyTestData) {
	return Object.keys(obj).length === 0;
}
export const Results = () => {
	const { testData } = useDailyTest();

	const connectionResults = useMemo(() => {
		if (
			testData?.websockets?.result === 'passed' &&
			testData?.network?.result === 'connected'
		) {
			return (
				<>
					You will be able to make video calls via the network you are on right
					now.
				</>
			);
		} else {
			return <>You might not be able to make video calls via your network.</>;
		}
	}, [testData]);

	const internetQualityResults = useMemo(() => {
		if (testData?.connection?.result === 'good') {
			return <>Your internet connection quality is good.</>;
		} else {
			return (
				<>
					Your internet connection quality may not be optimal for video calls.
				</>
			);
		}
	}, [testData]);

	const showNetworkDebuggerLink = useMemo(() => {
		if (
			testData?.websockets?.result !== 'passed' ||
			testData?.network?.result !== 'connected' ||
			testData?.connection?.result !== 'good'
		) {
			return (
				<p>
					For an advanced network check, please try our{' '}
					<a href="https://network-test.daily.co/index.html" target="_blank">
						Network Debugger
					</a>
					. You can send the results to your network administrator for more
					information.
				</p>
			);
		} else {
			return null;
		}
	}, [
		testData?.connection?.result,
		testData?.network?.result,
		testData?.websockets?.result,
	]);

	return (
		<Card title="Results">
			{!isEmpty(testData) ? (
				<>
					<p>
						{connectionResults} {internetQualityResults}
					</p>
					<>{showNetworkDebuggerLink}</>
					<details>
						<summary>Raw data</summary>
						<pre> {JSON.stringify(testData)}</pre>
					</details>
				</>
			) : (
				<p>
					No test data...{' '}
					<Link to={`/`} className="link ghost">
						Start the test.
					</Link>
				</p>
			)}
		</Card>
	);
};
