import { useEffect, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { DailyProvider } from '@daily-co/daily-react';
import { useTabs } from './hooks/useUiState';
import { Button } from './components/shared/Button/Button.tsx';
import { Tests } from './components/Tests';
import './App.css';

export const App = () => {
	const [dailyCallObject, setDailyCallObject] = useState<DailyCall | null>(
		null,
	);

	/*
	 * We need a Daily Call Object to interact with both the DailyProvider and the DailyTestProvider.
	 * Out of an abundance of caution, to make sure we're using the same call object for both providers,
	 * we'll initialise it here and call `useDaily()` inside the <Tests/>, component,
	 * where we'll pass the object to the DailyTestProvider.
	 */
	useEffect(() => {
		const co = DailyIframe.createCallObject();
		setDailyCallObject(co);

		return () => {
			setDailyCallObject(null);
		};
	}, []);

	const { switchTabs } = useTabs();

	return (
		<div className="app">
			<header>
				<h1>Test your network and devices</h1>
				<p>
					The Daily API makes implementing a precall test a breeze, especially
					when combined with the{' '}
					<a href="https://docs.daily.co/reference/daily-react">
						Daily React library
					</a>
					. This app demonstrates how to do network and device checks.
				</p>
			</header>
			<main>
				{dailyCallObject ? (
					<DailyProvider
						callObject={dailyCallObject}
						recoilRootProps={{
							override: false,
						}}>
						<Tests />
					</DailyProvider>
				) : (
					<p>No call object..</p>
				)}
			</main>
			<nav className="navigation">
				<Button onClick={() => switchTabs('video-check')} variant="tab">
					Video check
				</Button>
				<Button onClick={() => switchTabs('speaker-check')} variant="tab">
					Speaker check
				</Button>
				<Button onClick={() => switchTabs('mic-check')} variant="tab">
					Microphone check
				</Button>
				<Button onClick={() => switchTabs('network-check')} variant="tab">
					Network check
				</Button>
				<Button onClick={() => switchTabs('connection-check')} variant="tab">
					Connection check
				</Button>
				<Button onClick={() => switchTabs('websocket-check')} variant="tab">
					WebSocket check
				</Button>
				<Button onClick={() => window.location.reload()} variant="tab">
					Restart
				</Button>
			</nav>
		</div>
	);
};
