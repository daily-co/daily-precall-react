import React, { useState } from 'react';
import { Card } from '../shared/Card/Card';
import { DailyWebsocketConnectivityTestResults } from '@daily-co/daily-js';
import { Link } from 'react-router-dom';
import { useDaily } from '@daily-co/daily-react';
import { logger } from '../../utils/Logger';
import { useTestData } from '../../hooks/useTestData';

export const WebsocketsCheck: React.FC = () => {
  const callObject = useDaily();
  const { websocketsTestData, setWebsocketsTestData } = useTestData();
  const [testRunning, setTestRunning] = useState(false);

  async function startTest() {
    if (!callObject) {
      logger.info('We need a a call object to continue.');
      return;
    } else {
      setTestRunning(true);
      const results = await callObject.testWebsocketConnectivity();
      setWebsocketsTestData(results);
      setTestRunning(false);
    }
  }

  function stopTest() {
    callObject?.abortTestWebsocketConnectivity();
    setTestRunning(false);
  }

  const renderVerdict = (
    v: DailyWebsocketConnectivityTestResults['result'],
  ) => {
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
      <>
        <div className="options">
          <button
            className="button primary"
            onClick={() => startTest()}
            disabled={testRunning}
          >
            Start websockets check
          </button>
          <button
            className="button primary"
            onClick={() => stopTest()}
            disabled={!testRunning}
          >
            Stop websockets check
          </button>
        </div>

        <div>
          {testRunning && <p>Test running....</p>}
          {websocketsTestData && (
            <>
              <h2>Verdict</h2>
              {renderVerdict(websocketsTestData.result)}
              <hr />
              <h2>Raw results</h2>
              <pre>{JSON.stringify(websocketsTestData, null, 2)}</pre>

              <Link to={`/results`} className="link special">
                👉 See all test results
              </Link>
            </>
          )}
        </div>
      </>
    </Card>
  );
};
