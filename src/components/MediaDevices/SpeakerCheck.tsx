/// <reference types="vite/client" />
// needed to load the .wav file

import React, { useEffect, useRef, useState } from 'react';
import { useDevices } from '@daily-co/daily-react';
import { Link } from 'react-router-dom';

import { AudioAnalyser } from '../shared/AudioVisualiser/AudioAnalyser.ts';
import { AudioVisualiser } from '../shared/AudioVisualiser/AudioVisualiser.tsx';
import { Card } from '../shared/Card/Card';
import { TroubleShooting } from '../shared/TroubleShooting/TroubleShooting';

import sound from '../shared/AudioVisualiser/sound.wav';
import { logger } from '../../utils/Logger';
import { getUserAgent } from '../../utils/utils';

export const SpeakerCheck: React.FC = () => {
  const { speakers, setSpeaker, currentSpeaker } = useDevices();
  const useragent = getUserAgent();
  const isFirefox = useragent.includes('Firefox');

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speakerAnalyser, setSpeakerAnalyser] = useState<AudioAnalyser | null>(
    null,
  );

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
    if (isFirefox) return; // setSinkId() on an AudioContext does not work in Firefox, so skip the visualization there.
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
  }, [audioRef, isPlaying, currentSpeaker, isFirefox]);

  const updateSpeakers = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const audioEl = audioRef.current;
    const isPaused = audioEl?.paused;

    if (!isPaused) {
      audioEl?.pause();
    }
    setSpeaker(ev.target.value)
      .then(async () => {
        if (!isPaused) {
          await audioEl?.play();
        }

        if (isFirefox) return; // we have no visualization in FF, so skip this

        // What's happening here? This is a Chrome-only issue we are circumventing. Chrome is the only
        // browser to return a "default" deviceId. But setSinkId() does not accept "default" as a device id.
        // So instead of just passing it the ev.target.value ("default") and move along, we need to find the same
        // device in the list of output devices with the actual device id.
        if (ev.target.value === 'default') {
          const defaultDevice = speakers.find(
            (s) => s.device.deviceId === 'default',
          );
          const nonDefaultDevice = speakers.find(
            (s) =>
              s.device.deviceId !== 'default' &&
              s.device.groupId === defaultDevice?.device.groupId &&
              defaultDevice.device.label.includes(s.device.label),
          );

          nonDefaultDevice &&
            speakerAnalyser?.setSinkId(nonDefaultDevice.device.deviceId);
        } else {
          speakerAnalyser?.setSinkId(ev.target.value);
        }
      })
      .catch((err) => logger.error(err));
  };

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
      <div className="options">
        <Link to={`/mic-check`} className="link primary">
          Yes
        </Link>
        <button onClick={toggleTroubleShooting} className="button primary">
          No
        </button>
      </div>

      <TroubleShooting show={showTroubleshooting} skipStep={'/mic-check'}>
        <p>
          Is the volume turned up? Check to make sure that your volume is turned
          up, and that the sound is not on mute.
        </p>
        <p>
          Are there headphones connected that the sound is coming out of, rather
          than coming out of the speakers?
        </p>
        x
        <p>
          If you’re using a desktop computer, check to make sure you have
          connected speakers or headphones, either with a cable or via
          bluetooth.
        </p>
      </TroubleShooting>

      {speakerAnalyser && <AudioVisualiser analyser={speakerAnalyser} />}

      <audio ref={audioRef} src={sound} loop autoPlay />

      <button onClick={toggleSound} className="button secondary">
        Toggle playing test sound
      </button>

      {speakers.length > 0 && (
        <form>
          <label htmlFor="speakerOptions">Select your speakers:</label>
          <select
            name="speakerOptions"
            id="speakerSelect"
            defaultValue={currentSpeaker?.device.deviceId}
            onChange={updateSpeakers}
          >
            {speakers.map((speaker) => (
              <option
                key={`speaker-${speaker.device.deviceId}`}
                value={speaker.device.deviceId}
              >
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
