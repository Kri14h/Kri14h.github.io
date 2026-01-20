import { TextBlock, ReadingMode } from '../types';

/**
 * Sorts text blocks based on the reading mode.
 * 
 * Logic:
 * Coordinates are 0-1000 scale.
 * 
 * [ymin, xmin, ymax, xmax]
 */
export const sortBlocks = (blocks: TextBlock[], mode: ReadingMode): TextBlock[] => {
  // Create a shallow copy to sort
  const sorted = [...blocks];

  sorted.sort((a, b) => {
    const boxA = a.box_2d;
    const boxB = b.box_2d;

    // Calculate centers
    const centerY_A = (boxA[0] + boxA[2]) / 2;
    const centerY_B = (boxB[0] + boxB[2]) / 2;
    const centerX_A = (boxA[1] + boxA[3]) / 2;
    const centerX_B = (boxB[1] + boxB[3]) / 2;

    const VERTICAL_TOLERANCE = 20; // units

    if (mode === ReadingMode.WEBTOON) {
      // Strictly Top-to-Bottom
      return centerY_A - centerY_B;
    } else {
      // Manga: Row-based, then Right-to-Left
      
      // Check if they are on the same "row" (similar Y)
      const diffY = centerY_A - centerY_B;
      
      if (Math.abs(diffY) < VERTICAL_TOLERANCE) {
        // Same row: Sort Right-to-Left (Descending X)
        // If B.x > A.x, B comes first
        return centerX_B - centerX_A;
      }
      
      // Different row: Sort Top-to-Bottom (Ascending Y)
      return diffY;
    }
  });

  // Re-assign order index based on the new sort
  return sorted.map((block, index) => ({
    ...block,
    order: index + 1
  }));
};