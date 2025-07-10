import api from '../api/axios';
import React, { useRef, useEffect, useState } from 'react';
import { useGameSettings, getDifficultySettings, DifficultySettings } from '../contexts/GameSettingsContext';

const paddleSound = new Audio('../../assets/paddle.mp3');
const scoreSound = new Audio('../../assets/score.mp3');
const wallSound = new Audio('../../assets/wall.mp3');

interface PongGameProps {
  player1: { username: string; isGuest: boolean };
  player2: { username: string; isGuest: boolean };
  isAIGame?: boolean; // New prop to indicate AI game
}

/**
 * AI States for Finite State Machine
 * The AI uses a simple state machine to make decisions, which helps reduce jitter
 * and create more natural, varied behaviors based on the game situation.
 */
enum AIState {
  CORRECT = 'CORRECT',     // Move to the predicted correct position to intercept the ball
  OPPOSITE = 'OPPOSITE',   // Move in the wrong direction (for easier difficulty levels)
  IDLE = 'IDLE',           // Don't move (simulates human reaction delay or mistakes)
  POWERUP = 'POWERUP'      // Target the power-up instead of the ball
}

/**
 * AI Game State Snapshot
 * This interface defines all the information the AI needs to make decisions.
 * The snapshot is taken once per second to prevent the AI from reacting too quickly.
 */
interface AIGameSnapshot {
  ballX: number;           // Horizontal position of the ball
  ballY: number;           // Vertical position of the ball
  ballVX: number;          // Horizontal velocity of the ball
  ballVY: number;          // Vertical velocity of the ball
  paddle2Y: number;        // AI paddle position
  paddle1Y: number;        // Player paddle position
  timestamp: number;       // When this snapshot was taken
  powerUpActive: boolean;  // Whether a power-up is currently on screen
  powerUpX?: number;       // Horizontal position of power-up (if active)
  powerUpY?: number;       // Vertical position of power-up (if active)
  mapType: string;         // Which map is being played (affects strategy)
  canvasWidth: number;     // Width of the game area
  canvasHeight: number;    // Height of the game area
}

/**
 * AI Controller Class
 * This class handles all AI logic, including predicting ball trajectory,
 * decision making based on game state, and simulating player input.
 * The AI has different behavior patterns based on difficulty level.
 */
class PongAI {
  // Current state in the AI's state machine
  private currentState: AIState = AIState.CORRECT;
  
  // Most recent information about the game
  private lastSnapshot: AIGameSnapshot | null = null;
  
  // AI's prediction of where the ball will be when it reaches the paddle
  private predictedBallY: number = 150;
  
  // Vertical position where the AI is trying to move its paddle
  private targetY: number = 150;
  
  // Difficulty settings that affect accuracy, reaction time, etc.
  private difficulty: DifficultySettings;
  
  // Simulated keyboard input (what keys the AI is "pressing")
  private keySimulator: { [key: string]: boolean } = {};
  
  // Timestamp of the last paddle movement (used for limiting movement speed)
  private lastMoveTime: number = 0;
  
  // Timestamp of the last state change (prevents rapid state switching)
  private lastStateChange: number = 0;
  
  // How long to stay in the current state (milliseconds)
  private stateDuration: number = 0;
  
  // Current power-up position, if any
  private powerUpPosition: {x: number, y: number} | null = null;
  
  // Current map type (affects strategy)
  private mapType: string = 'classic';
  
  /**
   * Constructor - Initialize the AI with specific difficulty settings
   * @param difficultySettings Controls AI accuracy, reaction time, etc.
   */
  constructor(difficultySettings: DifficultySettings) {
    this.difficulty = difficultySettings;
    this.targetY = 120; // Start at center-ish position
    this.predictedBallY = 150; // Start with center prediction
    this.lastStateChange = Date.now();
    this.stateDuration = 1000; // 1 second default state duration
  }

  /**
   * Take a snapshot of the game state
   * This is called once per second to update the AI's view of the game.
   * This deliberate delay prevents the AI from having superhuman reaction times.
   * 
   * @param gameState Current state of all important game objects
   */
  takeSnapshot(gameState: AIGameSnapshot): void {
    this.lastSnapshot = gameState;
    
    // After getting new information, the AI goes through its decision process:
    this.analyzeGameState();  // 1. Analyze where the ball is going
    this.updateState();       // 2. Decide what state to be in (chase ball, get powerup, etc)
    this.planNextMove();      // 3. Plan where to move the paddle
  }

  /**
   * Analyze the current game state to predict ball trajectory
   * This is the AI's "eyes" - it looks at the ball's position and velocity
   * to predict where the ball will be when it reaches the AI's paddle.
   */
  private analyzeGameState(): void {
    if (!this.lastSnapshot) return;

    const { ballX, ballY, ballVX, ballVY, paddle2Y } = this.lastSnapshot;
    
    // Predict where the ball will be when it reaches the paddle
    if (ballVX > 0) { // Ball moving towards AI (right side)
      // Calculate time until ball reaches paddle position
      const timeToReachPaddle = (480 - ballX) / Math.abs(ballVX); // Assuming paddle at x=480
      
      // Use physics to predict where ball will be vertically when it reaches paddle
      this.predictedBallY = this.predictBallPosition(ballY, ballVY, timeToReachPaddle);
    } else {
      // When ball is moving away from AI, gradually move toward center
      // This is more human-like behavior - players tend to reset position
      // when the ball is moving away from them
      const currentPaddleCenter = paddle2Y + 30;
      const centerY = 150;
      // Gradually move toward center when ball is away (10% per update)
      this.predictedBallY = currentPaddleCenter + (centerY - currentPaddleCenter) * 0.1;
    }
  }

