import React, { useEffect, useMemo, useState } from 'react';
import {
	useDevices,
	useLocalSessionId,
	useAudioTrack,
} from '@daily-co/daily-react';
import { Link } from 'react-router-dom';

import { AudioAnalyser } from '../shared/AudioVisualiser/AudioAnalyser.ts';
import { AudioVisualiser } from '../shared/AudioVisualiser/AudioVisualiser.tsx';

import { Card } from '../shared/Card/Card';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting';

export const MicCheck: React.FC = () => {
	const localSessionId = useLocalSessionId();
	const audioTrack = useAudioTrack(localSessionId ? localSessionId : '');
	const { microphones, micState, hasMicError, setMicrophone } = useDevices();
	const [micAnalyser, setMicAnalyser] = useState<AudioAnalyser | null>(null);
	const [soundWorks, setSoundWorks] = useState(false);

	const [showTroubleshooting, setShowTroubleshooting] = useState(false);
	const toggleTroubleShooting = () => {
		if (showTroubleshooting) {
			setShowTroubleshooting(false);
		} else {
			setShowTroubleshooting(true);
		}
	};

	const updateMicrophone = (ev: React.ChangeEvent<HTMLSelectElement>) => {
		setMicrophone(ev.target.value).catch((err) => console.log(err));
	};

	useEffect(() => {
		if (audioTrack.persistentTrack) {
			const newAnalyser = new AudioAnalyser();
			newAnalyser.analyseStream(audioTrack.persistentTrack);
			newAnalyser.startSamplingSound();
			setMicAnalyser(newAnalyser);
		}
	}, [audioTrack.persistentTrack]);

	useEffect(() => {
		// set a delay to give the analyser time to check if sound is being made
		const intervalId = setInterval(() => {
			const makingSound = micAnalyser?.isMakingSound() ?? true;
			if (makingSound) {
				// we can stop checking
				clearInterval(intervalId);
			}
			setSoundWorks(makingSound);
		}, 1000);
		return () => clearInterval(intervalId);
	}, [micAnalyser]);

	return (
		<Card title="Microphone">
			{/* An error is detected by Daily.
      The "Blocked", "in-use", and "not-found" errors are the most common user-related errors.
      How to handle them differs per browser: the recovery path for a blocked camera is slightly different
      on Firefox than it is in Chrome. Distinguishing between mobile and desktop devices is also key.*/}
			{hasMicError && (
				<TroubleShooting show skipStep={'/network-check'}>
					<h3>We have detected a microphone error.</h3>
					{micState === 'blocked' && (
						<>
							<p>Your browser needs microphone access.</p>
							<ol>
								<li>
									Click the camera icon in your browser&apos;s address bar
								</li>
								<li>Select “Always allow”, then click “Done”</li>
								<li>Refresh the page to try again</li>
							</ol>
						</>
					)}
					{micState === 'in-use' && (
						<>
							<p>Another app is using your microphone.</p>
							<p>
								We cannot access your microphone. Close any apps (like Zoom or
								Teams) that might be using your camera, then refresh the page.
							</p>
						</>
					)}
					{micState === 'not-found' && (
						<>
							<p>No microphone detected.</p>
							<p>
								Unable to detect a microphone. No one can hear you. Please try
								connecting a microphone, then reload this page.
							</p>
						</>
					)}

					{micState === 'constraints-none-specified' ||
						(micState === 'constraints-invalid' && (
							// `getUserMedia()` was provided with either invalid constraints
							// or empty constraints.
							<p>Try reloading the page.</p>
						))}

					{micState === 'undefined-mediadevices' && (
						// This indicates that `window.navigator.mediaDevices`
						// is undefined and a `getUserMedia()` call is not possible. This most commonly
						// is a result of accessing the call via a non-secure `http` url.
						<p>Are you sure you are on a secure website?</p>
					)}

					{micState === 'unknown' && (
						// While we have done our best to handle and normalize all possible
						// errors across browsers and common device issues, we were unable to categorize
						// this error. All unknown errors will be reported as this type. The original
						// error thrown by `getUserMedia()` will be included in the `msg` string.
						<p>Unknown error. Try reloading the page.</p>
					)}
				</TroubleShooting>
			)}

			{/* There is no mic error that Daily can detect, but it's still possible the user's mic is not functioning correctly.
      For example, they're using their MacBook in clam-shell mode. This will not throw an error, but sound will not get
      picked up either.*/}
			{!hasMicError && !soundWorks && (
				<>
					<h2>Try making some noise!</h2>
					<div className="options">
						<Link className="link primary" to={`/network-check`}>
							Skip this step
						</Link>

						<button onClick={toggleTroubleShooting} className="button ghost">
							I need help
						</button>
					</div>

					<TroubleShooting show={showTroubleshooting}>
						<ul>
							<li>
								Are you sure you have selected the correct microphone in the
								dropdown below?
							</li>
							<li>
								If you are using your laptop's microphone, make sure your laptop
								is open
							</li>
							<li>Is something covering your microphone?</li>
							<li>
								Close other programs that might be using the camera, e.g. Skype.
							</li>
							<li>
								Restart your browser (e.g. Chrome, Firefox, Microsoft Edge,
								Safari).
							</li>
							<li>Restart your computer</li>
						</ul>
					</TroubleShooting>
				</>
			)}

			{/*Everything works!*/}
			{!hasMicError && soundWorks && (
				<>
					<h2>Your microphone works!</h2>
					<div>
						<Link to={`/network-check`} className="link primary">
							Next
						</Link>
					</div>
				</>
			)}

			{micAnalyser && <AudioVisualiser analyser={micAnalyser} />}

			{microphones.length > 0 && (
				<form>
					<label htmlFor="micOptions">Select your microphone:</label>
					<select name="micOptions" id="micSelect" onChange={updateMicrophone}>
						{microphones.map((mic) => (
							<option
								key={`mic-${mic.device.deviceId}`}
								selected={mic.selected}
								value={mic.device.deviceId}>
								{mic.device.label}
							</option>
						))}
					</select>
				</form>
			)}

			<details>
				<summary>Raw microphone data</summary>
				<pre>{JSON.stringify(microphones, null, 2)}</pre>
			</details>
		</Card>
	);
};
