import { DailyTestProvider } from '@daily-co/daily-precall-react';
import { useDaily } from '@daily-co/daily-react';
import { useTabs, useUiState } from '../hooks/useUiState';
import { Button } from './shared/Button/Button';
import { VideoCheck } from './MediaDevices/VideoCheck';
import { SpeakerCheck } from './MediaDevices/SpeakerCheck';
import { MicCheck } from './MediaDevices/MicCheck';
import { NetworkCheck } from './Network/NetworkCheck';
import { ConnectionCheck } from './Network/ConnectionCheck';
import { WebsocketCheck } from './Network/WebsocketCheck';

export const Tests = () => {
	const { uiState } = useUiState();
	const { switchTabs } = useTabs();
	const callObject = useDaily();

	return (
		/* DailyTestProvider calls startCamera() on the call object as soon as it's instantiated. This gives
		 * us access to the user's video and audio tracks (provided they give permissions). We'll use these streams
		 * in our devices and connection checks. */
		<DailyTestProvider callObject={callObject}>
			{uiState === 'idle' ? (
				<Button onClick={() => switchTabs('video-check')}>
					Get started 👉
				</Button>
			) : (
				<>
					{uiState === 'video-check' && <VideoCheck />}
					{uiState === 'speaker-check' && <SpeakerCheck />}
					{uiState === 'mic-check' && <MicCheck />}

					{uiState === 'network-check' && <NetworkCheck />}
					{uiState === 'connection-check' && <ConnectionCheck />}
					{uiState === 'websocket-check' && <WebsocketCheck />}
				</>
			)}
		</DailyTestProvider>
	);
};