  /**
   * Predict the future position of the ball considering wall bounces
   * This is the "physics brain" of the AI, allowing it to anticipate
   * where the ball will be after potentially multiple wall bounces.
   * 
   * @param ballY Current vertical position of ball
   * @param ballVY Current vertical velocity of ball
   * @param time Time in the future to predict position
   * @returns Predicted Y position of ball after given time
   */
  private predictBallPosition(ballY: number, ballVY: number, time: number): number {
    // Simple physics: position = startPosition + (velocity * time)
    let predictedY = ballY + (ballVY * time);
    
    // Account for wall bounces - ball bounces between y=8 and y=292 (canvas height - ball radius)
    const topWall = 8;
    const bottomWall = 292;
    const playAreaHeight = bottomWall - topWall;
    
    if (predictedY < topWall || predictedY > bottomWall) {
      // Calculate bounces - this handles multiple bounces off walls
      if (predictedY < topWall) {
        // Ball would go beyond top wall
        const overshoot = topWall - predictedY;
        const bounces = Math.floor(overshoot / playAreaHeight);
        const remainder = overshoot % playAreaHeight;
        
        // Even number of bounces means coming from top wall
        // Odd number means coming from bottom wall
        if (bounces % 2 === 0) {
          predictedY = topWall + remainder;
        } else {
          predictedY = bottomWall - remainder;
        }
      } else if (predictedY > bottomWall) {
        // Ball would go beyond bottom wall
        const overshoot = predictedY - bottomWall;
        const bounces = Math.floor(overshoot / playAreaHeight);
        const remainder = overshoot % playAreaHeight;
        
        // Same logic for bottom wall
        if (bounces % 2 === 0) {
          predictedY = bottomWall - remainder;
        } else {
          predictedY = topWall + remainder;
        }
      }
    }
    
    // Ensure paddle can reach this position (paddle center can be between 30 and 270)
    return Math.max(30, Math.min(270, predictedY));
  }

  /**
   * Update the AI's state based on game conditions
   * This is the "decision maker" of the AI - it decides what the AI should be focusing on
   * (chasing the ball, getting a power-up, idling, etc.) based on the current game state
   * and difficulty settings.
   */
  private updateState(): void {
    if (!this.lastSnapshot) return;

    const { ballX, ballY, ballVX, powerUpActive, powerUpX, powerUpY, mapType, canvasWidth, canvasHeight } = this.lastSnapshot;
    const now = Date.now();
    
    // Store map type for strategy decisions
    this.mapType = mapType;
    
    // Update power-up position if one is active
    if (powerUpActive && powerUpX !== undefined && powerUpY !== undefined) {
      this.powerUpPosition = { x: powerUpX, y: powerUpY };
    } else {
      this.powerUpPosition = null;
    }
    
    // State hysteresis - stay in current state for at least stateDuration milliseconds
    // This prevents rapid state switching and makes movement more human-like
    if (now - this.lastStateChange < this.stateDuration) {
      return;
    }
    
    // Human-like behavior: After successfully hitting the ball, pause briefly
    // This simulates how humans often pause after making a successful hit
    if (ballVX < 0 && this.currentState === AIState.CORRECT) {
      this.currentState = AIState.IDLE;
      this.stateDuration = 500 + Math.random() * 500; // Idle for 0.5-1 second after hitting
      this.lastStateChange = now;
      return;
    }
    
    // Power-up collection behavior: Go for power-ups when it's safe to do so
    // Only attempt when the ball is moving away from AI (defensive priority)
    if (powerUpActive && this.powerUpPosition && ballVX < 0) {
      // Check if power-up is within reasonable distance from paddle
      const distanceToPowerUp = Math.abs((this.lastSnapshot.paddle2Y + 30) - this.powerUpPosition.y);
      
      // Only go for power-ups that are close enough to reasonably reach
      // This prevents AI from abandoning defense for distant power-ups
      if (distanceToPowerUp < 100) {
        this.currentState = AIState.POWERUP;
        this.stateDuration = 1000; // Stay in power-up state for 1 second
        this.lastStateChange = now;
        return;
      }
    }
    
    // Difficulty behavior: Easier AIs occasionally move in wrong direction
    // This simulates mistakes that human players make
    let wrongDirectionChance = 0;
    if (ballVX > 0) { // Only consider wrong direction when ball is coming towards AI
      // Different accuracy levels based on difficulty setting
      switch(this.difficulty.accuracy) {
        case 0.3: // Easy - makes mistakes frequently (30% chance)
          wrongDirectionChance = 0.3;
          break;
        case 0.6: // Medium - occasional mistakes (15% chance)
          wrongDirectionChance = 0.15;
          break;
        case 0.85: // Hard - rare mistakes (5% chance)
          wrongDirectionChance = 0.05;
          break;
        default: // Expert - never deliberately moves wrong direction
          wrongDirectionChance = 0;
      }
      
      // Random chance to make mistake based on difficulty
      if (Math.random() < wrongDirectionChance) {
        this.currentState = AIState.OPPOSITE;
        this.stateDuration = 300 + Math.random() * 300; // Wrong direction for 0.3-0.6 sec
        this.lastStateChange = now;
        return;
      }
    }
    
    // Default behavior when ball is approaching: Move to intercept
    if (ballVX > 0) {
      this.currentState = AIState.CORRECT;
      this.stateDuration = 500; // Stay in correct position state for half a second
      this.lastStateChange = now;
      return;
    } 
    
    // When ball is moving away: Occasionally pause/idle based on difficulty
    // This simulates how human players sometimes relax when the ball is away
    if (ballVX < 0 && Math.random() < this.difficulty.idleChance) {
      this.currentState = AIState.IDLE;
      this.stateDuration = 500 + Math.random() * 1000; // Idle for 0.5-1.5 seconds
      this.lastStateChange = now;
      return;
    }
    
    // Default to correct position (this covers any remaining cases)
    this.currentState = AIState.CORRECT;
    this.stateDuration = 500;
    this.lastStateChange = now;
  }

