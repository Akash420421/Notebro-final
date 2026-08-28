import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Check,
  Undo2,
  Redo2,
  Trash2,
  Download,
  PenTool,
  Pencil,
  Highlighter,
  Eraser,
  Sparkles,
  Square,
  Circle as CircleIcon,
  Minus,
  MoveRight,
  Star,
  Grid3X3,
  Sliders,
  Maximize2,
  RotateCcw,
  Layers,
  Palette,
  Eye,
} from 'lucide-react';

interface SketchCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSketch: (dataUrl: string) => void;
  initialSketch?: string | null;
}

export type SketchTool =
  | 'pen'
  | 'brush'
  | 'highlighter'
  | 'pencil'
  | 'neon'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'star';

export type PaperStyle = 'white' | 'grid' | 'ruled' | 'dots' | 'yellow' | 'dark';

const COLOR_SWATCHES = [
  { name: 'Black', hex: '#1E1E1E' },
  { name: 'Dark Gray', hex: '#4B5563' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'White', hex: '#FFFFFF' },
];

const SIZE_PRESETS = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 5 },
  { label: 'Thick', size: 10 },
  { label: 'Bold', size: 18 },
  { label: 'Heavy', size: 28 },
];

export const SketchCanvasModal: React.FC<SketchCanvasModalProps> = ({
  isOpen,
  onClose,
  onSaveSketch,
  initialSketch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tool states
  const [tool, setTool] = useState<SketchTool>('pen');
  const [color, setColor] = useState<string>('#1E1E1E');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [opacity, setOpacity] = useState<number>(100);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('white');
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [showPaperMenu, setShowPaperMenu] = useState<boolean>(false);
  const [showShapeMenu, setShowShapeMenu] = useState<boolean>(false);

  // Drawing state refs (zero-lag synchronous tracking)
  const isDrawingRef = useRef<boolean>(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotBeforeShapeRef = useRef<ImageData | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Initialize Canvas
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear background
    ctx.fillStyle = paperStyle === 'dark' ? '#18181B' : paperStyle === 'yellow' ? '#FEFCE8' : '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (initialSketch) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        captureState();
      };
      img.src = initialSketch;
    } else {
      captureState();
    }
  }, [paperStyle, initialSketch]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(setupCanvas, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen, setupCanvas]);

  // Capture canvas state for undo/redo
  const captureState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, imgData];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const nextIdx = historyIndex - 1;
      ctx.putImageData(history[nextIdx], 0, 0);
      setHistoryIndex(nextIdx);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const nextIdx = historyIndex + 1;
      ctx.putImageData(history[nextIdx], 0, 0);
      setHistoryIndex(nextIdx);
    }
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear the entire sketch?')) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = paperStyle === 'dark' ? '#18181B' : paperStyle === 'yellow' ? '#FEFCE8' : '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      captureState();
    }
  };

  // Precise Coordinates helper
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  // Configure Context styles based on selected tool
  const configureContext = (ctx: CanvasRenderingContext2D) => {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const alphaVal = opacity / 100;

    switch (tool) {
      case 'eraser':
        ctx.strokeStyle = paperStyle === 'dark' ? '#18181B' : paperStyle === 'yellow' ? '#FEFCE8' : '#FFFFFF';
        ctx.lineWidth = brushSize * 4;
        ctx.globalAlpha = 1.0;
        break;

      case 'brush':
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 1.8;
        ctx.globalAlpha = Math.min(1.0, alphaVal * 0.9);
        break;

      case 'highlighter':
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize * 4.5;
        ctx.globalAlpha = Math.min(0.35, alphaVal * 0.35);
        break;

      case 'pencil':
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, brushSize * 0.7);
        ctx.globalAlpha = Math.min(0.65, alphaVal * 0.65);
        break;

      case 'neon':
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = alphaVal;
        ctx.shadowBlur = brushSize * 3;
        ctx.shadowColor = color;
        break;

      case 'line':
      case 'arrow':
      case 'rect':
      case 'circle':
      case 'star':
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = alphaVal;
        break;

      case 'pen':
      default:
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.globalAlpha = alphaVal;
        break;
    }
  };

  // Ultra-smooth Continuous Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    const pt = getCoordinates(e);
    isDrawingRef.current = true;
    startPointRef.current = pt;
    lastPointRef.current = pt;

    if (['line', 'arrow', 'rect', 'circle', 'star'].includes(tool)) {
      snapshotBeforeShapeRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
      configureContext(ctx);
      // Draw initial round dot immediately for tap / start of stroke
      const radius = Math.max(1, (ctx.lineWidth || brushSize) / 2);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentPt = getCoordinates(e);

    // Shapes preview drawing
    if (['line', 'arrow', 'rect', 'circle', 'star'].includes(tool)) {
      if (snapshotBeforeShapeRef.current) {
        ctx.putImageData(snapshotBeforeShapeRef.current, 0, 0);
      }
      if (startPointRef.current) {
        configureContext(ctx);
        drawShape(ctx, startPointRef.current, currentPt, tool);
      }
      return;
    }

    // Freehand drawing: continuously draw unbroken connected stroke
    if (lastPointRef.current) {
      configureContext(ctx);
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(currentPt.x, currentPt.y);
      ctx.stroke();
      lastPointRef.current = currentPt;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    const currentPt = getCoordinates(e);

    if (['line', 'arrow', 'rect', 'circle', 'star'].includes(tool)) {
      if (snapshotBeforeShapeRef.current) {
        ctx.putImageData(snapshotBeforeShapeRef.current, 0, 0);
      }
      if (startPointRef.current) {
        configureContext(ctx);
        drawShape(ctx, startPointRef.current, currentPt, tool);
      }
    }

    isDrawingRef.current = false;
    startPointRef.current = null;
    lastPointRef.current = null;
    snapshotBeforeShapeRef.current = null;
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
    captureState();
  };

  // Shape drawing helper
  const drawShape = (
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    shapeType: SketchTool
  ) => {
    ctx.beginPath();
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (shapeType === 'line') {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    } else if (shapeType === 'arrow') {
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(dy, dx);
      const headLen = Math.max(12, brushSize * 2.5);
      ctx.beginPath();
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(
        to.x - headLen * Math.cos(angle - Math.PI / 6),
        to.y - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(to.x, to.y);
      ctx.lineTo(
        to.x - headLen * Math.cos(angle + Math.PI / 6),
        to.y - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
    } else if (shapeType === 'rect') {
      ctx.strokeRect(from.x, from.y, dx, dy);
    } else if (shapeType === 'circle') {
      const radiusX = Math.abs(dx) / 2;
      const radiusY = Math.abs(dy) / 2;
      const centerX = from.x + dx / 2;
      const centerY = from.y + dy / 2;
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (shapeType === 'star') {
      const cx = from.x + dx / 2;
      const cy = from.y + dy / 2;
      const outerR = Math.max(Math.abs(dx), Math.abs(dy)) / 2;
      const innerR = outerR * 0.45;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerR;
        let y = cy + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerR;
        y = cy + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      ctx.stroke();
    }
  };

  // Save / Attach sketch
  const handleSaveAndAttach = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSketch(dataUrl);
    onClose();
  };

  // Export as PNG file
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `sketch-${Date.now()}.png`;
    a.click();
  };

  if (!isOpen) return null;

  // Background pattern CSS for canvas area
  const getPaperBackgroundStyle = () => {
    switch (paperStyle) {
      case 'grid':
        return 'bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px]';
      case 'ruled':
        return 'bg-white bg-[linear-gradient(to_bottom,#f3f4f6_1px,transparent_1px)] [background-size:100%_28px]';
      case 'dots':
        return 'bg-white bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] [background-size:24px_24px]';
      case 'yellow':
        return 'bg-amber-50/60 bg-[linear-gradient(to_bottom,#fde68a_1px,transparent_1px)] [background-size:100%_28px]';
      case 'dark':
        return 'bg-neutral-900 bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:20px_20px]';
      case 'white':
      default:
        return 'bg-white';
    }
  };

  const isShapeTool = ['line', 'arrow', 'rect', 'circle', 'star'].includes(tool);

  return (
    <div className="fixed inset-0 z-60 bg-neutral-950 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none">
      {/* 1. TOP APP BAR */}
      <div className="w-full px-3 sm:px-6 py-2.5 bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 flex items-center justify-between z-30 shrink-0 text-white">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2.5">
          <button
            id="sketch-studio-back-btn"
            onClick={onClose}
            className="p-2 -ml-1 rounded-full text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer flex items-center gap-1.5"
            title="Back to Note"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            <span className="text-xs font-semibold hidden sm:inline">Back</span>
          </button>

          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Sketch Studio
            </span>
            <span className="text-[10px] text-neutral-400 font-medium capitalize truncate max-w-[120px]">
              {tool} • {brushSize}px • {paperStyle}
            </span>
          </div>
        </div>

        {/* Center: Undo / Redo & Clear */}
        <div className="flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-2xl border border-neutral-700/60 shadow-inner">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-neutral-700 mx-1" />

          {/* Paper Background Style Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPaperMenu(!showPaperMenu);
                setShowShapeMenu(false);
              }}
              className={`p-1.5 rounded-xl transition cursor-pointer ${
                showPaperMenu ? 'bg-neutral-700 text-white' : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
              }`}
              title="Paper Background Style"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            {showPaperMenu && (
              <div className="absolute left-1/2 -translate-x-1/2 top-11 w-44 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-2 z-40 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
                  Paper Texture
                </div>
                {(
                  [
                    { id: 'white', name: 'Plain White' },
                    { id: 'grid', name: 'Grid / Math' },
                    { id: 'ruled', name: 'Ruled Lines' },
                    { id: 'dots', name: 'Dot Matrix' },
                    { id: 'yellow', name: 'Legal Yellow' },
                    { id: 'dark', name: 'Blackboard' },
                  ] as { id: PaperStyle; name: string }[]
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPaperStyle(p.id);
                      setShowPaperMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer ${
                      paperStyle === p.id ? 'bg-amber-500 text-black' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span>{p.name}</span>
                    {paperStyle === p.id && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download PNG */}
          <button
            onClick={handleExportPNG}
            className="p-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-700 transition cursor-pointer"
            title="Download PNG to device"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear Canvas */}
          <button
            onClick={handleClearCanvas}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Primary "Attach to Note" Action Button */}
        <div className="flex items-center gap-2">
          <button
            id="sketch-attach-btn"
            onClick={handleSaveAndAttach}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#5B86E5] hover:bg-[#4D78DE] text-white font-bold text-xs sm:text-sm rounded-full shadow-[0_4px_16px_rgba(91,134,229,0.3)] active:scale-95 transition cursor-pointer border border-[#D4E4FA]/40"
          >
            <Check className="w-4 h-4 stroke-[2.8]" />
            <span>Attach to Note</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN FULL-SCREEN DRAWING CANVAS */}
      <div
        ref={containerRef}
        className={`flex-1 relative w-full overflow-hidden flex items-center justify-center cursor-crosshair select-none ${getPaperBackgroundStyle()}`}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="touch-none w-full h-full block select-none"
        />
      </div>

      {/* 3. FLOATING TOOLBAR & CONTROLS AT BOTTOM */}
      <div className="w-full bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 p-2 sm:p-3 z-30 shrink-0 flex flex-col items-center gap-2">
        {/* Upper row: Tool Selectors */}
        <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-2">
          {/* Pen */}
          <button
            onClick={() => setTool('pen')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'pen'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>

          {/* Calligraphy Brush */}
          <button
            onClick={() => setTool('brush')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'brush'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Brush</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => setTool('highlighter')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'highlighter'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlighter</span>
          </button>

          {/* Pencil */}
          <button
            onClick={() => setTool('pencil')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'pencil'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Pencil</span>
          </button>

          {/* Neon Glow Pen */}
          <button
            onClick={() => setTool('neon')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'neon'
                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Neon</span>
          </button>

          {/* Geometric Shapes Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowShapeMenu(!showShapeMenu);
                setShowPaperMenu(false);
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isShapeTool
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Shapes</span>
            </button>

            {showShapeMenu && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl p-2 z-40 flex flex-col gap-1 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-0.5">
                  Draw Geometry
                </div>
                {[
                  { id: 'line', label: 'Straight Line', icon: Minus },
                  { id: 'arrow', label: 'Arrow Pointer', icon: MoveRight },
                  { id: 'rect', label: 'Rectangle / Box', icon: Square },
                  { id: 'circle', label: 'Circle / Ellipse', icon: CircleIcon },
                  { id: 'star', label: '5-Point Star', icon: Star },
                ].map((s) => {
                  const IconComp = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setTool(s.id as SketchTool);
                        setShowShapeMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                        tool === s.id ? 'bg-amber-400 text-black font-bold' : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Eraser */}
          <button
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tool === 'eraser'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Lower row: Color Swatches & Brush Sizes */}
        <div className="w-full max-w-2xl flex items-center justify-between gap-2 overflow-x-auto px-2 py-1 scrollbar-none">
          {/* Swatches */}
          <div className="flex items-center gap-1.5 shrink-0">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.name}
                onClick={() => {
                  setColor(swatch.hex);
                  if (tool === 'eraser') setTool('pen');
                }}
                style={{ backgroundColor: swatch.hex }}
                className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                  color === swatch.hex && tool !== 'eraser'
                    ? 'ring-2 ring-amber-400 scale-125 border-white'
                    : 'border-neutral-600/60 hover:scale-110'
                }`}
                title={swatch.name}
              />
            ))}

            {/* Custom Color input */}
            <label className="relative cursor-pointer shrink-0 ml-1">
              <input
                type="color"
                value={color}
                onChange={(e) => {
                  setColor(e.target.value);
                  if (tool === 'eraser') setTool('pen');
                }}
                className="opacity-0 w-6 h-6 absolute inset-0 cursor-pointer"
              />
              <div
                style={{ backgroundColor: color }}
                className="w-6 h-6 rounded-full border-2 border-dashed border-amber-400 flex items-center justify-center text-[10px] text-white font-bold"
                title="Custom Color"
              >
                +
              </div>
            </label>
          </div>

          {/* Brush Thickness Presets */}
          <div className="flex items-center gap-1.5 shrink-0 bg-neutral-800/80 px-2 py-1 rounded-xl border border-neutral-700/50">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setBrushSize(preset.size)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  brushSize === preset.size
                    ? 'bg-amber-400 text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {/* Size Slider */}
            <input
              type="range"
              min="1"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
              title={`Size: ${brushSize}px`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
