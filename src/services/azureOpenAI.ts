import { ModelConfig } from '../types';

// Updated interface with proper types
interface AzureOpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta?: {
      content?: string;
    };
    text?: string;
    message?: {
      content?: string;
      role?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Helper to detect model types
export const detectModelType = (modelConfig: ModelConfig): 'o1' | 'phi' | 'deepseek' | 'standard' => {
  const deploymentName = (modelConfig.deploymentName || modelConfig.deploymentId || '').toLowerCase();
  const modelName = (modelConfig.name || '').toLowerCase();
  const endpoint = (modelConfig.endpoint || '').toLowerCase();
  
  if (deploymentName.includes('o1') || modelName.includes('o1')) {
    return 'o1';
  } else if (
    deploymentName.includes('phi') || 
    modelName.includes('phi') || 
    endpoint.includes('phi') ||
    modelConfig.isPhiModel
  ) {
    return 'phi';
  } else if (
    deploymentName.includes('deepseek') || 
    modelName.includes('deepseek') || 
    endpoint.includes('deepseek') ||
    modelConfig.isDeepseekModel
  ) {
    return 'deepseek';
  } else {
    return 'standard';
  }
};

// Helper function to extract content from a response object
function extractContentFromResponse(responseObject: any): string {
  if (!responseObject || typeof responseObject !== 'object') {
    return '';
  }
  
  if (responseObject.choices && responseObject.choices.length > 0) {
    const choice = responseObject.choices[0];
    // Check all possible locations for content
    return choice?.message?.content || 
           choice?.delta?.content || 
           choice?.text || 
           '';
  }
  
  return '';
}

export async function streamCompletion(
  modelConfig: ModelConfig,
  prompt: string,
  onData: (text: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
  abortSignal?: AbortSignal
) {
  try {
    // Get the model type
    const modelType = detectModelType(modelConfig);
    let url: string;
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let requestBody: any;
    
    // Configure the request based on model type
    if (modelType === 'phi') {
      // Use the backend server for Phi models (non-streaming for now)
      url = '/api/phi';
      requestBody = {
        // Include credentials in the request
        apiKey: modelConfig.apiKey,
        endpoint: modelConfig.endpoint,
        deploymentId: modelConfig.deploymentId,
        
        // Model parameters
        model: modelConfig.deploymentName || modelConfig.name || "Phi-4",
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: false // Phi doesn't support streaming reliably through our proxy
      };
    } else if (modelType === 'deepseek') {
      // Use the backend server for DeepSeek models with streaming
      url = '/api/deepseek';
      requestBody = {
        // Include credentials in the request
        apiKey: modelConfig.apiKey,
        endpoint: modelConfig.endpoint,
        deploymentId: modelConfig.deploymentId,
        
        // Model parameters
        model: modelConfig.deploymentName || modelConfig.name || "DeepSeek",
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        stream: true // Enable streaming for DeepSeek
      };
    } else if (modelType === 'o1') {
      // For O1 models (non-streaming)
      const deploymentName = modelConfig.deploymentName || modelConfig.deploymentId;
      const apiVersion = modelConfig.apiVersion || '2023-12-01-preview';
      url = `${modelConfig.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
      headers['api-key'] = modelConfig.apiKey;
      requestBody = {
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: 2000,
        stream: false
      };
    } else {
      // For standard models (GPT-4, etc) with streaming
      const deploymentName = modelConfig.deploymentName || modelConfig.deploymentId;
      const apiVersion = modelConfig.apiVersion || '2023-12-01-preview';
      url = `${modelConfig.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
      headers['api-key'] = modelConfig.apiKey;
      requestBody = {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        stream: true
      };
    }

    console.log(`Sending request to ${url} for model type: ${modelType}`);
    
    // Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      if (response.status === 404 && (modelType === 'phi' || modelType === 'deepseek')) {
        throw new Error(`Backend server endpoint not found. Make sure the server is running with: npm run server`);
      }
      
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    // Handle non-streaming responses (O1, Phi)
    if ((modelType === 'o1' || modelType === 'phi') || !requestBody.stream) {
      try {
        const jsonResponse = await response.json();
        console.log('Received non-streaming response');
        
        // Extract the content from the response using the helper function
        const content = extractContentFromResponse(jsonResponse);
        
        if (content) {
          onData(content);
          onComplete();
        } else {
          console.error('No content found in response:', jsonResponse);
          throw new Error('No content found in the response');
        }
      } catch (e) {
        console.error('Error processing non-streaming response:', e);
        onError(new Error(`Failed to process response: ${e instanceof Error ? e.message : 'Unknown error'}`));
        onComplete();
      }
    } else {
      // Handle streaming responses (standard models and DeepSeek)
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body reader could not be created');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      try {
        // Process stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process complete lines from the buffer
          let lineEnd = buffer.indexOf('\n');
          while (lineEnd !== -1) {
            const line = buffer.substring(0, lineEnd).trim();
            buffer = buffer.substring(lineEnd + 1);
            
            if (line) {
              processStreamLine(line, onData);
            }
            
            lineEnd = buffer.indexOf('\n');
          }
        }
        
        // Process any remaining content in the buffer
        if (buffer.trim()) {
          processStreamLine(buffer.trim(), onData);
        }
        
        onComplete();
      } catch (e) {
        console.error('Error processing stream:', e);
        onError(new Error(`Stream processing error: ${e instanceof Error ? e.message : 'Unknown error'}`));
        onComplete();
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('Stream was aborted');
      } else {
        console.error('Error in streamCompletion:', error);
        onError(error);
      }
    } else {
      onError(new Error('Unknown error occurred'));
    }
  }
}

// Helper to process a line from the SSE stream
function processStreamLine(line: string, onData: (text: string) => void): void {
  // Skip empty lines and the keep-alive lines
  if (!line || line === '[DONE]') return;
  
  // Lines should start with "data: "
  if (line.startsWith('data: ')) {
    const jsonData = line.substring(6).trim();
    
    // End of stream marker
    if (jsonData === '[DONE]') return;
    
    try {
      // Parse the JSON data
      const parsedData = JSON.parse(jsonData);
      
      // Extract the content
      const content = extractContentFromResponse(parsedData);
      
      if (content) {
        onData(content);
      }
    } catch (e) {
      console.warn('Failed to parse JSON from stream:', jsonData);
    }
  }
}