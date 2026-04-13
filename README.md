# Gladia n8n nodes

![Gladia n8n Custom Nodes](https://mintcdn.com/gladia-95/d3oqVq8GCojBkeW7/assets/dark-banner.png?fit=max&auto=format&n=d3oqVq8GCojBkeW7&q=85&s=fcfb8697c847a9467d0a6853086b0bb4)

This is an n8n community node. It lets you use **Gladia** in your n8n workflows.

[Gladia](https://gladia.io/) is a speech-to-text API that provides fast and accurate audio transcription powered by AI, with support for 100+ languages, speaker diarization, translation, summarization, and more.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

### Via the n8n UI (recommended)

1. Open your n8n instance and go to **Settings** → **Community Nodes**.
2. Click **Install a community node**.
3. Enter `@gladiaio/n8n-nodes` in the search field and select it.
4. Click **Install** and wait for the installation to complete.
5. The Gladia node will be available in the nodes panel under **Gladia**.

> **Note:** Community node installation requires a self-hosted n8n instance. This feature is not available on n8n Cloud free plans. See the [n8n documentation](https://docs.n8n.io/integrations/community-nodes/installation/) for details.

### Via npm (manual install)

If you manage your n8n instance manually, you can install the package directly:

```bash
npm install @gladiaio/n8n-nodes
```

Then restart your n8n instance. The node will be picked up automatically.

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

## Publishing a new release

Releases are published to npm automatically when a version tag is pushed to GitHub.

1. Go to the repository on GitHub → **Releases** → **Draft a new release**.
2. Click **Choose a tag**, type a new tag following the format `v1.2.3`, and select **Create new tag on publish**.
3. Click **Publish release**.

The CD pipeline will trigger automatically: it runs lint, build, and tests, then publishes the package to npm.

> **Note:** An `NPM_TOKEN` secret must be configured in **Settings** → **Secrets and variables** → **Actions**.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Gladia API documentation](https://docs.gladia.io/)
- [Get your Gladia API key](https://docs.gladia.io/reference/getting-your-api-key)
