import api from "../api/axios";
import React, { useRef, useEffect, useState } from "react";
import {
  useGameSettings,
  getDifficultySettings,
  DifficultySettings,
  GameSettings,
} from "../contexts/GameSettingsContext";
import { useTranslation } from "react-i18next";

// Game constants for consistent physics
// Ball speed is calculated based on the slider value (1-10)
// Min speed: 80 units/sec, Max speed: 400 units/sec
const calculateBallSpeed = (speedSetting: number): number => {
  // Ensure speed setting is within valid range
  const validSpeed = Math.max(1, Math.min(10, speedSetting));
  // Exponential scaling for more dramatic difference at higher settings
  return 80 + Math.pow(validSpeed - 1, 1.5) * 32;
};

// Standard normalized vector components (direction)
const STANDARD_NORMALIZED_X_SPEED = 0.8; // Normalized speed components (0-1)
const STANDARD_NORMALIZED_Y_SPEED = 0.4;

// Load audio files from the public folder for better Docker compatibility
const paddleSound = new Audio("/paddle.mp3");
const scoreSound = new Audio("/score.mp3");
const wallSound = new Audio("/wall.mp3");

/**
 * Time-based Movement System with Normalized Velocities
 *
 * This game uses a time-based movement system (delta time) rather than a frame-based system,
 * combined with normalized velocity values to ensure consistent game speed across all devices:
 *
 * 1. All velocities are normalized (values between 0-1, typically around 0.3-0.8)
 * 2. A configurable ball speed (using a slider from 1-10) is applied to these normalized values
 * 3. Movement is scaled by deltaTime (time since last frame), ensuring consistent speed
 * 4. This approach guarantees uniform gameplay experience regardless of device performance
 *
 * Benefits of this approach:
 * - Predictable ball behavior (always bounces at same angles and speeds)
 * - Smooth gameplay on both high-end and low-end devices
 * - Easier to balance difficulty since speeds are standardized
 *
 * Key parameters:
 * - Ball Speed: Configurable from 1-10, translating to 80-400 units per second (exponential scaling)
 * - paddleSpeedPerSecond: 300 units the paddle moves per second
 * - normalizedVelocities: X=0.8, Y=0.4 (standard normalized speed components)
 */

interface PongGameProps {
  player1: { username: string; isGuest: boolean; id?: string };
  player2: { username: string; isGuest: boolean; id?: string };
  onGameEnd?: (result: {
    winnerId: number;
    winnerAlias: string;
    // e.g. score: { p1: number; p2: number };
  }) => void;
  isAIGame?: boolean; // New prop to indicate AI game
  onReturnToMenu?: () => void; // Callback to return to menu
}

/**
 * AI States for Finite State Machine
 * The AI uses a simple state machine to make decisions, which helps reduce jitter
 * and create more natural, varied behaviors based on the game situation.
 */
enum AIState {
  CORRECT = "CORRECT", // Move to the predicted correct position to intercept the ball
  OPPOSITE = "OPPOSITE", // Move in the wrong direction (for easier difficulty levels)
  IDLE = "IDLE", // Don't move (simulates human reaction delay or mistakes)
  POWERUP = "POWERUP", // Target the power-up instead of the ball
}

/**
 * AI Game State Snapshot
 * This interface defines all the information the AI needs to make decisions.
 * The snapshot is taken once per second to prevent the AI from reacting too quickly.
 */
interface AIGameSnapshot {
  ballX: number; // Horizontal position of the ball
  ballY: number; // Vertical position of the ball
  ballVX: number; // Horizontal velocity of the ball (in units per second, time-based)
  ballVY: number; // Vertical velocity of the ball (in units per second, time-based)
  paddle2Y: number; // AI paddle position
  paddle1Y: number; // Player paddle position
  timestamp: number; // When this snapshot was taken
  powerUpActive: boolean; // Whether a power-up is currently on screen
  powerUpX?: number; // Horizontal position of power-up (if active)
  powerUpY?: number; // Vertical position of power-up (if active)
  mapType: string; // Which map is being played (affects strategy)
  canvasWidth: number; // Width of the game area
  canvasHeight: number; // Height of the game area
}

