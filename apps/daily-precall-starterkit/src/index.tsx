import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { RecoilRoot } from 'recoil';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { VideoCheck } from './components/MediaDevices/VideoCheck';
import { NetworkCheck } from './components/Network/NetworkCheck';
import { SpeakerCheck } from './components/MediaDevices/SpeakerCheck';
import { MicCheck } from './components/MediaDevices/MicCheck';
import { ConnectionCheck } from './components/Network/ConnectionCheck';
import { WebsocketsCheck } from './components/Network/WebsocketsCheck';

const router = createBrowserRouter([
	{
		path: '/',
		element: <App />,
		children: [
			{
				path: 'video-check',
				element: <VideoCheck />,
			},
			{
				path: 'speaker-check',
				element: <SpeakerCheck />,
			},
			{
				path: 'mic-check',
				element: <MicCheck />,
			},
			{
				path: 'network-check',
				element: <NetworkCheck />,
			},
			{
				path: 'connection-check',
				element: <ConnectionCheck />,
			},
			{
				path: 'websockets-check',
				element: <WebsocketsCheck />,
			},
		],
	},
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<RecoilRoot>
			<RouterProvider router={router}></RouterProvider>
		</RecoilRoot>
	</React.StrictMode>,
);
