import React, { useState, useRef, useEffect, useCallback } from 'react';

export const defaultRooms = [
  {
    id: 'living-room',
    name: 'Modern Living Room',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 38,
    defaultWidth: 28,
  },
  {
    id: 'bedroom',
    name: 'Minimalist Bedroom',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 32,
    defaultWidth: 22,
  },
  {
    id: 'office',
    name: 'Cozy Office Lounge',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    defaultX: 50,
    defaultY: 30,
    defaultWidth: 24,
  }
];

const PRESETS = [
  { label: 'S', width: 18, title: 'Small (18%)' },
  { label: 'M', width: 28, title: 'Medium (28%)' },
  { label: 'L', width: 42, title: 'Large (42%)' },
  { label: 'XL', width: 55, title: 'Extra Large (55%)' }
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
  const [isHovered, setIsHovered] = useState(false);

  // Per-room position & size state map
  const [roomSettings, setRoomSettings] = useState(() => {
    const initial = {};
    defaultRooms.forEach(room => {
      initial[room.id] = {
        x: room.defaultX,
        y: room.defaultY,
        width: room.defaultWidth
      };
    });
    return initial;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const wallRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 50,
    startPosY: 38,
    wallWidth: 1,
    wallHeight: 1
  });

  const resizeRef = useRef({
    isResizing: false,
    handle: null,
    initialDistance: 1,
    initialWidth: 28,
    centerX: 0,
    centerY: 0
  });

  const currentRoom = defaultRooms[activeRoomIndex] || defaultRooms[0];
  const currentSettings = roomSettings[currentRoom.id] || {
    x: currentRoom.defaultX,
    y: currentRoom.defaultY,
    width: currentRoom.defaultWidth
  };

  // Reset current room settings
  const handleReset = useCallback(() => {
    setRoomSettings(prev => ({
      ...prev,
      [currentRoom.id]: {
        x: currentRoom.defaultX,
        y: currentRoom.defaultY,
        width: currentRoom.defaultWidth
      }
    }));
  }, [currentRoom]);

  // Adjust size directly
  const handleSizeChange = useCallback((newWidth) => {
    const clamped = Math.max(10, Math.min(75, Math.round(newWidth)));
    setRoomSettings(prev => ({
      ...prev,
      [currentRoom.id]: {
        ...(prev[currentRoom.id] || { x: currentRoom.defaultX, y: currentRoom.defaultY }),
        width: clamped
      }
    }));
  }, [currentRoom]);

  // Handle Drag Move (Pointer Events)
  const handleArtPointerDown = (e) => {
    if (e.button !== 0) return; // Only primary button
    if (!wallRef.current) return;

    e.preventDefault();
    const rect = wallRef.current.getBoundingClientRect();

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentSettings.x,
      startPosY: currentSettings.y,
      wallWidth: rect.width,
      wallHeight: rect.height
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleArtPointerMove = (e) => {
    if (!dragRef.current.isDragging) return;

    const { startX, startY, startPosX, startPosY, wallWidth, wallHeight } = dragRef.current;
    const deltaX = ((e.clientX - startX) / wallWidth) * 100;
    const deltaY = ((e.clientY - startY) / wallHeight) * 100;

    // Bounds clamping keeping art center visible inside wall (10% to 90%)
    const newX = Math.max(10, Math.min(90, startPosX + deltaX));
    const newY = Math.max(10, Math.min(90, startPosY + deltaY));

    setRoomSettings(prev => ({
      ...prev,
      [currentRoom.id]: {
        ...(prev[currentRoom.id] || { width: currentRoom.defaultWidth }),
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10
      }
    }));
  };

  const handleArtPointerUp = (e) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }
  };

  // Handle Corner Resizing (Pointer Events)
  const handleResizePointerDown = (e, handleName) => {
    if (e.button !== 0) return;
    e.stopPropagation(); // Do not trigger parent art drag
    if (!wallRef.current) return;

    const rect = wallRef.current.getBoundingClientRect();
    const centerX = rect.left + (currentSettings.x / 100) * rect.width;
    const centerY = rect.top + (currentSettings.y / 100) * rect.height;

    const initialDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);

    resizeRef.current = {
      isResizing: true,
      handle: handleName,
      initialDistance: Math.max(initialDistance, 10),
      initialWidth: currentSettings.width,
      centerX,
      centerY
    };

    setIsResizing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e) => {
    if (!resizeRef.current.isResizing) return;
    e.stopPropagation();

    const { initialDistance, initialWidth, centerX, centerY } = resizeRef.current;
    const currentDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY);

    const scaleFactor = currentDistance / initialDistance;
    const newWidth = initialWidth * scaleFactor;

    handleSizeChange(newWidth);
  };

  const handleResizePointerUp = (e) => {
    if (resizeRef.current.isResizing) {
      e.stopPropagation();
      resizeRef.current.isResizing = false;
      setIsResizing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
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
    ? 'border-[8px] md:border-[12px] border-gray-950 bg-white p-1 md:p-2.5 shadow-inner'
    : selectedFrame?.id === 'oak-frame'
    ? 'border-[8px] md:border-[12px] border-amber-800 bg-white p-1 md:p-2.5 shadow-inner'
    : selectedFrame?.id === 'white-frame'
    ? 'border-[8px] md:border-[12px] border-gray-100 bg-white p-1 md:p-2.5 shadow-inner'
    : selectedFrame?.id === 'wrap'
    ? 'border-[3px] border-amber-950/20 shadow-md'
    : 'border border-gray-300 shadow-sm';

  const showActiveOutline = showGuides && (isHovered || isDragging || isResizing);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Room Visualizer"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-5xl w-full flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl animate-fade-in my-auto">
        
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🖼️</span>
            <div>
              <h3 className="font-display font-semibold text-gray-900 dark:text-white text-base sm:text-lg leading-tight">
                Room Visualizer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Drag to reposition • Drag corners or slider to resize
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Guide overlay toggle */}
            <button
              onClick={() => setShowGuides(prev => !prev)}
              title={showGuides ? 'Hide adjustment handles' : 'Show adjustment handles'}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
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
              <span className="hidden sm:inline">{showGuides ? 'Guides On' : 'Guides Off'}</span>
            </button>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              title="Reset position and size to default"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Reset</span>
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

        {/* Room Wall Container */}
        <div 
          ref={wallRef}
          className="relative bg-gray-900 aspect-[16/9] w-full overflow-hidden select-none touch-none cursor-default"
        >
          {/* Background Room Photo */}
          <img
            src={currentRoom.image}
            alt={currentRoom.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Floating Helpful Hint Badge */}
          <div className="absolute top-3 left-3 pointer-events-none z-10 transition-opacity duration-300 opacity-80 hover:opacity-100">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/10 shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isDragging ? 'Moving artwork...' : isResizing ? 'Resizing artwork...' : 'Click & drag art to move'}
            </span>
          </div>

          {/* Interactive Artwork Element */}
          <div
            onPointerDown={handleArtPointerDown}
            onPointerMove={handleArtPointerMove}
            onPointerUp={handleArtPointerUp}
            onPointerCancel={handleArtPointerUp}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              top: `${currentSettings.y}%`,
              left: `${currentSettings.x}%`,
              width: `${currentSettings.width}%`,
              transform: 'translate(-50%, -50%)',
              boxShadow: isDragging 
                ? '0 35px 60px -15px rgba(0, 0, 0, 0.85), 0 0 0 2px rgba(59, 130, 246, 0.5)'
                : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              touchAction: 'none'
            }}
            className={`absolute z-20 transition-shadow duration-200 ${
              isDragging ? 'cursor-grabbing scale-[1.01]' : 'cursor-grab'
            }`}
          >
            {/* Framed Image Container */}
            <div className={`w-full h-full relative transition-all duration-300 ${frameClass}`}>
              <img
                src={artwork?.image}
                alt={artwork?.altText || artwork?.title}
                className="w-full h-auto object-cover pointer-events-none select-none block"
                draggable={false}
              />
            </div>

            {/* Selection Outlines & Corner Handles */}
            {showGuides && (
              <div 
                className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                  showActiveOutline ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Dashed visual bounding ring */}
                <div className="absolute -inset-1 border-2 border-dashed border-blue-500 rounded pointer-events-none" />

                {/* Corner Resize Handles */}
                {/* Top-Left (NW) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                  title="Drag to resize"
                  className="absolute -top-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>

                {/* Top-Right (NE) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                  title="Drag to resize"
                  className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>

                {/* Bottom-Left (SW) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                  title="Drag to resize"
                  className="absolute -bottom-2.5 -left-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nesw-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>

                {/* Bottom-Right (SE) */}
                <div
                  onPointerDown={(e) => handleResizePointerDown(e, 'se')}
                  onPointerMove={handleResizePointerMove}
                  onPointerUp={handleResizePointerUp}
                  onPointerCancel={handleResizePointerUp}
                  title="Drag to resize"
                  className="absolute -bottom-2.5 -right-2.5 w-5 h-5 bg-white border-2 border-blue-600 rounded-full shadow-md cursor-nwse-resize pointer-events-auto hover:scale-125 transition-transform flex items-center justify-center z-30"
                >
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                </div>

                {/* Quick size readout pill */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-2 py-0.5 rounded text-[10px] font-mono tracking-wider whitespace-nowrap shadow pointer-events-none">
                  Size: {Math.round(currentSettings.width)}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/70 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
          
          {/* Top row: Room Switcher & Framing */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Room Switcher */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 hidden md:inline">
                Room:
              </span>
              {defaultRooms.map((room, idx) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
              <div className="flex items-center gap-2 self-start sm:self-auto">
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
                  className="text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {framingOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bottom row: Size Adjustment Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/70 dark:border-gray-800">
            {/* Size Slider & Step Buttons */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1">
                <span>Art Size:</span>
                <span className="font-mono text-gray-900 dark:text-white font-semibold text-xs min-w-[2.5rem]">
                  {Math.round(currentSettings.width)}%
                </span>
              </span>

              {/* Step Down */}
              <button
                onClick={() => handleSizeChange(currentSettings.width - 3)}
                title="Decrease size"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold transition-colors"
              >
                -
              </button>

              {/* Range slider */}
              <input
                type="range"
                min="10"
                max="75"
                step="1"
                value={currentSettings.width}
                onChange={(e) => handleSizeChange(Number(e.target.value))}
                aria-label="Adjust artwork size in room"
                className="flex-1 accent-blue-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
              />

              {/* Step Up */}
              <button
                onClick={() => handleSizeChange(currentSettings.width + 3)}
                title="Increase size"
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold transition-colors"
              >
                +
              </button>
            </div>

            {/* Quick Size Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500 mr-1 hidden lg:inline">Presets:</span>
              {PRESETS.map(preset => {
                const isActive = Math.abs(currentSettings.width - preset.width) <= 2;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleSizeChange(preset.width)}
                    title={preset.title}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-400 dark:border-blue-700'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
  );
}
