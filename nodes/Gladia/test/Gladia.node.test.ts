import type { IExecuteFunctions, INode, NodeParameterValueType } from 'n8n-workflow';

import * as GenericFunctions from '../GenericFunctions';
import { Gladia } from '../Gladia.node';

jest.mock('n8n-workflow', () => {
	const original = jest.requireActual('n8n-workflow');
	return {
		...original,
		sleep: jest.fn(),
	};
});

interface MockExecuteFunctions extends IExecuteFunctions {
	getInputData: jest.Mock;
	getNode: jest.Mock;
	continueOnFail: jest.Mock;
	getNodeParameter: jest.Mock;
	helpers: IExecuteFunctions['helpers'] & {
		httpRequestWithAuthentication: jest.Mock;
		assertBinaryData: jest.Mock;
		getBinaryDataBuffer: jest.Mock;
	};
}

function createMockExecuteFunctions(): MockExecuteFunctions {
	return {
		getInputData: jest.fn(),
		getNode: jest.fn(),
		continueOnFail: jest.fn(),
		getNodeParameter: jest.fn(),
		helpers: {
			httpRequestWithAuthentication: jest.fn(),
			assertBinaryData: jest.fn(),
			getBinaryDataBuffer: jest.fn(),
		},
	} as unknown as MockExecuteFunctions;
}

