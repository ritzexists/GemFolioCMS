import React, { useState, useEffect, useRef } from 'react';
import { useTheme, themes } from '@/context/ThemeContext';

interface SnakeGameProps {
  onExit: () => void;
}

const GRID_W = 30;
const GRID_H = 15;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function SnakeGame({ onExit }: SnakeGameProps) {
  const { theme } = useTheme();
  const currentTheme = themes[theme];
  
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction !== 'DOWN') setDirection('UP');
          break;
        case 'ArrowDown':
          if (direction !== 'UP') setDirection('DOWN');
          break;
        case 'ArrowLeft':
          if (direction !== 'RIGHT') setDirection('LEFT');
          break;
        case 'ArrowRight':
          if (direction !== 'LEFT') setDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };

        switch (direction) {
          case 'UP': head.y -= 1; break;
          case 'DOWN': head.y += 1; break;
          case 'LEFT': head.x -= 1; break;
          case 'RIGHT': head.x += 1; break;
        }

        // Check collisions
        if (
          head.x < 0 || head.x >= GRID_W ||
          head.y < 0 || head.y >= GRID_H ||
          prevSnake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 1);
          setFood({
            x: Math.floor(Math.random() * GRID_W),
            y: Math.floor(Math.random() * GRID_H)
          });
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    gameLoopRef.current = setInterval(moveSnake, 100);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [direction, food, gameOver]);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', String(score));
    }
  }, [score, highScore]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 10 });
    setDirection('RIGHT');
    setGameOver(false);
    setScore(0);
  };

  // Render grid to text
  const renderGrid = () => {
    const grid = Array(GRID_H).fill(null).map(() => Array(GRID_W).fill('·'));
    
    // Draw food
    if (food.y >= 0 && food.y < GRID_H && food.x >= 0 && food.x < GRID_W) {
      grid[food.y][food.x] = '★';
    }

    // Draw snake
    snake.forEach((segment, i) => {
      if (segment.y >= 0 && segment.y < GRID_H && segment.x >= 0 && segment.x < GRID_W) {
        grid[segment.y][segment.x] = i === 0 ? 'O' : 'o';
      }
    });

    return grid.map(row => row.join('')).join('\n');
  };

  return (
    <div 
      className="flex flex-col h-full select-none text-neon-green overflow-y-auto custom-scrollbar pr-2" 
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2">
        SCORE: {score.toString().padStart(3, '0')}  HIGH: {highScore.toString().padStart(3, '0')}
      </div>
      
      <div className="relative">
        <pre className="font-mono leading-none whitespace-pre">
          {renderGrid()}
        </pre>
        
        {gameOver && (
          <div className="mt-4 text-neon-green">
            <div className="font-bold animate-pulse mb-2">GAME OVER</div>
            <div className="flex gap-4">
              <button 
                onClick={restartGame}
                className="hover:text-neon-pink hover:underline decoration-dashed underline-offset-4 transition-colors"
              >
                [R]ETRY
              </button>
              <button 
                onClick={onExit}
                className="hover:text-neon-pink hover:underline decoration-dashed underline-offset-4 transition-colors"
              >
                [E]XIT
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 opacity-50">
        [ARROWS] MOVE • [R] RETRY • [E] EXIT
      </div>
    </div>
  );
}
