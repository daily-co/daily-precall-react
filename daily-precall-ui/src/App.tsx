import { useEffect, useState } from 'react';
import { DailyTest } from '@daily-co/daily-precall-react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { useTabs, useUiState } from './hooks/useUiState';
import { VideoCheck } from './components/MediaDevices/VideoCheck';
import { SpeakerCheck } from './components/MediaDevices/SpeakerCheck';
import { MicCheck } from './components/MediaDevices/MicCheck';
import { NetworkCheck } from './components/Network/NetworkCheck';
import { WebsocketCheck } from './components/Network/WebsocketCheck';
import { ConnectionCheck } from './components/Network/ConnectionCheck';

export const App = () => {
	const [dailyCallObject, setDailyCallObject] = useState<DailyCall | undefined>(
		undefined,
	);
	const { uiState } = useUiState();
	const { switchTabs } = useTabs();

	useEffect(() => {
		if (dailyCallObject) return;
		const co = DailyIframe.createCallObject();
		setDailyCallObject(co);
	}, [dailyCallObject]);

	return (
		<>
			<DailyTest callObject={dailyCallObject}>
				<div className="container">
					<>
						<h1>Test your network and devices</h1>
						<p>
							The Daily API makes implementing a precall test a breeze,
							especially when combined with our{' '}
							<a href="https://docs.daily.co/reference/daily-react">
								Daily React library
							</a>
							. This test demonstrates how to do a browser check, a network
							check, and a devices check.
						</p>

						<div>
							<button onClick={() => switchTabs('video-check')}>
								Video check*
							</button>
							<button onClick={() => switchTabs('speaker-check')}>
								Speaker check*
							</button>
							<button onClick={() => switchTabs('mic-check')}>
								Microphone check*
							</button>
							<button onClick={() => switchTabs('network-check')}>
								Network check
							</button>
							<button onClick={() => switchTabs('connection-check')}>
								Connection check*
							</button>
							<button onClick={() => switchTabs('websocket-check')}>
								WebSocket check
							</button>
						</div>
					</>
					<>
						{uiState === 'video-check' && <VideoCheck />}
						{uiState === 'speaker-check' && <SpeakerCheck />}
						{uiState === 'mic-check' && <MicCheck />}
						{uiState === 'network-check' && <NetworkCheck />}
						{uiState === 'connection-check' && <ConnectionCheck />}
						{uiState === 'websocket-check' && <WebsocketCheck />}
					</>
				</div>
			</DailyTest>
		</>
	);
};
