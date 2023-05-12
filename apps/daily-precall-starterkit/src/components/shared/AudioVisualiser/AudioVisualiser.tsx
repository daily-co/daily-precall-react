import React, { useEffect, useRef } from 'react';
import { AudioAnalyser } from './AudioAnalyser';

interface Props {
	analyser: AudioAnalyser;
}

const CANVAS_WIDTH = 300;
const CANVAS_HEIGHT = 200;
const CANVAS_COLOR = 'rgba(27, 235, 185, 0.5)';

export const AudioVisualiser: React.FC<Props> = ({ analyser }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const canvasContext = canvas?.getContext('2d');
		if (!canvas || !canvasContext) return;

		const clearCanvas = () => {
			canvasContext.clearRect(0, 0, canvas.width, canvas.height);
		};

		const draw = () => {
			const dataArray = analyser.getByteFrequencyData();
			const interestingFrequenciesBucket = dataArray.slice(
				16,
				dataArray.length / 8,
			);

			canvasContext.fillStyle = CANVAS_COLOR;
			canvasContext.beginPath();

			const bufferLength = interestingFrequenciesBucket.length;
			const sliceWidth = canvas.width / bufferLength;

			canvasContext.moveTo(0, 0);

			let horizontalPosition = 0;
			for (let i = 0; i < bufferLength; i++) {
				const normalizedValue = interestingFrequenciesBucket[i] / 128;
				const verticalPosition = (normalizedValue * canvas.height) / 2;

				canvasContext.lineTo(horizontalPosition, verticalPosition);

				horizontalPosition += sliceWidth;
			}

			canvasContext.lineTo(canvas.width, 0);
			canvasContext.fill();

			requestAnimationFrame(() => {
				clearCanvas();
				draw();
			});
		};

		canvas.width = CANVAS_WIDTH;
		canvas.height = CANVAS_HEIGHT;

		draw();
	}, [analyser]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				width: CANVAS_WIDTH,
				height: CANVAS_HEIGHT,
				transform: 'rotateX(180deg)',
				borderTop: `2px solid ${CANVAS_COLOR}`,
				marginBottom: '1rem',
			}}
		/>
	);
};
