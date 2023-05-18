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
	result: 'bad' | 'good' | 'warning' | 'failed' | '';
	data: Throughput | null;
}

export interface NetworkTestReport {
	errors?: ErrorEvent[];
	result: 'connected' | 'failed' | '';
}

export interface WebsocketsTestReport {
	errors?: ErrorEvent[];
	failed: string[];
	passed: string[];
	result: string | 'passed' | 'failed' | 'warning' | '';
}

export declare type ErrorEvent = {
	error: DailyNonFatalErrorType | DailyFatalErrorType | string;
	timestamp: Date;
};
