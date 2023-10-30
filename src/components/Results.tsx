import { Card } from './shared/Card/Card';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTestData } from '../hooks/useTestData';

export const Results = () => {
  const { websocketsTestData, connectionTestData, networkTestData } =
    useTestData();

  const networkResults = useMemo(() => {
    if (
      websocketsTestData?.result === 'passed' &&
      networkTestData?.result === 'passed'
    ) {
      return (
        <>
          You will be able to make video calls via the network you are on right
          now.
        </>
      );
    } else {
      return <>You might not be able to make video calls via your network.</>;
    }
  }, [networkTestData?.result, websocketsTestData?.result]);

  const connectionQualityResults = useMemo(() => {
    if (connectionTestData?.result === 'good') {
      return <>Your internet connection quality is good.</>;
    } else {
      return (
        <>
          Your internet connection quality may not be optimal for video calls.
        </>
      );
    }
  }, [connectionTestData?.result]);

  const showNetworkDebuggerLink = useMemo(() => {
    if (
      websocketsTestData?.result !== 'passed' ||
      networkTestData?.result !== 'passed' ||
      connectionTestData?.result !== 'good'
    ) {
      return (
        <p>
          For an advanced network check, please try our{' '}
          <a href="https://network-test.daily.co/index.html" target="_blank">
            Network Debugger
          </a>
          . You can send the results to your network administrator for more
          information.
        </p>
      );
    } else {
      return null;
    }
  }, [
    connectionTestData?.result,
    networkTestData?.result,
    websocketsTestData?.result,
  ]);

  return (
    <Card title="Results">
      {websocketsTestData || connectionTestData || networkTestData ? (
        <>
          <p>
            {networkResults} {connectionQualityResults}
          </p>
          <>{showNetworkDebuggerLink}</>
          <details>
            <summary>Raw data</summary>
            <pre> Websockets: {JSON.stringify(websocketsTestData)}</pre>
            <pre> Connection: {JSON.stringify(connectionTestData)}</pre>
            <pre> Network: {JSON.stringify(networkTestData)}</pre>
          </details>
        </>
      ) : (
        <p>
          No test data...{' '}
          <Link to={`/`} className="link ghost">
            Start the test.
          </Link>
        </p>
      )}
    </Card>
  );
};
