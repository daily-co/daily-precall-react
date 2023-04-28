// declare global {
// 	interface Window {
// 		debug: Record<string, () => void>;
// 	}
// }
//
// declare const debug = window.debug;
// export {};
export {};

declare global {
	var debug: {
		someMethod: () => void;
	};
}
