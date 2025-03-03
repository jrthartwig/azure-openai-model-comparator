import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (as fallback)
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for development
app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory in production
app.use(express.static(path.join(__dirname, 'dist')));

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Helper function to handle model-specific requests with streaming support
async function handleModelRequest(req, res, modelType) {
  try {
    // Extract credentials from the request body
    const { apiKey, endpoint, deploymentId, ...otherParams } = req.body;
    
    // Validate required parameters
    if (!apiKey || !endpoint) {
      return res.status(400).json({ 
        error: `Missing required parameters for ${modelType} model.`,
        details: "Both 'apiKey' and 'endpoint' must be provided in the request body."
      });
    }
    
    // Clean up base URL (remove trailing slashes)
    const cleanBaseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    
    // Build the full API URL based on model type
    const apiPath = modelType === 'phi' ? '/v1/chat/completions' : '/chat/completions';
    const apiUrl = `${cleanBaseUrl}${apiPath}`;
    
    // Extract the model request parameters (excluding credentials)
    const modelRequestBody = { ...otherParams };
    
    // Check if client requested streaming
    const isStreamingRequest = modelRequestBody.stream === true;
    
    console.log(`Making ${isStreamingRequest ? 'streaming' : 'non-streaming'} request to ${apiUrl}`);
    
    if (isStreamingRequest) {
      // Handle streaming response
      const axiosResponse = await axios({
        method: 'post',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'text/event-stream'
        },
        data: modelRequestBody,
        responseType: 'stream',
      });
      
      // Set appropriate headers for SSE
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Pipe the stream directly to the client
      axiosResponse.data.pipe(res);
      
      // Handle errors in the stream
      axiosResponse.data.on('error', (err) => {
        console.error(`Stream error: ${err}`);
        res.end();
      });
    } else {
      // Handle non-streaming response
      const response = await axios({
        method: 'post',
        url: apiUrl,
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        data: modelRequestBody,
        validateStatus: status => true, // Accept all status codes to handle errors gracefully
      });
      
      // Log the status code
      console.log(`Received response with status: ${response.status}`);
      
      if (response.status >= 400) {
        console.error(`API Error:`, response.data);
      }
      
      // Forward the status code and response
      res.status(response.status).json(response.data);
    }
  } catch (error) {
    console.error(`Error in ${modelType} API:`, error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    
    // Send a detailed error response
    res.status(500).json({
      error: `Failed to process ${modelType} request`,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Phi model endpoint
app.post('/api/phi', async (req, res) => {
  console.log('Received Phi model request');
  await handleModelRequest(req, res, 'phi');
});

// DeepSeek model endpoint
app.post('/api/deepseek', async (req, res) => {
  console.log('Received DeepSeek model request');
  await handleModelRequest(req, res, 'deepseek');
});

// Add RAG proxy endpoint
app.post('/api/rag/search', async (req, res) => {
  try {
    const { 
      endpoint, indexName, apiKey, apiVersion = '2023-11-01', 
      query, top = 3, queryType = 'simple', // Default to simple search instead of semantic
      semanticConfiguration = null // Make this optional
    } = req.body;
    
    // Validate required parameters
    if (!endpoint || !indexName || !apiKey || !query) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: "endpoint, indexName, apiKey, and query are required" 
      });
    }
    
    // Clean up base URL (remove trailing slashes)
    const cleanBaseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    
    // Build search URL
    const searchUrl = `${cleanBaseUrl}/indexes/${indexName}/docs/search?api-version=${apiVersion}`;
    
    // Build search request payload
    const searchPayload = {
      search: query,
      top,
      queryType
    };
    
    // Only include semanticConfiguration if we're doing semantic search and have a config name
    if (queryType === 'semantic' && semanticConfiguration) {
      searchPayload.semanticConfiguration = semanticConfiguration;
    }
    
    console.log(`Making ${queryType} search request to: ${searchUrl}`);
    console.log(`Query: "${query}", Top: ${top}`);
    
    // Make the search request
    const response = await axios({
      method: 'post',
      url: searchUrl,
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      data: searchPayload
    });
    
    console.log(`Search response with status: ${response.status}, found ${response.data.value?.length || 0} results`);
    
    // Return the search results
    res.json(response.data);
  } catch (error) {
    console.error('Error in RAG search:', error);
    
    let errorDetails = {
      error: 'Failed to process search request',
      message: error.message
    };
    
    // Add response details if available
    if (error.response) {
      errorDetails.status = error.response.status;
      errorDetails.data = error.response.data;
      errorDetails.headers = error.response.headers;
    }
    
    res.status(500).json(errorDetails);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    models: ['phi', 'deepseek'],
    rag: 'enabled',
    message: 'Backend server is running. You can configure model credentials directly in the frontend.'
  });
});

// In production, serve the frontend for any other routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API endpoints:`);
  console.log(`- Health check: http://localhost:${port}/api/health`);
  console.log(`- Phi model: http://localhost:${port}/api/phi`);
  console.log(`- DeepSeek model: http://localhost:${port}/api/deepseek`);
  console.log(`- RAG search: http://localhost:${port}/api/rag/search`);
  console.log('--------------------------------------');
  console.log('Using dynamic credentials mode: Credentials are passed with each request');
  console.log('--------------------------------------');
});
