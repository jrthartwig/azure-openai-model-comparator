# Connection Guide

This guide explains how to set up your environment for connecting to Azure OpenAI models, including special models like Phi and DeepSeek.

## Architecture

This application uses a two-part architecture:

1. **Frontend (Vite/React)**: Runs on port 3000
2. **Backend (Express)**: Runs on port 3001

For special models (Phi and DeepSeek), the frontend makes API calls to the backend, which then forwards them to the actual Azure API endpoints. This avoids CORS issues and provides better error handling.

## Running the Application

### Full Setup (Recommended)

To run both the frontend and backend together:

```bash
npm run dev:full
```

This starts both the Vite development server and the Express backend server using concurrently.

### Running Frontend and Backend Separately

Start the frontend:

```bash
npm run dev
```

Start the backend:

```bash
npm run server
```

## Troubleshooting Backend Connections

If you encounter 404 errors when trying to use Phi or DeepSeek models, check the following:

1. **Is the backend server running?** 
   - Make sure you see "Server running at http://localhost:3001" in your console.
   - If not, run `npm run server` in a separate terminal.

2. **Are your environment variables set correctly?**
   - Make sure your `.env` file exists and has the correct API keys and URLs.
   - Check the backend server logs to see if environment variables are detected.

3. **Check the health endpoint**
   - Open `http://localhost:3001/api/health` in your browser.
   - It should return a JSON response confirming the server is running.

## Manual Connection Test

To manually test if your backend can connect to the models:

```bash
# For Phi models:
curl -X POST http://localhost:3001/api/phi \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"max_tokens":100}'

# For DeepSeek models:
curl -X POST http://localhost:3001/api/deepseek \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello!"}],"max_tokens":100}'
```

If these commands return responses from the models, your backend is configured correctly.
