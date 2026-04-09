# n8n-nodes-gladia

This is an n8n community node. It lets you use **Gladia** in your n8n workflows.

[Gladia](https://gladia.io/) is a speech-to-text API that provides fast and accurate audio transcription powered by AI, with support for 100+ languages, speaker diarization, translation, summarization, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Compatibility](#compatibility)
[Usage](#usage)
[Resources](#resources)
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Search for `n8n-nodes-gladia` in the community nodes panel.

## Operations

**Transcription**

- **Transcribe** — Submit an audio file (via URL or binary data) for transcription and optionally wait for the result.

Supported options:
- Language detection (auto or specified)
- Code switching (multi-language audio)
- Speaker diarization (with min/max speaker count)
- Named entity recognition
- Sentiment analysis
- Subtitles generation (SRT, VTT)
- Summarization
- Translation to target languages
- Custom vocabulary
- Configurable polling interval and timeout

## Credentials

1. Sign up at [gladia.io](https://app.gladia.io/auth/signup) to get an API key.
2. In n8n, go to **Credentials** → **New** → search for **Gladia API**.
3. Paste your API key into the **API Key** field.

The credential is tested against the Gladia `/v2/health` endpoint on save.

## Compatibility

- Tested against n8n `1.x`
- Minimum recommended n8n version: `1.0.0`

## Usage

**Transcribe from URL:**
1. Add the Gladia node to your workflow.
2. Set **Audio Source** to `URL` and provide a publicly accessible audio URL.
3. Enable **Wait for Completion** to receive the full transcript in the output, or disable it to get the transcription ID immediately and poll manually.

**Transcribe from binary data:**
1. Pipe a binary file (e.g. from an HTTP Request or Read Binary File node) into the Gladia node.
2. Set **Audio Source** to `Binary Data` and enter the binary field name (default: `data`).
3. The node will upload the file to Gladia and then start transcription.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Gladia API documentation](https://docs.gladia.io/)
- [Get your Gladia API key](https://docs.gladia.io/reference/getting-your-api-key)
