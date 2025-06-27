import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import styles from './SnakeGame.module.scss';

export type Point = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Difficulty = 'easy' | 'medium' | 'hard';

const FIELD_SIZE = 20;
const DIFFICULTY_SPEED: Record<string, number> = {
  easy: 180,
  medium: 100,
  hard: 60,
};

function getRandomFreeCell(fieldSize: number, snake: Point[]): Point {
  const free: Point[] = [];
  for (let y = 0; y < fieldSize; y++) {
    for (let x = 0; x < fieldSize; x++) {
      if (!snake.some(p => p.x === x && p.y === y)) free.push({x, y});
    }
  }
  return free[Math.floor(Math.random() * free.length)] || {x: 0, y: 0};
}

export const SnakeGame: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('right');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const moveRef = useRef(direction);
  const runningRef = useRef(isRunning);
  const pausedRef = useRef(isPaused);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => { moveRef.current = direction; }, [direction]);
  useEffect(() => { runningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  const changeDirection = (newDirection: Direction) => {
    if (!runningRef.current || pausedRef.current) return;
    if (newDirection === 'up' && moveRef.current !== 'down') setDirection('up');
    if (newDirection === 'down' && moveRef.current !== 'up') setDirection('down');
    if (newDirection === 'left' && moveRef.current !== 'right') setDirection('left');
    if (newDirection === 'right' && moveRef.current !== 'left') setDirection('right');
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') changeDirection('up');
      if (e.key === 'ArrowDown') changeDirection('down');
      if (e.key === 'ArrowLeft') changeDirection('left');
      if (e.key === 'ArrowRight') changeDirection('right');
      if (e.key === ' ') {
        e.preventDefault();
        if (isRunning) {
          setIsPaused(!isPaused);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isRunning, isPaused]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select') || target.closest('option')) {
        return;
      }
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('select') || target.closest('option')) {
        return;
      }
      e.preventDefault();
      if (!touchStartRef.current) return;
      const touch = e.changedTouches[0];
      const startX = touchStartRef.current.x;
      const startY = touchStartRef.current.y;
      const endX = touch.clientX;
      const endY = touch.clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const minSwipeDistance = 30;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            changeDirection('right');
          } else {
            changeDirection('left');
          }
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            changeDirection('down');
          } else {
            changeDirection('up');
          }
        }
      }
      touchStartRef.current = null;
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!isRunning || isPaused) return;
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        let newHead = { ...head };
        if (moveRef.current === 'up') newHead.y = (head.y - 1 + FIELD_SIZE) % FIELD_SIZE;
        if (moveRef.current === 'down') newHead.y = (head.y + 1) % FIELD_SIZE;
        if (moveRef.current === 'left') newHead.x = (head.x - 1 + FIELD_SIZE) % FIELD_SIZE;
        if (moveRef.current === 'right') newHead.x = (head.x + 1) % FIELD_SIZE;
        if (prevSnake.some(p => p.x === newHead.x && p.y === newHead.y)) {
          setIsRunning(false);
          setIsPaused(false);
          setScore(0);
          return prevSnake;
        }
        let grow = false;
        if (newHead.x === food.x && newHead.y === food.y) {
          grow = true;
          setFood(getRandomFreeCell(FIELD_SIZE, [newHead, ...prevSnake]));
          setScore(s => s + 1);
        }
        const newSnake = [newHead, ...prevSnake];
        if (!grow) newSnake.pop();
        return newSnake;
      });
    }, DIFFICULTY_SPEED[difficulty]);
    return () => clearInterval(interval);
  }, [isRunning, isPaused, difficulty, food]);

  const handleGameControl = () => {
    if (!isRunning) {
      setSnake([
        { x: Math.floor(FIELD_SIZE / 2), y: Math.floor(FIELD_SIZE / 2) },
        { x: Math.floor(FIELD_SIZE / 2) - 1, y: Math.floor(FIELD_SIZE / 2) },
      ]);
      setDirection('right');
      setFood(getRandomFreeCell(FIELD_SIZE, [
        { x: Math.floor(FIELD_SIZE / 2), y: Math.floor(FIELD_SIZE / 2) },
        { x: Math.floor(FIELD_SIZE / 2) - 1, y: Math.floor(FIELD_SIZE / 2) },
      ]));
      setIsRunning(true);
      setIsPaused(false);
      setScore(0);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value as Difficulty);
  };

  const getButtonText = () => {
    if (!isRunning) return 'Start';
    if (isPaused) return 'Resume';
    return 'Pause';
  };

  return (
    <div className={cn(styles.container, styles.relativeContainer)}>
      <h2 className={styles.title}>Snake</h2>
      <div className={styles.score}>Score: {score}</div>
      <div className={styles.gameField}>
        {Array.from({ length: FIELD_SIZE * FIELD_SIZE }).map((_, i) => {
          const x = i % FIELD_SIZE;
          const y = Math.floor(i / FIELD_SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = snake.slice(1).some(p => p.x === x && p.y === y);
          const isFood = food.x === x && food.y === y;
          let cellClass = cn(styles.cell, {
            [styles.head]: isHead,
            [styles.body]: !isHead && isBody,
            [styles.food]: !isHead && !isBody && isFood,
          });
          return (
            <div
              key={i}
              className={cellClass}
            />
          );
        })}
        {isRunning && isPaused && (
          <div className={styles.pauseOverlay}>Paused</div>
        )}
      </div>
      <div className={styles.controls}>
        <button 
          className={styles.startButton} 
          onClick={handleGameControl}
        >
          {getButtonText()}
        </button>
      </div>
      <div className={styles.difficultyRow}>
        <select 
          className={styles.difficultySelect} 
          value={difficulty} 
          onChange={handleDifficulty} 
          disabled={isRunning}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      {!isRunning && score > 0 && (
        <div className={styles.gameOver}>Game over! Your score: {score}</div>
      )}
    </div>
  );
}; 