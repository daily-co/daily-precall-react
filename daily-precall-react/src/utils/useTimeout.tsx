import React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export default function useTimeout(callback, delay) {
	const timeoutRef = React.useRef(null);
	const savedCallback = React.useRef(callback);
	React.useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);
	React.useEffect(() => {
		const tick = () => savedCallback.current();
		if (typeof delay === 'number') {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			timeoutRef.current = window.setTimeout(tick, delay);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return () => window.clearTimeout(timeoutRef.current);
		}
	}, [delay]);
	return timeoutRef;
}
