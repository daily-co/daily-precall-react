import React, { useEffect } from 'react';
import { DailyCall, DailyEvent } from '@daily-co/daily-js';

import { DailyTest } from './DailyTest.tsx';
import { RecoilRoot } from 'recoil';

type Props = {
	callObject: DailyCall | null;
	children: React.ReactNode;
};
export const DailyTestProvider: React.FC<React.PropsWithChildren<Props>> = ({
	children,
	callObject,
}) => {
	useEffect(() => {
		if (!callObject || callObject.isDestroyed()) return;

		function handleNewMeetingState() {
			switch (callObject?.meetingState()) {
				case 'left-meeting':
					callObject.destroy();
					break;
				default:
					break;
			}
		}

		// Use initial state
		handleNewMeetingState();
		callObject?.on('left-meeting' as DailyEvent, handleNewMeetingState);

		callObject.startCamera().then(() =>
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			console.log(callObject?._callFrameId, '====CAMERA STARTED!==='),
		);

		// Stop listening for changes in state
		return () => {
			callObject.off('left-meeting' as DailyEvent, handleNewMeetingState);
		};
	}, [callObject]);

	return (
		<RecoilRoot>
			<DailyTest callObject={callObject}>{children}</DailyTest>
		</RecoilRoot>
	);
};
