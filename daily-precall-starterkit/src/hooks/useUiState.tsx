import { atom, useRecoilState } from 'recoil';

export type UIView =
	| 'idle' // default state - nothing's happened yet
	| 'video-check' // check if video works
	| 'speaker-check' // check if the speakers work
	| 'mic-check' // check if the microphone works
	| 'network-check' // a network protocol check
	| 'connection-check' // an internet connection strength check
	| 'websocket-check'; // websocket check

const uiViewState = atom<UIView | null>({
	key: 'ui-view-state',
	default: 'idle',
});

export const useUiState = () => {
	const [uiState, setUiState] = useRecoilState(uiViewState);
	return {
		uiState,
		setUiState,
	};
};

export const useTabs = () => {
	const { setUiState } = useUiState();

	const switchTabs = (tab: UIView) => {
		setUiState(tab);
	};

	return {
		switchTabs,
	};
};
