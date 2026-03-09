import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'motion/react';

interface DraggableCardProps {
  children: React.ReactNode;
  className?: string;
  initialWidth?: string | number;
  initialHeight?: string | number;
  minWidth?: number;
  minHeight?: number;
  onClick?: (e: React.MouseEvent) => void;
  dragConstraints?: React.RefObject<Element>;
}

export default function DraggableCard({ 
  children, 
  className = "", 
  initialWidth = "100%", 
  initialHeight = "auto",
  minWidth = 200,
  minHeight = 150,
  onClick,
  dragConstraints
}: DraggableCardProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [size, setSize] = useState<{width: string | number, height: string | number}>({ width: initialWidth, height: initialHeight });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleNativeDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener('dragstart', handleNativeDragStart);
    }

    return () => {
      if (element) {
        element.removeEventListener('dragstart', handleNativeDragStart);
      }
    };
  }, []);

  const handleDragStart = () => {
    setIsGlitching(true);
    setTimeout(() => setIsGlitching(false), 300);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };

    const target = e.target as HTMLElement;
    // Allow text selection in inputs/textareas without dragging
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }
    
    dragControls.start(e);
  };

  const handleClick = (e: React.MouseEvent) => {
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) { // 5px threshold for drag vs click
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if the clicked element is "interactive"
    // We allow clicks if the target or any parent has 'card-action' class
    // OR if it's a native form element (input, button, etc)
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('.card-action') || 
                          target.tagName === 'INPUT' || 
                          target.tagName === 'BUTTON' || 
                          target.tagName === 'TEXTAREA' ||
                          target.tagName === 'A'; // Allow nested links to work normally

    if (!isInteractive) {
      e.preventDefault();
      // We don't stop propagation here to allow other non-navigation click handlers if needed,
      // but primarily we want to stop the parent <Link> or <a> from navigating.
    }

    if (onClick) {
      onClick(e);
    }
  };

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    // Capture initial state
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = containerRef.current?.offsetWidth || 0;
    const startHeight = containerRef.current?.offsetHeight || 0;

    const doDrag = (dragEvent: PointerEvent) => {
      // Calculate new dimensions
      const newWidth = Math.max(minWidth, startWidth + (dragEvent.clientX - startX));
      const newHeight = Math.max(minHeight, startHeight + (dragEvent.clientY - startY));
      
      setSize({ width: newWidth, height: newHeight });
    };

    const stopDrag = () => {
      setIsResizing(false);
      window.removeEventListener('pointermove', doDrag);
      window.removeEventListener('pointerup', stopDrag);
    };

    window.addEventListener('pointermove', doDrag);
    window.addEventListener('pointerup', stopDrag);
  };

  return (
    <motion.div
      ref={containerRef}
      drag={!isResizing}
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      dragConstraints={dragConstraints}
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
      whileDrag={{ scale: 1.02, zIndex: 50, cursor: 'grabbing' }}
      className={`relative group touch-none ${className} ${isGlitching ? 'glitch-effect' : ''}`}
      style={{ width: size.width, height: size.height }}
      onClick={handleClick}
    >
       {children}
       
       {/* Resize Handle */}
       <div 
         className="resize-handle opacity-0 group-hover:opacity-100 transition-opacity"
         onPointerDown={startResize}
       />
    </motion.div>
  );
}
