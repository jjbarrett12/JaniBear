'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export interface SignaturePadProps {
  onSignatureChange?: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

export function SignaturePad({
  onSignatureChange,
  width = 400,
  height = 150,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasDrawn = useRef(false);

  const getPoint = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ('touches' in e) {
        const touch = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
        if (!touch) return null;
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const draw = useCallback(
    (point: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (lastPos.current) {
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      lastPos.current = point;
      hasDrawn.current = true;
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const point = getPoint(e);
      if (point) {
        lastPos.current = point;
        setIsDrawing(true);
      }
    },
    [getPoint]
  );

  const moveDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const point = getPoint(e);
      if (point) {
        draw(point);
      }
    },
    [isDrawing, getPoint, draw]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
    if (hasDrawn.current) {
      const dataUrl = canvasRef.current?.toDataURL('image/png') ?? null;
      onSignatureChange?.(dataUrl);
    }
  }, [onSignatureChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onSignatureChange?.(null);
  }, [onSignatureChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);


  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={moveDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={moveDrawing}
        onTouchEnd={stopDrawing}
        className="touch-none w-full max-w-full rounded-lg border-2 border-slate-200 bg-slate-50 cursor-crosshair"
        style={{ maxWidth: width }}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-sm text-slate-500 hover:text-slate-700 underline"
      >
        Clear
      </button>
    </div>
  );
}
