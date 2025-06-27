import React, { useEffect, useRef, useState } from 'react';
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
  const [score, setScore] = useState(0);
  const moveRef = useRef(direction);
  const runningRef = useRef(isRunning);

  // Сохраняем последнее направление и статус игры
  useEffect(() => { moveRef.current = direction; }, [direction]);
  useEffect(() => { runningRef.current = isRunning; }, [isRunning]);

  // Управление с клавиатуры
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return;
      if (e.key === 'ArrowUp' && moveRef.current !== 'down') setDirection('up');
      if (e.key === 'ArrowDown' && moveRef.current !== 'up') setDirection('down');
      if (e.key === 'ArrowLeft' && moveRef.current !== 'right') setDirection('left');
      if (e.key === 'ArrowRight' && moveRef.current !== 'left') setDirection('right');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Основной игровой цикл
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = prevSnake[0];
        let newHead = { ...head };
        if (moveRef.current === 'up') newHead.y = (head.y - 1 + FIELD_SIZE) % FIELD_SIZE;
        if (moveRef.current === 'down') newHead.y = (head.y + 1) % FIELD_SIZE;
        if (moveRef.current === 'left') newHead.x = (head.x - 1 + FIELD_SIZE) % FIELD_SIZE;
        if (moveRef.current === 'right') newHead.x = (head.x + 1) % FIELD_SIZE;
        
        // Проверка на столкновение с собой
        if (prevSnake.some(p => p.x === newHead.x && p.y === newHead.y)) {
          setIsRunning(false);
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
  }, [isRunning, difficulty, food]);

  // Сброс игры
  const startGame = () => {
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
    setScore(0);
  };

  // Смена сложности
  const handleDifficulty = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value as Difficulty);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Змейка</h2>
      <div className={styles.score}>Счёт: {score}</div>
      <div className={styles.gameField}>
        {Array.from({ length: FIELD_SIZE * FIELD_SIZE }).map((_, i) => {
          const x = i % FIELD_SIZE;
          const y = Math.floor(i / FIELD_SIZE);
          const isHead = snake[0].x === x && snake[0].y === y;
          const isBody = snake.slice(1).some(p => p.x === x && p.y === y);
          const isFood = food.x === x && food.y === y;
          
          let cellClass = styles.cell;
          if (isHead) cellClass += ` ${styles.head}`;
          else if (isBody) cellClass += ` ${styles.body}`;
          else if (isFood) cellClass += ` ${styles.food}`;
          
          return (
            <div
              key={i}
              className={cellClass}
            />
          );
        })}
      </div>
      <div className={styles.controls}>
        <button 
          className={styles.startButton} 
          onClick={startGame} 
          disabled={isRunning}
        >
          Старт
        </button>
        <select 
          className={styles.difficultySelect} 
          value={difficulty} 
          onChange={handleDifficulty} 
          disabled={isRunning}
        >
          <option value="easy">Легко</option>
          <option value="medium">Средне</option>
          <option value="hard">Сложно</option>
        </select>
      </div>
      {!isRunning && score > 0 && (
        <div className={styles.gameOver}>Игра окончена! Ваш счёт: {score}</div>
      )}
    </div>
  );
}; 