/// <reference types="vite/client" />
// needed to load the .wav file

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDevices } from '@daily-co/daily-react';
import { Link } from 'react-router-dom';

import { AudioAnalyser } from '../shared/AudioVisualiser/AudioAnalyser.ts';
import { AudioVisualiser } from '../shared/AudioVisualiser/AudioVisualiser.tsx';
import { Card } from '../shared/Card/Card';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting';

import sound from '../shared/AudioVisualiser/sound.wav';

export const SpeakerCheck: React.FC = () => {
	const { speakers, setSpeaker } = useDevices();

	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [speakerAnalyser, setSpeakerAnalyser] = useState<AudioAnalyser | null>(
		null,
	);

	const selectedSpeaker = useMemo(() => {
		return speakers.find((s) => s.selected);
	}, [speakers]);

	const [showTroubleshooting, setShowTroubleshooting] = useState(false);
	const toggleTroubleShooting = () => {
		if (showTroubleshooting) {
			setShowTroubleshooting(false);
		} else {
			setShowTroubleshooting(true);
		}
	};

	useEffect(() => {
		const audio = audioRef.current;
		const handlePlaying = () => {
			setIsPlaying(true);
		};
		const handleEnded = () => {
			setIsPlaying(false);
		};
		if (audio) {
			audio.addEventListener('playing', handlePlaying);
			audio.addEventListener('ended', handleEnded);
		}
		return () => {
			audio?.removeEventListener('playing', handlePlaying);
			audio?.removeEventListener('ended', handleEnded);
		};
	}, [audioRef]);

	useEffect(() => {
		const newAnalyser = new AudioAnalyser();

		if (audioRef.current && isPlaying) {
			newAnalyser.analyseAudioElement(audioRef.current);
			newAnalyser.createOutput();
			setSpeakerAnalyser(newAnalyser);
		}

		// Clean-up
		return () => {
			newAnalyser.disconnectAnalyser();
		};
	}, [audioRef, isPlaying, selectedSpeaker]);

	const updateSpeakers = (ev: React.ChangeEvent<HTMLSelectElement>) => {
		const audioEl = audioRef.current;
		const isPaused = audioEl?.paused;

		if (!isPaused) {
			audioEl?.pause();
		}
		setSpeaker(ev.target.value)
			.then(async () => {
				speakerAnalyser?.setSinkId(ev.target.value);
				if (!isPaused) {
					await audioEl?.play();
				}
			})
			.catch((err) => console.log(err));
	};

	useEffect(() => {
		if (!audioRef.current) {
			return;
		}
		audioRef.current.play();
		audioRef.current.loop = true;
	}, []);

	const toggleSound = () => {
		const audioEl = audioRef.current;
		const isPaused = audioEl?.paused;

		if (!isPaused) {
			audioEl?.pause();
		} else {
			audioEl.play();
		}
	};

	return (
		<Card title="Speakers">
			<h2>Can you hear the sound?</h2>
			<div>
				<Link to={`/mic-check`} className="link primary">
					Yes
				</Link>
				<button onClick={toggleTroubleShooting} className="button primary">
					No
				</button>
			</div>

			<Link to={`/mic-check`} className="link ghost">
				I can’t see the screen due to a visual impairment
			</Link>

			<TroubleShooting show={showTroubleshooting} skipStep={'/mic-check'}>
				<p>
					Is the volume turned up? Check to make sure that your volume is turned
					up, and that the sound is not on mute.
				</p>
				<p>
					Are there headphones connected that the sound is coming out of, rather
					than coming out of the speakers?
				</p>
				<p>
					If you’re using a desktop computer, check to make sure you have
					connected speakers or headphones, either with a cable or via
					bluetooth.
				</p>
			</TroubleShooting>

			{speakerAnalyser && <AudioVisualiser analyser={speakerAnalyser} />}

			<audio ref={audioRef} src={sound} />

			<button onClick={toggleSound} className="button secondary">
				Toggle playing test sound
			</button>

			{speakers.length > 0 && (
				<form>
					<label htmlFor="speakerOptions">Select your speakers:</label>
					<select
						name="speakerOptions"
						id="speakerSelect"
						defaultValue={selectedSpeaker?.device.label}
						onChange={updateSpeakers}>
						{speakers.map((speaker) => (
							<option
								key={`speaker-${speaker.device.deviceId}`}
								value={speaker.device.deviceId}>
								{speaker.device.label}
							</option>
						))}
					</select>
				</form>
			)}

			<details>
				<summary>Raw speakers data</summary>
				<pre>{JSON.stringify(speakers, null, 2)}</pre>
			</details>
		</Card>
	);
};
