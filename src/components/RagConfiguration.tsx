import { useState } from 'react';
import { useRagContext } from '../context/RagContext';
import { RagConfig } from '../types';

export default function RagConfiguration() {
  const { ragConfig, setRagConfig, getRagStatus, isReady } = useRagContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempConfig, setTempConfig] = useState<RagConfig>({...ragConfig});
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = () => {
    setRagConfig(tempConfig);
    setIsEditing(false);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempConfig(prev => ({ ...prev, [name]: value }));
  };
  
  const status = getRagStatus();
  
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-4">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Retrieval Augmented Generation (RAG)</h2>
          {status === 'enabled' && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Enabled
            </span>
          )}
          {status === 'configured' && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Ready
            </span>
          )}
          {status === 'disabled' && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              Not Configured
            </span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Azure Cognitive Search Endpoint
                </label>
                <input
                  type="text"
                  name="indexEndpoint"
                  value={tempConfig.indexEndpoint}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="https://your-search-service.search.windows.net"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Index Name
                </label>
                <input
                  type="text"
                  name="indexName"
                  value={tempConfig.indexName}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="your-index-name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={tempConfig.apiKey}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="Your Azure Cognitive Search API key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Version
                </label>
                <input
                  type="text"
                  name="apiVersion"
                  value={tempConfig.apiVersion}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  placeholder="2023-11-01"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setTempConfig(ragConfig);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-blue-700 dark:text-blue-300 text-xs font-medium">Configuration Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400 text-xs mt-1">
                  <li>Simple search is enabled by default (no special setup required)</li>
                  <li>Your index should include fields named <code>content</code> or <code>text</code></li>
                  <li>Include a <code>title</code> field for better citations in responses</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              {isReady ? (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Configuration</h3>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Endpoint:</span>
                        <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{ragConfig.indexEndpoint}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Index:</span>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{ragConfig.indexName}</div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">API Key:</span>
                        <div className="text-sm text-gray-700 dark:text-gray-300">••••••••••••••••</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    RAG enables AI models to search through your documents to provide more accurate and contextually relevant answers.
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Configure RAG
                  </button>
                </div>
              )}
              
              {isReady && (
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragConfig.enabled}
                        onChange={() => setRagConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                        {ragConfig.enabled ? 'RAG Enabled' : 'RAG Disabled'}
                      </span>
                    </label>
                  </div>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p className="mb-1">When enabled, the model will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Search your documents for relevant information</li>
                  <li>Include that information in the prompt sent to the model</li>
                  <li>Generate a response based on both the prompt and document content</li>
                  <li>Cite document sources using [Document X] notation</li>
                </ul>
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-blue-700 dark:text-blue-300 text-xs font-medium mb-1">Search Options:</p>
                  <p className="text-blue-600 dark:text-blue-400 text-xs">
                    Using basic keyword search. For enhanced semantic search options, see the RAG_GUIDE.md file.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
