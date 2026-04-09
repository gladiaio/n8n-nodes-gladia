import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

import { gladiaApiRequest, gladiaApiUpload } from './GenericFunctions';

export class Gladia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Gladia',
		name: 'gladia',
		icon: { light: 'file:gladia.svg', dark: 'file:gladia.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Transcribe audio using the Gladia API',
		usableAsTool: true,
		defaults: {
			name: 'Gladia',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'gladiaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Transcription',
						value: 'transcription',
					},
				],
				default: 'transcription',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['transcription'],
					},
				},
				options: [
					{
						name: 'Transcribe',
						value: 'transcribe',
						description: 'Transcribe an audio file',
						action: 'Transcribe an audio file',
					},
				],
				default: 'transcribe',
			},
			{
				displayName: 'Audio Source',
				name: 'audioSource',
				type: 'options',
				options: [
					{
						name: 'URL',
						value: 'url',
					},
					{
						name: 'Binary Data',
						value: 'binaryData',
					},
				],
				default: 'url',
				displayOptions: {
					show: {
						resource: ['transcription'],
						operation: ['transcribe'],
					},
				},
			},
			{
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['transcription'],
						operation: ['transcribe'],
						audioSource: ['url'],
					},
				},
				description: 'URL of the audio file to transcribe',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						resource: ['transcription'],
						operation: ['transcribe'],
						audioSource: ['binaryData'],
					},
				},
				description: 'Name of the binary property containing the audio file',
			},
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						resource: ['transcription'],
						operation: ['transcribe'],
					},
				},
				description:
					'Whether to wait and poll for the transcription result instead of returning the transcription ID immediately',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['transcription'],
						operation: ['transcribe'],
					},
				},
				options: [
					{
						displayName: 'Custom Vocabulary',
						name: 'custom_vocabulary',
						type: 'string',
						default: '',
						description: 'Comma-separated list of custom vocabulary terms to improve accuracy',
					},
					{
						displayName: 'Diarization',
						name: 'diarization',
						type: 'boolean',
						default: false,
						description: 'Whether to enable speaker diarization',
					},
					{
						displayName: 'Diarization Max Speakers',
						name: 'diarization_max_speakers',
						type: 'number',
						default: 0,
						description:
							'Maximum number of speakers (0 for automatic). Only used when Diarization is enabled.',
						displayOptions: {
							show: {
								diarization: [true],
							},
						},
					},
					{
						displayName: 'Diarization Min Speakers',
						name: 'diarization_min_speakers',
						type: 'number',
						default: 0,
						description:
							'Minimum number of speakers (0 for automatic). Only used when Diarization is enabled.',
						displayOptions: {
							show: {
								diarization: [true],
							},
						},
					},
					{
						displayName: 'Enable Code Switching',
						name: 'enable_code_switching',
						type: 'boolean',
						default: false,
						description:
							'Whether to enable code switching (switch between languages) for multi-language conversations',
					},
					{
						displayName: 'Languages',
						name: 'languages',
						type: 'string',
						default: '',
						description:
							'Language code (e.g. en, fr, de), separated by commas. Leave empty for auto-detection.',
					},
					{
						displayName: 'Model',
						name: 'model',
						type: 'options',
						options: [{ name: 'Solaria 1', value: 'solaria-1' }],
						default: 'solaria-1',
						description: 'Model to use for transcription',
					},
					{
						displayName: 'Named Entity Recognition',
						name: 'named_entity_recognition',
						type: 'boolean',
						default: false,
						description: 'Whether to enable named entity recognition',
					},
					{
						displayName: 'Polling Interval (Seconds)',
						name: 'pollingInterval',
						type: 'number',
						default: 5,
						description: 'How often to check for transcription completion (in seconds)',
						displayOptions: {
							show: {
								'/waitForCompletion': [true],
							},
						},
					},
					{
						displayName: 'Polling Timeout (Seconds)',
						name: 'pollingTimeout',
						type: 'number',
						default: 600,
						description: 'Maximum time to wait for transcription completion (in seconds)',
						displayOptions: {
							show: {
								'/waitForCompletion': [true],
							},
						},
					},
					{
						displayName: 'Sentiment Analysis',
						name: 'sentiment_analysis',
						type: 'boolean',
						default: false,
						description: 'Whether to enable sentiment analysis',
					},
					{
						displayName: 'Subtitles',
						name: 'subtitles',
						type: 'boolean',
						default: false,
						description: 'Whether to generate subtitles',
					},
					{
						displayName: 'Subtitles Formats',
						name: 'subtitles_formats',
						type: 'multiOptions',
						options: [
							{ name: 'SRT', value: 'srt' },
							{ name: 'VTT', value: 'vtt' },
						],
						default: [],
						description: 'Subtitle formats to generate',
						displayOptions: {
							show: {
								subtitles: [true],
							},
						},
					},
					{
						displayName: 'Summarization',
						name: 'summarization',
						type: 'boolean',
						default: false,
						description: 'Whether to enable summarization',
					},
					{
						displayName: 'Translation',
						name: 'translation',
						type: 'boolean',
						default: false,
						description: 'Whether to enable translation',
					},
					{
						displayName: 'Translation Target Languages',
						name: 'translation_target_languages',
						type: 'string',
						default: '',
						description: 'Comma-separated list of target language codes (e.g. "en,fr,de")',
						displayOptions: {
							show: {
								translation: [true],
							},
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'transcription' && operation === 'transcribe') {
					const audioSource = this.getNodeParameter('audioSource', i) as string;
					const waitForCompletion = this.getNodeParameter('waitForCompletion', i) as boolean;
					const options = this.getNodeParameter('options', i) as {
						languages?: string;
						enable_code_switching?: boolean;
						custom_vocabulary?: string;
						diarization?: boolean;
						diarization_min_speakers?: number;
						diarization_max_speakers?: number;
						named_entity_recognition?: boolean;
						sentiment_analysis?: boolean;
						subtitles?: boolean;
						subtitles_formats?: string[];
						summarization?: boolean;
						translation?: boolean;
						translation_target_languages?: string;
						pollingInterval?: number;
						pollingTimeout?: number;
					};

					let audioUrl: string;

					if (audioSource === 'binaryData') {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

						const uploadResponse = await gladiaApiUpload.call(
							this,
							buffer,
							binaryData.fileName ?? 'audio.wav',
							binaryData.mimeType,
						);

						audioUrl = uploadResponse.audio_url as string;
						if (!audioUrl) {
							throw new NodeOperationError(
								this.getNode(),
								'Upload succeeded but no audio_url returned',
								{ itemIndex: i },
							);
						}
					} else {
						audioUrl = this.getNodeParameter('audioUrl', i) as string;
					}

					const body: Record<string, unknown> = {
						audio_url: audioUrl,
					};

					if (options.custom_vocabulary) {
						body.custom_vocabulary = options.custom_vocabulary
							.split(',')
							.map((v) => v.trim())
							.filter(Boolean);
					}

					if (options.languages) {
						if (!body.language_config) body.language_config = {};
						(body.language_config as Record<string, string[]>).languages = options.languages
							.split(',')
							.map((l) => l.trim())
							.filter(Boolean);
					}

					if (options.enable_code_switching !== undefined) {
						if (!body.language_config) body.language_config = {};
						(body.language_config as Record<string, boolean>).code_switching =
							options.enable_code_switching;
					}

					if (options.diarization !== undefined) {
						body.diarization = options.diarization;

						if (options.diarization) {
							const diarizationConfig: Record<string, number> = {};
							if (options.diarization_min_speakers && options.diarization_min_speakers > 0) {
								diarizationConfig.min_speakers = options.diarization_min_speakers;
							}
							if (options.diarization_max_speakers && options.diarization_max_speakers > 0) {
								diarizationConfig.max_speakers = options.diarization_max_speakers;
							}
							if (Object.keys(diarizationConfig).length > 0) {
								body.diarization_config = diarizationConfig;
							}
						}
					}

					if (options.subtitles !== undefined) {
						body.subtitles = options.subtitles;

						if (
							options.subtitles &&
							options.subtitles_formats &&
							options.subtitles_formats.length > 0
						) {
							body.subtitles_config = { formats: options.subtitles_formats };
						}
					}

					if (options.translation !== undefined) {
						body.translation = options.translation;

						if (options.translation && options.translation_target_languages) {
							body.translation_config = {
								target_languages: options.translation_target_languages
									.split(',')
									.map((l) => l.trim())
									.filter(Boolean),
							};
						}
					}

					if (options.summarization !== undefined) {
						body.summarization = options.summarization;
					}

					if (options.sentiment_analysis !== undefined) {
						body.sentiment_analysis = options.sentiment_analysis;
					}

					if (options.named_entity_recognition !== undefined) {
						body.named_entity_recognition = options.named_entity_recognition;
					}

					const initResponse = await gladiaApiRequest.call(this, 'POST', '/v2/transcription', body);

					if (!waitForCompletion) {
						returnData.push({ json: initResponse });
						continue;
					}

					const resultUrl = initResponse.result_url as string | undefined;
					const transcriptionId = initResponse.id as string | undefined;

					if (!resultUrl && !transcriptionId) {
						throw new NodeOperationError(
							this.getNode(),
							'No result_url or id returned from transcription initiation',
							{ itemIndex: i },
						);
					}

					const pollEndpoint = resultUrl ? undefined : `/v2/transcription/${transcriptionId}`;

					const pollingInterval = (options.pollingInterval ?? 5) * 1000;
					const pollingTimeout = (options.pollingTimeout ?? 600) * 1000;
					const startTime = Date.now();

					let result: JsonObject | undefined;

					while (Date.now() - startTime < pollingTimeout) {
						await sleep(pollingInterval);

						let pollResponse: JsonObject;

						if (resultUrl) {
							const requestOptions: IHttpRequestOptions = {
								method: 'GET',
								url: resultUrl,
								json: true,
							};
							pollResponse = (await this.helpers.httpRequestWithAuthentication.call(
								this,
								'gladiaApi',
								requestOptions,
							)) as JsonObject;
						} else {
							pollResponse = await gladiaApiRequest.call(this, 'GET', pollEndpoint as string);
						}

						const status = pollResponse.status as string;

						if (status === 'done') {
							result = pollResponse;
							break;
						}

						if (status === 'error') {
							throw new NodeOperationError(
								this.getNode(),
								`Transcription failed: ${JSON.stringify(pollResponse.error_message ?? pollResponse.error ?? 'Unknown error')}`,
								{ itemIndex: i },
							);
						}
					}

					if (!result) {
						throw new NodeOperationError(
							this.getNode(),
							`Transcription timed out after ${(pollingTimeout / 1000).toString()} seconds`,
							{ itemIndex: i },
						);
					}

					returnData.push({ json: result });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
