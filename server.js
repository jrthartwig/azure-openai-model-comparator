import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
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
    // Get API configuration from environment variables
    const apiKey = modelType === 'phi' 
      ? process.env.VITE_PHI_API_KEY 
      : process.env.VITE_DEEPSEEK_API_KEY;
      
    const baseUrl = modelType === 'phi'
      ? process.env.VITE_PHI_BASE_URL
      : process.env.VITE_DEEPSEEK_BASE_URL;
      
    // Check if we have the necessary configuration
    if (!apiKey || !baseUrl) {
      console.error(`Missing API configuration for ${modelType} model`);
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.startsWith('VITE_')));
      
      return res.status(500).json({ 
        error: `Missing API configuration for ${modelType} model. Check your .env file.` 
      });
    }
    
    // Clean up base URL (remove trailing slashes)
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Build the full API URL based on model type
    const apiPath = modelType === 'phi' ? '/v1/chat/completions' : '/chat/completions';
    const apiUrl = `${cleanBaseUrl}${apiPath}`;
    
    // Check if client requested streaming
    const isStreamingRequest = req.body.stream === true;
    
    console.log(`Making ${isStreamingRequest ? 'streaming' : 'non-streaming'} request to ${apiUrl}`);
    console.log('Request body:', req.body);
    
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
        data: req.body,
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
        data: req.body,
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
      console.error('Response data:', error.response.data);
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Also return env vars for debugging (excluding sensitive values)
  const envVars = {};
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_')) {
      if (key.includes('KEY') || key.includes('SECRET')) {
        envVars[key] = '[REDACTED]';
      } else {
        envVars[key] = process.env[key];
      }
    }
  }
  
  res.json({ 
    status: 'ok', 
    models: ['phi', 'deepseek'],
    environment: envVars
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
  console.log('--------------------------------------');
  console.log('Environment variables:');
  console.log(`- VITE_PHI_API_KEY: ${process.env.VITE_PHI_API_KEY ? '[SET]' : '[NOT SET]'}`);
  console.log(`- VITE_PHI_BASE_URL: ${process.env.VITE_PHI_BASE_URL || '[NOT SET]'}`);
  console.log(`- VITE_DEEPSEEK_API_KEY: ${process.env.VITE_DEEPSEEK_API_KEY ? '[SET]' : '[NOT SET]'}`);
  console.log(`- VITE_DEEPSEEK_BASE_URL: ${process.env.VITE_DEEPSEEK_BASE_URL || '[NOT SET]'}`);
  console.log('--------------------------------------');
});
