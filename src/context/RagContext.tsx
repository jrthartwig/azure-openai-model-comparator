import React, { useState, createContext, useContext, ReactNode } from 'react';
import { RagConfig } from '../types';

interface RagContextProps {
  ragConfig: RagConfig;
  setRagConfig: React.Dispatch<React.SetStateAction<RagConfig>>;
  toggleRagEnabled: () => void;
  getRagStatus: () => 'configured' | 'enabled' | 'disabled';
  isReady: boolean;
}

const defaultRagConfig: RagConfig = {
  enabled: false,
  indexEndpoint: '',
  indexName: '',
  apiKey: '',
  apiVersion: '2023-11-01'
};

const RagContext = createContext<RagContextProps | undefined>(undefined);

export const useRagContext = () => {
  const context = useContext(RagContext);
  if (!context) {
    throw new Error('useRagContext must be used within a RagProvider');
  }
  return context;
};

interface RagProviderProps {
  children: ReactNode;
}

export const RagProvider: React.FC<RagProviderProps> = ({ children }) => {
  const [ragConfig, setRagConfig] = useState<RagConfig>(defaultRagConfig);

  // Toggle RAG enabled state
  const toggleRagEnabled = () => {
    setRagConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  // Check if RAG is ready to use (has all required config)
  const isReady = Boolean(
    ragConfig.indexEndpoint && 
    ragConfig.indexName && 
    ragConfig.apiKey
  );

  // Get current RAG status
  const getRagStatus = (): 'configured' | 'enabled' | 'disabled' => {
    if (!isReady) return 'disabled';
    return ragConfig.enabled ? 'enabled' : 'configured';
  };

  return (
    <RagContext.Provider value={{
      ragConfig,
      setRagConfig,
      toggleRagEnabled,
      getRagStatus,
      isReady
    }}>
      {children}
    </RagContext.Provider>
  );
};
