export interface ModelConfig {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
  selected: boolean;
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
