import { useState } from 'react';
import { useModelContext } from '../context/ModelContext';
import { ModelConfig } from '../types';

export default function ModelConfigForm() {
  const { addModel } = useModelContext();
  const [formData, setFormData] = useState<Omit<ModelConfig, 'id' | 'selected'>>({
    name: '',
    endpoint: '',
    apiKey: '',
    deploymentName: '',
    apiVersion: '2023-05-15', // Default API version
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addModel({
      id: crypto.randomUUID(),
      ...formData,
      selected: true,
    });
    
    // Reset form
    setFormData({
      name: '',
      endpoint: '',
      apiKey: '',
      deploymentName: '',
      apiVersion: '2023-05-15',
    });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Add Azure OpenAI Model</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Model Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="e.g., GPT-4"
            />
          </div>
          
          <div>
            <label className="block mb-1">Deployment Name</label>
            <input
              type="text"
              name="deploymentName"
              value={formData.deploymentName}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="Azure deployment name"
            />
          </div>
          
          <div>
            <label className="block mb-1">Endpoint URL</label>
            <input
              type="url"
              name="endpoint"
              value={formData.endpoint}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="https://your-resource.openai.azure.com"
            />
          </div>
          
          <div>
            <label className="block mb-1">API Key</label>
            <input
              type="password"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="Azure OpenAI API Key"
            />
          </div>
          
          <div>
            <label className="block mb-1">API Version</label>
            <input
              type="text"
              name="apiVersion"
              value={formData.apiVersion}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="e.g., 2023-05-15"
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Model
        </button>
      </form>
    </div>
  );
}
