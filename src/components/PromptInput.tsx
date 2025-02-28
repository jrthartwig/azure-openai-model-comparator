import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export default function PromptInput({ onSubmit, isStreaming, onStopStreaming }: PromptInputProps) {
  const [prompt, setPrompt] = useState<string>('');
  const { selectedModels } = useModelContext();
  const hasEnoughModels = selectedModels.length >= 2;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && hasEnoughModels) {
      onSubmit(prompt.trim());
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter your prompt
        </label>
        <div className="relative">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask the models a question or provide a task..."
            rows={5}
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm 
                     focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                     disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400
                     px-4 py-3 text-base resize-y"
          />
          {prompt.length > 0 && !isStreaming && (
            <button 
              type="button"
              onClick={() => setPrompt('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-end">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                     shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path d="M5.25 3A2.25 2.25 0 003 5.25v9.5A2.25 2.25 0 005.25 17h9.5A2.25 2.25 0 0017 14.75v-9.5A2.25 2.25 0 0014.75 3h-9.5z" />
            </svg>
            Stop Generation
          </button>
        ) : (
          <button
            type="submit"
            disabled={!prompt.trim() || !hasEnoughModels}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                     shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 
                     disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-1.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
            Send Prompt
          </button>
        )}
      </div>
    </form>
  );
}
