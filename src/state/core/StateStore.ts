// @ts-check
/**
 * Centralized State Store for Chress
 *
 * Single source of truth for all application state.
 * Implements a lightweight state management pattern with:
 * - Clear separation between persistent, session, transient, and UI state
 * - Event-based subscriptions for reactive updates
 * - Immutable state updates
 * - Built-in debugging and time-travel capabilities
 *
 * Refactored into smaller modules for better maintainability:
 * - StateDefinitions: Type definitions and initial state
 * - StateSliceManager: Get/set operations
 * - StateSubscriptionManager: Listener subscriptions
 * - StateHistoryManager: History and debugging
 * - StateEventBridge: EventBus compatibility
 */

import { eventBus } from '@core/EventBus';
import { EventTypes } from '@core/EventTypes';
import { createInitialState } from './StateDefinitions';
import { StateSliceManager, deepClone } from './StateSliceManager';
import { StateSubscriptionManager } from './StateSubscriptionManager';
import { StateHistoryManager } from './StateHistoryManager';
import { StateEventBridge } from './StateEventBridge';

type StateListener = (sliceState: any, path?: string | null) => void;

interface StateSnapshot {
    state: any;
    timestamp: number;
}

interface StateStats {
    persistent: { count: number; memory: number };
    session: { count: number; memory: number };
    transient: { count: number; memory: number };
    ui: { count: number; memory: number };
    historySize: number;
    mutationsRecorded: number;
    listenerCount: number;
}

/**
 * State Store class
 */
export class StateStore {
    state: any;
    private sliceManager: StateSliceManager;
    private subscriptionManager: StateSubscriptionManager;
    private historyManager: StateHistoryManager;
    private eventBridge: StateEventBridge;

    constructor() {
        this.state = createInitialState();

        // Initialize sub-managers
        this.sliceManager = new StateSliceManager(this.state);
        this.subscriptionManager = new StateSubscriptionManager();
        this.historyManager = new StateHistoryManager(50, 100);
        this.eventBridge = new StateEventBridge();
    }

    /**
     * Creates the initial state structure
     */
    createInitialState(): any {
        return createInitialState();
    }

    /**
     * Get state from a specific slice or path
     */
    get(path: string): any {
        return this.sliceManager.get(path);
    }

    /**
     * Set state at a specific path
     */
    set(path: string, value: any, mutation: string = 'setState'): void {
        // Record mutation for debugging
        this.historyManager.recordMutation(mutation, path, this.get(path), value);

        // Apply the state change
        const { newState, topLevelSlice } = this.sliceManager.set(path, value);

        // Update state references
        this.state = newState;
        this.sliceManager.updateStateReference(newState);

        // Record in history if enabled
        if (this.historyManager.isRecording()) {
            this.historyManager.recordHistory(this.state);
        }

        // Notify listeners
        this.subscriptionManager.notifyListeners(topLevelSlice, this.state[topLevelSlice], path);

        // Emit EventBus event for backward compatibility
        this.eventBridge.emitStateChangeEvent(path, value);
    }

    /**
     * Update multiple paths atomically
     */
    batchSet(updates: Record<string, any>, mutation: string = 'batchSetState'): void {
        // Record mutations
        for (const [path, value] of Object.entries(updates)) {
            this.historyManager.recordMutation(mutation, path, this.get(path), value);
        }

        // Apply batch changes
        const { newState, affectedSlices } = this.sliceManager.batchSet(updates);

        // Update state references
        this.state = newState;
        this.sliceManager.updateStateReference(newState);

        // Record in history
        if (this.historyManager.isRecording()) {
            this.historyManager.recordHistory(this.state);
        }

        // Notify all affected slices
        this.subscriptionManager.notifyMultipleSlices(affectedSlices, this.state);

        // Emit events
        this.eventBridge.emitBatchEvents(updates);
    }

    /**
     * Subscribe to changes in a specific state slice
     */
    subscribe(slice: string, callback: StateListener): () => void {
        return this.subscriptionManager.subscribe(slice, callback);
    }

    /**
     * Notify all listeners for a specific slice
     */
    notifyListeners(slice: string, path: string | null = null): void {
        this.subscriptionManager.notifyListeners(slice, this.state[slice], path);
    }

    /**
     * Reset a specific slice to initial state
     */
    resetSlice(slice: string): void {
        const initialState = createInitialState();
        this.set(slice, initialState[slice], `reset_${slice}`);
    }

