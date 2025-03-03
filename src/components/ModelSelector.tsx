import { useModelContext } from '../context/ModelContext';

export default function ModelSelector() {
  const { models, toggleModelSelection, removeModel, selectedModels } = useModelContext();

  if (models.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <p className="text-gray-500 dark:text-gray-400">No models added yet. Add a model to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Select Models to Compare</h2>
      
      <div className="space-y-3">
        {models.map(model => (
          <div key={model.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`model-${model.id}`}
                checked={model.selected}
                onChange={() => toggleModelSelection(model.id || '')}
                disabled={selectedModels.length >= 6 && !model.selected}
                className="mr-3 h-5 w-5 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor={`model-${model.id}`} className="text-gray-900 dark:text-white font-medium">
                {model.name || model.deploymentId}
              </label>
            </div>
            <button
                onClick={() => removeModel(model.id || '')}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                title="Remove model"
            >
              <span className="sr-only">Remove</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      {selectedModels.length >= 6 && (
        <div className="mt-3 text-sm text-amber-600 dark:text-amber-400">
          <p>Maximum of 6 models can be selected at once.</p>
        </div>
      )}
      
      {selectedModels.length === 0 && (
        <div className="mt-3 text-sm text-blue-600 dark:text-blue-400">
          <p>Select at least one model to begin comparison.</p>
        </div>
      )}
    </div>
  );
}
