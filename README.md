# Azure OpenAI Model Comparator

A tool to compare responses from different Azure OpenAI models side by side, including standard models (GPT-4, GPT-3.5), O1, Phi, and DeepSeek models.

## Features

- Compare responses from multiple Azure OpenAI models side by side
- Support for streaming responses from standard models
- Support for special models like O1, Phi, and DeepSeek
- Real-time response display with Markdown formatting
- Syntax highlighting for code in responses

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your API keys and endpoints:

```
# Server port
PORT=3001

# Phi model configuration
VITE_PHI_API_KEY=your_phi_api_key_here
VITE_PHI_BASE_URL=https://phi-4-voljh.eastus.models.ai.azure.com

# DeepSeek model configuration
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_DEEPSEEK_BASE_URL=https://DeepSeek-R1-ibhnj.eastus.models.ai.azure.com
```

## Running the Application

The application consists of a React frontend and an Express backend server to handle API requests for special models.

### Development Mode

To run both the frontend and backend in development mode:

```bash
npm run dev:full
```

This will start the Vite dev server for the frontend at http://localhost:3000 and the Express server for the backend at http://localhost:3001.

### Starting Only the Frontend

```bash
npm run dev
```

### Starting Only the Backend Server

```bash
npm run server
```

### Production Build

```bash
npm run build
```

## Usage

1. Add your Azure OpenAI models in the Model Configuration panel
2. Select at least 2 models to compare
3. Enter your prompt in the input box
4. Click "Send Prompt" to see the responses

## Model Types

- **Standard models**: GPT-4, GPT-3.5 - Uses direct Azure OpenAI API with streaming
- **O1 models**: Uses Azure OpenAI API without streaming
- **Phi models**: Uses the backend server to route requests to Azure AI Studio
- **DeepSeek models**: Uses the backend server to route requests to Azure AI Studio

## Troubleshooting

If you encounter issues with the backend server:

1. Check that your environment variables are set correctly
2. Look for error messages in the server console
3. Ensure you have the correct API keys and endpoints for your models
4. For DeepSeek models, make sure you're using the base URL without any path components
