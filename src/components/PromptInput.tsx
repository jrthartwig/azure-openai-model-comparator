import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  isSubmitDisabled?: boolean;
  submitTooltip?: string;
}

export default function PromptInput({ 
  onSubmit, 
  isStreaming,
  onStopGeneration,
  isSubmitDisabled = false,
  submitTooltip = ""
}: PromptInputProps) {
  const [prompt, setPrompt] = useState<string>('');
  const { selectedModelIds } = useModelContext();
  const hasEnoughModels = selectedModelIds.length >= 2;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isSubmitDisabled) {
      onSubmit(prompt.trim());
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">
        Prompt
      </label>
      
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder="Enter your prompt here..."
        rows={4}
        disabled={isStreaming}
      ></textarea>
      
      <div className="mt-4 flex justify-end">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopGeneration}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Stop Generation
          </button>
        ) : (
          <div className="relative">
            <button
              type="submit"
              className={`px-4 py-2 bg-blue-600 text-white rounded-md flex items-center ${
                isSubmitDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
              disabled={isSubmitDisabled || !prompt.trim()}
              data-tooltip-content={submitTooltip}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
              Send Prompt
            </button>
            {submitTooltip && isSubmitDisabled && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap">
                {submitTooltip}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-gray-800 border-x-4 border-x-transparent"></div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!hasEnoughModels && (
        <div className="text-amber-600 dark:text-amber-400 text-sm mt-2">
          Please select at least 2 models to compare
        </div>
      )}
    </form>
  );
}
