import { atom, useRecoilState, useRecoilValue } from "recoil";

export type UIView =
  | "idle" // default state - nothing's happened yet
  | "video-check" // check if video works
  | "speaker-check" // check if the speakers work
  | "mic-check" // check if the microphone works
  | "network-check" // a network check
  | "connection-check" // an internet connection strength check (throughput)
  | "websocket-check"; // websocket check

const uiViewState = atom<UIView | null>({
  key: "ui-view-state",
  default: "idle",
});

const showTabsState = atom<boolean>({
  key: "show-tabs-state",
  default: true, // set this to false if you don't want to show the tabs
});

export const useUiState = () => {
  const [uiState, setUiState] = useRecoilState(uiViewState);
  return {
    uiState,
    setUiState,
  };
};

export const useTabs = () => {
  const showTabs = useRecoilValue(showTabsState);

  const { setUiState } = useUiState();

  const switchTabs = (tab: any) => {
    setUiState(tab);
  };

  return {
    switchTabs,
    showTabs,
  };
};
