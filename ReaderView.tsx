import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Volume2, Settings2, Play, Pause, Loader2, Maximize2, Minimize2, ArrowLeft, BookOpen } from 'lucide-react';
import { ComicPageData, ReadingMode, TextBlock, AppSettings } from '../types';
import { analyzeComicPage } from '../services/geminiService';
import { blobToBase64 } from '../utils/fileUtils';
import { sortBlocks } from '../utils/textSorter';
import ComicPage from './ComicPage';

interface ReaderViewProps {
  initialPages: ComicPageData[];
  settings: AppSettings;
  onExit: () => void;
}

const ReaderView: React.FC<ReaderViewProps> = ({ initialPages, settings, onExit }) => {
  const [pages, setPages] = useState<ComicPageData[]>(initialPages);
  const [readingMode, setReadingMode] = useState<ReadingMode>(settings.defaultReadingMode);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Analysis Queue State
  const [analyzingPageIds, setAnalyzingPageIds] = useState<Set<string>>(new Set());

  // TTS & Navigation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // References
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pagesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSpokenBlockIdRef = useRef<string | null>(null);
  
  // Cleanup
  useEffect(() => {
    return () => {
      synthRef.current.cancel();
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // --- Logic: Analysis & Prefetching ---
  const triggerPageAnalysis = useCallback(async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page || page.analyzed) return;
    
    setAnalyzingPageIds(prev => {
      if (prev.has(page.id)) return prev;
      return new Set(prev).add(page.id);
    });

    try {
      const response = await fetch(page.imageUrl);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      const rawBlocks = await analyzeComicPage(base64);
      
      setPages(prev => prev.map(p => {
        if (p.id !== page.id) return p;
        return { ...p, analyzed: true, blocks: sortBlocks(rawBlocks, readingMode) };
      }));
    } catch (err) {
      console.error(`Analysis failed for page ${pageIndex}`, err);
    } finally {
      setAnalyzingPageIds(prev => {
        const next = new Set(prev);
        next.delete(page.id);
        return next;
      });
    }
  }, [pages, readingMode]);

  // Background Prefetcher
  useEffect(() => {
    if (pages.length === 0) return;
    const PREFETCH_COUNT = 3;
    for (let i = 0; i < PREFETCH_COUNT; i++) {
      const targetIndex = currentPageIndex + i;
      if (targetIndex < pages.length) {
         const page = pages[targetIndex];
         if (!page.analyzed && !analyzingPageIds.has(page.id)) {
            triggerPageAnalysis(targetIndex);
         }
      }
    }
  }, [currentPageIndex, pages, analyzingPageIds, triggerPageAnalysis]);


  // --- Logic: Scroll Tracking ---
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const pageId = entry.target.getAttribute('data-page-id');
        if (pageId) {
          const index = pages.findIndex(p => p.id === pageId);
          if (index !== -1) {
            setCurrentPageIndex(index);
          }
        }
      }
    });
  }, [pages]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, { root: null, rootMargin: '0px', threshold: 0.5 });
    pagesRef.current.forEach((el) => { if (el) observerRef.current?.observe(el); });
    return () => observerRef.current?.disconnect();
  }, [pages, readingMode, handleObserver]);


  // --- Logic: TTS & Fullscreen ---
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(console.error);
    }
  };

  const speakBlock = useCallback((text: string, onEnd: () => void) => {
    const cleanText = text.replace(/\n/g, ' ').trim();
    if (!cleanText) { onEnd(); return; }
    
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    
    // Apply Settings
    utterance.rate = settings.ttsRate;
    utterance.pitch = settings.ttsPitch;
    if (settings.ttsVoiceURI) {
       const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === settings.ttsVoiceURI);
       if (voice) utterance.voice = voice;
    }

    utterance.onend = () => { onEnd(); };
    utterance.onerror = (e) => { console.error("TTS Error", e); onEnd(); };
    synthRef.current.speak(utterance);
  }, [settings]);

  useEffect(() => {
    if (!isPlaying) {
      synthRef.current.cancel();
      setActiveBlockId(null);
      lastSpokenBlockIdRef.current = null;
      return;
    }

    const playNext = () => {
      if (!isPlaying) return;
      const page = pages[currentPageIndex];
      if (!page || !page.analyzed) {
         const checkAgain = setTimeout(playNext, 1000);
         return () => clearTimeout(checkAgain);
      }
      if (page.blocks.length === 0) {
          if (currentPageIndex < pages.length - 1) {
            const nextEl = pagesRef.current.get(pages[currentPageIndex + 1].id);
            nextEl?.scrollIntoView({ behavior: 'smooth' });
            setCurrentPageIndex(p => p + 1);
            setCurrentBlockIndex(0);
          } else {
            setIsPlaying(false);
          }
          return;
      }
      if (currentBlockIndex >= page.blocks.length) {
        if (currentPageIndex < pages.length - 1) {
          const nextEl = pagesRef.current.get(pages[currentPageIndex + 1].id);
          nextEl?.scrollIntoView({ behavior: 'smooth' });
          setCurrentPageIndex(p => p + 1);
          setCurrentBlockIndex(0);
        } else {
          setIsPlaying(false);
        }
        return;
      }

      const block = page.blocks[currentBlockIndex];
      if (lastSpokenBlockIdRef.current === block.id) return;
      
      lastSpokenBlockIdRef.current = block.id;
      setActiveBlockId(block.id);
      
      speakBlock(block.text, () => {
        if (isPlaying) setCurrentBlockIndex(prev => prev + 1);
      });
    };

    const timeout = setTimeout(playNext, 100);
    return () => clearTimeout(timeout);
  }, [isPlaying, currentPageIndex, currentBlockIndex, pages, speakBlock]);

  const togglePlay = () => {
    if (pages.length === 0) return;
    setIsPlaying(!isPlaying);
    lastSpokenBlockIdRef.current = null; 
  };

  const handleModeToggle = () => {
    const newMode = readingMode === ReadingMode.MANGA ? ReadingMode.WEBTOON : ReadingMode.MANGA;
    setReadingMode(newMode);
    setPages(prev => prev.map(p => 
      p.analyzed ? { ...p, blocks: sortBlocks(p.blocks, newMode) } : p
    ));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {!isFullScreen && (
        <header className="flex-shrink-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 shadow-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={onExit}>
              <ArrowLeft className="text-gray-400 w-5 h-5" />
              <div className="flex items-center gap-2">
                 <BookOpen className="text-indigo-500 w-5 h-5" />
                 <h1 className="font-bold text-lg tracking-tight hidden sm:block">ComiCast Web</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleModeToggle}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md border border-gray-700 transition-colors text-sm"
              >
                <Settings2 className="w-4 h-4" />
                <span className="hidden sm:inline">{readingMode === ReadingMode.MANGA ? 'Manga' : 'Webtoon'}</span>
              </button>
              
              <button onClick={toggleFullScreen} className="p-2 hover:bg-gray-700 rounded-md transition-colors">
                {isFullScreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 w-full h-full relative overflow-hidden bg-gray-950">
          <div 
             className={`w-full h-full scroll-smooth ${
               readingMode === ReadingMode.WEBTOON 
               ? "overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 space-y-4" 
               : "overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory"
             }`}
          >
            {pages.map((page, index) => (
              <div 
                key={page.id} 
                data-page-id={page.id}
                ref={(el) => { if (el) pagesRef.current.set(page.id, el); else pagesRef.current.delete(page.id); }}
                className={readingMode === ReadingMode.MANGA ? "h-full flex-shrink-0 w-full flex justify-center bg-black" : "w-full flex justify-center"}
              >
                 <ComicPage 
                    page={page}
                    activeBlockId={activeBlockId}
                    readingMode={readingMode}
                    isAnalyzing={analyzingPageIds.has(page.id)}
                    onAnalyzeClick={() => triggerPageAnalysis(index)}
                    onBlockClick={(block) => {
                      setIsPlaying(false);
                      lastSpokenBlockIdRef.current = null;
                      setTimeout(() => {
                        setCurrentPageIndex(index);
                        setCurrentBlockIndex(block.order ? block.order - 1 : 0);
                        setActiveBlockId(block.id);
                        setIsPlaying(true);
                      }, 50);
                    }}
                 />
              </div>
            ))}
          </div>
      </main>

      {/* FABs */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-4">
          {isFullScreen && (
            <button onClick={toggleFullScreen} className="w-10 h-10 rounded-full bg-gray-800/80 text-white flex items-center justify-center backdrop-blur shadow-lg">
              <Minimize2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={togglePlay} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-105 ${isPlaying ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
      </div>

      {isPlaying && (
          <div className="fixed bottom-8 left-8 z-50 bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-md border border-gray-700 text-xs flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-green-400 animate-pulse" />
            <span>Page {currentPageIndex + 1}</span>
          </div>
      )}
    </div>
  );
};

export default ReaderView;