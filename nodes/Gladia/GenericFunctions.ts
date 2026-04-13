import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://api.gladia.io';

export async function gladiaApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: object = {},
	headers: Record<string, string> = {},
): Promise<JsonObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${endpoint}`,
		json: true,
		headers,
	};

	if (method !== 'GET' && Object.keys(body).length > 0) {
		options.body = body as JsonObject;
	}

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'gladiaApi',
		options,
	);

	if (typeof response === 'string') {
		try {
			return JSON.parse(response) as JsonObject;
		} catch {
			throw new NodeApiError(this.getNode(), { message: `Unexpected response: ${response}` });
		}
	}

	return response as JsonObject;
}

export async function gladiaApiUpload(
	this: IExecuteFunctions,
	buffer: Buffer,
	fileName: string,
	mimeType: string,
): Promise<JsonObject> {
	const credentials = await this.getCredentials('gladiaApi');

	const form = new FormData();
	form.append('audio', new Blob([buffer], { type: mimeType }), fileName);

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}/v2/upload`,
		body: form,
		headers: {
			'x-gladia-key': credentials.apiKey as string,
		},
	};

	const response = await this.helpers.httpRequest(options);

	if (typeof response === 'string') {
		try {
			return JSON.parse(response) as JsonObject;
		} catch {
			throw new NodeApiError(this.getNode(), { message: `Upload failed: ${response}` });
		}
	}

	return response as JsonObject;
}
