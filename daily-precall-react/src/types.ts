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

type ThroughputTest = 'maxRTT' | 'packetLoss';

export interface ConnectionTestReport {
	errors?: ErrorEvent[];
	id?: string;
	result?: ResultTypes;
	startedAt?: Date;
	throughput?: Record<ThroughputTest, number>;
}

export interface NetworkTestReport {
	errors?: ErrorEvent[];
	connected?: ConnectionModes[];
	failed?: ConnectionModes[];
	successRate?: number;
	result?: 'failed' | 'warning' | 'passed' | '';
	id?: string;
	startedAt?: Date;
}

export declare type ErrorEvent = {
	timestamp: Date;
	error: DailyNonFatalErrorType | DailyFatalErrorType;
};
