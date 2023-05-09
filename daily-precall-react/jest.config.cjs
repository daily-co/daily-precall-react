module.exports = {
	preset: 'ts-jest/presets/js-with-babel',
	moduleNameMapper: {
		'^react$': '<rootDir>/../../node_modules/react',
	},
	testEnvironment: 'jsdom',
	testPathIgnorePatterns: ['/node_modules/'],
	collectCoverage: false,
	collectCoverageFrom: ['src/**/*{ts,tsx}'],
};
