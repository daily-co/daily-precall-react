export const CONNECTION_MODES = {
	ALL: 'all',
	STUN: 'stun',
	TURN_UDP: 'turn-udp',
	TURN_TCP: 'turn-tcp',
	TURN_TLS: 'turn-tls',
	RELAY_ONLY: 'relay',
};

const ConnectionModes = Object.values(CONNECTION_MODES);
export type ConnectionModes = (typeof ConnectionModes)[number];

export const NAT_SERVICES = {
	TWILIO: 'twilio',
};

export const NAT_SERVICES_LINKS = {
	TWILIO: 'https://prod-ks.pluot.blue/tt-150331.json', // TODO: is this ok to expose?
};

export const CONNECTION_STATUS = {
	CONNECTED: 'connected',
	FAILED: 'failed',
	STOPPED: 'stopped',
};