/**
 * AI Controller Class
 * This class handles all AI logic, including predicting ball trajectory,
 * decision making based on game state, and simulating player input.
 * The AI has different behavior patterns based on difficulty level.
 *
 * Key features:
 * - Data collection limited to once per second (snapshots)
 * - Movement uses delta time for consistent speed across frame rates
 * - Difficulty-based reaction time and accuracy simulation
 * - Different strategies for different maps
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

  // Game settings reference for ball speed
  private gameSettings: GameSettings;

  // Simulated keyboard input (what keys the AI is "pressing")
  private keySimulator: { [key: string]: boolean } = {};

  // Timestamp of the last paddle movement (used for limiting movement speed)
  private lastMoveTime: number = 0;

  // Timestamp of the last state change (prevents rapid state switching)
  private lastStateChange: number = 0;

  // How long to stay in the current state (milliseconds)
  private stateDuration: number = 0;

  // Current power-up position, if any
  private powerUpPosition: { x: number; y: number } | null = null;

  // Current map type (affects strategy)
  private mapType: string = "classic";

  /**
   * Constructor - Initialize the AI with specific difficulty settings
   * @param difficultySettings Controls AI accuracy, reaction time, etc.
   */
  constructor(
    difficultySettings: DifficultySettings,
    gameSettings: GameSettings
  ) {
    this.difficulty = difficultySettings;
    this.gameSettings = gameSettings;
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
    this.analyzeGameState(); // 1. Analyze where the ball is going
    this.updateState(); // 2. Decide what state to be in (chase ball, get powerup, etc)
    this.planNextMove(); // 3. Plan where to move the paddle
  }

  /**
   * Analyze the current game state to predict ball trajectory
   * This is the AI's "eyes" - it looks at the ball's position and velocity
   * to predict where the ball will be when it reaches the AI's paddle.
   */
  private analyzeGameState(): void {
    if (!this.lastSnapshot) return;

    const { ballX, ballY, ballVX, ballVY, paddle2Y } = this.lastSnapshot; // Predict where the ball will be when it reaches the paddle
    if (ballVX > 0) {
      // Ball moving towards AI (right side)
      // Calculate time until ball reaches paddle position
      // Use the current ball speed from game settings
      const currentBallSpeed = calculateBallSpeed(this.gameSettings.ballSpeed);
      const effectiveVelocity = ballVX * currentBallSpeed;
      const paddleX = 480; // Right paddle X position
      const timeToReachPaddle = Math.max(
        0.001,
        (paddleX - ballX) / Math.abs(effectiveVelocity)
      ); // Ensure positive time

      // Use physics to predict where ball will be vertically when it reaches paddle
      this.predictedBallY = this.predictBallPosition(
        ballY,
        ballVY,
        timeToReachPaddle
      );
    } else {
      // When ball is moving away from AI, gradually move toward center
      // This is more human-like behavior - players tend to reset position
      // when the ball is moving away from them
      const currentPaddleCenter = paddle2Y + 30;
      const centerY = 150;
      // Gradually move toward center when ball is away (10% per update)
      this.predictedBallY =
        currentPaddleCenter + (centerY - currentPaddleCenter) * 0.1;
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
  private predictBallPosition(
    ballY: number,
    ballVY: number,
    time: number
  ): number {
    // Simple physics: position = startPosition + (velocity * time)
    let predictedY = ballY + ballVY * time;

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

    const {
      ballX,
      ballY,
      ballVX,
      powerUpActive,
      powerUpX,
      powerUpY,
      mapType,
      canvasWidth,
      canvasHeight,
    } = this.lastSnapshot;
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
      const distanceToPowerUp = Math.abs(
        this.lastSnapshot.paddle2Y + 30 - this.powerUpPosition.y
      );

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
    if (ballVX > 0) {
      // Only consider wrong direction when ball is coming towards AI
      // Different accuracy levels based on difficulty setting
      switch (this.difficulty.accuracy) {
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
    } // When ball is moving away: Occasionally pause/idle based on difficulty
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

    const {
      paddle2Y,
      ballX,
      ballY,
      ballVX,
      ballVY,
      canvasWidth,
      canvasHeight,
    } = this.lastSnapshot;
    const paddleHeight = 60; // Standard paddle height

    // Use different positioning strategies based on the current AI state
    switch (this.currentState) {
      case AIState.CORRECT: // Normal play - try to hit the ball
        // Apply map-specific targeting strategies
        if (this.mapType === "corners") {
          // CORNERS MAP STRATEGY: Avoid corner traps, stay in the scorable zone
          if (ballVX > 0) {
            // Ball coming towards AI
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
              this.targetY = this.predictedBallY - paddleHeight / 2;
            }
          } else {
            // When ball moving away, stay in the middle (safest position)
            this.targetY = canvasHeight / 2 - paddleHeight / 2;
          }
        } else if (this.mapType === "center-wall") {
          // CENTER WALL MAP STRATEGY: Simply chase the ball
          // For this map, the simple approach works best - just track the ball
          this.targetY = this.predictedBallY - paddleHeight / 2;
        } else {
          // CLASSIC MAP STRATEGY: Just track the ball's predicted position
          this.targetY = this.predictedBallY - paddleHeight / 2;
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
          this.targetY = this.powerUpPosition.y - paddleHeight / 2;
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
    this.targetY = Math.max(
      0,
      Math.min(canvasHeight - paddleHeight, this.targetY)
    );
  }

  // Simulate keyboard input (called every frame)
  // This is where the AI actually controls the paddle movement
  simulateInput(
    currentPaddleY: number,
    deltaTime: number = 0
  ): { [key: string]: boolean } {
    const paddleHeight = 60; // Standard paddle height
    const targetCenter = this.targetY + paddleHeight / 2;
    const currentCenter = currentPaddleY + paddleHeight / 2;
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
    const reactionDelay =
      this.difficulty.accuracy < 0.95
        ? (1 - this.difficulty.reactionTime) * 100
        : 16; // Minimum 16ms delay even for expert (matches human reaction)

    if (currentTime - this.lastMoveTime < reactionDelay) {
      return this.keySimulator; // Wait before reacting
    }

    // Use delta time instead of fixed frame timing
    // For a 60fps game, deltaTime is ~0.01667 seconds (16.67ms)
    // This ensures consistent AI movement regardless of frame rate
    const minimumUpdateTime = 0.016; // 16ms in seconds
    if (
      deltaTime > 0 &&
      (currentTime - this.lastMoveTime) / 1000 < minimumUpdateTime
    ) {
      return this.keySimulator;
    }

    // Move toward target with smoother acceleration/deceleration
    if (Math.abs(difference) > threshold) {
      if (difference > 0) {
        // Need to move down
        this.keySimulator["ArrowDown"] = true;
      } else {
        // Need to move up
        this.keySimulator["ArrowUp"] = true;
      }
      // Update the lastMoveTime based on actual deltaTime instead of current time
      // This ensures movement is smoother with consistent frame rates
      this.lastMoveTime = currentTime;
    }

    return this.keySimulator;
  }

  getCurrentState(): AIState {
    return this.currentState;
  }

  getDebugInfo(): string {
    const ballSpeed = this.lastSnapshot
      ? calculateBallSpeed(this.gameSettings.ballSpeed)
      : "N/A";
    return `AI State: ${this.currentState}, Target Y: ${this.targetY.toFixed(
      1
    )}, Map: ${this.mapType}, Ball Speed: ${ballSpeed}, Current Y: ${
      this.lastSnapshot?.paddle2Y.toFixed(1) || "N/A"
    }`;
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

const PongGame: React.FC<PongGameProps> = ({
  player1,
  player2,
  onGameEnd,
  isAIGame,
  onReturnToMenu,
}) => {
  console.log("PongGame: Initializing with players", {
    player1,
    player2,
    isAIGame,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const animationFrameRef = useRef<number | null>(null);
  const embedded = Boolean(onGameEnd);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [restartKey, setRestartKey] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false); // New state to track game-over state
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState<string | null>(null); // for screen reader aria announcements
  const { settings } = useGameSettings();
  const { t } = useTranslation();

  console.log("PongGame: Using game settings", settings);

  // for screen reader announcement
  useEffect(() => {
    if (isGameOver && winner) {
      setLiveMessage(null); // force remount
      setTimeout(() => {
        setLiveMessage(t("pongGame.winnerMessage", { winner }));
        setTimeout(() => {
          liveRegionRef.current?.focus();
        }, 10);
      }, 100);
    }
  }, [t, isGameOver, winner]);
  // Focus canvas when component loads to capture keyboard events immediately
  useEffect(() => {
    if (canvasRef.current && !isGameOver && !winner) {
      // Only focus the canvas if we're not in game over state and no winner is declared
      canvasRef.current.focus();
    }
  }, [isGameOver, winner]);

  // Create a ref to track canvas focus state that persists across renders
  const isFocusedRef = useRef(false);

  // Handle keyboard events with focus awareness
  // Create ref for tracking paused state
  const isPausedRef = useRef(false);

  // Explicitly disable focus and set game over state when a winner is declared
  useEffect(() => {
    if (winner) {
      // Disable focus and keyboard events when game is over
      setIsFocused(false);
      isFocusedRef.current = false;
      setIsGameOver(true);

      if (canvasRef.current) {
        canvasRef.current.blur();
        // Remove focus programmatically to ensure no keyboard events are captured
        canvasRef.current.removeAttribute("tabindex");

        // Stop the animation frame to prevent any game updates
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }

      // Prevent any keyboard events from being captured during game over state
      document.body.focus();

      // Create a listener to prevent focus on canvas when game is over
      const preventFocus = (event: FocusEvent) => {
        if (event.target === canvasRef.current && canvasRef.current) {
          canvasRef.current.blur();
          event.preventDefault();
          return false;
        }
      };

      // Add event listener to prevent focus
      document.addEventListener("focusin", preventFocus);

      // Clean up the listener when component unmounts
      return () => {
        document.removeEventListener("focusin", preventFocus);
      };
    }
  }, [winner]);

  useEffect(() => {
    // Keyboard event handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip all game-related key handling if game is over
      if (isGameOver) {
        return;
      }

      // Only process any game-related keys when canvas is focused
      if (isFocusedRef.current) {
        // Handle pause toggle with 'p' key
        if (e.key === "p") {
          e.preventDefault();
          setIsPaused((prev) => {
            const newPausedState = !prev;
            isPausedRef.current = newPausedState;
            return newPausedState;
          });
          return;
        }

        // For other game control keys
        if (
          [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "w",
            "a",
            "s",
            "d",
            " ",
          ].includes(e.key)
        ) {
          e.preventDefault();
          keysPressed.current[e.key] = true;
        }
      }
      // When not focused, allow normal browser behavior (scrolling with arrow keys, etc.)
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // For game control keys, only prevent default behavior if canvas is focused
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "w",
          "a",
          "s",
          "d",
          " ",
        ].includes(e.key)
      ) {
        if (isFocusedRef.current) {
          e.preventDefault();
          keysPressed.current[e.key] = false;
        }
        // When not focused, allow normal browser behavior
      }
    };

    // Add listeners
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle focus events
  const handleFocus = () => {
    console.log("Game canvas focused");
    setIsFocused(true);
    isFocusedRef.current = true;
  };

  const handleBlur = () => {
    console.log("Game canvas blurred");
    setIsFocused(false);
    isFocusedRef.current = false;

    // Only pause the game when focus is lost if the game isn't over
    // This prevents auto-pause when clicking buttons at game end
    if (!isGameOver && !winner) {
      setIsPaused(true);
      isPausedRef.current = true;
    }

    // Clear all key states when focus is lost to prevent stuck keys
    keysPressed.current = {};
  };

  // AI instance
  const aiRef = useRef<PongAI | null>(null);

  // Power-up states
  const [player1PowerUps, setPlayer1PowerUps] = useState<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 },
  });

  const [player2PowerUps, setPlayer2PowerUps] = useState<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 },
  });

  // Track last paddle that hit the ball
  const lastPaddleHitRef = useRef<"player1" | "player2" | null>(null);

  // Use refs to track power-up states for immediate access in the game loop
  const player1PowerUpsRef = useRef<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 },
  });

  const player2PowerUpsRef = useRef<{
    paddleEnlarge: { active: boolean; endTime: number };
  }>({
    paddleEnlarge: { active: false, endTime: 0 },
  });

  useEffect(() => {
    console.log("PongGame: useEffect running, initializing game");

    // Detect Firefox browser for specific adjustments
    const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
    console.log("Browser detection:", {
      isFirefox,
      userAgent: navigator.userAgent,
    });

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
      // Use normalized velocity components for consistent behavior
      ballVX =
        Math.random() > 0.5
          ? STANDARD_NORMALIZED_X_SPEED
          : -STANDARD_NORMALIZED_X_SPEED,
      ballVY = (Math.random() - 0.5) * STANDARD_NORMALIZED_Y_SPEED * 2;

    // Initialize ball position safely for center wall map
    if (settings.mapType === "center-wall") {
      const wallHeight = canvasHeight * 0.6;
      const wallY = (canvasHeight - wallHeight) / 2;

      // Start ball either above or below the wall
      if (Math.random() > 0.5) {
        ballY = wallY - 15; // Above wall
        ballVY = STANDARD_NORMALIZED_Y_SPEED; // Moving down
      } else {
        ballY = wallY + wallHeight + 15; // Below wall
        ballVY = -STANDARD_NORMALIZED_Y_SPEED; // Moving up
      }
    }
    const paddleSpeed = 6;
    let leftScore = 0,
      rightScore = 0;
    let gameOver = false;

    // Initialize AI if this is an AI game
    // The AI is only created once per game session and persists between points
    if (isAIGame && !aiRef.current) {
      console.log(
        "PongGame: Creating new AI with difficulty",
        settings.aiDifficulty
      );
      const difficultySettings = getDifficultySettings(settings.aiDifficulty);
      aiRef.current = new PongAI(difficultySettings, settings);
    }

    // AI snapshot timing - controls how often the AI updates its view of the game
    // Higher values make the AI more human-like by limiting its "perception" speed
    let lastAISnapshotTime = 0; // Timestamp of the last game state snapshot

    // Power-up system
    let powerUpX = -100,
      powerUpY = -100; // Start off-screen
    let powerUpActive = false;
    let powerUpType = "paddleEnlarge";
    let lastPowerUpSpawn = 0;
    let lastPaddleHit: "player1" | "player2" | null = null; // Track which player last hit the ball
    const powerUpSpawnInterval = 15000; // 15 seconds

    // Reset power-ups when game restarts
    player1PowerUpsRef.current = {
      paddleEnlarge: { active: false, endTime: 0 },
    };
    player2PowerUpsRef.current = {
      paddleEnlarge: { active: false, endTime: 0 },
    };

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
        case "corners":
          // Draw thinner corner walls - only on edges
          const wallThickness = 5;
          const cornerSize = 60;

          // Top left corner
          ctx.fillRect(0, 0, cornerSize, wallThickness);
          ctx.fillRect(0, 0, wallThickness, cornerSize);

          // Top right corner
          ctx.fillRect(canvasWidth - cornerSize, 0, cornerSize, wallThickness);
          ctx.fillRect(
            canvasWidth - wallThickness,
            0,
            wallThickness,
            cornerSize
          );

          // Bottom left corner
          ctx.fillRect(
            0,
            canvasHeight - wallThickness,
            cornerSize,
            wallThickness
          );
          ctx.fillRect(0, canvasHeight - cornerSize, wallThickness, cornerSize);

          // Bottom right corner
          ctx.fillRect(
            canvasWidth - cornerSize,
            canvasHeight - wallThickness,
            cornerSize,
            wallThickness
          );
          ctx.fillRect(
            canvasWidth - wallThickness,
            canvasHeight - cornerSize,
            wallThickness,
            cornerSize
          );
          break;

        case "center-wall":
          // Draw center wall with gaps at top and bottom
          const wallHeight = canvasHeight * 0.6; // 60% of canvas height
          const wallY = (canvasHeight - wallHeight) / 2;
          ctx.fillRect(canvasWidth / 2 - 5, wallY, 10, wallHeight);
          break;

        case "classic":
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
      const paddle1Height = player1PowerUpsRef.current.paddleEnlarge.active
        ? paddleHeight * 1.5
        : paddleHeight;
      ctx.fillRect(10, paddle1Y, paddleWidth, paddle1Height);

      // Player 2 paddle (right)
      const paddle2Height = player2PowerUpsRef.current.paddleEnlarge.active
        ? paddleHeight * 1.5
        : paddleHeight;
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
      if (
        player1PowerUpsRef.current.paddleEnlarge.active ||
        player2PowerUpsRef.current.paddleEnlarge.active
      ) {
        ctx.save();
        ctx.fillStyle = "#FFD700";
        ctx.font = "12px Arial";

        if (player1PowerUpsRef.current.paddleEnlarge.active) {
          const timeLeft = Math.max(
            0,
            (player1PowerUpsRef.current.paddleEnlarge.endTime - Date.now()) /
              1000
          );
          ctx.fillText(
            `${t("powerups.bigPaddle")}: ${timeLeft.toFixed(1)}s`,
            20,
            canvasHeight - 20
          );
        }

        if (player2PowerUpsRef.current.paddleEnlarge.active) {
          const timeLeft = Math.max(
            0,
            (player2PowerUpsRef.current.paddleEnlarge.endTime - Date.now()) /
              1000
          );
          ctx.fillText(
            `${t("powerups.bigPaddle")}: ${timeLeft.toFixed(1)}s`,
            canvasWidth - 120,
            canvasHeight - 20
          );
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

    function update(deltaTime: number) {
      if (gameOver) return;

      const currentTime = Date.now();

      // Update power-up timers
      if (
        player1PowerUpsRef.current.paddleEnlarge.active &&
        currentTime > player1PowerUpsRef.current.paddleEnlarge.endTime
      ) {
        // Update the ref directly for immediate effect
        player1PowerUpsRef.current = {
          paddleEnlarge: { active: false, endTime: 0 },
        };

        // Also update React state for UI
        setPlayer1PowerUps({
          paddleEnlarge: { active: false, endTime: 0 },
        });
        console.log("Player 1 powerup expired");
      }

      if (
        player2PowerUpsRef.current.paddleEnlarge.active &&
        currentTime > player2PowerUpsRef.current.paddleEnlarge.endTime
      ) {
        // Update the ref directly for immediate effect
        player2PowerUpsRef.current = {
          paddleEnlarge: { active: false, endTime: 0 },
        };

        // Also update React state for UI
        setPlayer2PowerUps({
          paddleEnlarge: { active: false, endTime: 0 },
        });
        console.log("Player 2 powerup expired");
      }

      // Spawn power-ups
      if (
        settings.powerUpsEnabled &&
        settings.paddleEnlargePowerUp &&
        !powerUpActive &&
        currentTime - lastPowerUpSpawn > powerUpSpawnInterval
      ) {
        powerUpActive = true;
        powerUpX = Math.random() * (canvasWidth - 100) + 50;
        powerUpY = Math.random() * (canvasHeight - 100) + 50;
        lastPowerUpSpawn = currentTime;
      }

      // AI Logic - Take snapshot once per second
      if (
        isAIGame &&
        aiRef.current &&
        currentTime - lastAISnapshotTime >= 1000
      ) {
        // Limit AI "thinking" to once per second
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
          canvasHeight: canvasHeight,
        };
        aiRef.current.takeSnapshot(snapshot);
        lastAISnapshotTime = currentTime;

        // Only log AI state occasionally to reduce console spam
        if (Math.random() < 0.1) {
          console.log(aiRef.current.getDebugInfo());
        }
      }

      // AI paddle control - simulate keyboard input with delta time
      if (isAIGame && aiRef.current) {
        const aiInput = aiRef.current.simulateInput(paddle2Y, deltaTime);
        // Override keysPressed for player 2 (AI)
        keysPressed.current["ArrowUp"] = aiInput["ArrowUp"] || false;
        keysPressed.current["ArrowDown"] = aiInput["ArrowDown"] || false;
      }

      // Move paddles based on keys pressed with wall collision and deltaTime
      // Convert paddleSpeed to units per second
      const paddleSpeedPerSecond = 300; // Adjusted based on original value to maintain similar feel
      const frameAdjustedPaddleSpeed = paddleSpeedPerSecond * deltaTime;

      let newPaddle1Y = paddle1Y;
      let newPaddle2Y = paddle2Y;

      if (keysPressed.current["w"])
        newPaddle1Y = Math.max(0, paddle1Y - frameAdjustedPaddleSpeed);
      if (keysPressed.current["s"]) {
        const currentPaddleHeight = player1PowerUpsRef.current.paddleEnlarge
          .active
          ? paddleHeight * 1.5
          : paddleHeight;
        newPaddle1Y = Math.min(
          canvasHeight - currentPaddleHeight,
          paddle1Y + frameAdjustedPaddleSpeed
        );
      }
      if (keysPressed.current["ArrowUp"])
        newPaddle2Y = Math.max(0, paddle2Y - frameAdjustedPaddleSpeed);
      if (keysPressed.current["ArrowDown"]) {
        const currentPaddleHeight = player2PowerUpsRef.current.paddleEnlarge
          .active
          ? paddleHeight * 1.5
          : paddleHeight;
        newPaddle2Y = Math.min(
          canvasHeight - currentPaddleHeight,
          paddle2Y + frameAdjustedPaddleSpeed
        );
      }

      // Check wall collisions for corner walls map
      if (settings.mapType === "corners") {
        const wallThickness = 5; // Match the drawing thickness
        const cornerSize = 60; // Match the drawing size
        const paddle1Height = player1PowerUpsRef.current.paddleEnlarge.active
          ? paddleHeight * 1.5
          : paddleHeight;
        const paddle2Height = player2PowerUpsRef.current.paddleEnlarge.active
          ? paddleHeight * 1.5
          : paddleHeight;

        // Player 1 (left paddle) wall collision
        if (newPaddle1Y < cornerSize && 10 + paddleWidth > wallThickness) {
          newPaddle1Y = Math.max(newPaddle1Y, cornerSize);
        }
        if (
          newPaddle1Y + paddle1Height > canvasHeight - cornerSize &&
          10 + paddleWidth > wallThickness
        ) {
          newPaddle1Y = Math.min(
            newPaddle1Y,
            canvasHeight - cornerSize - paddle1Height
          );
        }

        // Player 2 (right paddle) wall collision
        if (
          newPaddle2Y < cornerSize &&
          canvasWidth - 20 < canvasWidth - wallThickness
        ) {
          newPaddle2Y = Math.max(newPaddle2Y, cornerSize);
        }
        if (
          newPaddle2Y + paddle2Height > canvasHeight - cornerSize &&
          canvasWidth - 20 < canvasWidth - wallThickness
        ) {
          newPaddle2Y = Math.min(
            newPaddle2Y,
            canvasHeight - cornerSize - paddle2Height
          );
        }
      }

      paddle1Y = newPaddle1Y;
      paddle2Y = newPaddle2Y;

      // Apply ball movement using deltaTime for consistent speed
      // Use the selected ball speed from settings
      const currentBallSpeed = calculateBallSpeed(settings.ballSpeed);

      // Use small, consistent steps for ball movement to avoid Firefox issues
      // This performs a simplified "sub-step" physics update for smoother motion
      // Firefox sometimes has larger time gaps which can cause the ball to "jump" through objects

      // Firefox-specific adjustments
      const isFirefox =
        navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
      const maxStep = isFirefox ? 1 / 240 : 1 / 120; // Smaller steps for Firefox (240 Hz)

      // Store previous position for stuck detection
      const prevBallX = ballX;
      const prevBallY = ballY;

      let remainingDelta = deltaTime;
      let subStepCount = 0;

      while (remainingDelta > 0) {
        const stepDelta = Math.min(remainingDelta, maxStep);
        subStepCount++;

        // Apply movement for this sub-step
        ballX += ballVX * currentBallSpeed * stepDelta;
        ballY += ballVY * currentBallSpeed * stepDelta;

        // Ensure the ball never gets "stuck" by checking for very small velocities
        // Firefox seems more prone to velocity degradation in some cases
        const MIN_VELOCITY = 0.1;
        if (Math.abs(ballVX) < MIN_VELOCITY) {
          ballVX = ballVX >= 0 ? MIN_VELOCITY : -MIN_VELOCITY;
        }
        if (Math.abs(ballVY) < MIN_VELOCITY) {
          ballVY = ballVY >= 0 ? MIN_VELOCITY : -MIN_VELOCITY;
        }

        // If ball appears stuck in same position for too many frames, reset it
        // This is a last resort for Firefox-specific issues
        if (frameCount % 60 === 0) {
          // Check periodically
          if (Math.abs(ballVX) < 0.001 && Math.abs(ballVY) < 0.001) {
            console.warn("Ball appears stuck, nudging it into motion");
            ballVX = Math.random() > 0.5 ? 0.3 : -0.3;
            ballVY = Math.random() > 0.5 ? 0.2 : -0.2;
          }
        }

        remainingDelta -= stepDelta;
      }

      // Increment frame counter
      frameCount++;

      // Check for ball getting truly stuck (no movement after all updates)
      // This is a Firefox-specific failsafe
      if (
        frameCount > 60 && // Only check after game has been running
        ballX === prevBallX &&
        ballY === prevBallY &&
        subStepCount > 0
      ) {
        // Ball position didn't change despite updates
        console.warn(
          "Ball appears completely stuck - applying emergency reset"
        );

        // Move ball away from current position slightly and restore velocity
        ballX += (Math.random() - 0.5) * 5;
        ballY += (Math.random() - 0.5) * 5;

        // Reset velocity to standard values
        ballVX =
          Math.random() > 0.5
            ? STANDARD_NORMALIZED_X_SPEED
            : -STANDARD_NORMALIZED_X_SPEED;
        ballVY = (Math.random() - 0.5) * STANDARD_NORMALIZED_Y_SPEED * 2;
      }

      // Ball collision with top/bottom walls (consistent reflection)
      // Enhanced with minimum velocity to prevent getting stuck
      if (ballY < 8) {
        ballY = 8;
        // Ensure minimum vertical velocity after bounce
        ballVY = Math.max(Math.abs(ballVY), 0.2);
        playSound(wallSound);
      }
      if (ballY > canvasHeight - 8) {
        ballY = canvasHeight - 8;
        // Ensure minimum vertical velocity after bounce
        ballVY = -Math.max(Math.abs(ballVY), 0.2);
        playSound(wallSound);
      }

      // Firefox debug helper - detects if ball is moving abnormally slow
      // and logs diagnostic information
      const ballSpeed = Math.sqrt(ballVX * ballVX + ballVY * ballVY);
      if (ballSpeed < 0.05 && frameCount % 60 === 0) {
        console.warn("Warning: Ball moving very slowly", {
          ballX,
          ballY,
          ballVX,
          ballVY,
          speed: ballSpeed,
          browser: navigator.userAgent,
        });
      }

      // Map-specific collision detection
      if (settings.mapType === "center-wall") {
        // Center wall collision
        const wallHeight = canvasHeight * 0.6;
        const wallY = (canvasHeight - wallHeight) / 2;

        if (
          ballX > canvasWidth / 2 - 13 &&
          ballX < canvasWidth / 2 + 13 &&
          ballY > wallY &&
          ballY < wallY + wallHeight
        ) {
          // Determine which side of the wall the ball hit
          if (ballX < canvasWidth / 2) {
            ballX = canvasWidth / 2 - 13;
          } else {
            ballX = canvasWidth / 2 + 13;
          }

          // Perfect reflection - reverse direction but maintain normalized speed
          ballVX = -ballVX;

          // Ensure consistent speed after bouncing
          if (Math.abs(ballVX) < 0.3) ballVX = ballVX > 0 ? 0.3 : -0.3;

          // Keep y velocity the same for consistent bouncing
          playSound(wallSound);
        }
      }

      // Corner walls collision with consistent physics
      if (settings.mapType === "corners") {
        const wallThickness = 5; // Match with the drawing thickness
        const cornerSize = 60; // Match with the drawing size

        // Check all corner wall collisions
        let wallHit = false;

        // Top walls
        if (ballY < wallThickness + 8) {
          if (ballX < cornerSize || ballX > canvasWidth - cornerSize) {
            ballY = wallThickness + 8;
            // Consistent reflection physics
            ballVY = Math.abs(ballVY);

            // Use normalized values for consistent speed
            // Ensure x-velocity is adequate to prevent getting stuck
            if (Math.abs(ballVX) < 0.3) {
              ballVX = ballVX > 0 ? 0.3 : -0.3;
            }

            wallHit = true;
          }
        }

        // Bottom walls
        if (ballY > canvasHeight - wallThickness - 8) {
          if (ballX < cornerSize || ballX > canvasWidth - cornerSize) {
            ballY = canvasHeight - wallThickness - 8;
            // Consistent reflection physics
            ballVY = -Math.abs(ballVY);

            // Use normalized values for consistent speed
            // Ensure x-velocity is adequate to prevent getting stuck
            if (Math.abs(ballVX) < 0.3) {
              ballVX = ballVX > 0 ? 0.3 : -0.3;
            }

            wallHit = true;
          }
        }

        // Left walls
        if (ballX < wallThickness + 8) {
          if (ballY < cornerSize || ballY > canvasHeight - cornerSize) {
            ballX = wallThickness + 8;
            // Consistent reflection physics
            ballVX = Math.abs(ballVX);

            // Use normalized values for consistent speed
            // Ensure y-velocity is adequate to prevent getting stuck
            if (Math.abs(ballVY) < 0.3) {
              ballVY = ballVY > 0 ? 0.3 : -0.3;
            }

            wallHit = true;
          }
        }

        // Right walls
        if (ballX > canvasWidth - wallThickness - 8) {
          if (ballY < cornerSize || ballY > canvasHeight - cornerSize) {
            ballX = canvasWidth - wallThickness - 8;
            // Consistent reflection physics
            ballVX = -Math.abs(ballVX);

            // Use normalized values for consistent speed
            // Ensure y-velocity is adequate to prevent getting stuck
            if (Math.abs(ballVY) < 0.3) {
              ballVY = ballVY > 0 ? 0.3 : -0.3;
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
          if (lastPaddleHitRef.current === "player1") {
            if (settings.paddleEnlargePowerUp) {
              // Update the ref directly for immediate effect in the game loop
              player1PowerUpsRef.current = {
                paddleEnlarge: { active: true, endTime: currentTime + 8000 },
              };

              // Also update React state for UI updates
              setPlayer1PowerUps({
                paddleEnlarge: { active: true, endTime: currentTime + 8000 },
              });
              console.log(
                "Player 1 powerup activated, expires at",
                currentTime + 8000
              );
            }
          } else if (lastPaddleHitRef.current === "player2") {
            if (settings.paddleEnlargePowerUp) {
              // Update the ref directly for immediate effect in the game loop
              player2PowerUpsRef.current = {
                paddleEnlarge: { active: true, endTime: currentTime + 8000 },
              };

              // Also update React state for UI updates
              setPlayer2PowerUps({
                paddleEnlarge: { active: true, endTime: currentTime + 8000 },
              });
              console.log(
                "Player 2 powerup activated, expires at",
                currentTime + 8000
              );
            }
          }
        }
      }

      // We already check for power-up expiration at the start of the update function
      // This code is now redundant

      // Ball collision with left paddle (improved physics)
      const currentPaddle1Height = player1PowerUpsRef.current.paddleEnlarge
        .active
        ? paddleHeight * 1.5
        : paddleHeight;
      if (
        ballX - 8 < 20 &&
        ballX - 8 > 10 &&
        ballY > paddle1Y &&
        ballY < paddle1Y + currentPaddle1Height
      ) {
        ballX = 20 + 8;
        lastPaddleHitRef.current = "player1"; // Track who hit the ball

        // Improved ball physics (with consistent speed)
        const relativeIntersectY = paddle1Y + currentPaddle1Height / 2 - ballY;
        const normalizedRelativeIntersectionY =
          relativeIntersectY / (currentPaddle1Height / 2);
        const bounceAngle = (normalizedRelativeIntersectionY * Math.PI) / 4; // Max 45 degree angle

        // Use normalized vector components to maintain consistent speed
        // This ensures the ball always moves at the same speed after bouncing
        const normalizedSpeedX = 0.8; // Standard horizontal speed component (normalized)
        ballVX = normalizedSpeedX; // Always moves to the right after hitting left paddle

        // Y-component depends on where the paddle was hit
        // The further from center, the steeper the angle
        ballVY = -normalizedSpeedX * Math.tan(bounceAngle);

        // Ensure y-speed doesn't get too extreme
        if (Math.abs(ballVY) < 0.1) {
          // Add a small vertical component if too flat
          ballVY = Math.random() < 0.5 ? -0.1 : 0.1;
        } else if (Math.abs(ballVY) > 0.7) {
          // Cap the vertical speed for playability
          ballVY = ballVY > 0 ? 0.7 : -0.7;
        }

        playSound(paddleSound);
      }

      // Ball collision with right paddle (improved physics)
      const currentPaddle2Height = player2PowerUpsRef.current.paddleEnlarge
        .active
        ? paddleHeight * 1.5
        : paddleHeight;
      if (
        ballX + 8 > canvasWidth - 20 &&
        ballX + 8 < canvasWidth - 10 &&
        ballY > paddle2Y &&
        ballY < paddle2Y + currentPaddle2Height
      ) {
        ballX = canvasWidth - 20 - 8;
        lastPaddleHitRef.current = "player2"; // Track who hit the ball

        // Improved ball physics (with consistent speed)
        const relativeIntersectY = paddle2Y + currentPaddle2Height / 2 - ballY;
        const normalizedRelativeIntersectionY =
          relativeIntersectY / (currentPaddle2Height / 2);
        const bounceAngle = (normalizedRelativeIntersectionY * Math.PI) / 4; // Max 45 degree angle

        // Use normalized vector components to maintain consistent speed
        // This ensures the ball always moves at the same speed after bouncing
        const normalizedSpeedX = 0.8; // Standard horizontal speed component (normalized)
        ballVX = -normalizedSpeedX; // Always moves to the left after hitting right paddle

        // Y-component depends on where the paddle was hit
        // The further from center, the steeper the angle
        ballVY = -normalizedSpeedX * Math.tan(bounceAngle);

        // Ensure y-speed doesn't get too extreme
        if (Math.abs(ballVY) < 0.1) {
          // Add a small vertical component if too flat
          ballVY = Math.random() < 0.5 ? -0.1 : 0.1;
        } else if (Math.abs(ballVY) > 0.7) {
          // Cap the vertical speed for playability
          ballVY = ballVY > 0 ? 0.7 : -0.7;
        }

        playSound(paddleSound);
      }

      // Ball out of bounds (score) - modified for corner walls
      let canScore = true;

      if (settings.mapType === "corners") {
        // Check if ball is in scoring zone (avoid corner wall areas)
        const cornerSize = 60; // Match with the drawing size

        if (ballY < cornerSize || ballY > canvasHeight - cornerSize) {
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
      if (
        leftScore === settings.scoreToWin ||
        rightScore === settings.scoreToWin
      ) {
        const winningPlayer =
          leftScore === settings.scoreToWin ? player1 : player2;
        setWinner(winningPlayer.username);
        setScore({ left: leftScore, right: rightScore });
        gameOver = true;

        // Enhanced debug logging
        console.log("Game over - checking if match result should be sent", {
          player1: {
            username: player1.username,
            isGuest: player1.isGuest,
            id: player1.id,
          },
          player2: {
            username: player2.username,
            isGuest: player2.isGuest,
            id: player2.id,
          },
          winner:
            leftScore === settings.scoreToWin
              ? player1.username
              : player2.username,
        });

        // Only send match results if both players are logged in (not guests) and have IDs
        if (!player1.isGuest && !player2.isGuest && player1.id && player2.id) {
          console.log(
            "Both players are logged in with IDs, sending match results"
          );

          try {
            // The winner is either player1 or player2's ID
            const winnerId =
              leftScore === settings.scoreToWin ? player1.id : player2.id;

            // Convert IDs to integers for the API call
            const player1Id = parseInt(player1.id);
            const player2Id = parseInt(player2.id);
            const winnerIdInt = parseInt(winnerId);

            console.log("Match data prepared:", {
              player1: player1Id,
              player2: player2Id,
              winner: winnerIdInt,
            });

            if (isNaN(player1Id) || isNaN(player2Id) || isNaN(winnerIdInt)) {
              throw new Error("Invalid player IDs - must be numeric");
            }

            api
              .post("/matches", {
                player1: player1Id,
                player2: player2Id,
                winner: winnerIdInt,
              })
              .then((response) => {
                console.log("Match result saved:", response.data);
              })
              .catch((error) => {
                console.error(
                  "Error saving match result:",
                  error.response ? error.response.data : error.message
                );
              });
          } catch (error) {
            console.error("Error preparing match data:", error);
          }
        } else {
          console.log(
            "Match result not sent - one or both players are guests or missing IDs",
            {
              player1IsGuest: player1.isGuest,
              player2IsGuest: player2.isGuest,
              player1HasId: Boolean(player1.id),
              player2HasId: Boolean(player2.id),
            }
          );
        }
      }
    }

    function resetBall() {
      // Use our standard normalized velocity constants (defined at top of file)
      // These ensure consistent ball behavior on every point
      const baseSpeedX = STANDARD_NORMALIZED_X_SPEED; // 0.8
      const baseSpeedY = STANDARD_NORMALIZED_Y_SPEED; // 0.4

      // For center wall map, spawn the ball avoiding the center wall
      if (settings.mapType === "center-wall") {
        const wallHeight = canvasHeight * 0.6;
        const wallY = (canvasHeight - wallHeight) / 2;

        // Randomly choose top or bottom to spawn the ball
        if (Math.random() > 0.5) {
          // Spawn at top
          ballX = canvasWidth / 2;
          ballY = Math.max(15, wallY - 15); // Safely above the wall
          ballVX = Math.random() > 0.5 ? baseSpeedX : -baseSpeedX;
          ballVY = baseSpeedY; // Start moving downward
        } else {
          // Spawn at bottom
          ballX = canvasWidth / 2;
          ballY = Math.min(canvasHeight - 15, wallY + wallHeight + 15); // Safely below the wall
          ballVX = Math.random() > 0.5 ? baseSpeedX : -baseSpeedX;
          ballVY = -baseSpeedY; // Start moving upward
        }
      } else {
        // Normal spawn in the center for other maps
        ballX = canvasWidth / 2;
        ballY = canvasHeight / 2;
        ballVX = Math.random() > 0.5 ? baseSpeedX : -baseSpeedX;
        ballVY = (Math.random() - 0.5) * baseSpeedY * 2;
      }

      // Reset who last hit the ball on each point
      lastPaddleHitRef.current = null;

      // Log the reset ball state for debugging
      console.log(
        `Ball reset: pos=(${ballX},${ballY}), vel=(${ballVX},${ballVY}), speed=${calculateBallSpeed(
          settings.ballSpeed
        )}`
      );

      setScore({ left: leftScore, right: rightScore });
    }

    let lastTimeStamp = 0; // Initialize to 0, will be set on first frame
    let frameCount = 0; // Track frame count for diagnostics

    const gameLoop = (timestamp: number) => {
      // Don't process game loop if game is over, but still continue animation frame for UI updates
      if (isGameOver || gameOver) {
        // We still want to draw the current state (showing the final game state)
        draw();
        // Request next frame for UI updates but skip game logic
        animationFrameRef.current = window.requestAnimationFrame(gameLoop);
        return;
      }

      // Calculate delta time in seconds (time since last frame)
      const deltaTime = (timestamp - lastTimeStamp) / 1000; // Convert to seconds

      // More aggressive capping of delta time for Firefox compatibility
      // Firefox can sometimes have larger gaps between frames
      const cappedDeltaTime = Math.min(deltaTime, 0.03); // Cap at ~30 FPS equivalent (more stable)

      // Log delta time occasionally to help debug performance issues
      if (Math.random() < 0.01) {
        // Log only 1% of frames to avoid console spam
        console.log(
          `Delta time: ${cappedDeltaTime.toFixed(4)}s, FPS: ${(
            1 / cappedDeltaTime
          ).toFixed(1)}`
        );
      }

      // Always draw the current state, even when paused
      draw();

      // Only update game state if not paused
      if (!isPausedRef.current) {
        // Ensure we're always advancing by a safe minimum increment
        // This helps prevent "stuck" balls in Firefox
        const safeTimeDelta = Math.max(cappedDeltaTime, 0.005); // Minimum 5ms step
        update(safeTimeDelta);

        // Only update timestamp if game is active
        lastTimeStamp = timestamp;
      } else {
        // When paused, we don't advance game state,
        // but we need to update timestamp to avoid large jumps when unpaused
        lastTimeStamp = timestamp;
      }

      // Request next frame as soon as possible
      animationFrameRef.current = window.requestAnimationFrame(gameLoop);
    };

    // Log initial ball state for debugging
    console.log(
      `Initial ball setup: pos=(${ballX},${ballY}), vel=(${ballVX},${ballVY}), speed=${calculateBallSpeed(
        settings.ballSpeed
      )}`
    );

    // Start the game loop with more reliable initialization
    const startGameLoop = (timestamp: number) => {
      lastTimeStamp = timestamp; // Set initial timestamp (no delta on first frame)
      animationFrameRef.current = window.requestAnimationFrame(gameLoop);
    };

    // Request first frame with proper initialization
    animationFrameRef.current = window.requestAnimationFrame(startGameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [player1.username, player2.username, restartKey, isAIGame, settings]);

  function handleRestart() {
    console.log("Restart button clicked - resetting game state");

    // Reset game state
    setWinner(null);
    setScore({ left: 0, right: 0 });
    setIsGameOver(false);

    // Explicitly ensure game is not paused when restarted
    setIsPaused(false);
    isPausedRef.current = false;

    // Clear all key states
    keysPressed.current = {};

    // Trigger re-render with new key to reset game state completely
    setRestartKey((prev) => prev + 1);

    // Re-enable focus on the canvas after a short delay
    // This has to happen after React has updated the DOM with the new game state
    setTimeout(() => {
      // Check if component is still mounted
      if (canvasRef.current) {
        // Restore tabindex attribute if it was removed
        canvasRef.current.setAttribute("tabindex", "0");

        // Set focus state first to prevent auto-pause behavior
        setIsFocused(true);
        isFocusedRef.current = true;

        // Now focus the canvas
        canvasRef.current.focus();
      }
    }, 300); // Use a longer delay to ensure React has completed its updates
  }

  // New function to handle returning to the main menu/game selection
  function handleReturnToMenu() {
    console.log("Return to menu button clicked");

    // Cancel any animation frames to stop the game completely
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // First use the provided callback if it exists
    if (onReturnToMenu && typeof onReturnToMenu === "function") {
      console.log("Using provided onReturnToMenu callback");
      try {
        onReturnToMenu();
        return; // If callback succeeds, we're done
      } catch (err) {
        console.error("Error calling onReturnToMenu callback:", err);
        // Fall through to backup method if callback fails
      }
    } else {
      console.log("No callback provided, using history navigation");
    }

    // Backup: use history API instead of full page reload
    // This will navigate to the home page but is gentler than a full reload
    try {
      window.history.pushState({}, "", "/");
      // Dispatch a popstate event to trigger route change in React Router
      window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
    } catch (err) {
      console.error("Error using history API:", err);
      // Last resort fallback - direct navigation
      window.location.href = "/";
    }
  }

  console.log("PongGame: Rendering component with canvas");
  console.log("Power-up status:", {
    player1: player1PowerUpsRef.current.paddleEnlarge.active,
    player2: player2PowerUpsRef.current.paddleEnlarge.active,
    lastHit: lastPaddleHitRef.current,
  });

  // helper to fire the tournament callback
  const handleReturnToBracket = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!winner) return;

    const winnerId =
      winner === player1.username ? Number(player1.id) : Number(player2.id);

    onGameEnd!({
      winnerId,
      winnerAlias: winner,
    });
  };

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
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {t("pongGame.pressPToPause")}
        </div>
        <span className="dark:text-white text-black">{player2.username}</span>
      </div>

      <div className="relative">
        {/* Overlay when game is not focused */}
        {!isFocused && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-40 cursor-pointer"
            onClick={() => canvasRef.current?.focus()}
          >
            <div className="bg-blue-900 bg-opacity-80 px-6 py-4 rounded-lg text-white font-bold text-center animate-pulse">
              {t("pongGame.clickToPlay")}
              <br />
              <span className="text-sm text-blue-200">
                {t("pongGame.controlsWorkWhenFocused")}
              </span>
            </div>
          </div>
        )}

        {/* Overlay when game is manually paused with "p" key */}
        {isPaused && isFocused && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black bg-opacity-40">
            <div className="bg-purple-900 bg-opacity-80 px-8 py-6 rounded-lg text-white font-bold text-center">
              {t("pongGame.gamePaused")}
              <br />
              <span className="text-sm text-purple-200 mt-2 block">
                {t("pongGame.pressPToResume")}
              </span>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={500}
          height={300}
          tabIndex={isGameOver || winner ? -1 : 0} // Disable tab focus when game is over or winner exists
          onClick={(e) => {
            // Only allow focus when game is not over
            if (!isGameOver && !winner) {
              e.currentTarget.focus();

              // If the game was paused because focus was lost, unpause it now
              if (isPaused && !isPausedRef.current) {
                setIsPaused(false);
                isPausedRef.current = false;
              }
            } else {
              // Prevent default behavior when game is over
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            background: "#222",
            display: "block",
            margin: "0 auto",
            imageRendering: "pixelated",
            outline: "none", // Remove the focus outline
            boxShadow: isFocused
              ? "0 0 10px 4px rgba(0, 255, 255, 0.6)"
              : "0 0 5px 1px rgba(255, 0, 0, 0.3)", // Visual indicator of focus
          }}
        />
        {winner && (
          <div
            className="absolute flex flex-col items-center justify-center text-4xl text-white font-bold bg-black bg-opacity-80"
            style={{
              width: "500px", // Match canvas width
              height: "300px", // Match canvas height
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              borderRadius: "8px",
              zIndex: 30, // Higher z-index to ensure it's above everything
              position: "absolute", // Ensure it's positioned correctly
            }}
            onClick={(e) => {
              // Completely block all events from reaching the canvas
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onKeyDown={(e) => {
              // Prevent keyboard events from reaching the canvas
              e.stopPropagation();
            }}
          >
            {/* This next part is a secret div, visible only to screen readers, which ensures that the error
	  or success messages get announced using aria. */}
            {liveMessage && (
              <div
                ref={liveRegionRef}
                tabIndex={-1}
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
              >
                {liveMessage}
              </div>
            )}
            <div className="mb-8">
              {t("pongGame.winnerMessage", { winner })}
            </div>
            <div className="flex flex-col gap-4 w-64">
              {/* only show “Restart” if not embedded in TournamentPage */}
              {!embedded && (
                <button
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xl font-bold transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleRestart();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  tabIndex={1}
                  autoFocus
                >
                  {t("pongGame.restartMatch")}
                </button>
              )}
              {/* only show “Return to Menu” if not embedded; when embedded we call back to TournamentPage */}
              {!embedded ? (
                <button
                  className="text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-11 py-3 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleReturnToMenu(); // your existing menu handler
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  tabIndex={2}
                >
                  {t("pongGame.returnToMainMenu")}
                </button>
              ) : (
                <button
                  className="text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-semibold rounded-lg text-sm w-full sm:w-auto px-11 py-3 text-center"
                  onClick={handleReturnToBracket}
                  onMouseDown={(e) => e.stopPropagation()}
                  tabIndex={2}
                >
                  {t("pongGame.returnToBracket")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PongGame;
