import React from 'react';
import { TextBlock } from '../types';

interface TextOverlayProps {
  blocks: TextBlock[];
  activeBlockId: string | null;
  onBlockClick: (block: TextBlock) => void;
}

const TextOverlay: React.FC<TextOverlayProps> = ({ blocks, activeBlockId, onBlockClick }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {blocks.map((block) => {
        // box_2d is [ymin, xmin, ymax, xmax] in 0-1000 scale
        const top = block.box_2d[0] / 10; // %
        const left = block.box_2d[1] / 10; // %
        const height = (block.box_2d[2] - block.box_2d[0]) / 10; // %
        const width = (block.box_2d[3] - block.box_2d[1]) / 10; // %
        
        const isActive = activeBlockId === block.id;

        return (
          <div
            key={block.id}
            onClick={(e) => {
              e.stopPropagation(); // Prevent toggling controls if clicking a box
              onBlockClick(block);
            }}
            className={`absolute border-2 flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-200
              ${isActive ? 'border-green-400 bg-green-400/30 scale-105 z-10' : 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20'}
            `}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
          />
        );
      })}
    </div>
  );
};

export default TextOverlay;