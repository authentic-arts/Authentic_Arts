import React, { useState, useRef, useEffect, useCallback } from 'react';

export const defaultRooms = [
  {
    id: 'living-room',
    name: 'Modern Living Room',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 38,
    defaultWidth: 28,
    defaultHeight: 38,
  },
  {
    id: 'bedroom',
    name: 'Minimalist Bedroom',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 32,
    defaultWidth: 22,
    defaultHeight: 30,
  },
  {
    id: 'office',
    name: 'Cozy Office Lounge',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 30,
    defaultWidth: 24,
    defaultHeight: 32,
  }
];

const SIZE_PRESETS = [
  { label: 'S', width: 18, height: 24, title: 'Small' },
  { label: 'M', width: 28, height: 38, title: 'Medium' },
  { label: 'L', width: 42, height: 56, title: 'Large' },
  { label: 'XL', width: 56, height: 72, title: 'Extra Large' }
];

const RATIO_PRESETS = [
  { label: '1:1', ratio: 1.0, title: 'Square (1:1)' },
  { label: '3:4', ratio: 3 / 4, title: 'Portrait (3:4)' },
  { label: '4:3', ratio: 4 / 3, title: 'Landscape (4:3)' },
  { label: '16:9', ratio: 16 / 9, title: 'Wide (16:9)' }
];

