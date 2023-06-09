import { useCallback, useEffect, useState } from 'react';
import { ErrorEvent } from '../types.ts';
import { useDailyTest } from '../useDailyTest.ts';
import { DailyEventObject } from '@daily-co/daily-js';

export const useCatchErrors = () => {
	const { callObject } = useDailyTest();
	const [errors, setErrors] = useState<ErrorEvent[]>([]);

	const addError = useCallback((error: DailyEventObject | string) => {
		const newError: ErrorEvent = {
			timestamp: new Date(),
			error,
		};
		setErrors((prevState) => [...prevState, newError]);
	}, []);

	useEffect(() => {
		if (!callObject) return;
		callObject.on('error', addError);
		callObject.on('nonfatal-error', addError);

		return function cleanup() {
			callObject.off('error', addError);
			callObject.off('nonfatal-error', addError);
		};
	}, [addError, callObject]);

	return {
		addError,
		errors,
	};
};