describe('Gladia Node', () => {
	let executeFunctions: MockExecuteFunctions;
	const gladiaApiRequestSpy = jest.spyOn(GenericFunctions, 'gladiaApiRequest');
	const gladiaApiUploadSpy = jest.spyOn(GenericFunctions, 'gladiaApiUpload');
	const node = new Gladia();

	beforeEach(() => {
		jest.clearAllMocks();
		executeFunctions = createMockExecuteFunctions();
		executeFunctions.getInputData.mockReturnValue([{ json: {} }]);
		executeFunctions.getNode.mockReturnValue({ name: 'Gladia' } as INode);
		executeFunctions.continueOnFail.mockReturnValue(false);
	});

	describe('transcription:transcribe with URL, no wait', () => {
		it('should initiate transcription and return immediately', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: false,
					options: {},
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockResolvedValueOnce({
				id: 'txn-123',
				result_url: 'https://api.gladia.io/v2/transcription/txn-123',
			});

			const result = await node.execute.call(executeFunctions);

			expect(gladiaApiRequestSpy).toHaveBeenCalledWith('POST', '/v2/transcription', {
				audio_url: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
			});
			expect(result).toEqual([
				[
					{
						json: {
							id: 'txn-123',
							result_url: 'https://api.gladia.io/v2/transcription/txn-123',
						},
						pairedItem: { item: 0 },
					},
				],
			]);
		});
	});

	describe('transcription:transcribe with URL, wait for completion', () => {
		it('should poll until status is done', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: true,
					options: { pollingInterval: 1, pollingTimeout: 30 },
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockResolvedValueOnce({
				id: 'txn-123',
				result_url: 'https://api.gladia.io/v2/transcription/txn-123',
			});

			executeFunctions.helpers.httpRequestWithAuthentication
				.mockResolvedValueOnce({ status: 'processing' })
				.mockResolvedValueOnce({
					status: 'done',
					result: { transcription: { full_transcript: 'Hello world' } },
				});

			const result = await node.execute.call(executeFunctions);

			expect(gladiaApiRequestSpy).toHaveBeenCalledTimes(1);
			expect(executeFunctions.helpers.httpRequestWithAuthentication).toHaveBeenCalledTimes(2);
			expect(result[0][0].json).toEqual({
				status: 'done',
				result: { transcription: { full_transcript: 'Hello world' } },
			});
		});

		it('should throw on error status', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: true,
					options: { pollingInterval: 1, pollingTimeout: 30 },
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockResolvedValueOnce({
				id: 'txn-err',
				result_url: 'https://api.gladia.io/v2/transcription/txn-err',
			});

			executeFunctions.helpers.httpRequestWithAuthentication.mockResolvedValueOnce({
				status: 'error',
				error_message: 'Invalid audio format',
			});

			await expect(node.execute.call(executeFunctions)).rejects.toThrow('Transcription failed');
		});
	});

	describe('transcription:transcribe with binary data', () => {
		it('should upload binary then transcribe', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'binaryData',
					binaryPropertyName: 'data',
					waitForCompletion: false,
					options: {},
				};
				return params[param];
			}) as () => NodeParameterValueType);

			executeFunctions.helpers.assertBinaryData.mockReturnValue({
				data: '',
				mimeType: 'audio/wav',
				fileName: 'test.wav',
			});
			executeFunctions.helpers.getBinaryDataBuffer.mockResolvedValue(Buffer.from('audio-data'));

			gladiaApiUploadSpy.mockResolvedValueOnce({
				audio_url: 'https://api.gladia.io/file/uploaded-123',
			});

			gladiaApiRequestSpy.mockResolvedValueOnce({
				id: 'txn-bin',
				result_url: 'https://api.gladia.io/v2/transcription/txn-bin',
			});

			const result = await node.execute.call(executeFunctions);

			expect(gladiaApiUploadSpy).toHaveBeenCalledWith(
				Buffer.from('audio-data'),
				'test.wav',
				'audio/wav',
			);
			expect(gladiaApiRequestSpy).toHaveBeenCalledWith('POST', '/v2/transcription', {
				audio_url: 'https://api.gladia.io/file/uploaded-123',
			});
			expect(result[0][0].json.id).toBe('txn-bin');
		});
	});

	describe('transcription options', () => {
		it('should pass all options to the API', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: false,
					options: {
						languages: 'en',
						diarization: true,
						diarization_min_speakers: 2,
						diarization_max_speakers: 5,
						subtitles: true,
						subtitles_formats: ['srt', 'vtt'],
						translation: true,
						translation_target_languages: 'fr,de',
						summarization: true,
						sentiment_analysis: true,
						named_entity_recognition: true,
						enable_code_switching: true,
						custom_vocabulary: 'n8n, LangChain, GPT-4',
					},
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockResolvedValueOnce({ id: 'txn-opts' });

			await node.execute.call(executeFunctions);

			expect(gladiaApiRequestSpy).toHaveBeenCalledWith('POST', '/v2/transcription', {
				audio_url: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
				language_config: { languages: ['en'], code_switching: true },
				diarization: true,
				diarization_config: { min_speakers: 2, max_speakers: 5 },
				subtitles: true,
				subtitles_config: { formats: ['srt', 'vtt'] },
				translation: true,
				translation_config: { target_languages: ['fr', 'de'] },
				summarization: true,
				sentiment_analysis: true,
				named_entity_recognition: true,
				custom_vocabulary: ['n8n', 'LangChain', 'GPT-4'],
			});
		});
	});

	describe('continueOnFail', () => {
		it('should return error in json when continueOnFail is true', async () => {
			executeFunctions.continueOnFail.mockReturnValue(true);
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: false,
					options: {},
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockRejectedValueOnce(new Error('API error'));

			const result = await node.execute.call(executeFunctions);

			expect(result[0][0].json).toEqual({ error: 'API error' });
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});
	});

	describe('polling with transcription ID fallback', () => {
		it('should poll using /v2/transcription/:id when no result_url', async () => {
			executeFunctions.getNodeParameter.mockImplementation(((param: string) => {
				const params: Record<string, unknown> = {
					resource: 'transcription',
					operation: 'transcribe',
					audioSource: 'url',
					audioUrl: 'http://files.gladia.io/example/audio-transcription/split_infinity.wav',
					waitForCompletion: true,
					options: { pollingInterval: 1, pollingTimeout: 30 },
				};
				return params[param];
			}) as () => NodeParameterValueType);

			gladiaApiRequestSpy.mockResolvedValueOnce({ id: 'txn-456' }).mockResolvedValueOnce({
				status: 'done',
				result: { transcription: { full_transcript: 'Test' } },
			});

			const result = await node.execute.call(executeFunctions);

			expect(gladiaApiRequestSpy).toHaveBeenCalledTimes(2);
			expect(gladiaApiRequestSpy).toHaveBeenLastCalledWith('GET', '/v2/transcription/txn-456');
			expect((result[0][0].json as Record<string, unknown>).status).toBe('done');
		});
	});
});
