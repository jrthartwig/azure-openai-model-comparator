export interface AzureOpenAIModel {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  deploymentId: string;
  modelVersion?: string;
  // Add any other necessary properties
}

export interface ModelConfig {
  endpoint: string;
  apiKey: string;
  deploymentId: string;
  deploymentName?: string; // Added missing property
  name?: string;           // Added missing property
  apiVersion?: string;     // Added missing property
  // Add any other necessary properties
}

export interface ModelResponse {
  modelId: string;
  text: string;
  isComplete: boolean;
  error?: string;
}

export interface StreamingState {
  isStreaming: boolean;
  responses: Record<string, ModelResponse>;
}
