import { useCallback, useEffect, useState } from "react";

import { ErrorEvent, TestState, useDailyTest } from "../DailyTestProvider.tsx";
import ConnectionStats, {
  getResultFromNetworkTest,
} from "../utils/ConnectionStats.ts";
import { NAT_SERVICES_LINKS } from "../utils/constants.ts";
import { v4 as uuidv4 } from "uuid";

type ThroughputTest = "maxRtt" | "packetLoss";

export interface ConnectionTestReport {
  errors?: ErrorEvent[];
  id?: string;
  result?: "good" | "bad" | "warning" | "failed" | "";
  startedAt?: Date;
  throughput?: Record<ThroughputTest, number | null>;
}
// TODO: allow users to provide their own tracks so we don't have to rely on access to a Daily room in order for this to work
export const useConnectionTest = () => {
  const { addTestData, callObject } = useDailyTest();

  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [connectionTestState, setConnectionTestState] =
    useState<TestState>("idle");
  const [testDuration, setTestDuration] = useState<number>(0);
  const [testTimeout, setTestTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>();
  const [networkInterval, setNetworkInterval] = useState<any>();

  const localParticipant = callObject?.participants().local;
  const audioTrack = localParticipant?.tracks?.audio;
  const videoTrack = localParticipant?.tracks?.video;

  const [connectionStatsTester, setConnectionStatsTester] = useState<any>();
  const [throughputTestData, setThroughputTestData] = useState<
    ConnectionTestReport["throughput"]
  >({ maxRtt: null, packetLoss: null });
  const [throughputTestResult, setThroughputTestResult] =
    useState<ConnectionTestReport["result"]>("");

  useEffect(() => {
    if (testTimeout) clearTimeout(testTimeout);
    if (testDuration > 0) {
      let newTimeout: ReturnType<typeof setTimeout> = setTimeout(() => {
        setConnectionTestState("stopping");
      }, testDuration * 1000);
      setTestTimeout(newTimeout);
    }
  }, [testDuration]);

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
      switch (connectionTestState) {
        case "idle":
          break;
        case "starting":
          const stream = new MediaStream();
          if (audioTrack?.persistentTrack) {
            stream.addTrack(audioTrack.persistentTrack);
          } else {
            addError(
              "No audio track found: this may affect the throughput test results."
            );
          }
          if (videoTrack?.persistentTrack) {
            stream.addTrack(videoTrack.persistentTrack);
          } else {
            addError(
              "No video track found: this may affect the throughput test results."
            );
          }

          if (!videoTrack?.persistentTrack && !audioTrack?.persistentTrack) {
            addError(
              "No audio and video tracks found: cannot create media stream needed to measure throughput."
            );
            setConnectionTestState("stopping");
            return;
          }

          const service = NAT_SERVICES_LINKS.TWILIO;
          const svcResp = await fetch(service);
          const iceServers = await svcResp.json();

          const connectionTester = new ConnectionStats({
            iceServers: iceServers,
            mediaStream: stream,
            limitSamples: false,
          });

          await connectionTester.startContinuouslySampling();
          setConnectionStatsTester(connectionTester);
          setConnectionTestState("running");
          break;
        case "running":
          const n = setInterval(async () => {
            const sample = await connectionStatsTester.getSample();
            setThroughputTestData(sample);
            const verdict = getResultFromNetworkTest(
              sample
            ) as ConnectionTestReport["result"];
            setThroughputTestResult(verdict);
          }, 1000);
          setNetworkInterval(n);
          break;
        case "stopping":
          connectionStatsTester?.stopSampling();
          if (networkInterval) {
            clearInterval(networkInterval);
          }
          if (testTimeout) {
            clearTimeout(testTimeout);
          }
          setTestDuration(0);
          setTestTimeout(null);
          setConnectionStatsTester(null);
          setConnectionTestState("finished");
          break;
        case "finished":
          setConnectionTestResults();
          break;
      }
    };
    handleNewState();

    return () => {
      clearInterval(networkInterval);
    };
  }, [connectionTestState]);

  const setConnectionTestResults = () => {
    const results: ConnectionTestReport = {};
    results.errors = errors;
    results.id = uuidv4();
    results.result = throughputTestResult;
    results.startedAt = new Date();
    results.throughput = throughputTestData;

    addTestData("connection", results);
  };

  /**
   * Starts the connection test.
   * @param duration The duration of the test in seconds.
   */
  const startConnectionTest = async (duration: number = 10): Promise<void> => {
    setTestDuration(duration);
    setConnectionTestState("starting");
  };

  /**
   * Stops the connection test.
   */
  const stopConnectionTest = () => {
    setConnectionTestState("stopping");
  };

  return {
    connectionTestState,
    startConnectionTest,
    stopConnectionTest,
  };
};
