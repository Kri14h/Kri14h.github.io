import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Mic, RefreshCw, Trash2, Layout } from 'lucide-react';
import { AppSettings, ReadingMode, DEFAULT_SETTINGS } from '../types';
import { clearCache } from '../utils/storage';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ settings, onUpdateSettings, onBack }) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      setVoices(avail.sort((a, b) => a.name.localeCompare(b.name)));
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleClearData = () => {
    if (confirm("Are you sure? This will reset your preferences.")) {
      clearCache();
      onUpdateSettings(DEFAULT_SETTINGS);
      alert("Settings reset.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 h-16 border-b border-gray-800 flex items-center px-4 bg-gray-900/90 backdrop-blur-md sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors mr-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-8">
        
        {/* Section 1: Audio */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-indigo-400">
            <Volume2 className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Audio & TTS</h2>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-6">
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Voice Model</label>
              <div className="relative">
                <select
                  value={settings.ttsVoiceURI || ''}
                  onChange={(e) => handleChange('ttsVoiceURI', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 appearance-none"
                >
                  <option value="">Default System Voice</option>
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                   <Mic className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Speed Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Speech Rate</label>
                <span className="text-sm font-mono text-indigo-400">{settings.ttsRate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.ttsRate}
                onChange={(e) => handleChange('ttsRate', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Pitch Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-400">Pitch</label>
                <span className="text-sm font-mono text-indigo-400">{settings.ttsPitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.ttsPitch}
                onChange={(e) => handleChange('ttsPitch', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Reader */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-purple-400">
            <Layout className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Reader Preferences</h2>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
             <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Default Reading Mode</h3>
                  <p className="text-xs text-gray-500">Sets the default layout for new files</p>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                   <button
                     onClick={() => handleChange('defaultReadingMode', ReadingMode.MANGA)}
                     className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                       settings.defaultReadingMode === ReadingMode.MANGA ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                     }`}
                   >
                     Manga
                   </button>
                   <button
                     onClick={() => handleChange('defaultReadingMode', ReadingMode.WEBTOON)}
                     className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                       settings.defaultReadingMode === ReadingMode.WEBTOON ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                     }`}
                   >
                     Webtoon
                   </button>
                </div>
             </div>
          </div>
        </section>

        {/* Section 3: Storage */}
        <section>
           <div className="flex items-center gap-2 mb-4 text-red-400">
            <Trash2 className="w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Storage & Data</h2>
          </div>
          
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="font-medium">Clear Application Data</h3>
                  <p className="text-xs text-gray-500">Resets settings and clears temporary caches.</p>
               </div>
               <button
                 onClick={handleClearData}
                 className="px-4 py-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 rounded-lg text-sm font-medium transition-colors"
               >
                 Clear Cache
               </button>
            </div>
          </div>
        </section>
        
        <div className="text-center text-xs text-gray-600 pt-8">
          ComiCast Web v1.0
        </div>
      </main>
    </div>
  );
};

export default SettingsScreen;