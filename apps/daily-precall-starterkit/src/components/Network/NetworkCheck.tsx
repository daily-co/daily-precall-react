import React, { useEffect, useRef } from 'react';
import {
	useDailyTest,
	useNetworkTest,
	NetworkTestReport,
} from 'daily-precall-react';

import { Card } from '../shared/Card/Card';
import { useLocalSessionId, useMediaTrack } from '@daily-co/daily-react';

export const NetworkCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const { startNetworkTest, stopNetworkTest, networkTestState } =
		useNetworkTest();

	/* We're using the user's video and audio track for the throughput test. You could
	 * pass other tracks here too.*/
	const localSessionId = useLocalSessionId() ?? '';
	const audioTrack = useMediaTrack(localSessionId, 'audio');
	const videoTrack = useMediaTrack(localSessionId, 'video');

	const mediaStream = useRef<MediaStream>();
	useEffect(() => {
		// We only need to do this in Safari. Since there's no real reliable way to test
		// user agents anymore, we'll just do it for all browsers.
		mediaStream.current = new MediaStream();
		if (audioTrack.persistentTrack)
			mediaStream.current.addTrack(audioTrack.persistentTrack);
		if (videoTrack.persistentTrack)
			mediaStream.current.addTrack(videoTrack.persistentTrack);

		return () => {
			delete mediaStream.current;
		};
	}, [audioTrack.persistentTrack, videoTrack.persistentTrack]);

	const renderVerdict = (v: NetworkTestReport['result']) => {
		switch (v) {
			case 'connected':
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

			default:
				break;
		}
		return '';
	};

	return (
		<Card title="Network conditions check">
			<p>
				This test checks if the user's network allows them to talk other
				networks. It either passes or not. If it doesn't pass, we recommend
				using the{' '}
				<a href="https://network-test.daily.co/index.html">
					Daily network debugger
				</a>{' '}
				to dig into why.
			</p>
			<p>
				Current network test state: <u> {networkTestState}</u>.
			</p>
			<>
				<div className="options">
					<button
						className="button primary"
						onClick={() => startNetworkTest(mediaStream.current as MediaStream)}
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
