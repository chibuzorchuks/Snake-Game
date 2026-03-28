/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Trophy, Gamepad2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Constants & Types ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 150;

type Point = { x: number; y: number };

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  color: string;
}

const DUMMY_TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Dreams",
    artist: "SynthWave AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "bg-neon-pink"
  },
  {
    id: 2,
    title: "Cyber Pulse",
    artist: "Digital Ghost",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "bg-neon-blue"
  },
  {
    id: 3,
    title: "Midnight Drive",
    artist: "Retro Future",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "bg-neon-purple"
  }
];

export default function App() {
  // --- Snake Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  const gameCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- Music Player State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = DUMMY_TRACKS[currentTrackIndex];

  // --- Snake Game Logic ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (isGameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Check collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setIsGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, isGameOver, isPaused, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
        case ' ': setIsPaused(p => !p); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  useEffect(() => {
    const canvas = gameCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#18181b'; // zinc-900
    ctx.lineWidth = 0.5;
    const cellSize = canvas.width / GRID_SIZE;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ffff' : '#ff00ff'; // neon-blue head, neon-pink body
      ctx.shadowBlur = 10;
      ctx.shadowColor = index === 0 ? '#00ffff' : '#ff00ff';
      ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
      ctx.shadowBlur = 0;
    });

    // Draw food
    ctx.fillStyle = '#39ff14'; // neon-green
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#39ff14';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

  }, [snake, food]);

  // --- Music Player Logic ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = currentTrackIndex + (dir === 'next' ? 1 : -1);
    if (nextIndex >= DUMMY_TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = DUMMY_TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
  }, [currentTrackIndex, isPlaying]);

  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 font-orbitron selection:bg-neon-pink selection:text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-neon-pink flex items-center justify-center glow-pink">
            <Music className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 
              className="text-3xl font-black tracking-tighter text-glow-pink glitch" 
              data-text="NEON SNAKE & BEATS"
            >
              NEON SNAKE & BEATS
            </h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Retro-Future Arcade // v2.0</p>
          </div>
        </div>

        <div className="flex gap-12">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Current Score</p>
            <p 
              className="text-4xl font-black text-neon-blue text-glow-blue glitch" 
              data-text={score.toString().padStart(4, '0')}
            >
              {score.toString().padStart(4, '0')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">High Score</p>
            <p 
              className="text-4xl font-black text-neon-green glitch" 
              data-text={highScore.toString().padStart(4, '0')}
            >
              {highScore.toString().padStart(4, '0')}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-neon-pink/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-blue/10 blur-[120px] rounded-full animate-pulse delay-700" />

        <div className="relative group">
          {/* Game Canvas Container */}
          <div className="relative rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-900 shadow-2xl transition-all duration-500 group-hover:border-neon-blue/50">
            <canvas
              ref={gameCanvasRef}
              width={400}
              height={400}
              className="block cursor-none"
            />

            {/* Game Over Overlay */}
            <AnimatePresence>
              {isGameOver && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <Trophy className="w-20 h-20 text-neon-green mb-6 drop-shadow-[0_0_20px_#39ff14]" />
                  <h2 
                    className="text-6xl font-black text-white mb-4 tracking-tighter glitch" 
                    data-text="GAME OVER"
                  >
                    GAME OVER
                  </h2>
                  <p className="text-zinc-400 text-lg mb-10">Final Score: <span className="text-neon-blue font-bold">{score}</span></p>
                  <button
                    onClick={resetGame}
                    className="px-12 py-4 bg-neon-pink text-white font-black rounded-full glow-pink hover:scale-105 transition-transform active:scale-95 tracking-widest"
                  >
                    RESTART ARCADE
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pause Overlay */}
            <AnimatePresence>
              {isPaused && !isGameOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-zinc-950/60 flex flex-col items-center justify-center backdrop-blur-[2px]"
                >
                  <Gamepad2 className="w-20 h-20 text-neon-blue mb-6 animate-pulse" />
                  <h2 
                    className="text-5xl font-black text-white mb-8 tracking-widest glitch" 
                    data-text="PAUSED"
                  >
                    PAUSED
                  </h2>
                  <button
                    onClick={() => setIsPaused(false)}
                    className="px-12 py-4 border-2 border-neon-blue text-neon-blue font-black rounded-full hover:bg-neon-blue hover:text-black transition-all tracking-widest"
                  >
                    RESUME
                  </button>
                  <p className="mt-4 text-xs text-zinc-500 uppercase tracking-widest">Press Space to Toggle</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls Hint */}
          <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
            <span>Arrows to Move</span>
            <span className="text-zinc-700">•</span>
            <span>Space to Pause</span>
          </div>
        </div>
      </main>

      {/* Footer / Music Player */}
      <footer className="p-6 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Track Info */}
          <div className="flex items-center gap-4 w-full md:w-1/3">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className={`w-14 h-14 rounded-full ${currentTrack.color} flex items-center justify-center shadow-lg`}
            >
              <Music className="text-white w-6 h-6" />
            </motion.div>
            <div className="overflow-hidden">
              <h3 className="font-black text-xl tracking-tight truncate">{currentTrack.title}</h3>
              <p className="text-xs text-zinc-500 uppercase tracking-widest truncate">{currentTrack.artist}</p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center gap-3 w-full md:w-1/3">
            <div className="flex items-center gap-8">
              <button onClick={() => skipTrack('prev')} className="text-zinc-400 hover:text-white transition-colors">
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-xl"
              >
                {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-1" />}
              </button>
              <button onClick={() => skipTrack('next')} className="text-zinc-400 hover:text-white transition-colors">
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
            
            {/* Progress Bar (Visual Only) */}
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${currentTrack.color.replace('bg-', 'bg-')}`}
                initial={{ width: "0%" }}
                animate={{ width: isPlaying ? "100%" : "30%" }}
                transition={{ duration: 180, ease: "linear" }}
              />
            </div>
          </div>

          {/* Volume / Extra */}
          <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
            <Volume2 className="text-zinc-500 w-5 h-5" />
            <div className="w-24 h-1 bg-zinc-800 rounded-full">
              <div className="w-2/3 h-full bg-zinc-400 rounded-full" />
            </div>
          </div>
        </div>
      </footer>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={() => skipTrack('next')}
      />
    </div>
  );
}
