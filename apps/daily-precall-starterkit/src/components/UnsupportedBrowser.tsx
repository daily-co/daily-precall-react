import { Card } from './shared/Card/Card';

export const UnsupportedBrowser = () => {
	return (
		<Card title="Your browser does not support video calls.">
			<p>
				Open this page in a different browser to make a video call. Examples of
				browsers that are supported are the latest versions of{' '}
				<a href="https://www.google.com/chrome" rel="noopener noreferrer">
					Chrome
				</a>
				,{' '}
				<a href="https://www.apple.com/safari" rel="noopener noreferrer">
					Safari
				</a>
				,{' '}
				<a href="https://www.mozilla.org/firefox" rel="noopener noreferrer">
					Firefox
				</a>
				, and{' '}
				<a href="https://www.microsoft.com/edge" rel="noopener noreferrer">
					Microsoft Edge
				</a>
				.
			</p>
		</Card>
	);
};
