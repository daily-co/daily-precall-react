import { useCallback, useEffect, useState } from "react";

import { ErrorEvent, TestState, useDailyTest } from "../DailyTestProvider.tsx";
import {
  CONNECTION_MODES,
  CONNECTION_STATUS,
  ConnectionModes,
  NAT_SERVICES_LINKS,
} from "../utils/constants.ts";
import NetworkTester from "../utils/NetworkTester.ts";
import { v4 as uuidv4 } from "uuid";

type Protocols = {
  [key in ConnectionModes]?: {
    result?: string | null;
    iceCandidates?: any;
  };
};

export interface NetworkTestReport {
  errors?: any;
  connected?: ConnectionModes[];
  failed?: ConnectionModes[];
  successRate?: number;
  result?: "failed" | "warning" | "passed" | "";
  id?: string;
  startedAt?: Date;
}

export const useNetworkTest = () => {
  const { addTestData, callObject } = useDailyTest();
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [networkTestState, setNetworkTestState] = useState<TestState>("idle");
  const [testDuration, setTestDuration] = useState<number>(0);
  const [testTimeout, setTestTimeout] =
    useState<ReturnType<typeof setTimeout>>();
  const [networkInterval, setNetworkInterval] = useState<any>();
  const [protocolTesters, setProtocolTesters] = useState<ConnectionModes[]>();
  const [protocolTestData, setProtocolTestData] = useState<Protocols>({
    [CONNECTION_MODES.ALL]: {
      result: null,
      iceCandidates: null,
    },
    [CONNECTION_MODES.RELAY_ONLY]: {
      result: null,
      iceCandidates: null,
    },
    [CONNECTION_MODES.STUN]: {
      result: null,
      iceCandidates: null,
    },
    [CONNECTION_MODES.TURN_UDP]: {
      result: null,
      iceCandidates: null,
    },
    [CONNECTION_MODES.TURN_TCP]: {
      result: null,
      iceCandidates: null,
    },
    [CONNECTION_MODES.TURN_TLS]: {
      result: null,
      iceCandidates: null,
    },
  });

  useEffect(() => {
    if (testTimeout) {
      clearTimeout(testTimeout);
    }
    if (testDuration > 0) {
      const newTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
        setNetworkTestState("stopping");
      }, testDuration * 1000);
      setTestTimeout(newTimeout);
    }
  }, [testDuration]);

  useEffect(() => {
    const isDone = Object.keys(protocolTestData).every(
      (key) => protocolTestData[key]?.result !== null
    );
    if (isDone) setNetworkTestState("finished");
  }, [protocolTestData]);

  const addError = useCallback((error: any) => {
    const newError: ErrorEvent = {
      timestamp: new Date(),
      error,
    };
    setErrors((prevState) => [...prevState, newError]);
  }, []);

  useEffect(() => {
    if (!callObject) return;
    callObject.on("error", addError);
    callObject.on("nonfatal-error", addError);

    return function cleanup() {
      callObject.off("error", addError);
      callObject.off("nonfatal-error", addError);
    };
  }, [callObject]);

  useEffect(() => {
    const handleNewState = async () => {
      switch (networkTestState) {
        case "idle":
          break;
        case "starting":
          const svcResp = await fetch(NAT_SERVICES_LINKS.TWILIO);
          const iceServers = await svcResp.json();
          const testers = await Promise.all(
            Object.keys(protocolTestData).map((test) =>
              initiateProtocolTester(test, iceServers)
            )
          );
          setProtocolTesters(testers);
          setNetworkTestState("running");
          break;
        case "running":
          const n = setInterval(async () => {}, 1000);
          setNetworkInterval(n);
          break;
        case "stopping":
          if (protocolTesters) {
            await Promise.all(
              protocolTesters.map((test: any) => {
                test.stop();
              })
            );
          }
          setNetworkTestState("finished");
          break;
        case "finished":
          if (networkInterval) clearInterval(networkInterval);
          if (testTimeout) clearTimeout(testTimeout);

          setNetworkTestResults();
          break;
        case "aborted":
          if (networkInterval) clearInterval(networkInterval);
          if (testTimeout) clearTimeout(testTimeout);
          if (protocolTesters) {
            protocolTesters.map((test: any) => {
              test.stop();
            });
          }
          setNetworkTestState("idle");
          setErrors([]);
          break;
      }
    };
    handleNewState();

    return () => {
      clearInterval(networkInterval);
    };
  }, [networkTestState]);

  const setNetworkTestResults = () => {
    const results: NetworkTestReport = {};
    const connected = Object.keys(protocolTestData).filter(
      (key) => protocolTestData[key]?.result === "connected"
    );
    const failed = Object.keys(protocolTestData).filter(
      (key) => protocolTestData[key]?.result === "failed"
    );

    if (
      protocolTestData[CONNECTION_MODES.RELAY_ONLY]?.result ===
      CONNECTION_STATUS.CONNECTED
    ) {
      results.result = "passed";
    } else if (
      protocolTestData[CONNECTION_MODES.RELAY_ONLY]?.result ===
      CONNECTION_STATUS.FAILED
    ) {
      results.result = "failed";
    } else {
      results.result = "warning";
    }

    results.connected = connected;
    results.errors = errors;
    results.failed = failed;
    results.id = uuidv4();
    results.startedAt = new Date();

    addTestData("network", results);
  };

  async function initiateProtocolTester(
    connectionMode: ConnectionModes,
    iceServers: RTCIceServer[]
  ) {
    const instance: any = new NetworkTester({
      natService: "twilio",
      connectionMode,
      iceServers,
    });

    instance.setupRTCPeerConnection().then((result: any) => {
      setProtocolTestData((prevState) => ({
        ...prevState,
        [connectionMode]: {
          result: result.status,
          iceCandidates: result.iceCandidates,
        },
      }));
    });

    return instance;
  }

  const startNetworkTest = async (timeout: number = 10): Promise<any> => {
    setTestDuration(timeout);
    setNetworkTestState("starting");
  };

  const stopNetworkTest = () => {
    setNetworkTestState("aborted");
  };

  return {
    startNetworkTest,
    stopNetworkTest,
    networkTestState,
  };
};
