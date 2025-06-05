import axios from 'axios';
import React, { useRef, useEffect, useState } from 'react';

const paddleSound = new Audio('../../assets/paddle.mp3');
const scoreSound = new Audio('../../assets/score.mp3');
const wallSound = new Audio('../../assets/wall.mp3');
const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';

interface PongGameProps {
  player1: { username: string; isGuest: boolean };
  player2: { username: string; isGuest: boolean };
}

// Seven-segment display segments for digits 0-9
const SEGMENTS = [
  [1,1,1,1,1,1,0], // 0
  [0,1,1,0,0,0,0], // 1
  [1,1,0,1,1,0,1], // 2
  [1,1,1,1,0,0,1], // 3
  [0,1,1,0,0,1,1], // 4
  [1,0,1,1,0,1,1], // 5
  [1,0,1,1,1,1,1], // 6
  [1,1,1,0,0,0,0], // 7
  [1,1,1,1,1,1,1], // 8
  [1,1,1,1,0,1,1], // 9
];

// Draws a single seven-segment digit
function drawSevenSegment(ctx: CanvasRenderingContext2D, digit: number, x: number, y: number, size: number, color: string) {
  const seg = SEGMENTS[digit];
  const w = size, h = size * 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 4;
  ctx.lineCap = 'round';
  // Top
  if (seg[0]) ctx.beginPath(), ctx.moveTo(x, y), ctx.lineTo(x + w, y), ctx.stroke();
  // Top-right
  if (seg[1]) ctx.beginPath(), ctx.moveTo(x + w, y), ctx.lineTo(x + w, y + h/2), ctx.stroke();
  // Bottom-right
  if (seg[2]) ctx.beginPath(), ctx.moveTo(x + w, y + h/2), ctx.lineTo(x + w, y + h), ctx.stroke();
  // Bottom
  if (seg[3]) ctx.beginPath(), ctx.moveTo(x, y + h), ctx.lineTo(x + w, y + h), ctx.stroke();
  // Bottom-left
  if (seg[4]) ctx.beginPath(), ctx.moveTo(x, y + h/2), ctx.lineTo(x, y + h), ctx.stroke();
  // Top-left
  if (seg[5]) ctx.beginPath(), ctx.moveTo(x, y), ctx.lineTo(x, y + h/2), ctx.stroke();
  // Middle
  if (seg[6]) ctx.beginPath(), ctx.moveTo(x, y + h/2), ctx.lineTo(x + w, y + h/2), ctx.stroke();
  ctx.restore();
}

