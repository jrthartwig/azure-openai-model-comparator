import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ModelConfig } from '../types';

interface ModelContextProps {
  models: ModelConfig[];
  selectedModelIds: string[];  // Keep this for backward compatibility
  selectedModels: ModelConfig[]; // Add this to fix the error
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, model: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  isModelSelected: (id: string) => boolean;
}

const ModelContext = createContext<ModelContextProps | undefined>(undefined);

export const useModelContext = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const [models, setModels] = useState<ModelConfig[]>([]);

  // Get only the selected models
  const selectedModels = models.filter(model => model.selected);
  
  // Get IDs of selected models
  const selectedModelIds = selectedModels.map(model => model.id || '').filter(id => id !== '');

  const addModel = (model: ModelConfig) => {
    // Generate an ID if not provided
    const modelWithId = {
      ...model,
      id: model.id || `model-${Date.now()}`,
      // If deploymentId is missing but deploymentName is present, set deploymentId to deploymentName
      deploymentId: model.deploymentId || model.deploymentName || '',
    };
    
    setModels(prev => [...prev, modelWithId]);
  };

  const updateModel = (id: string, updates: Partial<ModelConfig>) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === id ? { ...model, ...updates } : model
      )
    );
  };

  const removeModel = (id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  };

  const toggleModelSelection = (id: string) => {
    setModels(prev => prev.map(model => 
      model.id === id ? { ...model, selected: !model.selected } : model
    ));
  };

  const isModelSelected = (id: string) => {
    return selectedModelIds.includes(id);
  };

  return (
    <ModelContext.Provider value={{ 
      models, 
      selectedModelIds, 
      selectedModels,
      addModel, 
      updateModel,
      removeModel, 
      toggleModelSelection,
      isModelSelected
    }}>
      {children}
    </ModelContext.Provider>
  );
};
