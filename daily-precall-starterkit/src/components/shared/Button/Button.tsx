import React from 'react';
import './Button.css';

interface BaseProps {
	variant?: 'primary' | 'tab' | 'ghost';
}

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		BaseProps {}

export const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
	children,
	variant,
	...props
}) => {
	return (
		<button
			className={`button button-${variant ? variant : 'primary'}`}
			{...(props as ButtonProps)}>
			{children}
		</button>
	);
};
