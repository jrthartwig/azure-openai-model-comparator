import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';
import { ModelConfig } from '../types';

// Initial model form state
const initialModelForm: ModelConfig = {
  name: '',
  endpoint: '',
  apiKey: '',
  deploymentId: ''
};

export default function ModelConfiguration() {
  const { models, addModel, updateModel, removeModel, toggleModelSelection, isModelSelected, selectedModelIds } = useModelContext();
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [modelForm, setModelForm] = useState<ModelConfig>(initialModelForm);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  const handleAddModel = () => {
    if (editingModelId) {
      // Update existing model
      updateModel(editingModelId, modelForm);
      setEditingModelId(null);
    } else {
      // Add new model
      addModel(modelForm);
    }
    
    // Reset form
    setModelForm(initialModelForm);
    setIsAddingModel(false);
  };

  const handleEditModel = (model: ModelConfig) => {
    setModelForm(model);
    setEditingModelId(model.id);
    setIsAddingModel(true);
  };

  const handleRemoveModel = (id: string) => {
    removeModel(id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setModelForm(prev => ({ ...prev, [name]: value }));
  };

  // Format model type badge
  const getModelBadge = (model: ModelConfig) => {
    const endpoint = model.endpoint.toLowerCase();
    const name = (model.name || '').toLowerCase();
    const deploymentId = (model.deploymentId || '').toLowerCase();
    
    if (name.includes('o1') || deploymentId.includes('o1')) {
      return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">O1</span>;
    } 
    
    if (endpoint.includes('phi') || name.includes('phi') || model.isPhiModel) {
      return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Phi</span>;
    }
    
    if (endpoint.includes('deepseek') || name.includes('deepseek') || model.isDeepseekModel) {
      return <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">DeepSeek</span>;
    }
    
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Model Configuration</h2>
        <button
          onClick={() => setIsAddingModel(!isAddingModel)}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          {isAddingModel ? 'Cancel' : 'Add Model'}
        </button>
      </div>

      {isAddingModel ? (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
          <h3 className="mb-3 text-gray-900 dark:text-white font-medium">
            {editingModelId ? 'Edit Model' : 'Add New Model'}
          </h3>
          
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="name"
                value={modelForm.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="e.g., GPT-4, O1-Preview, Phi-3, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Endpoint
              </label>
              <input
                type="text"
                name="endpoint"
                value={modelForm.endpoint}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="e.g., https://your-resource.openai.azure.com"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                For Phi models: https://phi-name.region.models.ai.azure.com
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                For DeepSeek models: https://DeepSeek-R1-name.region.models.ai.azure.com
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                name="apiKey"
                value={modelForm.apiKey}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Your Azure OpenAI API key"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deployment ID
              </label>
              <input
                type="text"
                name="deploymentId"
                value={modelForm.deploymentId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Your Azure OpenAI deployment ID"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setModelForm(prev => ({ ...prev, isPhiModel: !prev.isPhiModel }));
                }}
                className={`px-3 py-1 border rounded-md ${
                  modelForm.isPhiModel
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-100'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                Phi Model
              </button>
              
              <button
                onClick={() => {
                  setModelForm(prev => ({ ...prev, isDeepseekModel: !prev.isDeepseekModel }));
                }}
                className={`px-3 py-1 border rounded-md ${
                  modelForm.isDeepseekModel
                    ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                DeepSeek Model
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAddModel}
              disabled={!modelForm.endpoint || !modelForm.apiKey}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                !modelForm.endpoint || !modelForm.apiKey
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-blue-700'
              }`}
            >
              {editingModelId ? 'Update Model' : 'Add Model'}
            </button>
          </div>
        </div>
      ) : null}

      {models.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No models configured. Click "Add Model" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            <span>Model</span>
            <div className="flex space-x-4">
              <span>Select</span>
              <span>Actions</span>
            </div>
          </div>
          
          {models.map((model) => (
            <div 
              key={model.id} 
              className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white flex items-center">
                  {model.name || model.deploymentId}
                  {getModelBadge(model)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {model.endpoint}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <label 
                  className={`inline-flex items-center ${isModelSelected(model.id) ? 'text-blue-600' : 'text-gray-500'} cursor-pointer`}
                >
                  <input
                    type="checkbox"
                    checked={isModelSelected(model.id)}
                    onChange={() => toggleModelSelection(model.id)}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 border rounded flex items-center justify-center ${
                    isModelSelected(model.id) 
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isModelSelected(model.id) && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </span>
                </label>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEditModel(model)}
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => handleRemoveModel(model.id)}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <div>
          {models.length > 0 && (
            <span>
              {selectedModelIds.length} of {models.length} models selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
