import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

/**
 * Full-screen image lightbox with:
 * - Previous / next navigation (buttons + swipe + keyboard)
 * - Pinch-to-zoom on mobile, scroll-wheel zoom on desktop
 * - Double-tap / double-click to toggle zoom
 * - Close with X button or Escape key
 */
export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const lastTap = useRef(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const src = images[index];

  // Reset zoom when changing image
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [index]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const goNext = useCallback(() => {
    if (index < images.length - 1) {
      setIndex(index + 1);
    }
  }, [index, images.length]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
    }
  }, [index]);

  function zoomIn() {
    setScale((s) => Math.min(s + 0.5, 5));
  }

  function zoomOut() {
    setScale((s) => {
      const next = Math.max(s - 0.5, 1);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function resetZoom() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  // Double-tap / double-click to toggle zoom
  function handleDoubleTap() {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  }

  // Wheel zoom
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (e.deltaY < 0) {
      setScale((s) => Math.min(s + 0.2, 5));
    } else {
      setScale((s) => {
        const next = Math.max(s - 0.2, 1);
        if (next === 1) setOffset({ x: 0, y: 0 });
        return next;
      });
    }
  }

  // Touch swipe for next/prev (only when not zoomed)
  const touchStart = useRef({ x: 0, y: 0, time: 0 });

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y };
      if (scale > 1) setDragging(true);
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1 && dragging && scale > 1) {
      const t = e.touches[0];
      const dx = t.clientX - dragStart.current.x;
      const dy = t.clientY - dragStart.current.y;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.changedTouches.length === 1 && !dragging) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const elapsed = Date.now() - touchStart.current.time;

      // Double-tap detection
      const now = Date.now();
      if (now - lastTap.current < 300 && Math.abs(dx) < 10) {
        handleDoubleTap();
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }

      // Swipe (only when not zoomed)
      if (scale === 1 && Math.abs(dx) > 50 && elapsed < 300) {
        if (dx < 0) goNext();
        else goPrev();
      }
    }
    setDragging(false);
  }

  // Mouse drag when zoomed
  function handleMouseDown(e: React.MouseEvent) {
    if (scale > 1) {
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (dragging && scale > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    }
  }

  function handleMouseUp() {
    setDragging(false);
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="بستن"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        <button
          onClick={zoomOut}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="کوچک‌نمایی"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="flex items-center rounded-full bg-white/10 px-3 text-xs text-white">
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={zoomIn}
          className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="بزرگ‌نمایی"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        {scale > 1 && (
          <button
            onClick={resetZoom}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="بازنشانی زوم"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Image counter */}
      <div className="absolute bottom-4 right-4 z-10 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
        {index + 1} / {images.length}
      </div>

      {/* Previous button */}
      {index > 0 && (
        <button
          onClick={goPrev}
          className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="تصویر قبلی"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Next button */}
      {index < images.length - 1 && (
        <button
          onClick={goNext}
          className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="تصویر بعدی"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Image */}
      <img
        ref={imgRef}
        src={src}
        alt={`تصویر ${index + 1}`}
        draggable={false}
        className="max-h-[85vh] max-w-[90vw] select-none object-contain transition-transform duration-150"
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
        }}
        onClick={(e) => {
          e.stopPropagation();
          const now = Date.now();
          if (now - lastTap.current < 300) {
            handleDoubleTap();
            lastTap.current = 0;
          } else {
            lastTap.current = now;
          }
        }}
        onDoubleClick={handleDoubleTap}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
