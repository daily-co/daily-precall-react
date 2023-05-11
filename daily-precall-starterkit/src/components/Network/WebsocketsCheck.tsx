import React from 'react';
import {
	useDailyTest,
	useWebsocketsTest,
	WebsocketsTestReport,
} from '@daily-co/daily-precall-react';

import { Card } from '../shared/Card/Card';

export const WebsocketsCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const { startWebsocketsTest, stopWebsocketsTest, websocketsTestState } =
		useWebsocketsTest();

	const renderVerdict = (v: WebsocketsTestReport['result']) => {
		switch (v) {
			case 'passed':
				return (
					<>
						<h3>All websocket connections passed</h3>
						<p>You are able to connect to websockets in all regions.</p>
					</>
				);
			case 'failed':
				return (
					<>
						<h3>All websocket connections failed</h3>
						<p>
							You are not able to connect to any region via websockets. Contact
							your network administrator for support.
						</p>
					</>
				);
			case 'warning':
				return (
					<>
						<h3>Some websocket connections failed</h3>
						<p>
							You are not able to connect to some regions via websockets.
							Contact your network administrator for support.
						</p>
					</>
				);
			default:
				break;
		}
		return '';
	};

	return (
		<Card title="Websockets check">
			<p>
				This is a test checks if the user's network and/our supports WebSocket
				connections. This is an advanced test that should only be run in cases
				where you would expect issues with websockets.
			</p>
			<p>
				Current websockets test state: <u> {websocketsTestState}</u>.
			</p>
			<>
				<div>
					<button
						className="button primary"
						onClick={() => startWebsocketsTest()}
						disabled={
							websocketsTestState === 'running' ||
							websocketsTestState === 'starting' ||
							websocketsTestState === 'stopping'
						}>
						Start websockets check
					</button>
					<button
						className="button primary"
						onClick={() => stopWebsocketsTest()}
						disabled={
							websocketsTestState === 'stopping' ||
							websocketsTestState === 'idle' ||
							websocketsTestState === 'finished'
						}>
						Stop network check
					</button>
				</div>

				<div>
					{testData?.websockets && (
						<>
							<h2>Verdict</h2>
							{renderVerdict(testData?.websockets.result)}
							<hr />
							<h2>Raw results</h2>
							<pre>{JSON.stringify(testData?.websockets, null, 2)}</pre>
						</>
					)}
				</div>
			</>
		</Card>
	);
};
