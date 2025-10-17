"use client"

import React from 'react';
import { useModels, LanguageModel } from '../hooks/useModels';

interface ModelSelectorProps {
  selectedModel: LanguageModel | null;
  onModelChange: (model: LanguageModel | null) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onModelChange, disabled }) => {
  const { models, loading, error } = useModels();

  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = event.target.value;
    if (!selectedKey) {
      onModelChange(null);
      return;
    }
    const model = models.find(m => m.key === selectedKey) || null;
    onModelChange(model);
  };

  if (loading) {
    return <div className="text-sm text-gray-400">Loading models...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500">Error: {error}</div>;
  }

  if (models.length === 0) {
    return <div className="text-sm text-gray-500">No models available.</div>;
  }

  return (
    <div className="relative">
      <select
        value={selectedModel?.key || ''}
        onChange={handleSelectionChange}
        disabled={disabled}
        className="block w-full pl-3 pr-10 py-2 text-sm border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="">-- Select a Model --</option>
        {models.map((model) => (
          <option key={model.key} value={model.key}>
            {model.displayName} ({model.provider})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;
