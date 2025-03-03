import { useState } from 'react';
import { streamCompletion } from './services/azureOpenAI';
import { ModelResponse } from './types';
import { ModelProvider, useModelContext } from './context/ModelContext';
import ModelConfiguration from './components/ModelConfiguration';
import PromptInput from './components/PromptInput';
import ResponsePanel from './components/ResponsePanel';

function AppContent() {
  const { models, selectedModelIds } = useModelContext();
  const [isStreaming, setIsStreaming] = useState(false);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  
  // AbortController instances for each model
  const [abortControllers, setAbortControllers] = useState<Record<string, AbortController>>({});
  
  const handleStopGeneration = () => {
    // Abort all ongoing requests
    Object.values(abortControllers).forEach(controller => controller.abort());
    setAbortControllers({});
    setIsStreaming(false);
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (selectedModelIds.length === 0) {
      alert("Please select at least one model.");
      return;
    }
    
    // Clear previous responses and set streaming state
    setResponses({});
    setIsStreaming(true);
    
    // Create new abort controllers for this batch of requests
    const newAbortControllers: Record<string, AbortController> = {};
    
    // Process each selected model
    const modelPromises = selectedModelIds.map(async (modelId) => {
      const model = models.find(m => m.id === modelId);
      if (!model) return;
      
      // Initialize empty response
      setResponses(prev => ({
        ...prev,
        [modelId]: { modelId, text: '', isComplete: false }
      }));
      
      // Create an AbortController for this request
      const controller = new AbortController();
      newAbortControllers[modelId] = controller;
      
      try {
        await streamCompletion(
          model,
          prompt,
          (text) => {
            // Append new text to the response
            setResponses(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                text: (prev[modelId]?.text || '') + text
              }
            }));
          },
          (error) => {
            // Handle errors
            console.error(`Error from model ${modelId}:`, error);
            setResponses(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                error: error.message,
                isComplete: true
              }
            }));
          },
          () => {
            // Mark as complete
            setResponses(prev => ({
              ...prev,
              [modelId]: {
                ...prev[modelId],
                isComplete: true
              }
            }));
            
            // Remove the controller
            delete newAbortControllers[modelId];
            setAbortControllers(prev => {
              const updated = { ...prev };
              delete updated[modelId];
              return updated;
            });
          },
          controller.signal
        );
      } catch (error) {
        console.error(`Failed to process model ${modelId}:`, error);
      }
    });
    
    // Update abort controllers
    setAbortControllers(newAbortControllers);
    
    // When all models have completed or errored
    await Promise.all(modelPromises);
    setIsStreaming(false);
  };

  return (
    <main className="container mx-auto p-4 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Azure OpenAI Model Comparator
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Compare responses from different Azure OpenAI models side by side
        </p>
      </header>
      
      <div className="mb-8">
        <ModelConfiguration />
      </div>
      
      <div className="mb-8">
        <PromptInput 
          onSubmit={handlePromptSubmit} 
          isStreaming={isStreaming}
          onStopGeneration={handleStopGeneration}
          isSubmitDisabled={selectedModelIds.length === 0}
          submitTooltip={selectedModelIds.length === 0 ? "Select at least one model" : ""}
        />
      </div>
      
      <div>
        <ResponsePanel responses={responses} isStreaming={isStreaming} />
      </div>
    </main>
  );
}

function App() {
  return (
    <ModelProvider>
      <AppContent />
    </ModelProvider>
  );
}

export default App;
