import React, { useState, useRef, useEffect } from 'react';
import { ComicPageData, AppSettings, DEFAULT_SETTINGS } from './types';
import { processComicFile } from './services/fileService';
import { loadSettings, saveSettings } from './utils/storage';
import HomeScreen from './components/HomeScreen';
import SettingsScreen from './components/SettingsScreen';
import ReaderView from './components/ReaderView';
import { Loader2 } from 'lucide-react';

enum Screen {
  HOME,
  READER,
  SETTINGS
}

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [pages, setPages] = useState<ComicPageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load settings on mount
  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
  }, []);

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const extractedPages = await processComicFile(file);
      setPages(extractedPages);
      setCurrentScreen(Screen.READER);
    } catch (e) {
      console.error("Failed to load comic", e);
      alert("Failed to load file. Ensure it is a valid .zip or .cbz");
    } finally {
      setIsLoading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
      {/* Hidden Global File Input */}
      <input 
        type="file" 
        accept=".cbz,.zip" 
        ref={fileInputRef} 
        className="hidden"
        onChange={handleFileChange}
      />

      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-2xl flex flex-col items-center shadow-2xl border border-gray-700">
             <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
             <p className="font-medium text-lg">Opening Comic...</p>
             <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      )}

      {currentScreen === Screen.HOME && (
        <HomeScreen 
          onOpenFile={triggerFilePicker} 
          onOpenSettings={() => setCurrentScreen(Screen.SETTINGS)} 
        />
      )}

      {currentScreen === Screen.SETTINGS && (
        <SettingsScreen 
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setCurrentScreen(Screen.HOME)}
        />
      )}

      {currentScreen === Screen.READER && (
        <ReaderView 
          initialPages={pages}
          settings={settings}
          onExit={() => {
            if(confirm("Close book and return to library?")) {
              setPages([]);
              setCurrentScreen(Screen.HOME);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;