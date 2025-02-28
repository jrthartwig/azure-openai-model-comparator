import { createContext, useContext, useState, ReactNode } from 'react';
import { ModelConfig } from '../types';

interface ModelContextType {
  models: ModelConfig[];
  addModel: (model: ModelConfig) => void;
  updateModel: (id: string, updates: Partial<ModelConfig>) => void;
  removeModel: (id: string) => void;
  toggleModelSelection: (id: string) => void;
  selectedModels: ModelConfig[];
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelConfig[]>([]);

  const addModel = (model: ModelConfig) => {
    setModels((prevModels) => [...prevModels, model]);
  };

  const updateModel = (id: string, updates: Partial<ModelConfig>) => {
    setModels((prevModels) =>
      prevModels.map((model) => (model.id === id ? { ...model, ...updates } : model))
    );
  };

  const removeModel = (id: string) => {
    setModels((prevModels) => prevModels.filter((model) => model.id !== id));
  };

  const toggleModelSelection = (id: string) => {
    setModels((prevModels) =>
      prevModels.map((model) =>
        model.id === id ? { ...model, selected: !model.selected } : model
      )
    );
  };

  const selectedModels = models.filter((model) => model.selected);

  return (
    <ModelContext.Provider
      value={{ models, addModel, updateModel, removeModel, toggleModelSelection, selectedModels }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModelContext() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModelContext must be used within a ModelProvider');
  }
  return context;
}
