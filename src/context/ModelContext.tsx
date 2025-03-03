import React, { useState, createContext, useContext, ReactNode } from 'react';
import { ModelConfig } from '../types';

interface ModelContextProps {
  models: ModelConfig[];
  selectedModelIds: string[];
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
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);

  const addModel = (model: ModelConfig) => {
    // Generate a unique ID if not provided
    const newModel = { 
      ...model, 
      id: model.id || `model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
    };
    
    setModels(prevModels => [...prevModels, newModel]);
    return newModel.id;
  };

  const updateModel = (id: string, updates: Partial<ModelConfig>) => {
    setModels(prevModels => 
      prevModels.map(model => 
        model.id === id ? { ...model, ...updates } : model
      )
    );
  };

  const removeModel = (id: string) => {
    setModels(prevModels => prevModels.filter(model => model.id !== id));
    // Also remove from selection if selected
    setSelectedModelIds(prevSelected => prevSelected.filter(modelId => modelId !== id));
  };

  const toggleModelSelection = (id: string) => {
    setSelectedModelIds(prevSelected => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter(modelId => modelId !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const isModelSelected = (id: string) => {
    return selectedModelIds.includes(id);
  };

  return (
    <ModelContext.Provider value={{
      models,
      selectedModelIds,
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
