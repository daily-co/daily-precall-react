import React, { createContext, useContext } from "react";
import {
  atom,
  RecoilRootProps,
  useRecoilCallback,
  useRecoilValue,
} from "recoil";
import {
  DailyCall,
  DailyFatalErrorType,
  DailyNonFatalErrorType,
} from "@daily-co/daily-js";
import {
  CameraTestReport,
  MicTestReport,
  SpeakerTestReport,
} from "./hooks/useMediaTest.ts";
import { WebsocketsTestReport } from "./hooks/useWebsocketsTest.ts";
import { NetworkTestReport } from "./hooks/useNetworkTest.ts";
import { ConnectionTestReport } from "./hooks/useConnectionTest.ts";

export type ErrorEvent = {
  timestamp: Date;
  error: DailyNonFatalErrorType | DailyFatalErrorType;
};

export type TestState =
  | "idle"
  | "starting"
  | "running"
  | "stopping"
  | "finished"
  | "error"
  | "aborted";

type TestDataKey =
  | "camera"
  | "speaker"
  | "mic"
  | "network"
  | "connection"
  | "websockets";

interface DailyTestData {
  camera?: CameraTestReport;
  speaker?: SpeakerTestReport;
  mic?: MicTestReport;
  network?: NetworkTestReport;
  connection?: ConnectionTestReport;
  websockets?: WebsocketsTestReport;
}

export interface ContextValue {
  testData: DailyTestData;
  callObject: DailyCall | undefined;
  addTestData(
    key: TestDataKey,
    data:
      | CameraTestReport
      | SpeakerTestReport
      | MicTestReport
      | NetworkTestReport
      | ConnectionTestReport
      | WebsocketsTestReport
  ): void;
}

const DailyTestContext = createContext<ContextValue>({
  testData: {},
  addTestData: () => {},
  callObject: undefined,
});

const testDataState = atom<DailyTestData>({
  key: "test-data-state",
  default: {},
});

type Props = {
  callObject?: DailyCall;
  children: React.ReactNode;
  recoilRootProps?: Omit<RecoilRootProps, "children">;
};
export const DailyTestProvider: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  callObject,
}) => {
  const testData = useRecoilValue(testDataState);
  const addTestData = useRecoilCallback(
    ({ set }) =>
      (key: TestDataKey, data) => {
        set(testDataState, (prevData) => ({
          ...prevData,
          [key]: data,
        }));
      },
    []
  );

  return (
    <DailyTestContext.Provider value={{ testData, addTestData, callObject }}>
      {children}
    </DailyTestContext.Provider>
  );
};
export const useDailyTest = () => useContext(DailyTestContext);
DailyTestContext.displayName = "DailyTestContext";
