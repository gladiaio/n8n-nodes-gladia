/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	testMatch: ['**/test/**/*.test.ts'],
	transformIgnorePatterns: ['node_modules/(?!uuid)'],
	transform: {
		'node_modules/uuid/.+\\.js$': 'ts-jest',
	},
};
