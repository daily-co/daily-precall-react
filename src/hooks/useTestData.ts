import { atom, useRecoilState } from 'recoil';
import {
  DailyConnectionQualityTestStats,
  DailyNetworkConnectivityTestStats,
  DailyWebsocketConnectivityTestResults,
} from '@daily-co/daily-js';

const websocketDataState = atom<DailyWebsocketConnectivityTestResults>({
  key: 'websocket-data-state',
  default: undefined,
});

const connectionDataState = atom<DailyConnectionQualityTestStats>({
  key: 'connection-data-state',
  default: undefined,
});

const networkDataState = atom<DailyNetworkConnectivityTestStats>({
  key: 'network-data-state',
  default: undefined,
});

export const useTestData = () => {
  const [websocketsTestData, setWebsocketsTestData] =
    useRecoilState(websocketDataState);
  const [connectionTestData, setConnectionTestData] =
    useRecoilState(connectionDataState);
  const [networkTestData, setNetworkTestData] =
    useRecoilState(networkDataState);

  return {
    websocketsTestData,
    setWebsocketsTestData,
    connectionTestData,
    setConnectionTestData,
    networkTestData,
    setNetworkTestData,
  };
};
