export const CONNECTION_MODES = {
	ALL: 'all', // used to gather all candidates
	STUN: 'stun',
	TURN_UDP: 'turn-udp',
	TURN_TCP: 'turn-tcp',
	TURN_TLS: 'turn-tls',
	RELAY_ONLY: 'relay',
};

const ConnectionModes = Object.values(CONNECTION_MODES);
export type ConnectionModes = typeof ConnectionModes[number];

export const NAT_SERVICES = {
	TWILIO: 'twilio',
	XIRSYS: 'xirsys',
};

export const NAT_SERVICES_LINKS = {
	TWILIO: 'https://prod-ks.pluot.blue/tt-150331.json',
	XIRSYS: 'xirsys',
};

export const CONNECTION_STATUS = {
	CONNECTED: 'connected',
	FAILED: 'failed',
	STOPPED: 'stopped',
};
