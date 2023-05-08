import { useDevices } from '@daily-co/daily-react';
import { useDailyTest } from '../DailyTest.tsx';
import { v4 as uuidv4 } from 'uuid';
import {
	CameraTestReport,
	MicTestReport,
	SpeakerTestReport,
} from '../types.js';

export const useMediaTest = () => {
	const {
		cameras,
		camState,
		micState,
		speakers,
		microphones,
		hasCamError,
		hasMicError,
	} = useDevices();

	const { addTestData } = useDailyTest();

	/**
	 * Adds current information about camera devices to testData.
	 * See also: https://docs.daily.co/reference/daily-js/instance-methods/get-input-devices
	 */
	const captureCameraReport = () => {
		// gum
		const report: CameraTestReport = {
			camError: hasCamError ? camState : null,
			camState: camState && camState,
			cameras: cameras && cameras,
			hasCamError: hasCamError && hasCamError,
			id: uuidv4(),
			selectedCamera: cameras && cameras.find((cam) => cam.selected)?.device,
			startedAt: new Date(),
		};

		addTestData('camera', report);
		return report;
	};

	/**
	 * Adds current information about speaker devices to testData.
	 * See also: https://docs.daily.co/reference/daily-js/instance-methods/get-input-devices
	 */
	const captureSpeakerReport = () => {
		const report: SpeakerTestReport = {
			id: uuidv4(),
			selectedSpeaker:
				speakers && speakers.find((speaker) => speaker.selected)?.device,
			speakers: speakers && speakers,
			startedAt: new Date(),
		};

		addTestData('speaker', report);
		return report;
	};

	/**
	 * Adds current information about microphone devices to testData.
	 * See also: https://docs.daily.co/reference/daily-js/instance-methods/get-input-devices
	 */
	const captureMicReport = () => {
		const report: MicTestReport = {
			hasMicError: hasMicError && hasMicError,
			id: uuidv4(),
			micError: hasMicError ? micState : null,
			micState: micState && micState,
			microphones: microphones && microphones,
			selectedMic:
				cameras &&
				microphones.find((microphone) => microphone.selected)?.device,
			startedAt: new Date(),
		};

		addTestData('mic', report);
		return report;
	};

	return {
		captureCameraReport,
		captureMicReport,
		captureSpeakerReport,
	};
};
