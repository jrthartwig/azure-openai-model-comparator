import { useState } from 'react';
import { streamCompletion } from './services/azureOpenAI';
import { enhancePromptWithRag } from './services/ragService';
import { ModelResponse } from './types';
import { ModelProvider, useModelContext } from './context/ModelContext';
import { RagProvider, useRagContext } from './context/RagContext';
import ModelConfiguration from './components/ModelConfiguration';
import RagConfiguration from './components/RagConfiguration';
import PromptInput from './components/PromptInput';
import ResponsePanel from './components/ResponsePanel';

function AppContent() {
  const { models, selectedModelIds } = useModelContext();
  const { ragConfig, compareWithWithoutRag } = useRagContext();
  const [isStreaming, setIsStreaming] = useState(false);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  const [isRagSearching, setIsRagSearching] = useState(false);
  
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
    
    let enhancedPrompt = prompt;
    let enhancedPromptWithRag = prompt;
    
    // If RAG is enabled or we're comparing with/without RAG, get enhanced prompt
    if (ragConfig.enabled || compareWithWithoutRag) {
      try {
        setIsRagSearching(true);
        enhancedPromptWithRag = await enhancePromptWithRag(ragConfig, prompt);
        setIsRagSearching(false);
      } catch (error) {
        console.error('Error enhancing prompt with RAG:', error);
        setIsRagSearching(false);
        setIsStreaming(false);
        alert('Error with RAG search: ' + (error instanceof Error ? error.message : String(error)));
        return;
      }
    }
    
    // Create new abort controllers for this batch of requests
    const newAbortControllers: Record<string, AbortController> = {};
    
    // Determine which models and RAG combinations to process
    let modelsToProcess: Array<{
      modelId: string;
      useRag: boolean;
      responseId: string;
    }> = [];
    
    // Build the list of models and RAG combinations to process
    if (compareWithWithoutRag) {
      // For each selected model, we'll do both with and without RAG
      selectedModelIds.forEach(modelId => {
        modelsToProcess.push({ 
          modelId, 
          useRag: true, 
          responseId: `${modelId}-rag` 
        });
        modelsToProcess.push({ 
          modelId, 
          useRag: false, 
          responseId: `${modelId}-norag` 
        });
      });
    } else {
      // Just use selected models with current RAG setting
      selectedModelIds.forEach(modelId => {
        modelsToProcess.push({ 
          modelId, 
          useRag: ragConfig.enabled, 
          responseId: modelId 
        });
      });
    }
    
    // Process each model/RAG combination
    const modelPromises = modelsToProcess.map(async ({ modelId, useRag, responseId }) => {
      const model = models.find(m => m.id === modelId);
      if (!model) return;
      
      // Make sure we always pass the display name for the model
      const displayName = model.name || model.deploymentId || modelId;
      
      // Initialize empty response with clear model name
      setResponses(prev => ({
        ...prev,
        [responseId]: { 
          modelId, 
          text: '', 
          isComplete: false,
          useRag: useRag,
          modelName: displayName
        }
      }));
      
      // Create an AbortController for this request
      const controller = new AbortController();
      newAbortControllers[responseId] = controller;
      
      try {
        // Choose the appropriate prompt based on whether we're using RAG
        const promptToUse = useRag ? enhancedPromptWithRag : prompt;
        
        await streamCompletion(
          model,
          promptToUse,
          (text) => {
            // Append new text to the response
            setResponses(prev => ({
              ...prev,
              [responseId]: {
                ...prev[responseId],
                text: (prev[responseId]?.text || '') + text
              }
            }));
          },
          (error) => {
            // Handle errors
            console.error(`Error from model ${responseId}:`, error);
            setResponses(prev => ({
              ...prev,
              [responseId]: {
                ...prev[responseId],
                error: error.message,
                isComplete: true
              }
            }));
          },
          () => {
            // Mark as complete
            setResponses(prev => ({
              ...prev,
              [responseId]: {
                ...prev[responseId],
                isComplete: true
              }
            }));
            
            // Remove the controller
            delete newAbortControllers[responseId];
            setAbortControllers(prev => {
              const updated = { ...prev };
              delete updated[responseId];
              return updated;
            });
          },
          controller.signal
        );
      } catch (error) {
        console.error(`Failed to process model ${responseId}:`, error);
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
        <RagConfiguration />
      </div>
      
      <div className="mb-8">
        <PromptInput 
          onSubmit={handlePromptSubmit} 
          isStreaming={isStreaming || isRagSearching}
          onStopGeneration={handleStopGeneration}
          isSubmitDisabled={selectedModelIds.length === 0}
          submitTooltip={selectedModelIds.length === 0 ? "Select at least one model" : ""}
        />
        
        {isRagSearching && (
          <div className="mt-2 flex items-center text-amber-600 dark:text-amber-400">
            <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Searching documents...</span>
          </div>
        )}
        
        {ragConfig.enabled && !isRagSearching && !compareWithWithoutRag && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>RAG enabled - Responses will be augmented with document search</span>
          </div>
        )}
        
        {compareWithWithoutRag && !isRagSearching && (
          <div className="mt-2 text-sm text-purple-600 dark:text-purple-400 flex items-center">
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>RAG comparison mode - Each model will be tested both with and without RAG</span>
          </div>
        )}
      </div>
      
      <div>
        <ResponsePanel 
          responses={responses} 
          isStreaming={isStreaming} 
          compareWithWithoutRag={compareWithWithoutRag} 
        />
      </div>
    </main>
  );
}

function App() {
  return (
    <RagProvider>
      <ModelProvider>
        <AppContent />
      </ModelProvider>
    </RagProvider>
  );
}

export default App;
