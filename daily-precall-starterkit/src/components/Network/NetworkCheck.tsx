import React from 'react';
import {
	useDailyTest,
	useNetworkTest,
	NetworkTestReport,
} from '@daily-co/daily-precall-react';

import { Card } from '../shared/Card/Card';

export const NetworkCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const { startNetworkTest, stopNetworkTest, networkTestState } =
		useNetworkTest();

	const renderVerdict = (v: NetworkTestReport['result']) => {
		switch (v) {
			case 'passed':
				return (
					<>
						<h3>Your network supports video call communication</h3>
						<p>
							Your network can communicate with other online networks. This
							means you can make video calls.
						</p>
					</>
				);
			case 'failed':
				return (
					<>
						<h3>Your network does not support video call communication</h3>
						<p>
							Your network cannot establish communication over any of the
							available protocols. This means you cannot make video calls.
							Contact your network administrator for support.
						</p>
					</>
				);
			case 'warning':
				return (
					<>
						<h3>
							Your network does not support all methods of video call
							communication
						</h3>
						<p>
							Your network can communicate over some of the protocols needed for
							video calls, but not all. This means you can make video calls, but
							you might experience some issues. Contact your network
							administrator for support.
						</p>
					</>
				);
			default:
				break;
		}
		return '';
	};

	return (
		<Card title="Network conditions check">
			<p>
				This test checks if the user's network allows traffic over STUN,
				TURN/UDP, TURN/TCP and TURN/TLS.
			</p>
			<p>
				Current network test state: <u> {networkTestState}</u>.
			</p>
			<>
				<div>
					<button
						className="button primary"
						onClick={() => startNetworkTest()}
						disabled={
							networkTestState === 'running' ||
							networkTestState === 'starting' ||
							networkTestState === 'stopping'
						}>
						Start network check
					</button>
					<button
						className="button primary"
						onClick={() => stopNetworkTest()}
						disabled={
							networkTestState === 'stopping' ||
							networkTestState === 'idle' ||
							networkTestState === 'finished'
						}>
						Stop network check
					</button>
				</div>

				<div>
					{testData?.network && (
						<>
							<h2>Verdict</h2>
							{renderVerdict(testData?.network.result)}
							<hr />
							<h2>Raw results</h2>
							<pre>{JSON.stringify(testData?.network, null, 2)}</pre>
						</>
					)}
				</div>
			</>
		</Card>
	);
};
