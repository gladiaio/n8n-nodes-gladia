import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class GladiaApi implements ICredentialType {
	name = 'gladiaApi';

	displayName = 'Gladia API';

	icon = { light: 'file:../nodes/Gladia/gladia.svg', dark: 'file:../nodes/Gladia/gladia.dark.svg' } as const;

	documentationUrl = 'https://docs.gladia.io/reference/getting-your-api-key';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-gladia-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.gladia.io',
			url: '/v2/health',
		},
	};
}
