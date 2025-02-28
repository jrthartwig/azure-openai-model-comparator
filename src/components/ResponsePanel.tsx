import { useModelContext } from '../context/ModelContext';
import { ModelConfig, ModelResponse } from '../types';
import { useEffect, useRef } from 'react';

interface ResponsePanelProps {
  responses: Record<string, ModelResponse>;
  isStreaming: boolean;
}

export default function ResponsePanel({ responses, isStreaming }: ResponsePanelProps) {
  const { models } = useModelContext();
  const responsePanelsRef = useRef<Record<string, HTMLDivElement | null>>({});
  
  // Auto-scroll each response panel to the bottom when content updates
  useEffect(() => {
    Object.keys(responses).forEach((modelId) => {
      const panel = responsePanelsRef.current[modelId];
      if (panel) {
        panel.scrollTop = panel.scrollHeight;
      }
    });
  }, [responses]);

  // Find model name by id
  const getModelName = (modelId: string) => {
    // Find a model with matching id or deploymentId
    const model = models.find((m: ModelConfig) => {
      return ((m as any).id === modelId) || (m.deploymentId === modelId);
    });
    
    // Return the name if found, or the deploymentId, or the original modelId as fallback
    return model ? (model.name || model.deploymentId) : modelId;
  };
  
  // Check if the model is an O1 model (for special "Reasoning" status)
  const isO1Model = (modelId: string) => {
    const model = models.find((m: ModelConfig) => 
      ((m as any).id === modelId) || (m.deploymentId === modelId)
    );
    
    if (!model) return false;
    
    const name = (model.name || model.deploymentId || '').toLowerCase();
    const deploymentName = (model.deploymentName || model.deploymentId || '').toLowerCase();
    
    return name.includes('o1') || deploymentName.includes('o1');
  };
  
  const responseEntries = Object.entries(responses);
  
  if (responseEntries.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          No responses yet. Select models and submit a prompt to begin comparison.
        </p>
      </div>
    );
  }

  // Arrange responses in a grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {responseEntries.map(([modelId, response]) => (
        <div 
          key={modelId}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
        >
          <div className="p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">{getModelName(modelId)}</h3>
            {response.isComplete ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Complete
              </span>
            ) : isStreaming ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <span className="animate-pulse mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                {isO1Model(modelId) ? 'Reasoning' : 'Streaming'}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Idle
              </span>
            )}
          </div>
          
          <div 
            ref={(el) => (responsePanelsRef.current[modelId] = el)}
            className="p-5 overflow-auto flex-grow h-[400px] bg-white dark:bg-gray-800"
          >
            {response.error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                         className="w-5 h-5 text-red-600 dark:text-red-400">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                    <p className="mt-2 text-sm text-red-700 dark:text-red-200">{response.error}</p>
                  </div>
                </div>
              </div>
            ) : response.text ? (
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 text-sm">
                  {response.text}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                {isO1Model(modelId) ? (
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                           className="w-6 h-6 text-purple-600 dark:text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" 
                              d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    </div>
                    <p className="text-purple-700 dark:text-purple-400 font-medium">Reasoning...</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                      O1 models perform multi-step reasoning to generate comprehensive responses
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <svg className="animate-spin mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Waiting for response...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
