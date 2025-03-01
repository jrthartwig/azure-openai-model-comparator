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
export const detectModelType = (modelConfig: ModelConfig): 'o1' | 'phi' | 'standard' => {
  const deploymentName = (modelConfig.deploymentName || modelConfig.deploymentId || '').toLowerCase();
  const modelName = (modelConfig.name || '').toLowerCase();
  const endpoint = (modelConfig.endpoint || '').toLowerCase();
  
  if (deploymentName.includes('o1') || modelName.includes('o1')) {
    return 'o1';
  } else if (
    deploymentName.includes('phi') || 
    modelName.includes('phi') || 
    endpoint.includes('phi') ||
    endpoint.includes('models.ai.azure.com')
  ) {
    return 'phi';
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
    // Use deploymentId as deploymentName if deploymentName is not available
    const deploymentName = modelConfig.deploymentName || modelConfig.deploymentId;
    
    // Check if this is an o1-mini model
    const isO1Model = deploymentName.toLowerCase().includes('o1') || 
                     (modelConfig.name && modelConfig.name.toLowerCase().includes('o1'));
    
    // Default API version if not provided
    const apiVersion = modelConfig.apiVersion || '2023-12-01-preview';
    
    // Prepare base request body
    const requestBody: any = {
      messages: [{ role: 'user', content: prompt }]
    };
    
    // Use the appropriate max tokens parameter based on model type
    if (isO1Model) {
      requestBody.max_completion_tokens = 2000;
      // O1 models don't support streaming
      requestBody.stream = false;
    } else {
      requestBody.max_tokens = 2000;
      requestBody.stream = true;
    }
    
    const url = `${modelConfig.endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': modelConfig.apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error from Azure OpenAI API: ${response.status} - ${errorText}`);
    }

    // Different handling for O1 models (non-streaming) vs other models (streaming)
    if (isO1Model) {
      // Handle non-streaming response for O1 models
      const jsonResponse = await response.json();
      
      // Get the content from the response
      const content = jsonResponse.choices[0]?.message?.content || '';
      
      if (content) {
        // We could simulate streaming by chunking the response, but let's just send it all at once for now
        onData(content);
      }
      
      onComplete();
    } else {
      // Handle streaming for all other models
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
                
                // Extract content from the delta (for chat completion) or text (for completion)
                const content = parsedData.choices[0]?.delta?.content || parsedData.choices[0]?.text || '';
                
                if (content) {
                  onData(content);
                }
                
                // Check if the response is complete
                if (parsedData.choices[0]?.finish_reason !== null) {
                  break;
                }
              } catch (e) {
                console.error('Error parsing JSON from stream:', e);
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
        onError(error);
      }
    } else {
      onError(new Error('Unknown error occurred'));
    }
  }
}