  /**
   * Plan the next paddle movement based on current state
   * This is the "strategy" part of the AI - it decides where the paddle
   * should be positioned based on the current state and map type.
   */
  private planNextMove(): void {
    if (!this.lastSnapshot) return;

    const { paddle2Y, ballX, ballY, ballVX, ballVY, canvasWidth, canvasHeight } = this.lastSnapshot;
    const paddleHeight = 60; // Standard paddle height
    
    // Use different positioning strategies based on the current AI state
    switch (this.currentState) {
      case AIState.CORRECT: // Normal play - try to hit the ball
        // Apply map-specific targeting strategies
        if (this.mapType === 'corners') {
          // CORNERS MAP STRATEGY: Avoid corner traps, stay in the scorable zone
          if (ballVX > 0) { // Ball coming towards AI
            // Aim for the middle scoring zone
            const centerY = canvasHeight / 2;
            const cornerSize = 60;
            
            // Adjust targeting to avoid corner traps
            if (ballY < cornerSize + 30) {
              // Ball in top area, aim lower to avoid top corner
              this.targetY = cornerSize + 40;
            } else if (ballY > canvasHeight - cornerSize - 30) {
              // Ball in bottom area, aim higher to avoid bottom corner
              this.targetY = canvasHeight - cornerSize - 40;
            } else {
              // Ball in middle area (safe zone), try to stay aligned with it
              this.targetY = this.predictedBallY - paddleHeight/2;
            }
          } else {
            // When ball moving away, stay in the middle (safest position)
            this.targetY = (canvasHeight / 2) - paddleHeight/2;
          }
        } else if (this.mapType === 'center-wall') {
          // CENTER WALL MAP STRATEGY: Simply chase the ball
          // For this map, the simple approach works best - just track the ball
          this.targetY = this.predictedBallY - paddleHeight/2;
        } else {
          // CLASSIC MAP STRATEGY: Just track the ball's predicted position
          this.targetY = this.predictedBallY - paddleHeight/2;
        }
        break;
      
      case AIState.OPPOSITE:
        // MISTAKE BEHAVIOR: Deliberately move in the wrong direction
        // This makes the AI look more human for easier difficulty levels
        this.targetY = canvasHeight - this.predictedBallY;
        break;
      
      case AIState.IDLE:
        // IDLE BEHAVIOR: Don't update target - stay where we are
        // Target remains the same, creating a pause in movement
        break;
      
      case AIState.POWERUP:
        // POWERUP BEHAVIOR: Chase the powerup instead of the ball
        if (this.powerUpPosition) {
          // Position paddle to hit the powerup
          this.targetY = this.powerUpPosition.y - paddleHeight/2;
        }
        break;
    }

    // Add realistic human imperfection based on difficulty level
    // Lower accuracy settings result in more positioning errors
    if (this.difficulty.accuracy < 1.0) {
      const error = (1 - this.difficulty.accuracy) * 15 * (Math.random() - 0.5);
      this.targetY += error;
    }

    // Ensure paddle stays within the valid play area
    // Clamp target position to valid paddle range (0 to canvas height - paddle height)
    this.targetY = Math.max(0, Math.min(canvasHeight - paddleHeight, this.targetY));
  }

  // Simulate keyboard input (called every frame)
  // This is where the AI actually controls the paddle movement
  simulateInput(currentPaddleY: number): { [key: string]: boolean } {
    const paddleHeight = 60; // Standard paddle height
    const targetCenter = this.targetY + paddleHeight/2;
    const currentCenter = currentPaddleY + paddleHeight/2;
    const difference = targetCenter - currentCenter;
    const threshold = 5; // Deadzone to prevent jitter
    const currentTime = Date.now();

    // Reset keys - start with no keys pressed
    this.keySimulator = {};

    // If in IDLE state, don't move - AI deliberately pauses
    if (this.currentState === AIState.IDLE) {
      return this.keySimulator;
    }

    // Add difficulty-based reaction delay
    // For easier difficulties, the AI waits longer before responding
    // For expert, we still add a small delay to ensure it's not superhuman
    const reactionDelay = this.difficulty.accuracy < 0.95 ? 
                         (1 - this.difficulty.reactionTime) * 100 : 
                         16; // Minimum 16ms delay even for expert (matches human reaction)
                         
    if (currentTime - this.lastMoveTime < reactionDelay) {
      return this.keySimulator; // Wait before reacting
    }
    
    // Throttle AI movement speed - prevent paddle from moving faster than player's paddle
    // Only make a movement decision at most every 16ms (roughly matches 60fps)
    if (currentTime - this.lastMoveTime < 16) {
      return this.keySimulator;
    }
    
    // Move toward target with smoother acceleration/deceleration
    if (Math.abs(difference) > threshold) {
      if (difference > 0) {
        // Need to move down
        this.keySimulator['ArrowDown'] = true;
      } else {
        // Need to move up
        this.keySimulator['ArrowUp'] = true;
      }
      this.lastMoveTime = currentTime;
    }
    
    return this.keySimulator;
  }

