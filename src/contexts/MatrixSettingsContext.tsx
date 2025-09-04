import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface MatrixSettings {
  // Global Controls
  globalSpeed: number;
  isPaused: boolean;
  showUI: boolean;
  
  // Matrix Rain Settings
  dropSpawnRate: number;
  trailLengthMin: number;
  trailLengthMax: number;
  speedVariationMin: number;
  speedVariationMax: number;
  characterChangeFreq: number;
  
  // Visual Effects
  glowIntensity: number;
  glowRadius: number;
  leadCharacterBrightness: number;
  fadeRate: number;
  backgroundOpacity: number;
  colorSaturation: number;
  
  // 3D Environment
  cameraMoveSpeed: number;
  particleDensity: number;
  wallTextureUpdateRate: number;
  lightingIntensity: number;
  fogIntensity: number;
  
  // Performance
  maxParticles: number;
  targetFPS: number;
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra';
  
  // Current Version
  currentVersion: number;
  show3D: boolean;
}

const defaultSettings: MatrixSettings = {
  // Global Controls
  globalSpeed: 0.3,
  isPaused: false,
  showUI: true,
  
  // Matrix Rain Settings
  dropSpawnRate: 1.0,
  trailLengthMin: 10,
  trailLengthMax: 30,
  speedVariationMin: 0.5,
  speedVariationMax: 2.0,
  characterChangeFreq: 1.0,
  
  // Visual Effects
  glowIntensity: 0.8,
  glowRadius: 3,
  leadCharacterBrightness: 1.5,
  fadeRate: 0.05,
  backgroundOpacity: 0.1,
  colorSaturation: 1.0,
  
  // 3D Environment
  cameraMoveSpeed: 0.5,
  particleDensity: 1.0,
  wallTextureUpdateRate: 0.8,
  lightingIntensity: 0.7,
  fogIntensity: 0.3,
  
  // Performance
  maxParticles: 1000,
  targetFPS: 60,
  qualityPreset: 'high',
  
  // Current Version
  currentVersion: 1,
  show3D: false,
};

const presets = {
  classic: {
    ...defaultSettings,
    globalSpeed: 0.8,
    dropSpawnRate: 0.6,
    glowIntensity: 0.5,
    fadeRate: 0.03,
  },
  intense: {
    ...defaultSettings,
    globalSpeed: 2.0,
    dropSpawnRate: 2.5,
    glowIntensity: 1.2,
    speedVariationMax: 3.0,
    fadeRate: 0.1,
  },
  zen: {
    ...defaultSettings,
    globalSpeed: 0.3,
    dropSpawnRate: 0.3,
    glowIntensity: 0.3,
    fadeRate: 0.01,
    backgroundOpacity: 0.05,
  },
  chaos: {
    ...defaultSettings,
    globalSpeed: 3.0,
    dropSpawnRate: 5.0,
    trailLengthMax: 50,
    speedVariationMax: 4.0,
    characterChangeFreq: 3.0,
    glowIntensity: 1.5,
  },
};

interface MatrixSettingsContextType {
  settings: MatrixSettings;
  updateSetting: <K extends keyof MatrixSettings>(key: K, value: MatrixSettings[K]) => void;
  loadPreset: (presetName: keyof typeof presets) => void;
  resetToDefaults: () => void;
  presets: typeof presets;
}

const MatrixSettingsContext = createContext<MatrixSettingsContextType | undefined>(undefined);

interface MatrixSettingsProviderProps {
  children: ReactNode;
}

export const MatrixSettingsProvider: React.FC<MatrixSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<MatrixSettings>(() => {
    const saved = localStorage.getItem('matrixSettings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('matrixSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof MatrixSettings>(key: K, value: MatrixSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const loadPreset = (presetName: keyof typeof presets) => {
    setSettings(presets[presetName]);
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <MatrixSettingsContext.Provider 
      value={{ 
        settings, 
        updateSetting, 
        loadPreset, 
        resetToDefaults,
        presets 
      }}
    >
      {children}
    </MatrixSettingsContext.Provider>
  );
};

export const useMatrixSettings = () => {
  const context = useContext(MatrixSettingsContext);
  if (context === undefined) {
    throw new Error('useMatrixSettings must be used within a MatrixSettingsProvider');
  }
  return context;
};