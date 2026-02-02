import EventEmitter from 'eventemitter3';

/**
 * Session Events Manager
 *
 * Emits events when token is refreshed or session state changes
 * Allows components to react to session changes and reload data
 */

const sessionEventEmitter = new EventEmitter();

export const SESSION_EVENTS = {
  TOKEN_REFRESHED: 'session:token_refreshed',
  SESSION_EXPIRED: 'session:expired',
  DATA_RELOAD_NEEDED: 'session:data_reload_needed',
} as const;

export const sessionEvents = {
  /**
   * Emit an event
   */
  emit: (event: string, ...args: any[]) => {
    sessionEventEmitter.emit(event, ...args);
  },

  /**
   * Listen to an event
   */
  on: (event: string, callback: (...args: any[]) => void) => {
    sessionEventEmitter.on(event, callback);
  },

  /**
   * Remove event listener
   */
  off: (event: string, callback: (...args: any[]) => void) => {
    sessionEventEmitter.off(event, callback);
  },

  /**
   * Remove all listeners for an event
   */
  removeAllListeners: (event?: string) => {
    sessionEventEmitter.removeAllListeners(event);
  },
};

/**
 * Emit token refreshed event
 * This notifies all components to reload their data with fresh token
 */
export const emitTokenRefreshed = () => {
  sessionEvents.emit(SESSION_EVENTS.TOKEN_REFRESHED);
  sessionEvents.emit(SESSION_EVENTS.DATA_RELOAD_NEEDED);
};

/**
 * Emit session expired event
 */
export const emitSessionExpired = () => {
  sessionEvents.emit(SESSION_EVENTS.SESSION_EXPIRED);
};

/**
 * Emit data reload needed event
 * Use this to force all screens to reload their data
 */
export const emitDataReloadNeeded = () => {
  sessionEvents.emit(SESSION_EVENTS.DATA_RELOAD_NEEDED);
};
