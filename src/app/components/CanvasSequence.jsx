"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const TOTAL_FRAMES = 240;
const FRAME_PATH = "/brain-frames/frame_";

/* ── Prioritized loading config ── */
// Load critical frames first (every Nth), then fill in the rest
const PRIORITY_STEP = 8;   // First pass: every 8th frame (30 frames)
const SECONDARY_STEP = 4;  // Second pass: every 4th frame gap fills
const BATCH_SIZE = 6;      // Concurrent requests per batch
const BATCH_DELAY = 30;    // ms between batches

function padNumber(num, size) {
  let s = String(num);
  while (s.length < size) s = "0" + s;
  return s;
}

function getFrameSrc(index) {
  return `${FRAME_PATH}${padNumber(index, 4)}.jpg`;
}

export default function CanvasSequence({ heroRef }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef(new Array(TOTAL_FRAMES).fill(null));
  const loadedSetRef = useRef(new Set());
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(null);
  const isReadyRef = useRef(false);
  const [loadProgress, setLoadProgress] = useState(0);

  // Draw a single frame on the canvas with object-fit: cover logic
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || !img.naturalWidth) {
      // Find nearest loaded frame as fallback
      let nearest = null;
      let minDist = Infinity;
      for (const idx of loadedSetRef.current) {
        const dist = Math.abs(idx - frameIndex);
        if (dist < minDist) {
          minDist = dist;
          nearest = idx;
        }
      }
      if (nearest !== null) {
        const fallbackImg = imagesRef.current[nearest];
        if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth) {
          drawImageOnCanvas(canvas, fallbackImg);
        }
      }
      return;
    }

    drawImageOnCanvas(canvas, img);
  }, []);

  // Core canvas rendering — extracted for reuse
  const drawImageOnCanvas = useCallback((canvas, img) => {
    const ctx = canvas.getContext("2d", { alpha: false });
    const dpr = window.devicePixelRatio || 1;
    const displayW = window.innerWidth;
    const displayH = window.innerHeight;

    // Only resize if needed
    if (canvas.width !== displayW * dpr || canvas.height !== displayH * dpr) {
      canvas.width = displayW * dpr;
      canvas.height = displayH * dpr;
      canvas.style.width = displayW + "px";
      canvas.style.height = displayH + "px";
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // object-fit: cover calculation
    const scale = Math.max(displayW / img.naturalWidth, displayH / img.naturalHeight);
    const x = (displayW - img.naturalWidth * scale) / 2;
    const y = (displayH - img.naturalHeight * scale) / 2;

    ctx.drawImage(
      img,
      x,
      y,
      img.naturalWidth * scale,
      img.naturalHeight * scale
    );

    ctx.restore();
  }, []);

  // Scroll handler — compute progress, pick frame, draw
  const onScroll = useCallback(() => {
    if (!heroRef.current || !isReadyRef.current) return;

    const hero = heroRef.current;
    const scrollStart = hero.offsetTop;
    const scrollEnd = scrollStart + hero.offsetHeight - window.innerHeight;
    const raw = (window.scrollY - scrollStart) / (scrollEnd - scrollStart);
    const progress = Math.min(Math.max(raw, 0), 1);
    const frameIndex = Math.min(
      Math.floor(progress * (TOTAL_FRAMES - 1)),
      TOTAL_FRAMES - 1
    );

    if (frameIndex !== currentFrameRef.current) {
      currentFrameRef.current = frameIndex;
      drawFrame(frameIndex);
    }
  }, [heroRef, drawFrame]);

  // RAF-wrapped scroll listener
  const rafScroll = useCallback(() => {
    onScroll();
    rafIdRef.current = requestAnimationFrame(rafScroll);
  }, [onScroll]);

  // Load a single image and return a promise
  const loadImage = useCallback((frameNum) => {
    return new Promise((resolve) => {
      const idx = frameNum - 1; // 0-indexed
      if (imagesRef.current[idx] && loadedSetRef.current.has(idx)) {
        resolve();
        return;
      }
      const img = new Image();
      img.decoding = "async";
      img.src = getFrameSrc(frameNum);
      img.onload = () => {
        imagesRef.current[idx] = img;
        loadedSetRef.current.add(idx);
        setLoadProgress(loadedSetRef.current.size);

        // Show first frame as soon as it loads
        if (idx === 0 && !isReadyRef.current) {
          isReadyRef.current = true;
          drawFrame(0);
        }
        // After first priority batch, enable scroll
        if (loadedSetRef.current.size >= Math.floor(TOTAL_FRAMES / PRIORITY_STEP) && !isReadyRef.current) {
          isReadyRef.current = true;
          drawFrame(0);
        }
        resolve();
      };
      img.onerror = () => resolve(); // Skip broken frames
    });
  }, [drawFrame]);

  // Load frames in batches with priority ordering
  const loadAllFrames = useCallback(async () => {
    // Phase 1: Load frame #1 immediately for instant display
    await loadImage(1);
    isReadyRef.current = true;
    drawFrame(0);

    // Phase 2: Priority frames (every Nth) for smooth skeleton playback
    const priorityFrames = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += PRIORITY_STEP) {
      if (i !== 1) priorityFrames.push(i); // Skip #1, already loaded
    }

    for (let b = 0; b < priorityFrames.length; b += BATCH_SIZE) {
      const batch = priorityFrames.slice(b, b + BATCH_SIZE);
      await Promise.all(batch.map(loadImage));
      if (b > 0) await new Promise(r => setTimeout(r, BATCH_DELAY));
    }

    // Phase 3: Secondary frames (fill gaps)
    const secondaryFrames = [];
    for (let i = 1; i <= TOTAL_FRAMES; i += SECONDARY_STEP) {
      if (!loadedSetRef.current.has(i - 1)) secondaryFrames.push(i);
    }

    for (let b = 0; b < secondaryFrames.length; b += BATCH_SIZE) {
      const batch = secondaryFrames.slice(b, b + BATCH_SIZE);
      await Promise.all(batch.map(loadImage));
      if (b > 0) await new Promise(r => setTimeout(r, BATCH_DELAY));
    }

    // Phase 4: Remaining frames
    const remaining = [];
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      if (!loadedSetRef.current.has(i - 1)) remaining.push(i);
    }

    for (let b = 0; b < remaining.length; b += BATCH_SIZE) {
      const batch = remaining.slice(b, b + BATCH_SIZE);
      await Promise.all(batch.map(loadImage));
      if (b > 0) await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }, [loadImage, drawFrame]);

  // Kick off progressive loading
  useEffect(() => {
    loadAllFrames();
  }, [loadAllFrames]);

  // Start the RAF loop
  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(rafScroll);

    // Handle resize
    const onResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", onResize);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [rafScroll, drawFrame]);

  const pct = Math.round((loadProgress / TOTAL_FRAMES) * 100);

  return (
    <div className="canvas-layer">
      <canvas ref={canvasRef} />
      <div className="canvas-overlay" />
      {/* Subtle loading indicator — only shows while loading */}
      {pct < 100 && pct > 0 && (
        <div
          className="canvas-load-bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            opacity: pct > 95 ? 0 : 0.7,
            transition: 'opacity 0.5s',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              height: 3,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