  getCurrentState(): AIState {
    return this.currentState;
  }

  getDebugInfo(): string {
    return `AI State: ${this.currentState}, Target Y: ${this.targetY.toFixed(1)}, Map: ${this.mapType}, PowerUp: ${this.powerUpPosition ? 'Available' : 'None'}, Current Y: ${this.lastSnapshot?.paddle2Y.toFixed(1) || 'N/A'}`;
  }
}

// Seven-segment display segments for digits 0-9
const SEGMENTS = [
  [1, 1, 1, 1, 1, 1, 0], // 0
  [0, 1, 1, 0, 0, 0, 0], // 1
  [1, 1, 0, 1, 1, 0, 1], // 2
  [1, 1, 1, 1, 0, 0, 1], // 3
  [0, 1, 1, 0, 0, 1, 1], // 4
  [1, 0, 1, 1, 0, 1, 1], // 5
  [1, 0, 1, 1, 1, 1, 1], // 6
  [1, 1, 1, 0, 0, 0, 0], // 7
  [1, 1, 1, 1, 1, 1, 1], // 8
  [1, 1, 1, 1, 0, 1, 1], // 9
];

// Draws a single seven-segment digit
function drawSevenSegment(
  ctx: CanvasRenderingContext2D,
  digit: number,
  x: number,
  y: number,
  size: number,
  color: string
) {
  const seg = SEGMENTS[digit];
  const w = size,
    h = size * 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 4;
  ctx.lineCap = "round";
  // Top
  if (seg[0])
    ctx.beginPath(), ctx.moveTo(x, y), ctx.lineTo(x + w, y), ctx.stroke();
  // Top-right
  if (seg[1])
    ctx.beginPath(),
      ctx.moveTo(x + w, y),
      ctx.lineTo(x + w, y + h / 2),
      ctx.stroke();
  // Bottom-right
  if (seg[2])
    ctx.beginPath(),
      ctx.moveTo(x + w, y + h / 2),
      ctx.lineTo(x + w, y + h),
      ctx.stroke();
  // Bottom
  if (seg[3])
    ctx.beginPath(),
      ctx.moveTo(x, y + h),
      ctx.lineTo(x + w, y + h),
      ctx.stroke();
  // Bottom-left
  if (seg[4])
    ctx.beginPath(),
      ctx.moveTo(x, y + h / 2),
      ctx.lineTo(x, y + h),
      ctx.stroke();
  // Top-left
  if (seg[5])
    ctx.beginPath(), ctx.moveTo(x, y), ctx.lineTo(x, y + h / 2), ctx.stroke();
  // Middle
  if (seg[6])
    ctx.beginPath(),
      ctx.moveTo(x, y + h / 2),
      ctx.lineTo(x + w, y + h / 2),
      ctx.stroke();
  ctx.restore();
}

