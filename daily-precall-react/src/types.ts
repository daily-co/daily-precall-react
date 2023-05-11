import {
	DailyFatalErrorType,
	DailyNonFatalErrorType,
} from '@daily-co/daily-js';
import { ConnectionModes } from './utils/constants.js';

export interface RTCPeerConnectionWithBuffers extends RTCPeerConnection {
	bufferedIceCandidates?: RTCIceCandidate[] | null;
	iceCandidates?: RTCIceCandidate[] | null;
}

export interface IceServerInterface {
	urls?: string;
	url?: string;
	[key: number]: {
		url?: string;
		urls?: string;
		credential?: string;
		username?: string;
	};
}
export type RTCStatsReportStat =
	| RTCIceCandidatePairStats[]
	| RTCInboundRtpStreamStats;

export type ResultTypes = 'bad' | 'good' | 'warning' | 'failed' | '';

export interface Throughput {
	maxRTT: number | null;
	packetLoss?: number | null;
}

export interface ConnectionTestReport {
	errors?: ErrorEvent[];
	id?: string;
	result?: ResultTypes;
	startedAt?: Date;
	throughput?: Throughput | null;
}

export interface NetworkTestReport {
	connected?: ConnectionModes[];
	errors?: ErrorEvent[];
	failed?: ConnectionModes[];
	id?: string;
	result?: 'failed' | 'warning' | 'passed' | '';
	startedAt?: Date;
}

export interface WebsocketsTestReport {
	errors?: ErrorEvent[];
	failed?: string[];
	id?: string;
	passed?: string[];
	result?: string | 'passed' | 'failed' | 'warning' | '';
	startedAt?: Date;
}

export declare type ErrorEvent = {
	error: DailyNonFatalErrorType | DailyFatalErrorType | string;
	timestamp: Date;
};
