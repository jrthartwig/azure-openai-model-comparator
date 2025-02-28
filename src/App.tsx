import { useState, useRef } from 'react';
import { ModelProvider, useModelContext } from './context/ModelContext';
import ModelConfigForm from './components/ModelConfigForm';
import ModelSelector from './components/ModelSelector';
import PromptInput from './components/PromptInput';
import ResponsePanel from './components/ResponsePanel';
import { streamCompletion } from './services/azureOpenAI';
import { ModelConfig, ModelResponse, StreamingState } from './types';

function ComparisonApp() {
  const { selectedModels } = useModelContext();
  const [streaming, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    responses: {},
  });
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  
  const handlePromptSubmit = async (prompt: string) => {
    if (streaming.isStreaming) return;
    
    // Initialize response state for selected models
    const initialResponses: Record<string, ModelResponse> = {};
    selectedModels.forEach((model: ModelConfig) => {
      // Using deploymentId as a unique identifier if id is not available
      const modelId = (model as any).id || model.deploymentId;
      initialResponses[modelId] = {
        modelId: modelId,
        text: '',
        isComplete: false,
      };
    });
    
    setStreamingState({
      isStreaming: true,
      responses: initialResponses,
    });
    
    // Start streaming for each selected model
    selectedModels.forEach((model: ModelConfig) => {
      // Using deploymentId as a unique identifier if id is not available
      const modelId = (model as any).id || model.deploymentId;
      const abortController = new AbortController();
      abortControllersRef.current[modelId] = abortController;
      
      // Call streamCompletion with the expected positional arguments
      streamCompletion(
        model,
        prompt,
        // onData callback
        (text: string) => {
          setStreamingState((prev: StreamingState) => ({
            ...prev,
            responses: {
              ...prev.responses,
              [modelId]: {
                ...prev.responses[modelId],
                text: prev.responses[modelId].text + text,
              },
            },
          }));
        },
        // onError callback
        (error: Error) => {
          setStreamingState((prev: StreamingState) => ({
            ...prev,
            responses: {
              ...prev.responses,
              [modelId]: {
                ...prev.responses[modelId],
                error: error.message,
                isComplete: true,
              },
            },
          }));
        },
        // onComplete callback
        () => {
          setStreamingState((prev: StreamingState) => {
            // Check if all streams are complete
            const updatedResponses: Record<string, ModelResponse> = {
              ...prev.responses,
              [modelId]: {
                ...prev.responses[modelId],
                isComplete: true,
              },
            };
            
            const allComplete = selectedModels.every(
              (m) => {
                const mId = (m as any).id || m.deploymentId;
                return updatedResponses[mId]?.isComplete === true;
              }
            );
            
            return {
              isStreaming: !allComplete,
              responses: updatedResponses,
            };
          });
          
          // Clean up abort controller
          delete abortControllersRef.current[modelId];
        },
        abortController.signal
      );
    });
  };
  
  const stopStreaming = () => {
    // Abort all ongoing requests
    Object.values(abortControllersRef.current).forEach((controller) => {
      controller.abort();
    });
    
    // Mark all as complete and stop streaming
    setStreamingState((prev: StreamingState) => {
      const updatedResponses = { ...prev.responses };
      Object.keys(updatedResponses).forEach((modelId) => {
        updatedResponses[modelId] = {
          ...updatedResponses[modelId],
          isComplete: true,
        };
      });
      
      return {
        isStreaming: false,
        responses: updatedResponses,
      };
    });
    
    // Clear controllers
    abortControllersRef.current = {};
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 tracking-tight">
            Azure OpenAI Model Comparator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Compare responses from multiple Azure OpenAI models side by side in real-time
          </p>
          <div className="mt-4 inline-block bg-blue-100 dark:bg-blue-900 rounded-full px-4 py-1">
            <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
              {selectedModels.length} {selectedModels.length === 1 ? 'Model' : 'Models'} Selected
            </span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Model Configuration</h2>
              </div>
              <div className="p-5">
                <ModelConfigForm />
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Selected Models</h2>
              </div>
              <div className="p-5">
                <ModelSelector />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Prompt Input</h2>
              </div>
              <div className="p-5">
                <PromptInput 
                  onSubmit={handlePromptSubmit}
                  isStreaming={streaming.isStreaming}
                  onStopStreaming={stopStreaming}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Model Responses</h2>
            {streaming.isStreaming && (
              <div className="flex items-center">
                <div className="animate-pulse mr-2 h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Streaming...</span>
              </div>
            )}
          </div>
          <div className="p-5">
            <ResponsePanel 
              responses={streaming.responses} 
              isStreaming={streaming.isStreaming}
            />
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Azure OpenAI Model Comparator</p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ModelProvider>
      <ComparisonApp />
    </ModelProvider>
  );
}
