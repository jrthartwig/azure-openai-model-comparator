import { useModelContext } from '../context/ModelContext';
import { ModelConfig, ModelResponse } from '../types';
import { useEffect, useRef } from 'react';
import { detectModelType } from '../services/azureOpenAI';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
        // Only auto-scroll if user is already at or near the bottom
        const isAtBottom = 
          panel.scrollHeight - panel.clientHeight - panel.scrollTop < 100;
          
        if (isAtBottom) {
          panel.scrollTop = panel.scrollHeight;
        }
      }
    });
  }, [responses]);

  // Find model by id
  const getModel = (modelId: string): ModelConfig | undefined => {
    return models.find((m: ModelConfig) => 
      ((m as any).id === modelId) || (m.deploymentId === modelId)
    );
  };

  // Find model name by id
  const getModelName = (modelId: string) => {
    const model = getModel(modelId);
    return model ? (model.name || model.deploymentId) : modelId;
  };
  
  // Get the model type (o1, phi, or standard)
  const getModelType = (modelId: string) => {
    const model = getModel(modelId);
    return model ? detectModelType(model) : 'standard';
  };
  
  // Get loading state text by model type
  const getLoadingStateText = (modelType: string) => {
    switch(modelType) {
      case 'o1':
        return 'Reasoning';
      case 'phi':
        return 'Processing';
      case 'deepseek':
        return 'Streaming';
      default:
        return 'Streaming';
    }
  };
  
  // Get loading state icon for each model type
  const getLoadingStateIcon = (modelType: string) => {
    if (modelType === 'deepseek') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
             className="w-6 h-6 text-blue-600 dark:text-blue-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
           className="w-6 h-6 text-blue-600 dark:text-blue-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  };
  
  // Get loading state message for each model type
  const getLoadingStateMessage = (modelType: string) => {
    switch(modelType) {
      case 'o1':
        return 'O1 models perform multi-step reasoning to generate comprehensive responses';
      case 'phi':
        return 'Phi models combine efficiency with strong reasoning capabilities';
      case 'deepseek':
        return 'DeepSeek is streaming its response in real-time';
      default:
        return 'Waiting for response...';
    }
  };
  
  const responseEntries = Object.entries(responses);
  
  if (responseEntries.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 dark:text-gray-400">
          No responses yet. Select a model and submit a prompt to begin.
        </p>
      </div>
    );
  }

  // Code highlighting component with both light and dark mode support
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';
    
    return !inline ? (
      <div className="rounded-md overflow-hidden my-4">
        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 text-xs font-semibold text-gray-900 dark:text-gray-200 rounded-t-md border border-b-0 border-gray-200 dark:border-gray-700">
          {language === 'text' ? 'Code' : language}
        </div>
        <SyntaxHighlighter
          language={language}
          style={{
            light: oneLight,
            dark: vscDarkPlus,
          }[document.documentElement.classList.contains('dark') ? 'dark' : 'light']}
          className="rounded-b-md !mt-0 !mb-0"
          customStyle={{
            margin: 0,
            borderBottomLeftRadius: '0.375rem',
            borderBottomRightRadius: '0.375rem'
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5 text-gray-800 dark:text-gray-200 text-sm font-mono">
        {children}
      </code>
    );
  };

  // Arrange responses in a grid layout
  const gridColsClass = responseEntries.length === 1 
    ? "grid-cols-1" 
    : "grid-cols-1 md:grid-cols-2";

  return (
    <div className={`grid ${gridColsClass} gap-6`}>
      {responseEntries.map(([modelId, response]) => {
        const modelType = getModelType(modelId);
        
        return (
          <div 
            key={modelId}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
          >
            <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center
                           ${modelType === 'o1' ? 'bg-purple-50 dark:bg-purple-900/20' : 
                             modelType === 'phi' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                             'bg-gray-100 dark:bg-gray-800'}`}
            >
              <div className="flex items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">{getModelName(modelId)}</h3>
                {modelType === 'phi' && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    Phi
                  </span>
                )}
                {modelType === 'o1' && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    O1
                  </span>
                )}
              </div>
              
              {response.isComplete ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Complete
                </span>
              ) : isStreaming ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                ${modelType === 'o1' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                                  modelType === 'phi' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 
                                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
                >
                  <span className="animate-pulse mr-1.5 h-1.5 w-1.5 rounded-full bg-current"></span>
                  {getLoadingStateText(modelType)}
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
                <div className="prose dark:prose-invert max-w-none prose-pre:!p-0 prose-img:rounded prose-img:mx-auto">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]} 
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      code: CodeBlock,
                      pre: ({ node, ...props }) => <div {...props} />,
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6">
                          <table className="border-collapse border border-gray-200 dark:border-gray-700" {...props} />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th className="border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border border-gray-200 dark:border-gray-700 p-2" {...props} />
                      ),
                    }}
                  >
                    {response.text}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  {modelType === 'o1' ? (
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
                  ) : modelType === 'phi' ? (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                             className="w-6 h-6 text-emerald-600 dark:text-emerald-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                      </div>
                      <p className="text-emerald-700 dark:text-emerald-400 font-medium">Processing...</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                        Phi models combine efficiency with strong reasoning capabilities
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <svg className="animate-spin mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {getLoadingStateMessage(modelType)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
