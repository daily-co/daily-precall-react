/// <reference types="vite/client" />

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDevices } from '@daily-co/daily-react';
import { AudioAnalyser } from '../shared/AudioVisualiser/AudioAnalyser.ts';
import { AudioVisualiser } from '../shared/AudioVisualiser/AudioVisualiser.tsx';
import { useTabs } from '../../hooks/useUiState';
import { Card } from '../shared/Card/Card';
import { Button } from '../shared/Button/Button';
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

	const { switchTabs } = useTabs();

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
				<Button onClick={() => switchTabs('mic-check')}>Yes</Button>
				<Button onClick={toggleTroubleShooting}>No</Button>
			</div>

			<Button variant="ghost" onClick={() => switchTabs('mic-check')}>
				I can’t hear the sound due to a hearing impairment
			</Button>

			<TroubleShooting
				show={showTroubleshooting}
				skipStep={() => switchTabs('mic-check')}>
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

			<Button onClick={toggleSound} variant="ghost">
				Toggle playing test sound
			</Button>

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
		</Card>
	);
};
