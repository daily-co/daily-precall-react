import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { RecoilRoot } from 'recoil';

declare global {
	interface Window {
		debug: any;
	}
}

function setDebug(isDebug: boolean) {
	if (isDebug) {
		window.debug = {
			log: window.console.log.bind(window.console, 'log: %s'),
			error: window.console.error.bind(window.console, 'error: %s'),
			info: window.console.info.bind(window.console, 'info: %s'),
			warn: window.console.warn.bind(window.console, 'warn: %s'),
		};
	} else {
		const noOp = () => {
			// do nothing
		};

		window.debug = {
			log: noOp,
			error: noOp,
			warn: noOp,
			info: noOp,
		};
	}
}

setDebug(true);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RecoilRoot>
			<App />
		</RecoilRoot>
	</React.StrictMode>,
);
