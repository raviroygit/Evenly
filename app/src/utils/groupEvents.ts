// Simple event system for React Native (no Node.js dependencies)
type EventCallback = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: { [key: string]: EventCallback[] } = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }
}

// Create a global event emitter for group-related events
export const groupEvents = new SimpleEventEmitter();

// Event types
export const GROUP_EVENTS = {
  GROUP_DELETED: 'group_deleted',
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUPS_REFRESH_NEEDED: 'groups_refresh_needed',
} as const;

// Helper functions to emit events
export const emitGroupDeleted = (groupId: string) => {
  console.log(`[GroupEvents] Emitting group deleted event for group: ${groupId}`);
  groupEvents.emit(GROUP_EVENTS.GROUP_DELETED, { groupId });
  groupEvents.emit(GROUP_EVENTS.GROUPS_REFRESH_NEEDED);
};

export const emitGroupCreated = (group: any) => {
  console.log(`[GroupEvents] Emitting group created event for group: ${group.id}`);
  groupEvents.emit(GROUP_EVENTS.GROUP_CREATED, { group });
  groupEvents.emit(GROUP_EVENTS.GROUPS_REFRESH_NEEDED);
};

export const emitGroupUpdated = (group: any) => {
  console.log(`[GroupEvents] Emitting group updated event for group: ${group.id}`);
  groupEvents.emit(GROUP_EVENTS.GROUP_UPDATED, { group });
  groupEvents.emit(GROUP_EVENTS.GROUPS_REFRESH_NEEDED);
};

export const emitGroupsRefreshNeeded = () => {
  console.log('[GroupEvents] Emitting groups refresh needed event');
  groupEvents.emit(GROUP_EVENTS.GROUPS_REFRESH_NEEDED);
};
