import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';
import { ModelConfig } from '../types';

export default function ModelConfigForm() {
  const { addModel } = useModelContext();
  const [formData, setFormData] = useState<Omit<ModelConfig, 'id'>>({
    name: '',
    endpoint: '',
    apiKey: '',
    deploymentId: '', // Add required deploymentId field
    deploymentName: '',
    apiVersion: '2023-05-15', // Default API version
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.endpoint || !formData.apiKey || !formData.deploymentId) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Add model with formData and set it as selected
    addModel({
      ...formData,
      selected: true, // This is now properly defined in ModelConfig
    });
    
    // Reset form
    setFormData({
      name: '',
      endpoint: '',
      apiKey: '',
      deploymentId: '', // Reset deploymentId too
      deploymentName: '',
      apiVersion: '2023-05-15',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For deploymentId field, if it's empty and deploymentName has value, use that
    if (name === 'deploymentName' && !formData.deploymentId) {
      setFormData(prev => ({ ...prev, [name]: value, deploymentId: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add Model</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., GPT-4 Turbo"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">How the model will appear in the UI</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            API Endpoint <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="endpoint"
            value={formData.endpoint}
            onChange={handleChange}
            placeholder="e.g., https://your-resource.openai.azure.com"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            API Key <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="apiKey"
            value={formData.apiKey}
            onChange={handleChange}
            placeholder="Your Azure OpenAI API Key"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">
            Deployment ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="deploymentId"
            value={formData.deploymentId}
            onChange={handleChange}
            placeholder="Your Azure OpenAI Deployment ID"
            required
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Deployment Name (Optional)</label>
          <input
            type="text"
            name="deploymentName"
            value={formData.deploymentName}
            onChange={handleChange}
            placeholder="Your Azure OpenAI Deployment Name"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">If different from Deployment ID</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-1">API Version</label>
          <input
            type="text"
            name="apiVersion"
            value={formData.apiVersion}
            onChange={handleChange}
            placeholder="e.g., 2023-05-15"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-blue-500"
        >
          Add Model
        </button>
      </form>
    </div>
  );
}
