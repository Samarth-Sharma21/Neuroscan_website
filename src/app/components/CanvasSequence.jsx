"use client";

import { useEffect, useRef, useCallback } from "react";

const TOTAL_FRAMES = 240;
const FRAME_PATH = "/brain-frames/frame_";

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
  const imagesRef = useRef([]);
  const loadedCountRef = useRef(0);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(null);
  const isReadyRef = useRef(false);

  // Draw a single frame on the canvas with object-fit: cover logic
  const drawFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete || !img.naturalWidth) return;

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

  // Preload images
  useEffect(() => {
    const images = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameSrc(i);
      img.onload = () => {
        loadedCountRef.current += 1;
        if (loadedCountRef.current === TOTAL_FRAMES) {
          isReadyRef.current = true;
          // Draw the first frame immediately
          drawFrame(0);
        }
      };
      images.push(img);
    }
    imagesRef.current = images;

    return () => {
      // Cleanup — no need to revoke since they're standard urls
    };
  }, [drawFrame]);

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

  return (
    <div className="canvas-layer">
      <canvas ref={canvasRef} />
      <div className="canvas-overlay" />
    </div>
  );
}
