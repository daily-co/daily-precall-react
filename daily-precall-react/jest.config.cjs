module.exports = {
	preset: 'ts-jest/presets/js-with-babel',
	moduleNameMapper: {
		"^@daily-co/daily-js": '<rootDir>/../node_modules/@daily-co/daily-js'
	},
	setupFilesAfterEnv: [
		"<rootDir>/jest.setup.ts"
	],
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['/node_modules/'],
	collectCoverage: false,
	collectCoverageFrom: [
		'src/**/*{ts,tsx}'
	],
	fakeTimers: {'enableGlobally': true}
};
