import React from 'react';
import { BookOpen, Upload, Settings } from 'lucide-react';

interface HomeScreenProps {
  onOpenFile: () => void;
  onOpenSettings: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenFile, onOpenSettings }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-950 text-gray-100 relative overflow-hidden">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <div className="bg-indigo-600/20 p-6 rounded-3xl backdrop-blur-sm border border-indigo-500/30">
            <BookOpen className="w-16 h-16 text-indigo-400" />
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r from-indigo-200 to-purple-200 bg-clip-text text-transparent">
          My Library
        </h1>
        <p className="text-gray-400 mb-10">
          Your intelligent AI comic reader.
        </p>

        {/* Empty State / Main Actions */}
        <div className="space-y-4">
          <button
            onClick={onOpenFile}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xl shadow-indigo-900/20 font-semibold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Upload className="w-5 h-5" />
            Open Comic File
          </button>
          
          <button
            onClick={onOpenSettings}
            className="w-full py-4 bg-gray-800 hover:bg-gray-750 text-gray-300 rounded-xl font-medium flex items-center justify-center gap-3 transition-colors border border-gray-700"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>

        {/* Recent Files Mockup (Visual Only for now as web access is restricted) */}
        <div className="mt-12 text-left">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent</h3>
          <div className="space-y-2 opacity-50">
            <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/50 flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">IMG</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">No recent files</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;