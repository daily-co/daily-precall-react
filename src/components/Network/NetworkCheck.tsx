import React, { useState } from 'react';
import {
  useDaily,
  useLocalSessionId,
  useVideoTrack,
  DailyVideo,
} from '@daily-co/daily-react';
import { DailyNetworkConnectivityTestStats } from '@daily-co/daily-js';
import { Link } from 'react-router-dom';

import { Card } from '../shared/Card/Card';
import { logger } from '../../utils/Logger';
import { useTestData } from '../../hooks/useTestData';

export const NetworkCheck: React.FC = () => {
  const localSessionId = useLocalSessionId();
  const videoTrack = useVideoTrack(localSessionId);
  const callObject = useDaily();
  const { networkTestData, setNetworkTestData } = useTestData();
  const [testRunning, setTestRunning] = useState(false);

  async function startTest() {
    if (
      !callObject ||
      !videoTrack.persistentTrack ||
      videoTrack.state !== 'playable'
    ) {
      logger.info('We need a video track and/or a call object to continue.');
      return;
    } else {
      setTestRunning(true);
      const results = await callObject.testNetworkConnectivity(
        videoTrack.persistentTrack,
      );
      setNetworkTestData(results);
      setTestRunning(false);
    }
  }

  function stopTest() {
    callObject?.abortTestNetworkConnectivity();
    setTestRunning(false);
  }

  const renderVerdict = (
    result: DailyNetworkConnectivityTestStats['result'],
  ) => {
    switch (result) {
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
      case 'aborted':
        return (
          <>
            <h3>Test aborted</h3>
            <p>Test aborted before any results were returned.</p>
          </>
        );

      default:
        break;
    }
    return '';
  };

  return (
    <Card title="Network conditions check">
      {/* We need a hidden DailyVideo element here. When the local participant’s video track is unassigned
			from a <video> element and cleaned up (which is what happens when we unmount the component when switching pages),
			the video track changes to interrupted in the participant tracks object. We really want to keep a reference to this track,
			because we need to pass it to the network test.*/}
      <DailyVideo
        automirror
        sessionId={localSessionId}
        type="video"
        style={{ display: 'none' }}
      />

      <p>
        This test checks if the user's network allows them to talk other
        networks. It either passes or not. If it doesn't pass, we recommend
        using the{' '}
        <a href="https://network-test.daily.co/index.html" target="_blank">
          Daily network debugger
        </a>{' '}
        to dig into why.
      </p>
      <>
        <div className="options">
          <button
            className="button primary"
            onClick={() => startTest()}
            disabled={testRunning}
          >
            Start network check
          </button>
          <button
            className="button primary"
            onClick={() => stopTest()}
            disabled={!testRunning}
          >
            Stop network check
          </button>
        </div>

        {testRunning && <p>Test running...</p>}
        {networkTestData && (
          <div>
            <h2>Verdict</h2>
            {renderVerdict(networkTestData?.result)}
            <Link to={`/connection-check`} className="link ghost">
              Continue to next check
            </Link>
          </div>
        )}
      </>
    </Card>
  );
};
