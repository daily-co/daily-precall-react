import React, { useEffect, useRef } from 'react';
import { AudioAnalyser } from './AudioAnalyser';

interface Props {
	analyser: AudioAnalyser;
}

export const AudioVisualiser: React.FC<React.PropsWithChildren<Props>> = ({
	analyser,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!canvasRef.current) return;
		if (!containerRef.current) return;

		const canvas = canvasRef.current;
		const container = containerRef.current;
		const canvasContainerRect = container.getBoundingClientRect();
		const canvasContext = canvas.getContext('2d');

		canvas.width = canvasContainerRect.width;
		canvas.height = canvasContainerRect.height;

		const clearCanvas = () => {
			canvasContext?.clearRect(0, 0, canvas.width, canvas.height);
		};

		const draw = (fillColor: string) => {
			const dataArray = analyser.getByteFrequencyData();
			const interestingFrequenciesBucket = dataArray.slice(
				16,
				dataArray.length / 8,
			);

			if (!canvasContext) {
				return;
			}

			canvasContext.fillStyle = fillColor;

			canvasContext.beginPath();

			const bufferLength = interestingFrequenciesBucket.length;
			const sliceWidth = canvas.width / bufferLength;

			canvasContext.moveTo(0, 0);

			let x = 0;
			for (let i = 0; i < bufferLength; i++) {
				const v = interestingFrequenciesBucket[i] / 128;
				const y = (v * canvas.height) / 2;

				canvasContext.lineTo(x, y);

				x += sliceWidth;
			}

			canvasContext.lineTo(canvas.width, 0);
			canvasContext.fill();

			requestAnimationFrame(() => {
				clearCanvas();
				draw(fillColor);
			});
		};

		draw('rgba(27, 235, 185, 0.5)');
	}, [analyser]);

	return (
		<div
			ref={containerRef}
			style={{
				width: '300px',
				height: '200px',
				marginBottom: '1rem',
			}}>
			<canvas
				ref={canvasRef}
				style={{
					transform: 'rotateX(180deg)',
					borderTop: '2px solid rgba(27, 235, 185)',
				}}
			/>
		</div>
	);
};
