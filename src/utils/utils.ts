export function getUserAgent() {
  if (
    typeof window !== 'undefined' &&
    window.navigator &&
    window.navigator.userAgent
  ) {
    return window.navigator.userAgent;
  }
  return '';
}
