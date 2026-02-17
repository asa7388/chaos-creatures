// Chaos Creatures Game Server — Timer Management
// 60s decision timer, 10s event choice sub-timer, timeout handling
// Source: docs/design/06-technical-architecture.md Section 5.4

import {
  TURN_TIMER_SECONDS,
  EVENT_CHOICE_TIMER_SECONDS,
  TIMER_WARNING_SECONDS,
  MAX_MISSED_TURNS,
} from '../engine/constants';

export interface TimerCallbacks {
  onWarning: (matchId: string, secondsRemaining: number) => void;
  onExpired: (matchId: string, phase: string) => void;
  onDisconnectForfeit: (matchId: string, playerId: string) => void;
}

/**
 * Manages turn timers for a single match.
 */
export class MatchTimerManager {
  private decisionTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private eventChoiceTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private timerStartedAt: number = 0;
  private timerDurationMs: number = TURN_TIMER_SECONDS * 1000;
  private matchId: string;
  private callbacks: TimerCallbacks;

  constructor(matchId: string, callbacks: TimerCallbacks) {
    this.matchId = matchId;
    this.callbacks = callbacks;
  }

  /**
   * Start the 60-second decision timer for the active player.
   */
  startDecisionTimer(onExpired: () => void): void {
    this.cancelDecisionTimer();
    this.timerStartedAt = Date.now();
    this.timerDurationMs = TURN_TIMER_SECONDS * 1000;

    // 15-second warning
    const warningMs = (TURN_TIMER_SECONDS - TIMER_WARNING_SECONDS) * 1000;
    this.warningTimer = setTimeout(() => {
      this.callbacks.onWarning(this.matchId, TIMER_WARNING_SECONDS);
    }, warningMs);

    // Expiry
    this.decisionTimer = setTimeout(() => {
      this.callbacks.onExpired(this.matchId, 'decision');
      onExpired();
    }, this.timerDurationMs);
  }

  /**
   * Start the 10-second event choice sub-timer.
   * Does NOT count against the 60s decision timer.
   */
  startEventChoiceTimer(onExpired: () => void): void {
    this.cancelEventChoiceTimer();

    this.eventChoiceTimer = setTimeout(() => {
      this.callbacks.onExpired(this.matchId, 'event_choice');
      onExpired();
    }, EVENT_CHOICE_TIMER_SECONDS * 1000);
  }

  /**
   * Start the reconnection grace timer for a disconnected player.
   */
  startReconnectTimer(playerId: string, graceSeconds: number, onExpired: () => void): void {
    this.cancelReconnectTimer();

    this.reconnectTimer = setTimeout(() => {
      this.callbacks.onDisconnectForfeit(this.matchId, playerId);
      onExpired();
    }, graceSeconds * 1000);
  }

  /**
   * Get remaining milliseconds on the decision timer.
   */
  getRemainingMs(): number {
    if (!this.decisionTimer) return 0;
    return Math.max(0, this.timerDurationMs - (Date.now() - this.timerStartedAt));
  }

  /**
   * Cancel the decision timer (e.g., player took action before timeout).
   */
  cancelDecisionTimer(): void {
    if (this.decisionTimer) {
      clearTimeout(this.decisionTimer);
      this.decisionTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  /**
   * Cancel the event choice timer.
   */
  cancelEventChoiceTimer(): void {
    if (this.eventChoiceTimer) {
      clearTimeout(this.eventChoiceTimer);
      this.eventChoiceTimer = null;
    }
  }

  /**
   * Cancel the reconnection timer.
   */
  cancelReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Cancel all timers. Called when match ends.
   */
  cancelAll(): void {
    this.cancelDecisionTimer();
    this.cancelEventChoiceTimer();
    this.cancelReconnectTimer();
  }

  /**
   * Destroy this timer manager.
   */
  destroy(): void {
    this.cancelAll();
  }
}

/** Map of match ID to timer manager */
const timerManagers = new Map<string, MatchTimerManager>();

export function getTimerManager(matchId: string): MatchTimerManager | undefined {
  return timerManagers.get(matchId);
}

export function createTimerManager(matchId: string, callbacks: TimerCallbacks): MatchTimerManager {
  const manager = new MatchTimerManager(matchId, callbacks);
  timerManagers.set(matchId, manager);
  return manager;
}

export function destroyTimerManager(matchId: string): void {
  const manager = timerManagers.get(matchId);
  if (manager) {
    manager.destroy();
    timerManagers.delete(matchId);
  }
}
