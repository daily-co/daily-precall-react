import { useEffect, useState } from 'react';
import DailyIframe, { DailyCall, DailyBrowserInfo } from '@daily-co/daily-js';
import { DailyProvider } from '@daily-co/daily-react';
import { logger } from './utils/Logger.ts';

import { Tests } from './components/Tests';
import { UnsupportedBrowser } from './components/UnsupportedBrowser';
import { Navigation } from './components/Navigation';
import './App.css';

export const App = () => {
	const [dailyCallObject, setDailyCallObject] = useState<DailyCall | null>(
		null,
	);
	const [browserInfo, setBrowserInfo] = useState<DailyBrowserInfo | null>(null);

	/*
	 * We need a Daily Call Object to interact with both the DailyProvider and the DailyTestProvider.
	 * Out of an abundance of caution, to make sure we're using the same call object for both providers,
	 * we'll initialise it here and call `useDaily()` inside the <Tests/>, component,
	 * where we'll pass the object to the DailyTestProvider.
	 */
	useEffect(() => {
		// There's no reason to create a call object and
		// start an entire precall check if the user's browser isn't supported.
		const supportedBrowser = DailyIframe.supportedBrowser();
		setBrowserInfo(supportedBrowser);

		if (supportedBrowser.supported) {
			logger.info('Browser is supported');
			const co = DailyIframe.createCallObject();
			setDailyCallObject(co);
			logger.info('Created call object');
		} else {
			logger.warn('Browser is not supported');
		}

		return () => {
			logger.info('Setting call object to null');
			setDailyCallObject(null);
		};
	}, []);

	return (
		<div className="app">
			<header>
				<img src="../public/logo.svg" alt="Daily logo" />
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
				) : browserInfo?.supported ? (
					'No call object could be created...'
				) : (
					<UnsupportedBrowser />
				)}
			</main>
			<Navigation />
		</div>
	);
};
