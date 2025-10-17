"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7210';

export interface LanguageModel {
  provider: string;
  key: string;
  displayName: string;
  available: boolean;
}

export function useModels() {
  const [models, setModels] = useState<LanguageModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchModels = useCallback(async () => {
    if (!token) {
        // Don't set loading to true if there's no token, just wait.
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${API_BASE}/api/models`, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setModels(data.filter(m => m.available));
      } else if (data) {
        setModels(data.available ? [data] : []);
      } else {
        setModels([]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return { models, loading, error, refetch: fetchModels };
}
