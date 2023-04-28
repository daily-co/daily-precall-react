import React from 'react';
import './Loader.css';

type LoaderProps = {
	color?: string;
	loadingText?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function Loader({
	color = 'rgba(102, 204, 204)',
	loadingText,
}: LoaderProps): React.ReactElement {
	const duration = 4;
	return (
		<div className="loader-container">
			<svg
				width="88"
				height="88"
				viewBox="0 0 88 88"
				xmlns="http://www.w3.org/2000/svg">
				<g fill="none" fillRule="evenodd" strokeWidth="2" stroke={color}>
					<circle cx="44" cy="44" r="44">
						<animate
							attributeName="r"
							begin="0s"
							dur={`${duration}s`}
							values="1; 40"
							calcMode="spline"
							keyTimes="0; 1"
							keySplines="0.165, 0.84, 0.44, 1"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-opacity"
							begin="0s"
							dur={`${duration}s`}
							values="1; 0"
							calcMode="spline"
							keyTimes="0; 1"
							keySplines="0.3, 0.61, 0.355, 1"
							repeatCount="indefinite"
						/>
					</circle>
					<circle cx="44" cy="44" r="44">
						<animate
							attributeName="r"
							begin={`-${duration / 2}s`}
							dur={`${duration}s`}
							values="1; 40"
							calcMode="spline"
							keyTimes="0; 1"
							keySplines="0.165, 0.84, 0.44, 1"
							repeatCount="indefinite"
						/>
						<animate
							attributeName="stroke-opacity"
							begin={`-${duration / 2}s`}
							dur={`${duration}s`}
							values="1; 0"
							calcMode="spline"
							keyTimes="0; 1"
							keySplines="0.3, 0.61, 0.355, 1"
							repeatCount="indefinite"
						/>
					</circle>
				</g>
			</svg>
			{loadingText && loadingText}
		</div>
	);
}
