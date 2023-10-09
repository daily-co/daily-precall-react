import React, { useState } from 'react';
import {
  useDaily,
  useLocalSessionId,
  useMediaTrack,
} from '@daily-co/daily-react';
import { DailyConnectionQualityTestStats } from '@daily-co/daily-js';
import { Link } from 'react-router-dom';

import { Card } from '../shared/Card/Card';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting';
import { logger } from '../../utils/Logger';
import { useTestData } from '../../hooks/useTestData';

const TEST_DURATION = 15;
export const ConnectionCheck: React.FC = () => {
  const localSessionId = useLocalSessionId();
  const videoTrack = useMediaTrack(localSessionId, 'video');
  const callObject = useDaily();
  const [testRunning, setTestRunning] = useState(false);

  const { connectionTestData, setConnectionTestData } = useTestData();

  async function startTest() {
    if (!callObject || !videoTrack.persistentTrack) {
      logger.info('We need a video track and/or a call object to continue.');
      return;
    } else {
      setTestRunning(true);
      const results = await callObject.testConnectionQuality({
        videoTrack: videoTrack.persistentTrack,
        duration: TEST_DURATION,
      });
      setConnectionTestData(results);
      setTestRunning(false);
    }
  }

  function stopTest() {
    callObject?.stopTestConnectionQuality();
    setTestRunning(false);
  }

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

  const renderVerdict = (v: DailyConnectionQualityTestStats['result']) => {
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
      case 'aborted':
        return (
          <>
            <h3>Test aborted</h3>
            <p>Test aborted before any data could be collected.</p>
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
        accurate its results. By default, the test runs for 15 seconds. You can
        customize how long it runs for, up to a maximum of 30 seconds.
      </p>
      {!videoTrack.persistentTrack && (
        <TroubleShooting show>
          We don't have access to your video. This means we cannot check your
          network speed. Please make sure your browser has access to your camera
          and microphone, and try going through the test again. You can still
          make video calls without a camera or microphone, but people will not
          be able to hear or see you.
        </TroubleShooting>
      )}
      {videoTrack.persistentTrack && (
        <>
          <div className="options">
            <button
              className="button primary"
              onClick={() => startTest()}
              disabled={testRunning}
            >
              Start connection check
            </button>
            <button
              className="button primary"
              onClick={() => stopTest()}
              disabled={!testRunning}
            >
              Stop connection check
            </button>
          </div>

          <div>
            {testRunning && <p>Test running for {TEST_DURATION} seconds...</p>}
            {connectionTestData && (
              <>
                <h2>Verdict</h2>
                {renderVerdict(connectionTestData.result)}
                <Link to={`/websockets-check`} className="link ghost">
                  Continue to next check
                </Link>
                <hr />
                <h2>Raw results</h2>
                <pre>{JSON.stringify(connectionTestData, null, 2)}</pre>
              </>
            )}
          </div>
        </>
      )}
    </Card>
  );
};
