import React, { useEffect, useRef } from 'react';

interface Props {
	analyser: any;
}

export const AudioVisualiser: React.FC<React.PropsWithChildren<Props>> = ({
	analyser,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		const canvasContainerRect = container?.getBoundingClientRect();
		const canvasContext = canvas?.getContext('2d');

		// @ts-ignore
		canvas.width = canvasContainerRect?.width
		// @ts-ignore
		canvas.height = canvasContainerRect?.height

		const primary = '#3DB8B8';
		const primaryWithContrast = '#3DB8B8';

		const clearCanvas = () => {
			// @ts-ignore
			canvasContext.clearRect(0, 0, canvas.width, canvas.height);
		};

		const draw = (fillColor: any, strokeColor: any) => {
			const dataArray = analyser.getByteFrequencyData();
			const interestingFrequenciesBucket = dataArray.slice(
				16,
				dataArray.length / 8,
			);

			if (!canvasContext) {
				return;
			}
			canvasContext.lineWidth = 2;
			canvasContext.strokeStyle = primary;
			canvasContext.fillStyle = primaryWithContrast;

			canvasContext.beginPath();

			let x = 0;

			const bufferLength = interestingFrequenciesBucket.length;
			// @ts-ignore
			const sliceWidth = canvas.width / bufferLength;

			canvasContext.moveTo(0, 0);
			for (let i = 0; i < bufferLength; i++) {
				const v = interestingFrequenciesBucket[i] / 128;
				// @ts-ignore
				const y = (v * canvas.height) / 2;

				canvasContext.lineTo(x, y);

				x += sliceWidth;
			}

			// @ts-ignore
			canvasContext.lineTo(canvas.width, 0);

			canvasContext.fill();
			canvasContext.stroke();

			requestAnimationFrame(() => {
				clearCanvas();
				draw(fillColor, strokeColor);
			});
		};

		draw(primary, primaryWithContrast);
	}, [analyser]);

	return (
		<div ref={containerRef} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
			<canvas
				ref={canvasRef}
				style={{ transform: 'rotateX(180deg) translateZ(-1px)' }}
			/>
		</div>
	);
};