    /**
     * Reset all transient state (e.g., on zone transition)
     */
    resetTransient(): void {
        this.resetSlice('transient');
        this.eventBridge.emitResetEvent('transient');
    }

    /**
     * Reset all session state (e.g., on game over)
     */
    resetSession(): void {
        this.resetSlice('session');
        this.resetSlice('transient');
        this.eventBridge.emitResetEvent('session');
    }

    /**
     * Reset entire state (new game)
     */
    reset(): void {
        this.state = createInitialState();
        this.sliceManager.updateStateReference(this.state);
        this.historyManager.clear();
        this.notifyAllListeners();
        this.eventBridge.emitResetEvent('all');
    }

    /**
     * Notify all listeners across all slices
     */
    notifyAllListeners(): void {
        this.subscriptionManager.notifyAllListeners(this.state);
    }

    /**
     * Get a snapshot of the current state
     */
    getSnapshot(): StateSnapshot {
        return this.sliceManager.getSnapshot();
    }

    /**
     * Restore state from a snapshot
     */
    restoreSnapshot(snapshot: StateSnapshot): void {
        this.state = deepClone(snapshot.state);
        this.sliceManager.updateStateReference(this.state);
        this.notifyAllListeners();
    }

    /**
     * Enable/disable history recording
     */
    setHistoryRecording(enabled: boolean): void {
        this.historyManager.setHistoryRecording(enabled, this.state);
    }

    /**
     * Get mutation history
     */
    getMutations(count: number = 10): any[] {
        return this.historyManager.getMutations(count);
    }

    /**
     * Get state history
     */
    getHistory(count: number = 10): any[] {
        return this.historyManager.getHistory(count);
    }

    /**
     * Get history length
     */
    getHistoryLength(): number {
        return this.historyManager.getHistoryLength();
    }

    /**
     * Get mutations length
     */
    getMutationsLength(): number {
        return this.historyManager.getMutationsLength();
    }

    /**
     * Get max history size
     */
    getMaxHistorySize(): number {
        return this.historyManager.getMaxHistorySize();
    }

    /**
     * Get max mutations size
     */
    getMaxMutations(): number {
        return this.historyManager.getMaxMutations();
    }

    /**
     * Clear history and mutations
     */
    clearHistory(): void {
        this.historyManager.clearHistory();
        this.historyManager.clearMutations();
    }

    /**
     * Deep clone utility
     */
    deepClone(obj: any): any {
        return deepClone(obj);
    }

    /**
     * Debug: Print current state structure
     */
    debugPrint(): void {
        console.group('🏪 State Store Debug');
        console.log('Persistent State:', this.state.persistent);
        console.log('Session State:', this.state.session);
        console.log('Transient State:', this.state.transient);
        console.log('UI State:', this.state.ui);
        console.log('Meta:', this.state.meta);
        console.log('Recent Mutations:', this.getMutations(5));
        console.groupEnd();
    }

    /**
     * Get state statistics
     */
    getStats(): StateStats {
        const countNodes = (obj: any, depth: number = 0): { count: number; memory: number } => {
            if (depth > 10) return { count: 0, memory: 0 };
            if (obj === null || typeof obj !== 'object') return { count: 1, memory: 0 };

            let count = 1;
            let memory = 0;

            if (obj instanceof Set || obj instanceof Map) {
                memory += obj.size * 8;
                count += obj.size;
            } else if (Array.isArray(obj)) {
                count += obj.length;
                obj.forEach(item => {
                    const stats = countNodes(item, depth + 1);
                    count += stats.count;
                    memory += stats.memory;
                });
            } else {
                const keys = Object.keys(obj);
                count += keys.length;
                keys.forEach(key => {
                    const stats = countNodes(obj[key], depth + 1);
                    count += stats.count;
                    memory += stats.memory;
                });
            }

            return { count, memory };
        };

        return {
            persistent: countNodes(this.state.persistent),
            session: countNodes(this.state.session),
            transient: countNodes(this.state.transient),
            ui: countNodes(this.state.ui),
            historySize: this.historyManager.getHistoryLength(),
            mutationsRecorded: this.historyManager.getMutationsLength(),
            listenerCount: this.subscriptionManager.getListenerCount()
        };
    }
}

// Create singleton instance
export const store = new StateStore();

// Debug access in development
if (typeof window !== 'undefined') {
    (window as any).chressStore = store;
}
