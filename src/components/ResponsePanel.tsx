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
  // IMPORTANT: This hook must be called unconditionally before any returns
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
      // Check for id property first (with type assertion) and fall back to deploymentId
      return ((m as any).id === modelId) || (m.deploymentId === modelId);
    });
    
    // Return the name if found, or the deploymentId, or the original modelId as fallback
    return model ? (model.name || model.deploymentId) : modelId;
  };
  
  const responseEntries = Object.entries(responses);
  
  if (responseEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
               className="w-8 h-8 text-gray-500 dark:text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">No responses yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Enter a prompt and click "Send Prompt" to generate responses from your selected models
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {responseEntries.map(([modelId, response]) => (
        <div 
          key={modelId}
          className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
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
                Streaming
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                Idle
              </span>
            )}
          </div>
          
          <div 
            ref={(el) => (responsePanelsRef.current[modelId] = el)}
            className="p-5 max-h-[500px] overflow-auto"
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
              <div className="flex items-center justify-center h-24 text-gray-500 dark:text-gray-400">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Waiting for response...
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
