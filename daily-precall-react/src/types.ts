import {
	DailyFatalErrorType,
	DailyNonFatalErrorType,
} from '@daily-co/daily-js';

export interface RTCPeerConnectionWithBuffers extends RTCPeerConnection {
	bufferedIceCandidates?: RTCIceCandidate[] | null;
	iceCandidates?: RTCIceCandidate[] | null;
}

export type RTCStatsReportStat =
	| RTCIceCandidatePairStats[]
	| RTCInboundRtpStreamStats;

export interface Throughput {
	maxRTT: number | null;
	packetLoss?: number | null;
}

export interface ConnectionTestReport {
	errors?: ErrorEvent[];
	id: string;
	result: 'bad' | 'good' | 'warning' | 'failed' | '';
	startedAt: Date;
	throughput: Throughput | null;
}

export interface NetworkTestReport {
	errors?: ErrorEvent[];
	id: string;
	result: 'connected' | 'failed' | '';
	startedAt: Date;
}

export interface WebsocketsTestReport {
	errors?: ErrorEvent[];
	failed: string[];
	id: string;
	passed: string[];
	result: string | 'passed' | 'failed' | 'warning' | '';
	startedAt: Date;
}

export declare type ErrorEvent = {
	error: DailyNonFatalErrorType | DailyFatalErrorType | string;
	timestamp: Date;
};
