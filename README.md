# Azure OpenAI Model Comparator

A tool to compare responses from different Azure OpenAI models side by side, including standard models (GPT-4, GPT-3.5), O1, Phi, and DeepSeek models.

## Features

- Compare responses from multiple Azure OpenAI models side by side
- Support for streaming responses from standard models and DeepSeek
- Support for special models like O1, Phi, and DeepSeek
- Real-time response display with Markdown formatting
- Syntax highlighting for code in responses
- Configure all model credentials directly from the UI - no need to set environment variables!

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the application in development mode:

```bash
npm run dev:full
```

This will start both the frontend (port 3000) and the backend server (port 3001).

## Running in Production

1. Build the frontend:

```bash
npm run build
```

2. Start the server:

```bash
NODE_ENV=production npm run server
```

This will serve both the backend API and the static frontend files from the `dist` directory.

## Model Configuration

All model credentials can be configured directly through the frontend UI. For each model type:

### Standard and O1 Models

- **Endpoint**: The Azure OpenAI endpoint (e.g., `https://your-resource.openai.azure.com`)
- **API Key**: Your Azure OpenAI API key
- **Deployment ID**: The deployment name of your model

### Phi and DeepSeek Models

- **Endpoint**: The Azure AI Studio endpoint (e.g., `https://phi-4-ssdfs.eastus.models.ai.azure.com` or `https://DeepSeek-R1-sdfsd.eastus.models.ai.azure.com`)
- **API Key**: Your Azure AI Studio API key
- **Deployment ID**: Optional, sometimes not needed for these models

For Phi models, use the endpoint format: `https://{name}.{region}.models.ai.azure.com`
For DeepSeek models, use the endpoint format: `https://DeepSeek-R1-{id}.{region}.models.ai.azure.com`

## Architecture

The application consists of two parts:

1. **Frontend**: A React application built with Vite, responsible for the UI and for direct API calls to standard Azure OpenAI models.
   
2. **Backend**: An Express server that acts as a proxy for requests to Phi and DeepSeek models, helping avoid CORS issues and providing better error handling.

All model credentials are passed directly from the frontend to the appropriate API (either directly to Azure OpenAI API for standard models or through the backend proxy for Phi and DeepSeek models).

## Troubleshooting

If you encounter errors with specific model types:

### Standard and O1 Models

- Check if your Azure OpenAI API key and endpoint are correct
- Verify that the deployment ID exists in your Azure OpenAI resource

### Phi and DeepSeek Models

- Make sure the backend server is running (check http://localhost:3001/api/health)
- Verify that your Azure AI Studio API key and endpoint are correct
- Check browser console for detailed error messages
