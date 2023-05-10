import { useEffect, useRef } from 'react';

// Adapted from https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/
export const useTimeout = (callback: () => void, delay?: number | null) => {
	const savedCallback = useRef(callback);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | number>();

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		const tick = () => savedCallback.current();
		if (typeof delay === 'number') {
			timeoutRef.current = window.setTimeout(tick, delay);
			return () => window.clearTimeout(timeoutRef.current);
		}
	}, [delay]);

	return timeoutRef;
};
