import { useModelContext } from '../context/ModelContext';

export default function ModelSelector() {
  const { models, toggleModelSelection, removeModel, selectedModels } = useModelContext();
  
  return (
    <div className="p-4 bg-white rounded shadow mb-4">
      <h2 className="text-xl font-bold mb-2">Select Models to Compare ({selectedModels.length}/6)</h2>
      
      {models.length === 0 ? (
        <p className="text-gray-500">No models configured. Please add a model first.</p>
      ) : (
        <div className="space-y-2">
          {models.map((model) => (
            <div key={model.id} className="flex items-center justify-between border p-2 rounded">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`model-${model.id}`}
                  checked={model.selected}
                  onChange={() => toggleModelSelection(model.id)}
                  disabled={selectedModels.length >= 6 && !model.selected}
                  className="mr-2"
                />
                <label htmlFor={`model-${model.id}`} className="mr-4">{model.name}</label>
                <span className="text-xs text-gray-500">{model.deploymentName}</span>
              </div>
              
              <button 
                onClick={() => removeModel(model.id)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      
      {selectedModels.length > 1 && selectedModels.length <= 6 ? (
        <div className="mt-2 text-green-600">
          {selectedModels.length} models selected for comparison
        </div>
      ) : selectedModels.length > 6 ? (
        <div className="mt-2 text-red-600">
          Maximum 6 models can be compared at once
        </div>
      ) : (
        <div className="mt-2 text-yellow-600">
          Select at least 2 models to compare
        </div>
      )}
    </div>
  );
}
