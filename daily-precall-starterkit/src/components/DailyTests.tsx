import { useCallback } from 'react';
import { DailyTestProvider } from '@daily-co/daily-precall-react';
import { useDaily, useDailyEvent } from '@daily-co/daily-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { logger } from '../utils/Logger';

export const DailyTests = () => {
	const callObject = useDaily();
	const location = useLocation();

	useDailyEvent(
		'started-camera',
		useCallback(async () => {
			logger.info('Camera started. Ready to start testing!');
		}, []),
	);

	return (
		/* DailyTestProvider calls startCamera() on the call object as soon as it's instantiated. This gives
		 * us access to the user's video and audio tracks (provided they give permissions). We'll use these streams
		 * in our devices and connection checks. */
		<DailyTestProvider callObject={callObject}>
			{location.pathname === '/' ? (
				<Link className="link primary" to={`video-check`}>
					Get started 👉
				</Link>
			) : null}
			{/*Where the individual components will be rendered*/}
			<Outlet />
		</DailyTestProvider>
	);
};