const PongGame: React.FC<PongGameProps> = ({ player1, player2, isAIGame }) => {
  console.log("PongGame: Initializing with players", { player1, player2, isAIGame });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const { settings } = useGameSettings();
  
  console.log("PongGame: Using game settings", settings);

  // AI instance
  const aiRef = useRef<PongAI | null>(null);

  // Power-up states
  const [player1PowerUps, setPlayer1PowerUps] = useState<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 }
  });

  const [player2PowerUps, setPlayer2PowerUps] = useState<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 }
  });

  // Track last paddle that hit the ball
  const lastPaddleHitRef = useRef<'player1' | 'player2' | null>(null);
  
  // Use refs to track power-up states for immediate access in the game loop
  const player1PowerUpsRef = useRef<{paddleEnlarge: { active: boolean; endTime: number }}>({
    paddleEnlarge: { active: false, endTime: 0 }
  });
  
  const player2PowerUpsRef = useRef<{paddleEnlarge: { active: boolean; endTime: number }}>({
    paddleEnlarge: { active: false, endTime: 0 }
  });

  useEffect(() => {
    console.log("PongGame: useEffect running, initializing game");
    
    const playSound = (sound: HTMLAudioElement) => {
      sound.currentTime = 0; // Reset sound to start
      sound.play().catch((err) => console.error("Sound play error:", err));
    };
    
    const canvas = canvasRef.current;
    console.log("PongGame: Canvas reference:", canvas);
    if (!canvas) {
      console.error("PongGame: Canvas element not found!");
      return;
    }
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("PongGame: Could not get 2D context!");
      return;
    }
    
    console.log("PongGame: Game initialization successful");

    // Define canvas dimensions first
    const paddleHeight = 60,
      paddleWidth = 10,
      canvasWidth = 500,
      canvasHeight = 300;
    
    let paddle1Y = 100,
      paddle2Y = 100;
    let ballX = 250,
      ballY = 150,
      ballVX = 3,
      ballVY = 2;
      
    // Initialize ball position safely for center wall map
    if (settings.mapType === 'center-wall') {
      const wallHeight = canvasHeight * 0.6;
      const wallY = (canvasHeight - wallHeight) / 2;
      
      // Start ball either above or below the wall
      if (Math.random() > 0.5) {
        ballY = wallY - 15; // Above wall
        ballVY = 2; // Moving down
      } else {
        ballY = wallY + wallHeight + 15; // Below wall
        ballVY = -2; // Moving up
      }
    }
    const paddleSpeed = 6;
    let leftScore = 0,
      rightScore = 0;
    let gameOver = false;

    // Initialize AI if this is an AI game
    // The AI is only created once per game session and persists between points
    if (isAIGame && !aiRef.current) {
      console.log("PongGame: Creating new AI with difficulty", settings.aiDifficulty);
      const difficultySettings = getDifficultySettings(settings.aiDifficulty);
      aiRef.current = new PongAI(difficultySettings);
    }

    // AI snapshot timing - controls how often the AI updates its view of the game
    // Higher values make the AI more human-like by limiting its "perception" speed
    let lastAISnapshotTime = 0; // Timestamp of the last game state snapshot

    // Power-up system
    let powerUpX = -100, powerUpY = -100; // Start off-screen
    let powerUpActive = false;
    let powerUpType = 'paddleEnlarge';
    let lastPowerUpSpawn = 0;
    let lastPaddleHit: 'player1' | 'player2' | null = null; // Track which player last hit the ball
    const powerUpSpawnInterval = 15000; // 15 seconds

    // Reset power-ups when game restarts
    player1PowerUpsRef.current = { paddleEnlarge: { active: false, endTime: 0 } };
    player2PowerUpsRef.current = { paddleEnlarge: { active: false, endTime: 0 } };
    
    // Also update React state for UI
    setPlayer1PowerUps({ paddleEnlarge: { active: false, endTime: 0 } });
    setPlayer2PowerUps({ paddleEnlarge: { active: false, endTime: 0 } });
    
    // Reset last paddle hit
    lastPaddleHitRef.current = null;

    // Helper function to draw different maps
    function drawMap() {
      if (!ctx) return;
      
      ctx.save();
      ctx.fillStyle = "#fff";
      
      switch (settings.mapType) {
        case 'corners':
          // Draw thinner corner walls - only on edges
          const wallThickness = 5;
          const cornerSize = 60;
          
          // Top left corner
          ctx.fillRect(0, 0, cornerSize, wallThickness);
          ctx.fillRect(0, 0, wallThickness, cornerSize);
          
          // Top right corner  
          ctx.fillRect(canvasWidth - cornerSize, 0, cornerSize, wallThickness);
          ctx.fillRect(canvasWidth - wallThickness, 0, wallThickness, cornerSize);
          
          // Bottom left corner
          ctx.fillRect(0, canvasHeight - wallThickness, cornerSize, wallThickness);
          ctx.fillRect(0, canvasHeight - cornerSize, wallThickness, cornerSize);
          
          // Bottom right corner
          ctx.fillRect(canvasWidth - cornerSize, canvasHeight - wallThickness, cornerSize, wallThickness);
          ctx.fillRect(canvasWidth - wallThickness, canvasHeight - cornerSize, wallThickness, cornerSize);
          break;
          
        case 'center-wall':
          // Draw center wall with gaps at top and bottom
          const wallHeight = canvasHeight * 0.6; // 60% of canvas height
          const wallY = (canvasHeight - wallHeight) / 2;
          ctx.fillRect(canvasWidth / 2 - 5, wallY, 10, wallHeight);
          break;
          
        case 'classic':
        default:
          // No additional walls
          break;
      }
      
      ctx.restore();
    }

    // VHS/Grain effect
    function drawVHSNoise() {
      if (!ctx) return;
      const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 24;
        imageData.data[i] += noise;
        imageData.data[i + 1] += noise;
        imageData.data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function draw() {
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw map elements first
      drawMap();

      // Draw dotted center line
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2, 0);
      ctx.lineTo(canvasWidth / 2, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Draw paddles with power-up effects
      ctx.fillStyle = "#fff";
      
      // Player 1 paddle (left)
      const paddle1Height = player1PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
      ctx.fillRect(10, paddle1Y, paddleWidth, paddle1Height);
      
      // Player 2 paddle (right)  
      const paddle2Height = player2PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
      ctx.fillRect(canvasWidth - 20, paddle2Y, paddleWidth, paddle2Height);
      
      // Draw ball
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw power-up if active
      if (powerUpActive && settings.powerUpsEnabled) {
        ctx.save();
        ctx.fillStyle = "#FFD700"; // Gold color
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🏓", powerUpX, powerUpY);
        ctx.restore();
      }

      // Draw big scores (seven-segment style)
      const size = 18;
      drawSevenSegment(
        ctx,
        Math.floor(leftScore / 10),
        canvasWidth / 2 - 70,
        18,
        size,
        "#fff"
      );
      drawSevenSegment(
        ctx,
        leftScore % 10,
        canvasWidth / 2 - 40,
        18,
        size,
        "#fff"
      );
      drawSevenSegment(
        ctx,
        Math.floor(rightScore / 10),
        canvasWidth / 2 + 20,
        18,
        size,
        "#fff"
      );
      drawSevenSegment(
        ctx,
        rightScore % 10,
        canvasWidth / 2 + 50,
        18,
        size,
        "#fff"
      );

      // Draw power-up timers
      if (player1PowerUpsRef.current.paddleEnlarge.active || player2PowerUpsRef.current.paddleEnlarge.active) {
        ctx.save();
        ctx.fillStyle = "#FFD700";
        ctx.font = "12px Arial";
        
        if (player1PowerUpsRef.current.paddleEnlarge.active) {
          const timeLeft = Math.max(0, (player1PowerUpsRef.current.paddleEnlarge.endTime - Date.now()) / 1000);
          ctx.fillText(`Big Paddle: ${timeLeft.toFixed(1)}s`, 20, canvasHeight - 20);
        }
        
        if (player2PowerUpsRef.current.paddleEnlarge.active) {
          const timeLeft = Math.max(0, (player2PowerUpsRef.current.paddleEnlarge.endTime - Date.now()) / 1000);
          ctx.fillText(`Big Paddle: ${timeLeft.toFixed(1)}s`, canvasWidth - 120, canvasHeight - 20);
        }
        
        ctx.restore();
      }

      // VHS noise overlay
      drawVHSNoise();

      // Draw winner overlay if game over
      if (gameOver) {
        return;
      }
    }

    function update() {
      if (gameOver) return;

      const currentTime = Date.now();

      // Update power-up timers
      if (player1PowerUpsRef.current.paddleEnlarge.active && currentTime > player1PowerUpsRef.current.paddleEnlarge.endTime) {
        // Update the ref directly for immediate effect
        player1PowerUpsRef.current = {
          paddleEnlarge: { active: false, endTime: 0 }
        };
        
        // Also update React state for UI
        setPlayer1PowerUps({
          paddleEnlarge: { active: false, endTime: 0 }
        });
        console.log("Player 1 powerup expired");
      }
      
      if (player2PowerUpsRef.current.paddleEnlarge.active && currentTime > player2PowerUpsRef.current.paddleEnlarge.endTime) {
        // Update the ref directly for immediate effect
        player2PowerUpsRef.current = {
          paddleEnlarge: { active: false, endTime: 0 }
        };
        
        // Also update React state for UI
        setPlayer2PowerUps({
          paddleEnlarge: { active: false, endTime: 0 }
        });
        console.log("Player 2 powerup expired");
      }

      // Spawn power-ups
      if (settings.powerUpsEnabled && settings.paddleEnlargePowerUp && !powerUpActive && currentTime - lastPowerUpSpawn > powerUpSpawnInterval) {
        powerUpActive = true;
        powerUpX = Math.random() * (canvasWidth - 100) + 50;
        powerUpY = Math.random() * (canvasHeight - 100) + 50;
        lastPowerUpSpawn = currentTime;
      }

      // AI Logic - Take snapshot once per second
      if (isAIGame && aiRef.current && currentTime - lastAISnapshotTime >= 1000) { // Limit AI "thinking" to once per second
        const snapshot: AIGameSnapshot = {
          ballX,
          ballY,
          ballVX,
          ballVY,
          paddle2Y,
          paddle1Y,
          timestamp: currentTime,
          powerUpActive: powerUpActive,
          powerUpX: powerUpX,
          powerUpY: powerUpY,
          mapType: settings.mapType,
          canvasWidth: canvasWidth,
          canvasHeight: canvasHeight
        };
        aiRef.current.takeSnapshot(snapshot);
        lastAISnapshotTime = currentTime;
        
        // Only log AI state occasionally to reduce console spam
        if (Math.random() < 0.1) {
          console.log(aiRef.current.getDebugInfo());
        }
      }

      // AI paddle control - simulate keyboard input
      if (isAIGame && aiRef.current) {
        const aiInput = aiRef.current.simulateInput(paddle2Y);
        // Override keysPressed for player 2 (AI)
        keysPressed.current["ArrowUp"] = aiInput["ArrowUp"] || false;
        keysPressed.current["ArrowDown"] = aiInput["ArrowDown"] || false;
      }

      // Move paddles based on keys pressed with wall collision
      let newPaddle1Y = paddle1Y;
      let newPaddle2Y = paddle2Y;
      
      if (keysPressed.current["w"])
        newPaddle1Y = Math.max(0, paddle1Y - paddleSpeed);
      if (keysPressed.current["s"]) {
        const currentPaddleHeight = player1PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
        newPaddle1Y = Math.min(canvasHeight - currentPaddleHeight, paddle1Y + paddleSpeed);
      }
      if (keysPressed.current["ArrowUp"])
        newPaddle2Y = Math.max(0, paddle2Y - paddleSpeed);
      if (keysPressed.current["ArrowDown"]) {
        const currentPaddleHeight = player2PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
        newPaddle2Y = Math.min(canvasHeight - currentPaddleHeight, paddle2Y + paddleSpeed);
      }

      // Check wall collisions for corner walls map
      if (settings.mapType === 'corners') {
        const wallThickness = 5; // Match the drawing thickness
        const cornerSize = 60; // Match the drawing size
        const paddle1Height = player1PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
        const paddle2Height = player2PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
        
        // Player 1 (left paddle) wall collision
        if (newPaddle1Y < cornerSize && 10 + paddleWidth > wallThickness) {
          newPaddle1Y = Math.max(newPaddle1Y, cornerSize);
        }
        if (newPaddle1Y + paddle1Height > canvasHeight - cornerSize && 10 + paddleWidth > wallThickness) {
          newPaddle1Y = Math.min(newPaddle1Y, canvasHeight - cornerSize - paddle1Height);
        }
        
        // Player 2 (right paddle) wall collision  
        if (newPaddle2Y < cornerSize && canvasWidth - 20 < canvasWidth - wallThickness) {
          newPaddle2Y = Math.max(newPaddle2Y, cornerSize);
        }
        if (newPaddle2Y + paddle2Height > canvasHeight - cornerSize && canvasWidth - 20 < canvasWidth - wallThickness) {
          newPaddle2Y = Math.min(newPaddle2Y, canvasHeight - cornerSize - paddle2Height);
        }
      }
      
      paddle1Y = newPaddle1Y;
      paddle2Y = newPaddle2Y;

      ballX += ballVX;
      ballY += ballVY;

      // Ball collision with top/bottom walls (consistent reflection)
      if (ballY < 8) {
        ballY = 8;
        ballVY = Math.abs(ballVY); // Perfect reflection
        playSound(wallSound);
      }
      if (ballY > canvasHeight - 8) {
        ballY = canvasHeight - 8;
        ballVY = -Math.abs(ballVY); // Perfect reflection
        playSound(wallSound);
      }

      // Map-specific collision detection
      if (settings.mapType === 'center-wall') {
        // Center wall collision
        const wallHeight = canvasHeight * 0.6;
        const wallY = (canvasHeight - wallHeight) / 2;
        
        if (ballX > canvasWidth / 2 - 13 && ballX < canvasWidth / 2 + 13 && 
            ballY > wallY && ballY < wallY + wallHeight) {
          // Determine which side of the wall the ball hit
          if (ballX < canvasWidth / 2) {
            ballX = canvasWidth / 2 - 13;
          } else {
            ballX = canvasWidth / 2 + 13;
          }
          
          // Perfect reflection - just reverse the x velocity
          ballVX = -ballVX;
          
          // Keep y velocity the same for consistent bouncing
          playSound(wallSound);
        }
      }

      // Corner walls collision with consistent physics
      if (settings.mapType === 'corners') {
        const wallThickness = 5; // Match with the drawing thickness
        const cornerSize = 60; // Match with the drawing size
        
        // Check all corner wall collisions
        let wallHit = false;
        
        // Top walls
        if (ballY < wallThickness + 8) {
          if ((ballX < cornerSize) || (ballX > canvasWidth - cornerSize)) {
            ballY = wallThickness + 8;
            // Consistent reflection physics
            ballVY = Math.abs(ballVY);
            
            // Ensure minimum speeds to prevent getting stuck
            if (Math.abs(ballVX) < 2) {
              ballVX = ballVX > 0 ? 2 : -2;
            }
            
            wallHit = true;
          }
        }
        
        // Bottom walls  
        if (ballY > canvasHeight - wallThickness - 8) {
          if ((ballX < cornerSize) || (ballX > canvasWidth - cornerSize)) {
            ballY = canvasHeight - wallThickness - 8;
            // Consistent reflection physics
            ballVY = -Math.abs(ballVY);
            
            // Ensure minimum speeds to prevent getting stuck
            if (Math.abs(ballVX) < 2) {
              ballVX = ballVX > 0 ? 2 : -2;
            }
            
            wallHit = true;
          }
        }
        
        // Left walls
        if (ballX < wallThickness + 8) {
          if ((ballY < cornerSize) || (ballY > canvasHeight - cornerSize)) {
            ballX = wallThickness + 8;
            // Consistent reflection physics
            ballVX = Math.abs(ballVX);
            
            // Ensure minimum speeds to prevent getting stuck
            if (Math.abs(ballVY) < 2) {
              ballVY = ballVY > 0 ? 2 : -2;
            }
            
            wallHit = true;
          }
        }
        
        // Right walls
        if (ballX > canvasWidth - wallThickness - 8) {
          if ((ballY < cornerSize) || (ballY > canvasHeight - cornerSize)) {
            ballX = canvasWidth - wallThickness - 8;
            // Consistent reflection physics
            ballVX = -Math.abs(ballVX);
            
            // Ensure minimum speeds to prevent getting stuck
            if (Math.abs(ballVY) < 2) {
              ballVY = ballVY > 0 ? 2 : -2;
            }
            
            wallHit = true;
          }
        }
        
        if (wallHit) {
          playSound(wallSound);
        }
      }

      // Power-up collection
      if (powerUpActive && settings.powerUpsEnabled) {
        const powerUpCollision = (pX: number, pY: number, pSize: number) => {
          return Math.abs(ballX - pX) < pSize && Math.abs(ballY - pY) < pSize;
        };
        
        if (powerUpCollision(powerUpX, powerUpY, 20)) {
          powerUpActive = false;
          console.log("Powerup collected by", lastPaddleHitRef.current);
          
          // Give power-up to the player who last hit the ball
          if (lastPaddleHitRef.current === 'player1') {
            if (settings.paddleEnlargePowerUp) {
              // Update the ref directly for immediate effect in the game loop
              player1PowerUpsRef.current = {
                paddleEnlarge: { active: true, endTime: currentTime + 8000 }
              };
              
              // Also update React state for UI updates
              setPlayer1PowerUps({
                paddleEnlarge: { active: true, endTime: currentTime + 8000 }
              });
              console.log("Player 1 powerup activated, expires at", currentTime + 8000);
            }
          } else if (lastPaddleHitRef.current === 'player2') {
            if (settings.paddleEnlargePowerUp) {
              // Update the ref directly for immediate effect in the game loop
              player2PowerUpsRef.current = {
                paddleEnlarge: { active: true, endTime: currentTime + 8000 }
              };
              
              // Also update React state for UI updates
              setPlayer2PowerUps({
                paddleEnlarge: { active: true, endTime: currentTime + 8000 }
              });
              console.log("Player 2 powerup activated, expires at", currentTime + 8000);
            }
          }
        }
      }

      // We already check for power-up expiration at the start of the update function
      // This code is now redundant

      // Ball collision with left paddle (improved physics)
      const currentPaddle1Height = player1PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
      if (
        ballX - 8 < 20 &&
        ballX - 8 > 10 &&
        ballY > paddle1Y &&
        ballY < paddle1Y + currentPaddle1Height
      ) {
        ballX = 20 + 8;
        lastPaddleHitRef.current = 'player1'; // Track who hit the ball
        
        // Improved ball physics
        const relativeIntersectY = (paddle1Y + currentPaddle1Height/2) - ballY;
        const normalizedRelativeIntersectionY = relativeIntersectY / (currentPaddle1Height/2);
        const bounceAngle = normalizedRelativeIntersectionY * Math.PI/4; // Max 45 degree angle
        
        const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
        ballVX = speed * Math.cos(bounceAngle);
        ballVY = speed * -Math.sin(bounceAngle);
        
        // Ensure minimum speed and direction
        if (ballVX < 2) ballVX = 2;
        if (Math.abs(ballVY) < 0.5) ballVY = (Math.random() - 0.5) * 2;
        
        playSound(paddleSound);
      }

      // Ball collision with right paddle (improved physics)
      const currentPaddle2Height = player2PowerUpsRef.current.paddleEnlarge.active ? paddleHeight * 1.5 : paddleHeight;
      if (
        ballX + 8 > canvasWidth - 20 &&
        ballX + 8 < canvasWidth - 10 &&
        ballY > paddle2Y &&
        ballY < paddle2Y + currentPaddle2Height
      ) {
        ballX = canvasWidth - 20 - 8;
        lastPaddleHitRef.current = 'player2'; // Track who hit the ball
        
        // Improved ball physics
        const relativeIntersectY = (paddle2Y + currentPaddle2Height/2) - ballY;
        const normalizedRelativeIntersectionY = relativeIntersectY / (currentPaddle2Height/2);
        const bounceAngle = normalizedRelativeIntersectionY * Math.PI/4; // Max 45 degree angle
        
        const speed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
        ballVX = -speed * Math.cos(bounceAngle);
        ballVY = speed * -Math.sin(bounceAngle);
        
        // Ensure minimum speed and direction
        if (ballVX > -2) ballVX = -2;
        if (Math.abs(ballVY) < 0.5) ballVY = (Math.random() - 0.5) * 2;
        
        playSound(paddleSound);
      }

      // Ball out of bounds (score) - modified for corner walls
      let canScore = true;
      
      if (settings.mapType === 'corners') {
        // Check if ball is in scoring zone (avoid corner wall areas)
        const cornerSize = 60; // Match with the drawing size
        
        if ((ballY < cornerSize) || (ballY > canvasHeight - cornerSize)) {
          canScore = false;
        }
      }
      
      if (canScore) {
        if (ballX < 0) {
          rightScore++;
          playSound(scoreSound);
          resetBall();
        } else if (ballX > canvasWidth) {
          leftScore++;
          playSound(scoreSound);
          resetBall();
        }
      }

      // Win condition with custom score
      if (leftScore === settings.scoreToWin || rightScore === settings.scoreToWin) {
        setWinner(leftScore === settings.scoreToWin ? player1.username : player2.username);
        setScore({ left: leftScore, right: rightScore });
        gameOver = true;
        api.post('/matches', {
          player: player1.isGuest ? 'guest' : player1.username,
          opponent: player2.isGuest ? 'guest' : player2.username,
          winner: leftScore === settings.scoreToWin ? player1.username : player2.username,
          loser: leftScore === settings.scoreToWin ? player2.username : player1.username,
          leftScore,
          rightScore,
        })
        .catch(console.error);
      }
    }

    function resetBall() {
      // For center wall map, spawn the ball avoiding the center wall
      if (settings.mapType === 'center-wall') {
        const wallHeight = canvasHeight * 0.6;
        const wallY = (canvasHeight - wallHeight) / 2;
        
        // Randomly choose top or bottom to spawn the ball
        if (Math.random() > 0.5) {
          // Spawn at top
          ballX = canvasWidth / 2;
          ballY = Math.max(15, wallY - 15); // Safely above the wall
          ballVX = Math.random() > 0.5 ? 3 : -3;
          ballVY = 2; // Start moving downward
        } else {
          // Spawn at bottom
          ballX = canvasWidth / 2;
          ballY = Math.min(canvasHeight - 15, wallY + wallHeight + 15); // Safely below the wall
          ballVX = Math.random() > 0.5 ? 3 : -3;
          ballVY = -2; // Start moving upward
        }
      } else {
        // Normal spawn in the center for other maps
        ballX = canvasWidth / 2;
        ballY = canvasHeight / 2;
        ballVX = Math.random() > 0.5 ? 3 : -3;
        ballVY = (Math.random() - 0.5) * 4;
      }
      
      // Reset who last hit the ball on each point
      lastPaddleHitRef.current = null;
      
      setScore({ left: leftScore, right: rightScore });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationFrameId: number;
    const gameLoop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    gameLoop();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [player1.username, player2.username, restartKey, isAIGame, settings]);

  function handleRestart() {
    setWinner(null);
    setScore({ left: 0, right: 0 });
    setRestartKey((prev) => prev + 1); // Trigger re-render
  }

  console.log("PongGame: Rendering component with canvas");
  console.log("Power-up status:", { 
    player1: player1PowerUpsRef.current.paddleEnlarge.active,
    player2: player2PowerUpsRef.current.paddleEnlarge.active,
    lastHit: lastPaddleHitRef.current
  });
  
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span className="dark:text-white text-black">{player1.username}</span>
        <span className="dark:text-white text-black">{player2.username}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{
          background: "#222",
          display: "block",
          margin: "0 auto",
          imageRendering: "pixelated",
        }}
      />
      {winner && (
        <div
          className="absolute inset-0 flex items-center justify-center text-4xl text-white font-bold bg-black bg-opacity-70"
          style={{
            width: "500px",
            height: "300px",
            left: 0,
            top: 0,
            margin: "0 auto",
            borderRadius: "8px",
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
