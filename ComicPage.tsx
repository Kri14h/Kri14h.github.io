import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { ComicPageData, TextBlock, ReadingMode } from '../types';
import TextOverlay from './TextOverlay';

interface ComicPageProps {
  page: ComicPageData;
  activeBlockId: string | null;
  readingMode: ReadingMode;
  isAnalyzing: boolean;
  onAnalyzeClick: () => void;
  onBlockClick: (block: TextBlock) => void;
}

const ComicPage: React.FC<ComicPageProps> = ({ 
  page, 
  activeBlockId, 
  readingMode,
  isAnalyzing,
  onAnalyzeClick,
  onBlockClick
}) => {
  
  // Dynamic styles based on reading mode
  // Webtoon: Width constrained, Height auto (Fill width)
  // Manga: Height constrained (to viewport usually), Width auto (Fit content)
  const imageClass = readingMode === ReadingMode.WEBTOON 
    ? "w-full h-auto object-contain" 
    : "h-full w-auto object-contain max-w-none"; // max-w-none is crucial for horizontal scrolling

  const containerClass = readingMode === ReadingMode.WEBTOON
    ? "relative w-full max-w-4xl mx-auto mb-8 bg-gray-900 shadow-2xl rounded-lg overflow-hidden min-h-[500px]"
    : "relative h-full flex-shrink-0 bg-gray-900 shadow-xl overflow-hidden snap-center flex items-center justify-center mx-1";

  return (
    <div className={containerClass} id={`page-${page.id}`}>
      {/* Image Layer */}
      <img 
        src={page.imageUrl} 
        alt={`Page ${page.filename}`}
        className={`block select-none ${imageClass}`}
        loading="lazy"
        draggable={false}
      />

      {/* Overlay Layer */}
      {page.analyzed && (
        <TextOverlay 
          blocks={page.blocks} 
          activeBlockId={activeBlockId}
          onBlockClick={onBlockClick}
        />
      )}

      {/* Analysis Trigger / Status */}
      {!page.analyzed && !isAnalyzing && (
         <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onAnalyzeClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full shadow-lg backdrop-blur-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Analyze</span>
            </button>
         </div>
      )}

      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
          <div className="bg-gray-800 text-white px-6 py-4 rounded-lg flex items-center gap-3 shadow-xl">
             <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
             <span className="font-medium">Detecting...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComicPage;