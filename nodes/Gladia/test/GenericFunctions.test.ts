import type { IExecuteFunctions, INode } from 'n8n-workflow';

import { gladiaApiRequest, gladiaApiUpload } from '../GenericFunctions';

function createMockExecuteFunctions() {
	return {
		getNode: jest.fn().mockReturnValue({ name: 'Gladia' } as INode),
		helpers: {
			httpRequestWithAuthentication: jest.fn().mockResolvedValue({}),
		},
	} as unknown as IExecuteFunctions & {
		helpers: { httpRequestWithAuthentication: jest.Mock };
	};
}

describe('GenericFunctions', () => {
	it('gladiaApiRequest should target the Gladia API without following redirects', async () => {
		const executeFunctions = createMockExecuteFunctions();

		await gladiaApiRequest.call(executeFunctions, 'GET', '/v2/transcription/txn-123');

		const [credentialType, options] =
			executeFunctions.helpers.httpRequestWithAuthentication.mock.calls[0];
		expect(credentialType).toBe('gladiaApi');
		expect(options.url).toBe('https://api.gladia.io/v2/transcription/txn-123');
		expect(options.disableFollowRedirect).toBe(true);
	});

	it('gladiaApiUpload should target the Gladia API without following redirects', async () => {
		const executeFunctions = createMockExecuteFunctions();

		await gladiaApiUpload.call(executeFunctions, Buffer.from('audio'), 'test.wav', 'audio/wav');

		const [, options] = executeFunctions.helpers.httpRequestWithAuthentication.mock.calls[0];
		expect(options.url).toBe('https://api.gladia.io/v2/upload');
		expect(options.disableFollowRedirect).toBe(true);
	});
});
