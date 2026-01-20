import JSZip from 'jszip';
import { ComicPageData } from '../types';

export const processComicFile = async (file: File): Promise<ComicPageData[]> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  const pages: ComicPageData[] = [];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // Filter and sort files (alphanumeric sort usually works for 001.jpg, 002.jpg)
  const fileNames = Object.keys(loadedZip.files).filter(name => {
    const lower = name.toLowerCase();
    return !loadedZip.files[name].dir && imageExtensions.some(ext => lower.endsWith(ext));
  }).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  for (const fileName of fileNames) {
    const fileData = await loadedZip.files[fileName].async('blob');
    const imageUrl = URL.createObjectURL(fileData);
    
    // Get dimensions (optional but good for canvas scaling later)
    const dimensions = await getImageDimensions(imageUrl);

    pages.push({
      id: fileName,
      filename: fileName,
      imageUrl,
      width: dimensions.width,
      height: dimensions.height,
      analyzed: false,
      blocks: []
    });
  }

  return pages;
};

const getImageDimensions = (url: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  });
};