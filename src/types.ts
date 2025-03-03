export interface AzureOpenAIModel {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  deploymentId: string;
  modelVersion?: string;
}

export interface ModelConfig {
  id?: string;
  endpoint: string;
  apiKey: string;
  deploymentId: string;
  deploymentName?: string; // Name of the deployed model
  name?: string;           // Display name for the model
  apiVersion?: string;     // API version for standard Azure OpenAI models
  isPhiModel?: boolean;    // Flag to identify Phi models
  isDeepseekModel?: boolean; // Flag to identify DeepSeek models
}

export interface ModelResponse {
  modelId: string;
  text: string;
  isComplete: boolean;
  error?: string;
  useRag?: boolean;        // Flag to indicate if RAG was used for this response
  modelName?: string;      // Display name of the model
}

export interface StreamingState {
  isStreaming: boolean;
  responses: Record<string, ModelResponse>;
}

// RAG-specific types
export interface RagConfig {
  enabled: boolean;
  indexEndpoint: string;
  indexName: string;
  apiKey: string;
  apiVersion?: string;
}

export interface RagDocument {
  id: string;
  content: string;
  title?: string;
  url?: string;
  source?: string;
}

export interface RagSearchResult {
  documents: RagDocument[];
  query: string;
}

export interface RagRequestOptions {
  top?: number;
  query: string;
  filter?: string;
  queryType?: 'simple' | 'semantic';
  semanticConfiguration?: string;
}