const PongGame: React.FC<PongGameProps> = ({ player1, player2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);

  useEffect(() => {

	const playSound = (sound: HTMLAudioElement) => {
	  sound.currentTime = 0; // Reset sound to start
	  sound.play().catch(err => console.error('Sound play error:', err));
	};
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let paddle1Y = 100, paddle2Y = 100;
    let ballX = 250, ballY = 150, ballVX = 3, ballVY = 2;
    const paddleHeight = 60, paddleWidth = 10, canvasWidth = 500, canvasHeight = 300;
    const paddleSpeed = 6;
    let leftScore = 0, rightScore = 0;
    let gameOver = false;

    // VHS/Grain effect
    function drawVHSNoise() {
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 24;
        imageData.data[i] += noise;
        imageData.data[i+1] += noise;
        imageData.data[i+2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw dotted center line
      ctx.save();
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvasWidth/2, 0);
      ctx.lineTo(canvasWidth/2, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Draw paddles and ball
      ctx.fillStyle = "#fff";
      ctx.fillRect(10, paddle1Y, paddleWidth, paddleHeight);
      ctx.fillRect(canvasWidth - 20, paddle2Y, paddleWidth, paddleHeight);
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw big scores (seven-segment style)
      const size = 18;
      drawSevenSegment(ctx, Math.floor(leftScore/10), canvasWidth/2 - 70, 18, size, '#fff');
      drawSevenSegment(ctx, leftScore%10, canvasWidth/2 - 40, 18, size, '#fff');
      drawSevenSegment(ctx, Math.floor(rightScore/10), canvasWidth/2 + 20, 18, size, '#fff');
      drawSevenSegment(ctx, rightScore%10, canvasWidth/2 + 50, 18, size, '#fff');

      // VHS noise overlay
      drawVHSNoise();

      // Draw winner overlay if game over
      if (gameOver) {
		return;
      }
    }

    function update() {
      if (gameOver) return;

      // Move paddles based on keys pressed
      if (keysPressed.current['w']) paddle1Y = Math.max(0, paddle1Y - paddleSpeed);
      if (keysPressed.current['s']) paddle1Y = Math.min(canvasHeight - paddleHeight, paddle1Y + paddleSpeed);
      if (keysPressed.current['ArrowUp']) paddle2Y = Math.max(0, paddle2Y - paddleSpeed);
      if (keysPressed.current['ArrowDown']) paddle2Y = Math.min(canvasHeight - paddleHeight, paddle2Y + paddleSpeed);

      ballX += ballVX;
      ballY += ballVY;

      // Ball collision with top/bottom walls
      if (ballY < 8) {
        ballY = 8;
        ballVY *= -1;
		playSound(wallSound);
      }
      if (ballY > canvasHeight - 8) {
        ballY = canvasHeight - 8;
        ballVY *= -1;
		playSound(wallSound);
      }

      // Ball collision with left paddle
      if (
        ballX - 8 < 20 && ballX - 8 > 10 &&
        ballY > paddle1Y && ballY < paddle1Y + paddleHeight
      ) {
        ballX = 20 + 8;
        const hitPos = (ballY - paddle1Y) / paddleHeight;
        if (hitPos < 0.2|| hitPos > 0.8) {
          ballVX = Math.abs(ballVX);
          ballVY *= -1;
        } else {
          ballVX = Math.abs(ballVX);
          ballVY = (hitPos - 0.5) * 10;
        }
		playSound(paddleSound);
      }

      // Ball collision with right paddle
      if (
        ballX + 8 > canvasWidth - 20 && ballX + 8 < canvasWidth - 10 &&
        ballY > paddle2Y && ballY < paddle2Y + paddleHeight
      ) {
        ballX = canvasWidth - 20 - 8;
        const hitPos = (ballY - paddle2Y) / paddleHeight;
        if (hitPos < 0.2 || hitPos > 0.8) {
          ballVX = -Math.abs(ballVX);
          ballVY *= -1;
        } else {
          ballVX = -Math.abs(ballVX);
          ballVY = (hitPos - 0.5) * 10;
        }
		playSound(paddleSound);
      }

      // Ball out of bounds (score)
      if (ballX < 0) {
        rightScore++;
		playSound(scoreSound);
        resetBall();
      } else if (ballX > canvasWidth) {
        leftScore++;
		playSound(scoreSound);
        resetBall();
      }

      // Win condition
      if (leftScore === 11 || rightScore === 11) {
        setWinner(leftScore === 11 ? player1.username : player2.username);
        setScore({ left: leftScore, right: rightScore });
        gameOver = true;
		axios.post(apiUrl + '/matches', {
			player: player1.isGuest ? 'guest' : player1.username,
			opponent: player2.isGuest ? 'guest' : player2.username,
			winner: leftScore === 11 ? player1.username : player2.username,
			loser: leftScore === 11 ? player2.username : player1.username,
			leftScore,
			rightScore,
		}).catch(console.error);
      }
    }

    function resetBall() {
      ballX = canvasWidth / 2;
      ballY = canvasHeight / 2;
      ballVX = (Math.random() > 0.5 ? 3 : -3);
      ballVY = (Math.random() - 0.5) * 4;
      setScore({ left: leftScore, right: rightScore });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animationFrameId: number;
    const gameLoop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [player1.username, player2.username, restartKey]);

  function handleRestart() {
	setWinner(null);
	setScore({ left: 0, right: 0 });
	setRestartKey(prev => prev + 1); // Trigger re-render
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: '#fff' }}>{player1.username}</span>
        <span style={{ color: '#fff' }}>{player2.username}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{
          background: '#222',
          display: 'block',
          margin: '0 auto',
          imageRendering: 'pixelated',
        }}
      />
      {winner && (
          <div 
        className="absolute inset-0 flex items-center justify-center text-4xl text-white font-bold bg-black bg-opacity-70"
        style={{
          width: '500px',
          height: '300px',
          left: 0,
          top: 0,
          margin: '0 auto',
          borderRadius: '8px',
        }}
      >
        <div>{winner} wins!</div>
        <button
          className="mt-6 px-6 py-2 bg-teal-700 text-white rounded text-xl font-bold"
          onClick={handleRestart}
        >	
          Restart 
        </button>
          </div>
      )}
    </div>
  );
};



export default PongGame;