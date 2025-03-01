import { ModelConfig } from '../types';

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
    };
    index: number;
    finish_reason: string | null;
  }[];
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
        model: modelConfig.deploymentName || modelConfig.name || 'Phi-4',
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
        model: modelConfig.deploymentName || modelConfig.name || 'DeepSeek',
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
    if ((modelType === 'o1' || modelType === 'phi') && !requestBody.stream) {
      try {
        const jsonResponse = await response.json();
        console.log('Received non-streaming response');
        
        // Extract the content from the response
        let content = '';
        
        if (jsonResponse.choices && jsonResponse.choices.length > 0) {
          content = jsonResponse.choices[0]?.message?.content || '';
        }
        
        if (content) {
          onData(content);
        } else {
          console.error('No content found in response:', jsonResponse);
          throw new Error('No content found in the response');
        }
        
        onComplete();
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

      // Process stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        try {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            // Each line starts with "data: "
            if (line.startsWith('data: ')) {
              const jsonData = line.substring(6);
              
              // End of stream
              if (jsonData === '[DONE]') {
                break;
              }
              
              try {
                const parsedData: AzureOpenAIResponse = JSON.parse(jsonData);
                
                // Extract content from the delta (for chat completion)
                const content = parsedData.choices[0]?.delta?.content || '';
                
                if (content) {
                  onData(content);
                }
                
                // Check if the response is complete
                if (parsedData.choices[0]?.finish_reason !== null) {
                  break;
                }
              } catch (e) {
                console.error('Error parsing JSON from stream:', e);
                console.log('Raw JSON data:', jsonData);
              }
            }
          }
        } catch (e) {
          console.error('Error decoding or processing stream chunk:', e);
        }
      }
      
      onComplete();
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