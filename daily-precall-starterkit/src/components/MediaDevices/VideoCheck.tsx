import React, { useEffect, useRef, useState } from 'react';
import {
	useVideoTrack,
	useDevices,
	useLocalParticipant,
} from '@daily-co/daily-react';
import { Link } from 'react-router-dom';

import { Card } from '../shared/Card/Card.tsx';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting.tsx';
import { Loader } from '../shared/Loader/Loader.tsx';

export const VideoCheck: React.FC = () => {
	const localParticipantId = useLocalParticipant();

	const videoTrack = useVideoTrack(
		localParticipantId ? localParticipantId.session_id : '',
	);
	const videoElement = useRef<HTMLVideoElement>(null);
	const [showTroubleshooting, setShowTroubleshooting] = useState(false);

	const { cameras, setCamera, hasCamError, camState } = useDevices();

	useEffect(() => {
		if (!videoTrack.persistentTrack) return;
		if (videoElement.current) {
			videoElement.current.srcObject =
				videoTrack.persistentTrack &&
				new MediaStream([videoTrack?.persistentTrack]);
		}
	}, [videoTrack.persistentTrack]);

	const updateCamera = (ev: React.ChangeEvent<HTMLSelectElement>) => {
		setCamera(ev.target.value);
	};

	const showTroubleShootingToggle = () => {
		if (showTroubleshooting) {
			setShowTroubleshooting(false);
		} else {
			setShowTroubleshooting(true);
		}
	};

	return (
		<Card title="Camera">
			<h2>Can you see yourself?</h2>
			{!hasCamError && (
				<div>
					<Link to={`/speaker-check`} className="link primary">
						Yes
					</Link>
					<button
						onClick={showTroubleShootingToggle}
						className="button primary">
						No
					</button>
				</div>
			)}
			<Link to={`/speaker-check`} className="link ghost">
				I can’t see the screen due to a visual impairment
			</Link>

			{/*The "Blocked", "in-use", and "not-found" errors are the most common user-related errors.
			How to handle them differs per browser: the recovery path for a blocked camera is slightly
			different on Firefox than it is in Chrome, for example.
			Distinguishing between mobile and desktop devices is also key.*/}
			{hasCamError && (
				<TroubleShooting show={true} skipStep={'/speaker-check'}>
					<h3>We have detected a camera error.</h3>
					{camState === 'blocked' && (
						<>
							<p>Your browser needs camera access.</p>
							<ol>
								<li>Click the camera icon in your browser's address bar</li>
								<li>Select “Always allow”, then click “Done”</li>
								<li>Refresh the page to try again</li>
							</ol>
						</>
					)}
					{camState === 'in-use' && (
						<>
							<p>Another app is using your camera.</p>
							<p>
								We cannot access your camera. Close any apps (like Zoom or
								Teams) that might be using your camera, then refresh the page.
							</p>
						</>
					)}
					{camState === 'not-found' && (
						<>
							<p>No camera detected.</p>
							<p>
								Unable to detect a camera. No one can see you. Please try
								connecting a camera, then reload this page.
							</p>
						</>
					)}
					{camState === 'constraints-none-specified' ||
						(camState === 'constraints-invalid' && (
							// `getUserMedia()` was provided with either invalid constraints
							// or empty constraints.
							<p>Try reloading the page.</p>
						))}
					{camState === 'undefined-mediadevices' && (
						// This indicates that `window.navigator.mediaDevices`
						// is undefined and a `getUserMedia()` call is not possible. This most commonly
						// is a result of accessing the call via a non-secure `http` url.
						<p>Are you sure you are on a secure website?</p>
					)}
					{camState === 'unknown' && (
						// While we have done our best to handle and normalize all possible
						// errors across browsers and common device issues, we were unable to categorize
						// this error. All unknown errors will be reported as this type. The original
						// error thrown by `getUserMedia()` will be included in the `msg` string.
						<p>Unknown error. Try reloading the page.</p>
					)}
				</TroubleShooting>
			)}

			<TroubleShooting
				show={showTroubleshooting && !hasCamError}
				skipStep={'/speaker-check'}>
				{!hasCamError && (
					<h3>We have not detected any errors with your camera.</h3>
				)}
				<p>
					Have you connected a web camera to a laptop? Try picking a different
					camera in the drop down list below.
				</p>
				<p>If this did not solve the problem, try the following:</p>
				<ul>
					<li>
						Close other programs that might be using the camera, e.g. Skype.
					</li>
					<li>
						Restart your browser (e.g. Chrome, Firefox, Microsoft Edge, Safari).
					</li>
					<li>Restart your computer</li>
				</ul>
			</TroubleShooting>

			<div className="videoElement">
				{/*This means the camera is still loading: it can sometimes take a moment to fetch a user's device.*/}
				{camState !== 'granted' && !hasCamError ? (
					<Loader />
				) : (
					videoTrack.persistentTrack && (
						<video autoPlay muted playsInline ref={videoElement} />
					)
				)}
			</div>

			{cameras.length > 0 && (
				<form>
					<label htmlFor="cameraOptions">Camera:</label>
					<select
						name="cameraOptions"
						id="cameraSelect"
						onChange={updateCamera}>
						{cameras?.map((camera) => (
							<option
								key={`cam-${camera.device.deviceId}`}
								value={camera.device.deviceId}>
								{camera.device.label}
							</option>
						))}
					</select>
				</form>
			)}

			<details>
				<summary>Raw camera data</summary>
				<pre>{JSON.stringify(cameras, null, 2)}</pre>
			</details>
		</Card>
	);
};
