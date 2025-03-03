import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';
import { ModelConfig } from '../types';

const ModelConfiguration = () => {
  const { models, addModel, removeModel, selectedModelIds, toggleModelSelection } = useModelContext();
  const [isExpanded, setIsExpanded] = useState(true);
  
  // State for new model form
  const [newModel, setNewModel] = useState<ModelConfig>({
    endpoint: '',
    apiKey: '',
    deploymentId: '',
    name: '',
    apiVersion: '2023-05-15',
    isPhiModel: false,
    isDeepseekModel: false,
  });
  
  // Form error state
  const [formError, setFormError] = useState<string | null>(null);
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Special handling for checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      // If this is a model type checkbox, ensure only one can be selected
      if (name === 'isPhiModel' && checked) {
        setNewModel(prev => ({ ...prev, [name]: checked, isDeepseekModel: false }));
      } else if (name === 'isDeepseekModel' && checked) {
        setNewModel(prev => ({ ...prev, [name]: checked, isPhiModel: false }));
      } else {
        setNewModel(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setNewModel(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Add a new model
  const handleAddModel = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newModel.endpoint || !newModel.apiKey || !newModel.deploymentId) {
      setFormError('Endpoint, API key, and deployment ID are required');
      return;
    }
    
    // Generate an ID if not present
    const modelWithId = {
      ...newModel,
      id: newModel.id || `model-${Date.now()}`,
      name: newModel.name || newModel.deploymentId,
      deploymentName: newModel.deploymentName || newModel.deploymentId // Ensure we always have deploymentName
    };
    
    // Add model to context
    addModel(modelWithId);
    
    // Reset form
    setNewModel({
      endpoint: '',
      apiKey: '',
      deploymentId: '',
      name: '',
      apiVersion: '2023-05-15',
      isPhiModel: false,
      isDeepseekModel: false,
    });
    
    // Clear any errors
    setFormError(null);
  };
  
  // Get appropriate model type label
  const getModelTypeLabel = (model: ModelConfig) => {
    if (model.isPhiModel) return 'Phi';
    if (model.isDeepseekModel) return 'DeepSeek';
    if ((model.deploymentId || '').toLowerCase().includes('o1')) return 'O1';
    return 'Standard';
  };
  
  // Get appropriate badge color class based on model type
  const getModelBadgeClass = (model: ModelConfig) => {
    if (model.isPhiModel) 
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    if (model.isDeepseekModel)
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if ((model.deploymentId || '').toLowerCase().includes('o1'))
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="font-semibold text-gray-900 dark:text-white">Model Configuration</h2>
        <svg className={`w-5 h-5 text-gray-500 transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {isExpanded && (
        <div className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Available Models</h3>
          
          {models.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">No models configured yet. Add a model to get started.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {models.map(model => (
                <div 
                  key={model.id} 
                  className={`p-3 rounded-md border ${
                    selectedModelIds.includes(model.id || '') 
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`model-${model.id}`}
                        checked={selectedModelIds.includes(model.id || '')}
                        onChange={() => toggleModelSelection(model.id || '')}
                        className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                      />
                      <label htmlFor={`model-${model.id}`} className="ml-2 font-medium text-gray-900 dark:text-white">
                        {model.name || model.deploymentId}
                      </label>
                    </div>
                    <div className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getModelBadgeClass(model)}`}>
                      {getModelTypeLabel(model)}
                    </div>
                    <button
                      onClick={() => removeModel(model.id || '')}
                      className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Add New Model</h3>
          
          <form onSubmit={handleAddModel} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                name="name"
                value={newModel.name}
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
                value={newModel.endpoint}
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
                value={newModel.apiKey}
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
                value={newModel.deploymentId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                placeholder="Your Azure OpenAI deployment ID"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  setNewModel(prev => ({ ...prev, isPhiModel: !prev.isPhiModel }));
                }}
                className={`px-3 py-1 border rounded-md ${
                  newModel.isPhiModel
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-100'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                Phi Model
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setNewModel(prev => ({ ...prev, isDeepseekModel: !prev.isDeepseekModel }));
                }}
                className={`px-3 py-1 border rounded-md ${
                  newModel.isDeepseekModel
                    ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-800 dark:text-blue-100'
                    : 'bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                DeepSeek Model
              </button>
            </div>
            
            {formError && (
              <p className="text-red-600 dark:text-red-400">{formError}</p>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newModel.endpoint || !newModel.apiKey || !newModel.deploymentId}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md ${
                  !newModel.endpoint || !newModel.apiKey || !newModel.deploymentId
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-700'
                }`}
              >
                Add Model
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ModelConfiguration;
