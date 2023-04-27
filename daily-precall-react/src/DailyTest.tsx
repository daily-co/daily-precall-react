import React, { useEffect } from "react";
import { DailyCall, DailyEvent } from "@daily-co/daily-js";

import { DailyProvider } from "@daily-co/daily-react";
import { DailyTestProvider } from "./DailyTestProvider.js";
import { RecoilRoot } from "recoil";

type Props = {
  callObject?: DailyCall;
  children: React.ReactNode;
};
export const DailyTest: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  callObject,
}) => {
  useEffect(() => {
    if (!callObject || callObject.isDestroyed()) return;

    function handleNewMeetingState() {
      switch (callObject?.meetingState()) {
        case "left-meeting":
          callObject.destroy();
          break;
        default:
          break;
      }
    }

    // Use initial state
    handleNewMeetingState();
    console.log("hello?");
    callObject.startCamera().then(() => console.log("start camera :D"));
    callObject?.on("left-meeting" as DailyEvent, handleNewMeetingState);

    // Stop listening for changes in state
    return () => {
      callObject.off("left-meeting" as DailyEvent, handleNewMeetingState);
    };
  }, [callObject]);

  return (
    <RecoilRoot>
      <DailyTestProvider callObject={callObject}>
        <DailyProvider callObject={callObject}>{children}</DailyProvider>
      </DailyTestProvider>
    </RecoilRoot>
  );
};
