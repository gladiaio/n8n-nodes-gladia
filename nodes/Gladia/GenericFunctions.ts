import type {
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { version as packageVersion } from '../../package.json';

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

	if (method !== 'GET') {
		const requestBody = { ...(body as Record<string, unknown>) };
		const shouldAddVersionMetadata =
			method === 'POST' && ['/v2/pre-recorded', '/v2/transcription'].includes(endpoint);

		if (shouldAddVersionMetadata) {
			const existingMetadata =
				typeof requestBody.custom_metadata === 'object' &&
				requestBody.custom_metadata !== null &&
				!Array.isArray(requestBody.custom_metadata)
					? (requestBody.custom_metadata as Record<string, unknown>)
					: {};

			requestBody.custom_metadata = {
				...existingMetadata,
				n8n: packageVersion,
			};
		}

		if (Object.keys(requestBody).length > 0) {
			options.body = requestBody as JsonObject;
		}
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
	const form = new FormData();
	form.append('audio', new Blob([buffer], { type: mimeType }), fileName);

	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}/v2/upload`,
		body: form,
	};

	const response = await this.helpers.httpRequestWithAuthentication.call(
		this,
		'gladiaApi',
		options,
	);

	if (typeof response === 'string') {
		try {
			return JSON.parse(response) as JsonObject;
		} catch {
			throw new NodeApiError(this.getNode(), { message: `Upload failed: ${response}` });
		}
	}

	return response as JsonObject;
}