export default function RoomVisualizerModal({
  isOpen,
  onClose,
  artwork,
  framingOptions = [],
  selectedFrame,
  onSelectFrame
}) {
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);
  const [showGuides, setShowGuides] = useState(true);
  const [lockAspect, setLockAspect] = useState(true);
  const [activeTab, setActiveTab] = useState('size'); // 'size' | 'room'

  // Per-room position & size state map
  const [roomSettings, setRoomSettings] = useState(() => {
    const initial = {};
    defaultRooms.forEach(room => {
      initial[room.id] = {
        x: room.defaultX,
        y: room.defaultY,
        width: room.defaultWidth,
        height: room.defaultHeight
      };
    });
    return initial;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);

  const wallRef = useRef(null);
  const dragCleanupRef = useRef(null);
  const resizeCleanupRef = useRef(null);

  const currentRoom = defaultRooms[activeRoomIndex] || defaultRooms[0];
  const currentSettings = roomSettings[currentRoom.id] || {
    x: currentRoom.defaultX,
    y: currentRoom.defaultY,
    width: currentRoom.defaultWidth,
    height: currentRoom.defaultHeight
  };

  // Clean up any dangling window listeners on unmount
  useEffect(() => {
    return () => {
      if (dragCleanupRef.current) dragCleanupRef.current();
      if (resizeCleanupRef.current) resizeCleanupRef.current();
    };
  }, []);

  // Reset current room settings
  const handleReset = useCallback(() => {
    setRoomSettings(prev => ({
      ...prev,
      [currentRoom.id]: {
        x: currentRoom.defaultX,
        y: currentRoom.defaultY,
        width: currentRoom.defaultWidth,
        height: currentRoom.defaultHeight
      }
    }));
  }, [currentRoom]);

  // Adjust Width directly
  const handleWidthChange = useCallback((newWidth) => {
    const clampedWidth = Math.max(10, Math.min(85, Math.round(newWidth)));
    setRoomSettings(prev => {
      const current = prev[currentRoom.id] || {
        x: currentRoom.defaultX,
        y: currentRoom.defaultY,
        width: currentRoom.defaultWidth,
        height: currentRoom.defaultHeight
      };

      let newHeight = current.height;
      if (lockAspect) {
        const aspect = current.width / current.height;
        newHeight = Math.max(10, Math.min(85, Math.round(clampedWidth / aspect)));
      }

      return {
        ...prev,
        [currentRoom.id]: {
          ...current,
          width: clampedWidth,
          height: newHeight
        }
      };
    });
  }, [currentRoom, lockAspect]);

  // Adjust Height directly
  const handleHeightChange = useCallback((newHeight) => {
    const clampedHeight = Math.max(10, Math.min(85, Math.round(newHeight)));
    setRoomSettings(prev => {
      const current = prev[currentRoom.id] || {
        x: currentRoom.defaultX,
        y: currentRoom.defaultY,
        width: currentRoom.defaultWidth,
        height: currentRoom.defaultHeight
      };

      let newWidth = current.width;
      if (lockAspect) {
        const aspect = current.width / current.height;
        newWidth = Math.max(10, Math.min(85, Math.round(clampedHeight * aspect)));
      }

      return {
        ...prev,
        [currentRoom.id]: {
          ...current,
          width: newWidth,
          height: clampedHeight
        }
      };
    });
  }, [currentRoom, lockAspect]);

  // Apply Ratio Preset
  const handleApplyRatio = useCallback((ratio) => {
    setRoomSettings(prev => {
      const current = prev[currentRoom.id] || {
        x: currentRoom.defaultX,
        y: currentRoom.defaultY,
        width: currentRoom.defaultWidth,
        height: currentRoom.defaultHeight
      };
      // In a 16:9 wall container, wall aspect is 16/9 ≈ 1.778
      // visual aspect ratio on screen = (width% * 16) / (height% * 9) = ratio
      // => height% = width% * (16 / 9) / ratio
      const calculatedHeight = Math.max(10, Math.min(85, Math.round((current.width * (16 / 9)) / ratio)));
      return {
        ...prev,
        [currentRoom.id]: {
          ...current,
          height: calculatedHeight
        }
      };
    });
  }, [currentRoom]);

  // Handle Drag Move (Pointer Events with window listeners)
  const handleArtPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return; // Only primary button / touch
    if (!wallRef.current) return;

    e.preventDefault();
    const rect = wallRef.current.getBoundingClientRect();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = currentSettings.x;
    const startPosY = currentSettings.y;
    const wallWidth = rect.width || 1;
    const wallHeight = rect.height || 1;

    setIsDragging(true);

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = ((moveEvent.clientX - startX) / wallWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / wallHeight) * 100;

      const newX = Math.max(8, Math.min(92, startPosX + deltaX));
      const newY = Math.max(8, Math.min(92, startPosY + deltaY));

      setRoomSettings(prev => ({
        ...prev,
        [currentRoom.id]: {
          ...(prev[currentRoom.id] || {
            width: currentRoom.defaultWidth,
            height: currentRoom.defaultHeight
          }),
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10
        }
      }));
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dragCleanupRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    dragCleanupRef.current = onPointerUp;
  };

  // Handle Resizing (Corner & Edge Handles with window listeners)
  const handleResizePointerDown = (e, handleName) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    if (!wallRef.current) return;

    const rect = wallRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentSettings.width;
    const startHeight = currentSettings.height;
    const wallWidth = rect.width || 1;
    const wallHeight = rect.height || 1;
    const aspectRatio = startWidth / startHeight;

    setIsResizing(true);
    setActiveHandle(handleName);

    const onResizeMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = ((moveEvent.clientX - startX) / wallWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / wallHeight) * 100;

      let newWidth = startWidth;
      let newHeight = startHeight;

      // Handle specific edge / corner adjustments (centered transform)
      if (handleName === 'e') {
        newWidth = startWidth + 2 * deltaX;
        if (lockAspect) newHeight = newWidth / aspectRatio;
      } else if (handleName === 'w') {
        newWidth = startWidth - 2 * deltaX;
        if (lockAspect) newHeight = newWidth / aspectRatio;
      } else if (handleName === 's') {
        newHeight = startHeight + 2 * deltaY;
        if (lockAspect) newWidth = newHeight * aspectRatio;
      } else if (handleName === 'n') {
        newHeight = startHeight - 2 * deltaY;
        if (lockAspect) newWidth = newHeight * aspectRatio;
      } else if (handleName === 'se') {
        newWidth = startWidth + 2 * deltaX;
        newHeight = startHeight + 2 * deltaY;
        if (lockAspect) {
          const dominantScale = Math.max(newWidth / startWidth, newHeight / startHeight);
          newWidth = startWidth * dominantScale;
          newHeight = startHeight * dominantScale;
        }
      } else if (handleName === 'sw') {
        newWidth = startWidth - 2 * deltaX;
        newHeight = startHeight + 2 * deltaY;
        if (lockAspect) {
          const dominantScale = Math.max(newWidth / startWidth, newHeight / startHeight);
          newWidth = startWidth * dominantScale;
          newHeight = startHeight * dominantScale;
        }
      } else if (handleName === 'ne') {
        newWidth = startWidth + 2 * deltaX;
        newHeight = startHeight - 2 * deltaY;
        if (lockAspect) {
          const dominantScale = Math.max(newWidth / startWidth, newHeight / startHeight);
          newWidth = startWidth * dominantScale;
          newHeight = startHeight * dominantScale;
        }
      } else if (handleName === 'nw') {
        newWidth = startWidth - 2 * deltaX;
        newHeight = startHeight - 2 * deltaY;
        if (lockAspect) {
          const dominantScale = Math.max(newWidth / startWidth, newHeight / startHeight);
          newWidth = startWidth * dominantScale;
          newHeight = startHeight * dominantScale;
        }
      }

      // Clamp bounds
      const clampedWidth = Math.max(10, Math.min(85, Math.round(newWidth * 10) / 10));
      const clampedHeight = Math.max(10, Math.min(85, Math.round(newHeight * 10) / 10));

      setRoomSettings(prev => ({
        ...prev,
        [currentRoom.id]: {
          ...(prev[currentRoom.id] || { x: currentRoom.defaultX, y: currentRoom.defaultY }),
          width: clampedWidth,
          height: clampedHeight
        }
      }));
    };

    const onResizeUp = () => {
      setIsResizing(false);
      setActiveHandle(null);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', onResizeUp);
      window.removeEventListener('pointercancel', onResizeUp);
      resizeCleanupRef.current = null;
    };

    window.addEventListener('pointermove', onResizeMove, { passive: false });
    window.addEventListener('pointerup', onResizeUp);
    window.addEventListener('pointercancel', onResizeUp);

    resizeCleanupRef.current = onResizeUp;
  };

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const frameClass = selectedFrame?.id === 'black-frame'
    ? 'border-[6px] sm:border-[10px] md:border-[12px] border-gray-950 bg-white p-1 md:p-2 shadow-inner'
    : selectedFrame?.id === 'oak-frame'
    ? 'border-[6px] sm:border-[10px] md:border-[12px] border-amber-800 bg-white p-1 md:p-2 shadow-inner'
    : selectedFrame?.id === 'white-frame'
    ? 'border-[6px] sm:border-[10px] md:border-[12px] border-gray-100 bg-white p-1 md:p-2 shadow-inner'
    : selectedFrame?.id === 'wrap'
    ? 'border-[2px] sm:border-[3px] border-amber-950/20 shadow-md'
    : 'border border-gray-300 shadow-sm';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-1.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Room Visualizer"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in my-auto max-h-[96vh]">
        
        {/* Header */}
        <div className="px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/70 dark:bg-gray-900/70 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl">🖼️</span>
            <div>
              <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm sm:text-base leading-tight">
                Room Visualizer
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block">
                Drag to move • Drag sides for width/height or corners to scale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Guide overlay toggle */}
            <button
              onClick={() => setShowGuides(prev => !prev)}
              title={showGuides ? 'Hide adjustment handles' : 'Show adjustment handles'}
              className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
                showGuides 
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showGuides ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                )}
              </svg>
              <span>{showGuides ? 'Guides' : 'Preview'}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              title="Reset position and size to default"
              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Close Button */}
            <button 
              onClick={onClose} 
              aria-label="Close modal"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Room Wall Container (Touch enabled with touch-action: none) */}
        <div 
          ref={wallRef}
          className="relative bg-gray-950 aspect-[16/9] w-full overflow-hidden select-none cursor-default shrink"
          style={{ touchAction: 'none' }}
        >
          {/* Background Room Photo */}
          <img
            src={currentRoom.image}
            alt={currentRoom.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Floating Helpful Touch Hint */}
          <div className="absolute top-2 left-2 pointer-events-none z-10 transition-opacity duration-300 opacity-80 sm:opacity-90">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-black/70 backdrop-blur-md text-white border border-white/10 shadow">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isDragging ? 'Moving art...' : isResizing ? `Resizing (${activeHandle})...` : 'Touch & drag art to move'}
            </span>
          </div>

          {/* Interactive Artwork Element */}
          <div
            onPointerDown={handleArtPointerDown}
            style={{
              top: `${currentSettings.y}%`,
              left: `${currentSettings.x}%`,
              width: `${currentSettings.width}%`,
              height: `${currentSettings.height}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: isDragging 
                ? '0 30px 60px -12px rgba(0, 0, 0, 0.9), 0 0 0 2px rgba(59, 130, 246, 0.6)'
                : '0 20px 45px -10px rgba(0, 0, 0, 0.75)',
              touchAction: 'none'
            }}
            className={`absolute z-20 transition-shadow duration-150 ${
              isDragging ? 'cursor-grabbing scale-[1.01]' : 'cursor-grab'
            }`}
          >
            {/* Framed Image Container */}
            <div className={`w-full h-full relative overflow-hidden flex items-center justify-center ${frameClass}`}>
              <img
                src={artwork?.image}
                alt={artwork?.altText || artwork?.title}
                className="w-full h-full object-cover pointer-events-none select-none block"
                draggable={false}
              />
            </div>

            {/* Selection Outlines & Resize Handles */}
            {showGuides && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Dashed visual bounding ring */}
                <div className="absolute -inset-1 border-2 border-dashed border-blue-500/80 rounded pointer-events-none" />

                {/* ================= CORNER HANDLES (Dual-Axis) ================= */}
                {/* Top-Left (NW) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
                  style={{ touchAction: 'none' }}
                  title="Resize corner"
                  className="absolute -top-3.5 -left-3.5 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-nwse-resize pointer-events-auto z-30"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-blue-600 rounded-full shadow-md hover:scale-125 transition-transform" />
                </div>

                {/* Top-Right (NE) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
                  style={{ touchAction: 'none' }}
                  title="Resize corner"
                  className="absolute -top-3.5 -right-3.5 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-nesw-resize pointer-events-auto z-30"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-blue-600 rounded-full shadow-md hover:scale-125 transition-transform" />
                </div>

                {/* Bottom-Left (SW) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                  style={{ touchAction: 'none' }}
                  title="Resize corner"
                  className="absolute -bottom-3.5 -left-3.5 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-nesw-resize pointer-events-auto z-30"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-blue-600 rounded-full shadow-md hover:scale-125 transition-transform" />
                </div>

                {/* Bottom-Right (SE) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                  style={{ touchAction: 'none' }}
                  title="Resize corner"
                  className="absolute -bottom-3.5 -right-3.5 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center cursor-nwse-resize pointer-events-auto z-30"
                >
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border-2 border-blue-600 rounded-full shadow-md hover:scale-125 transition-transform" />
                </div>

                {/* ================= EDGE HANDLES (Single-Axis: Width & Height) ================= */}
                {/* Top Edge (N - Vertical Height) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'n')}
                  style={{ touchAction: 'none' }}
                  title="Resize Height (Vertical)"
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center cursor-ns-resize pointer-events-auto z-30"
                >
                  <div className="w-5 sm:w-6 h-2 bg-blue-600 rounded-full border border-white shadow-md hover:scale-110 transition-transform" />
                </div>

                {/* Bottom Edge (S - Vertical Height) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 's')}
                  style={{ touchAction: 'none' }}
                  title="Resize Height (Vertical)"
                  className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center cursor-ns-resize pointer-events-auto z-30"
                >
                  <div className="w-5 sm:w-6 h-2 bg-blue-600 rounded-full border border-white shadow-md hover:scale-110 transition-transform" />
                </div>

                {/* Left Edge (W - Horizontal Width) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'w')}
                  style={{ touchAction: 'none' }}
                  title="Resize Width (Horizontal)"
                  className="absolute top-1/2 -left-3.5 -translate-y-1/2 w-7 h-10 sm:w-8 sm:h-12 flex items-center justify-center cursor-ew-resize pointer-events-auto z-30"
                >
                  <div className="h-5 sm:h-6 w-2 bg-blue-600 rounded-full border border-white shadow-md hover:scale-110 transition-transform" />
                </div>

                {/* Right Edge (E - Horizontal Width) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'e')}
                  style={{ touchAction: 'none' }}
                  title="Resize Width (Horizontal)"
                  className="absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-10 sm:w-8 sm:h-12 flex items-center justify-center cursor-ew-resize pointer-events-auto z-30"
                >
                  <div className="h-5 sm:h-6 w-2 bg-blue-600 rounded-full border border-white shadow-md hover:scale-110 transition-transform" />
                </div>

                {/* Live Dimensions Readout Pill */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-mono tracking-wider whitespace-nowrap shadow pointer-events-none">
                  W: {Math.round(currentSettings.width)}% • H: {Math.round(currentSettings.height)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Tabs */}
        <div className="sm:hidden flex border-t border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/80">
          <button
            onClick={() => setActiveTab('size')}
            className={`flex-1 py-1.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'size'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-600 dark:text-gray-400'
            }`}
          >
            📏 Resize & Proportions
          </button>
          <button
            onClick={() => setActiveTab('room')}
            className={`flex-1 py-1.5 text-xs font-semibold text-center border-b-2 transition-colors ${
              activeTab === 'room'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-600 dark:text-gray-400'
            }`}
          >
            🏡 Room & Frame
          </button>
        </div>

        {/* Control Toolbar */}
        <div className="p-2.5 sm:p-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-2.5 sm:gap-3 shrink-0 overflow-y-auto max-h-[40vh]">
          
          {/* Row 1: Room Switcher & Framing (Visible on Desktop OR when 'room' tab is active on Mobile) */}
          <div className={`${activeTab === 'room' ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3`}>
            {/* Room Switcher */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 hidden md:inline">
                Room:
              </span>
              {defaultRooms.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeRoomIndex === idx
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Frame Selector */}
            {framingOptions.length > 0 && (
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <label htmlFor="modal-frame-select" className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  Framing:
                </label>
                <select
                  id="modal-frame-select"
                  value={selectedFrame?.id || framingOptions[0]?.id}
                  onChange={(e) => {
                    const found = framingOptions.find(o => o.id === e.target.value);
                    if (found && onSelectFrame) onSelectFrame(found);
                  }}
                  className="text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {framingOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Row 2: Dual-Axis Size Adjustment (Width & Height) */}
          <div className={`${activeTab === 'size' ? 'flex' : 'hidden'} sm:flex flex-col gap-2 pt-1 sm:pt-2 border-t sm:border-t border-gray-200/80 dark:border-gray-800`}>
            
            {/* Sliders Grid: Width and Height */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 items-center">
              
              {/* Horizontal Width Slider */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap flex items-center gap-1 w-20 sm:w-24">
                  <span>↔ Width:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {Math.round(currentSettings.width)}%
                  </span>
                </span>

                <button
                  onClick={() => handleWidthChange(currentSettings.width - 2)}
                  title="Decrease width"
                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold transition-colors"
                >
                  -
                </button>

                <input
                  type="range"
                  min="10"
                  max="85"
                  step="1"
                  value={currentSettings.width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  aria-label="Adjust artwork width"
                  className="flex-1 accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />

                <button
                  onClick={() => handleWidthChange(currentSettings.width + 2)}
                  title="Increase width"
                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold transition-colors"
                >
                  +
                </button>
              </div>

              {/* Vertical Height Slider + Aspect Ratio Lock Toggle */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap flex items-center gap-1 w-20 sm:w-24">
                  <span>↕ Height:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                    {Math.round(currentSettings.height)}%
                  </span>
                </span>

                <button
                  onClick={() => handleHeightChange(currentSettings.height - 2)}
                  title="Decrease height"
                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold transition-colors"
                >
                  -
                </button>

                <input
                  type="range"
                  min="10"
                  max="85"
                  step="1"
                  value={currentSettings.height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  aria-label="Adjust artwork height"
                  className="flex-1 accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />

                <button
                  onClick={() => handleHeightChange(currentSettings.height + 2)}
                  title="Increase height"
                  className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold transition-colors"
                >
                  +
                </button>

                {/* Aspect Ratio Lock Toggle */}
                <button
                  onClick={() => setLockAspect(prev => !prev)}
                  title={lockAspect ? 'Aspect Ratio Locked (Proportional)' : 'Aspect Ratio Unlocked (Free Resizing)'}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-colors ${
                    lockAspect
                      ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span>{lockAspect ? '🔗' : '🔓'}</span>
                  <span className="hidden sm:inline">{lockAspect ? 'Locked' : 'Free'}</span>
                </button>
              </div>

            </div>

            {/* Presets Row: Ratio Formats & Sizes */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
              {/* Aspect Ratio Presets */}
              <div className="flex items-center gap-1">
                <span className="text-gray-400 dark:text-gray-500 mr-0.5 text-[11px]">Format:</span>
                {RATIO_PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    onClick={() => handleApplyRatio(preset.ratio)}
                    title={preset.title}
                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Size Presets */}
              <div className="flex items-center gap-1">
                <span className="text-gray-400 dark:text-gray-500 mr-0.5 text-[11px]">Size:</span>
                {SIZE_PRESETS.map(preset => {
                  const isActive = Math.abs(currentSettings.width - preset.width) <= 3;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => {
                        setRoomSettings(prev => ({
                          ...prev,
                          [currentRoom.id]: {
                            ...(prev[currentRoom.id] || { x: currentRoom.defaultX, y: currentRoom.defaultY }),
                            width: preset.width,
                            height: preset.height
                          }
                        }));
                      }}
                      title={preset.title}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
