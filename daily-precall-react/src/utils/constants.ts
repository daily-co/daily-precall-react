export const CONNECTION_MODES = {
	RELAY_ONLY: 'relay',
};

const ConnectionModes = Object.values(CONNECTION_MODES);
export type ConnectionModes = (typeof ConnectionModes)[number];

export const NAT_SERVICES_LINKS = {
	TWILIO: 'https://prod-ks.pluot.blue/tt-150331.json',
};

export const CONNECTION_STATUS = {
	CONNECTED: 'connected',
	FAILED: 'failed',
	STOPPED: 'stopped',
};
