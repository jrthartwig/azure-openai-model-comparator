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
      <div className="flex flex-col items-center justify-center w-full">
        {/* Centered Header */}
        <header className="w-full text-center py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-6 tracking-tight">
              Azure OpenAI Model Comparator
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Compare responses from multiple Azure OpenAI models side by side in real-time
            </p>
          </div>
        </header>

        {/* Main Content Container */}
        <div className="container max-w-7xl w-full px-4 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Left Side - Model Configuration */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-full">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Model Configuration</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Add Azure OpenAI models to compare
                  </p>
                </div>
                <div className="p-6">
                  <ModelConfigForm />
                </div>
              </div>
            </div>
            
            {/* Right Side - Model Selection & Prompt Input */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Selected Models</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Choose at least 2 models to compare
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 rounded-full px-4 py-1.5">
                    <span className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                      {selectedModels.length} {selectedModels.length === 1 ? 'Model' : 'Models'} Selected
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <ModelSelector />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Prompt Input</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter your prompt to generate responses
                  </p>
                </div>
                <div className="p-6">
                  <PromptInput 
                    onSubmit={handlePromptSubmit}
                    isStreaming={streaming.isStreaming}
                    onStopStreaming={stopStreaming}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Model Responses</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Compare outputs from different models
                </p>
              </div>
              {streaming.isStreaming && (
                <div className="flex items-center bg-green-100 dark:bg-green-900 rounded-full px-4 py-1.5">
                  <div className="animate-pulse mr-2 h-2.5 w-2.5 rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">Streaming...</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <ResponsePanel 
                responses={streaming.responses} 
                isStreaming={streaming.isStreaming}
              />
            </div>
          </div>
        </div>
          
        {/* Centered Footer */}
        <footer className="w-full text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
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
