import { useEffect, useRef } from 'react';

/**
 * Custom hook that runs a callback after a specified delay.
 * Adapted from https://www.joshwcomeau.com/snippets/react-hooks/use-timeout/
 * @param callback - The function to run
 * @param delay - The delay in milliseconds (optional)
 * @returns A ref to the timeout ID
 */
export const useTimeout = (callback: () => void, delay?: number | null) => {
	const callbackRef = useRef(callback);
	const timeoutRef = useRef<number>();

	// update the callback reference when it changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// set the timeout when the delay changes
	useEffect(() => {
		const tick = () => callbackRef.current();
		if (typeof delay === 'number') {
			timeoutRef.current = window.setTimeout(tick, delay);
			return () => window.clearTimeout(timeoutRef?.current);
		}
	}, [delay]);

	return timeoutRef;
};
