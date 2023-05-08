import {
	DailyCameraError,
	DailyFatalErrorType,
	DailyNonFatalErrorType,
} from '@daily-co/daily-js';
import { ConnectionModes } from './utils/constants.js';
import { StatefulDevice } from '@daily-co/daily-react';

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
	connected?: ConnectionModes[];
	errors?: ErrorEvent[];
	failed?: ConnectionModes[];
	id?: string;
	result?: 'failed' | 'warning' | 'passed' | '';
	startedAt?: Date;
	successRate?: number;
}

export interface WebsocketsTestReport {
	errors?: ErrorEvent[];
	failed?: string[];
	id?: string;
	passed?: string[];
	result?: string | 'passed' | 'failed' | 'warning' | '';
	startedAt?: Date;
}

export interface CameraTestReport {
	camError?: DailyCameraError | null | string;
	camState?: string;
	cameras?: StatefulDevice[] | null;
	hasCamError?: boolean;
	selectedCamera?: MediaDeviceInfo | NonNullable<unknown>;
	id?: string;
	startedAt?: Date;
}

export interface SpeakerTestReport {
	selectedSpeaker?: MediaDeviceInfo | NonNullable<unknown>;
	speakers?: StatefulDevice[] | null;
	id?: string;
	startedAt?: Date;
}

export interface MicTestReport {
	hasMicError?: boolean;
	micError?: DailyCameraError | null | string;
	micState?: string;
	microphones?: StatefulDevice[] | null;
	selectedMic?: MediaDeviceInfo | NonNullable<unknown>;
	id?: string;
	startedAt?: Date;
}

export declare type ErrorEvent = {
	error: DailyNonFatalErrorType | DailyFatalErrorType;
	timestamp: Date;
};
