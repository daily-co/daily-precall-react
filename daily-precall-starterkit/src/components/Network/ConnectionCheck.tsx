import React, { useEffect, useRef } from 'react';
import {
	useConnectionTest,
	useDailyTest,
	ConnectionTestReport,
} from '@daily-co/daily-precall-react';
import { useLocalSessionId, useMediaTrack } from '@daily-co/daily-react';

import { Card } from '../shared/Card/Card';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting';

const TEST_DURATION = 10;
export const ConnectionCheck: React.FC = () => {
	const { testData } = useDailyTest();

	const {
		startConnectionTest,
		timeElapsed,
		stopConnectionTest,
		connectionTestState,
	} = useConnectionTest();

	/* We're using the user's video and audio track for the throughput test. You could
	 * pass other tracks here too.*/
	const localSessionId = useLocalSessionId() ?? '';
	const audioTrack = useMediaTrack(localSessionId, 'audio');
	const videoTrack = useMediaTrack(localSessionId, 'video');

	const mediaStream = useRef<MediaStream>();
	useEffect(() => {
		mediaStream.current = new MediaStream();
		if (audioTrack.persistentTrack)
			mediaStream.current.addTrack(audioTrack.persistentTrack);
		if (videoTrack.persistentTrack)
			mediaStream.current.addTrack(videoTrack.persistentTrack);

		return () => {
			delete mediaStream.current;
		};
	}, [audioTrack.persistentTrack, videoTrack.persistentTrack]);

	const hasStreams = audioTrack || videoTrack;

	const tips = () => {
		return (
			<TroubleShooting show>
				<ol>
					<li>Move closer to the router or use an ethernet cable</li>
					<li>
						If on a mobile data connection, go outside or to a window. If on
						Wi-Fi, move closer to the router
					</li>
					<li>
						Switch Wi-Fi networks or use your smartphone's hotspot (such as 5G)
					</li>
					<li>
						<b>Did you know?</b> You can turn off your camera during your video
						call to improve the call quality.
					</li>
				</ol>
			</TroubleShooting>
		);
	};

	const renderVerdict = (v: ConnectionTestReport['result']) => {
		switch (v) {
			case 'good':
				return (
					<>
						<h3>Your internet connection is good</h3>
						<p>
							You can expect good video quality. If the call is choppy, then the
							other person probably has a poor connection.
						</p>
					</>
				);
			case 'bad':
				return (
					<>
						<h3>Bad internet connection detected</h3>
						<p>
							Our test indicated a bad internet connection. To prevent choppy
							sound or frozen video, try any of these tips:
						</p>
						{tips()}
					</>
				);
			case 'warning':
				return (
					<>
						<h3>Unstable internet connection detected</h3>
						<p>
							Our test indicated an unstable internet connection. To prevent
							choppy sound or frozen video, try any of these tips:
						</p>
						{tips()}
					</>
				);
			case 'failed':
				return (
					<>
						<h3>Internet connection error</h3>
						<p>
							We could not test your internet connection. Try any of these tips:
						</p>
						{tips()}
					</>
				);
			default:
				break;
		}
		return '';
	};

	return (
		<Card title="Connection quality check">
			<p>
				This is a test that sets up a RTCPeerConnection and measures a user's
				packet loss and round trip time. The longer the test runs, the more
				accurate its results. The test will automatically time-out after 15
				seconds.
			</p>
			<p>
				Current connection test state: <u> {connectionTestState}</u>.{' '}
				{connectionTestState === 'running' && (
					<>Expecting results in {TEST_DURATION - timeElapsed} seconds..</>
				)}
			</p>
			{!hasStreams && (
				// In order to test a user's internet connection quality, we'll need a
				// Daily video and/or audio stream. Currently, no streams are detected.
				// Make sure you've wrapped your `startConnectionTest` call inside a
				// `DailyTestProvider` component.
				<TroubleShooting show>
					We don't have access to your video and/or audio. This means we cannot
					check your network speed. Please make sure your browser has access to
					your camera and microphone, and try going through the test again. You
					can still make video calls without a camera or microphone, but people
					will not be able to hear or see you.
				</TroubleShooting>
			)}
			{hasStreams && (
				<>
					<div>
						<button
							className="button primary"
							onClick={() =>
								startConnectionTest(
									mediaStream.current as MediaStream,
									TEST_DURATION,
								)
							}
							disabled={
								connectionTestState === 'running' ||
								connectionTestState === 'starting' ||
								connectionTestState === 'stopping'
							}>
							Start connection check ({TEST_DURATION} seconds)
						</button>
						<button
							className="button primary"
							onClick={() => stopConnectionTest()}
							disabled={
								connectionTestState === 'stopping' ||
								connectionTestState === 'idle' ||
								connectionTestState === 'finished'
							}>
							Stop connection check
						</button>
					</div>

					<div>
						{testData?.connection && (
							<>
								<h2>Verdict</h2>
								{renderVerdict(testData?.connection.result)}
								<hr />
								<h2>Raw results</h2>
								<pre>{JSON.stringify(testData?.connection, null, 2)}</pre>
							</>
						)}
					</div>
				</>
			)}
		</Card>
	);
};
