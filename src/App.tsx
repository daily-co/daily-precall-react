import { useEffect, useState } from 'react';
import DailyIframe, { DailyCall, DailyBrowserInfo } from '@daily-co/daily-js';
import { DailyProvider } from '@daily-co/daily-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { logger } from './utils/Logger.ts';

import { UnsupportedBrowser } from './components/UnsupportedBrowser';
import { Navigation } from './components/Navigation';
import './App.css';
import { DailyLogo } from './components/shared/DailyLogo';

export const App = () => {
  const [daily, setDaily] = useState<DailyCall | null>(null);
  const [browserInfo, setBrowserInfo] = useState<DailyBrowserInfo | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (daily) return;
    const supportedBrowser = DailyIframe.supportedBrowser();
    setBrowserInfo(supportedBrowser);

    if (supportedBrowser.supported) {
      logger.info('Browser is supported');
      const instance = DailyIframe.getCallInstance();
      if (instance) {
        logger.info('Reusing existing callObject instance');
        setDaily(instance);
      } else {
        logger.info('Creating new callObject instance');
        const co = DailyIframe.createCallObject();
        setDaily(co);
        logger.info('Created call object');
      }
    } else {
      logger.warn('Browser is not supported. Not creating a call object.');
    }
  }, [daily]);

  useEffect(() => {
    if (!daily || daily.isDestroyed()) return;

    const startCam = async () => {
      await daily?.startCamera();
    };

    startCam()
      .then(() => logger.info('Camera started. Ready to start testing!'))
      .catch((e) => logger.error(e));
  }, [daily]);

  return (
    <div className="app">
      <header>
        <DailyLogo gradientId="dailyslashdesktop" height="32" />
        <p>
          The Daily API makes implementing a precall test a breeze, especially
          when combined with the{' '}
          <a
            href="https://docs.daily.co/reference/daily-react"
            target="_blank"
            rel="noreferrer"
          >
            Daily React library
          </a>
          . This app demonstrates how to do network and device checks using{' '}
          <a
            href="https://docs.daily.co/reference/rn-daily-js/instance-methods/test-connection-quality"
            target="_blank"
            rel="noreferrer"
          >
            testConnectionQuality
          </a>
          ,{' '}
          <a
            href="https://docs.daily.co/reference/daily-js/instance-methods/test-network-connectivity"
            target="_blank"
            rel="noreferrer"
          >
            testNetworkConnectivity()
          </a>
          , and{' '}
          <a
            href="https://docs.daily.co/reference/daily-js/instance-methods/test-websocket-connectivity"
            target="_blank"
            rel="noreferrer"
          >
            testWebsocketConnectivity
          </a>
          . For more info, check out this{' '}
          <a href="@TODO" target="_blank" rel="noreferrer">
            blog post
          </a>
          !
        </p>
      </header>
      <main>
        {daily ? (
          <DailyProvider callObject={daily}>
            {location.pathname === '/' ? (
              <Link className="link primary" to={`video-check`}>
                Get started 👉
              </Link>
            ) : null}
            {/*Where the individual components will be rendered. We'll use a ContextProvider to save the test results for the "final results" page. */}
            <Outlet />
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
