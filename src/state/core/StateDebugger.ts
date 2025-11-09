/**
 * State Debugger
 *
 * Visual debugging tool for the centralized state store.
 * Provides:
 * - Real-time state visualization
 * - Mutation history with diffs
 * - Time-travel debugging
 * - State export/import
 * - Performance monitoring
 */

import { store } from './StateStore';
import { persistence } from './StatePersistence';
import { logger } from '@core/logger';

declare global {
  interface Window {
    chressDebugger: StateDebugger;
  }
}

export class StateDebugger {
  private isOpen: boolean;
  private container: HTMLElement | null;
  private updateInterval: ReturnType<typeof setInterval> | null;
  private selectedSlice: string;
  private viewMode: string;

  constructor() {
    this.isOpen = false;
    this.container = null;
    this.updateInterval = null;
    this.selectedSlice = 'persistent';
    this.viewMode = 'tree'; // 'tree', 'json', 'mutations', 'stats'
  }

  /**
   * Toggle debugger visibility
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open debugger
   */
  open() {
    if (this.isOpen) return;

    this.createUI();
    this.isOpen = true;

    // Enable history recording
    store.setHistoryRecording(true);

    // Auto-refresh every 1 second
    this.updateInterval = setInterval(() => {
      this.refresh();
    }, 1000);

    this.refresh();
  }

  /**
   * Close debugger
   */
  close() {
    if (!this.isOpen) return;

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isOpen = false;
  }

  /**
   * Create debugger UI
   */
  createUI() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'state-debugger';
    this.container.innerHTML = `
      <style>
        #state-debugger {
          position: fixed;
          top: 10px;
          right: 10px;
          width: 600px;
          max-height: 80vh;
          background: rgba(0, 0, 0, 0.95);
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          border: 2px solid #00ff00;
          border-radius: 4px;
          overflow: hidden;
          z-index: 10000;
          display: flex;
          flex-direction: column;
        }

        #state-debugger-header {
          background: #003300;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #00ff00;
        }

        #state-debugger-title {
          font-weight: bold;
          font-size: 14px;
        }

        #state-debugger-close {
          background: #ff0000;
          color: white;
          border: none;
          padding: 4px 8px;
          cursor: pointer;
          border-radius: 2px;
        }

        #state-debugger-tabs {
          display: flex;
          gap: 5px;
          padding: 5px;
          background: #001100;
          border-bottom: 1px solid #00ff00;
        }

        .debugger-tab {
          padding: 5px 10px;
          background: #003300;
          border: 1px solid #00ff00;
          color: #00ff00;
          cursor: pointer;
          border-radius: 2px;
        }

        .debugger-tab.active {
          background: #00ff00;
          color: black;
          font-weight: bold;
        }

        #state-debugger-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }

        .state-tree {
          line-height: 1.6;
        }

        .state-key {
          color: #ffff00;
          font-weight: bold;
        }

        .state-value {
          color: #00ffff;
        }

        .state-type {
          color: #ff00ff;
          font-style: italic;
        }

        .state-indent {
          padding-left: 20px;
        }

        .mutation-entry {
          margin: 10px 0;
          padding: 10px;
          background: #001100;
          border-left: 3px solid #ffff00;
        }

        .mutation-path {
          color: #ffff00;
          font-weight: bold;
        }

        .mutation-old {
          color: #ff6666;
        }

        .mutation-new {
          color: #66ff66;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #003300;
        }

        .stat-label {
          color: #ffff00;
        }

        .stat-value {
          color: #00ffff;
          font-weight: bold;
        }

        #state-debugger-actions {
          padding: 10px;
          background: #001100;
          border-top: 1px solid #00ff00;
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }

        .debugger-btn {
          padding: 5px 10px;
          background: #003300;
          border: 1px solid #00ff00;
          color: #00ff00;
          cursor: pointer;
          border-radius: 2px;
          font-size: 11px;
        }

        .debugger-btn:hover {
          background: #005500;
        }
      </style>

      <div id="state-debugger-header">
        <div id="state-debugger-title">🐛 State Debugger</div>
        <button id="state-debugger-close">✕</button>
      </div>

      <div id="state-debugger-tabs">
        <button class="debugger-tab active" data-view="tree">State Tree</button>
        <button class="debugger-tab" data-view="json">JSON View</button>
        <button class="debugger-tab" data-view="mutations">Mutations</button>
        <button class="debugger-tab" data-view="stats">Statistics</button>
      </div>

      <div id="state-debugger-content">
        <!-- Content goes here -->
      </div>

      <div id="state-debugger-actions">
        <button class="debugger-btn" id="debug-print">Console Log</button>
        <button class="debugger-btn" id="debug-export">Export Save</button>
        <button class="debugger-btn" id="debug-clear">Clear History</button>
        <button class="debugger-btn" id="debug-snapshot">Take Snapshot</button>
        <button class="debugger-btn" id="debug-refresh">Refresh</button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add event listeners
    this.container.querySelector('#state-debugger-close')!.addEventListener('click', () => {
      this.close();
    });

    this.container.querySelectorAll('.debugger-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        this.viewMode = target.dataset.view || 'tree';
        this.container!.querySelectorAll('.debugger-tab').forEach(t => t.classList.remove('active'));
        target.classList.add('active');
        this.refresh();
      });
    });

    this.container.querySelector('#debug-print')!.addEventListener('click', () => {
      store.debugPrint();
    });

    this.container.querySelector('#debug-export')!.addEventListener('click', () => {
      persistence.exportSave();
    });

    this.container.querySelector('#debug-clear')!.addEventListener('click', () => {
      store.clearHistory();
      this.refresh();
    });

    this.container.querySelector('#debug-snapshot')!.addEventListener('click', () => {
      const snapshot = store.getSnapshot();
      logger.log('📸 State Snapshot:', snapshot);
      this.refresh();
    });

    this.container.querySelector('#debug-refresh')!.addEventListener('click', () => {
      this.refresh();
    });
  }

  /**
   * Refresh debugger content
   */
  refresh() {
    if (!this.container) return;

    const content = this.container.querySelector('#state-debugger-content');
    if (!content) return;

    switch (this.viewMode) {
      case 'tree':
        content.innerHTML = this.renderTree();
        break;
      case 'json':
        content.innerHTML = this.renderJSON();
        break;
      case 'mutations':
        content.innerHTML = this.renderMutations();
        break;
      case 'stats':
        content.innerHTML = this.renderStats();
        break;
    }
  }

  /**
   * Render state as tree view
   */
  renderTree() {
    const state = store.state;
    return `
      <div class="state-tree">
        ${this.renderSliceTree('Persistent', state.persistent)}
        ${this.renderSliceTree('Session', state.session)}
        ${this.renderSliceTree('Transient', state.transient)}
        ${this.renderSliceTree('UI', state.ui)}
        ${this.renderSliceTree('Meta', state.meta)}
      </div>
    `;
  }

  /**
   * Render a single state slice as tree
   */
  renderSliceTree(name: string, slice: unknown, indent = 0): string {
    const indentStyle = `padding-left: ${indent * 20}px`;

    if (slice === null) {
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-value">null</span></div>`;
    }

    if (slice === undefined) {
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-value">undefined</span></div>`;
    }

    if (typeof slice !== 'object') {
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-value">${this.escapeHtml(String(slice))}</span></div>`;
    }

    if (slice instanceof Set) {
      const items = Array.from(slice).slice(0, 10);
      const more = slice.size > 10 ? ` ... +${slice.size - 10} more` : '';
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-type">Set(${slice.size})</span> [${items.join(', ')}${more}]</div>`;
    }

    if (slice instanceof Map) {
      const items = Array.from(slice.entries()).slice(0, 5);
      const more = slice.size > 5 ? ` ... +${slice.size - 5} more` : '';
      const preview = items.map(([k, v]) => `${k}: ${typeof v === 'object' ? '{...}' : v}`).join(', ');
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-type">Map(${slice.size})</span> {${preview}${more}}</div>`;
    }

    if (Array.isArray(slice)) {
      if (slice.length === 0) {
        return `<div style="${indentStyle}"><span class="state-key">${name}:</span> <span class="state-type">Array(0)</span> []</div>`;
      }

      const preview = slice.slice(0, 3).map(item => typeof item === 'object' ? '{...}' : String(item)).join(', ');
      const more = slice.length > 3 ? ` ... +${slice.length - 3} more` : '';

      return `
        <div style="${indentStyle}">
          <span class="state-key">${name}:</span> <span class="state-type">Array(${slice.length})</span>
          <div class="state-indent">[${preview}${more}]</div>
        </div>
      `;
    }

    // Object
    const keys = Object.keys(slice);
    if (keys.length === 0) {
      return `<div style="${indentStyle}"><span class="state-key">${name}:</span> {}</div>`;
    }

    const children = keys.map(key => this.renderSliceTree(key, slice[key], indent + 1)).join('');

    return `
      <div style="${indentStyle}">
        <span class="state-key">${name}:</span> <span class="state-type">Object(${keys.length})</span>
        ${children}
      </div>
    `;
  }

  /**
   * Render state as JSON
   */
  renderJSON() {
    const state = store.state;

    // Convert Maps and Sets for JSON display
    const jsonFriendly = this.makeJSONFriendly(state);
    const json = JSON.stringify(jsonFriendly, null, 2);

    return `<pre>${this.escapeHtml(json)}</pre>`;
  }

  /**
   * Make state JSON-serializable
   */
  makeJSONFriendly(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Set) return Array.from(obj);
    if (obj instanceof Map) return Object.fromEntries(obj);
    if (Array.isArray(obj)) return obj.map(item => this.makeJSONFriendly(item));

    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.makeJSONFriendly((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  /**
   * Render mutation history
   */
  renderMutations() {
    const mutations = store.getMutations(20);

    if (mutations.length === 0) {
      return '<div style="color: #888;">No mutations recorded yet</div>';
    }

    return mutations.reverse().map(mutation => {
      const time = new Date(mutation.timestamp).toLocaleTimeString();
      const oldVal = this.formatValue(mutation.oldValue);
      const newVal = this.formatValue(mutation.newValue);

      return `
        <div class="mutation-entry">
          <div><strong>${this.escapeHtml(mutation.type)}</strong> <span style="color: #888;">${time}</span></div>
          <div class="mutation-path">${this.escapeHtml(mutation.path)}</div>
          <div class="mutation-old">- ${oldVal}</div>
          <div class="mutation-new">+ ${newVal}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render statistics
   */
  renderStats() {
    const stats = store.getStats();

    return `
      <div>
        <h3 style="color: #ffff00; margin-top: 0;">State Statistics</h3>

        <div class="stat-row">
          <span class="stat-label">History Size:</span>
          <span class="stat-value">${store.getHistoryLength()} / ${store.getMaxHistorySize()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Mutations Recorded:</span>
          <span class="stat-value">${store.getMutationsLength()} / ${store.getMaxMutations()}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Listeners:</span>
          <span class="stat-value">${stats.listenerCount}</span>
        </div>

        <h3 style="color: #ffff00; margin-top: 20px;">Slice Statistics</h3>

        <div class="stat-row">
          <span class="stat-label">Persistent Nodes:</span>
          <span class="stat-value">${stats.persistent.count}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Session Nodes:</span>
          <span class="stat-value">${stats.session.count}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Transient Nodes:</span>
          <span class="stat-value">${stats.transient.count}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">UI Nodes:</span>
          <span class="stat-value">${stats.ui.count}</span>
        </div>

        <h3 style="color: #ffff00; margin-top: 20px;">Game State</h3>

        <div class="stat-row">
          <span class="stat-label">Zones Cached:</span>
          <span class="stat-value">${store.get('persistent.zones')?.size || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Visited Zones:</span>
          <span class="stat-value">${store.get('persistent.player.visitedZones')?.size || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Defeated Enemies:</span>
          <span class="stat-value">${store.get('persistent.defeatedEnemies')?.size || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Active Enemies:</span>
          <span class="stat-value">${store.get('session.enemies')?.length || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Inventory Items:</span>
          <span class="stat-value">${store.get('persistent.player.inventory')?.length || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Message Log:</span>
          <span class="stat-value">${store.get('persistent.messageLog')?.length || 0}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Last Saved:</span>
          <span class="stat-value">${this.formatTimestamp(store.get('meta.lastSaved'))}</span>
        </div>

        <div class="stat-row">
          <span class="stat-label">Save Count:</span>
          <span class="stat-value">${store.get('meta.saveCount')}</span>
        </div>
      </div>
    `;
  }

  /**
   * Format value for display
   */
  formatValue(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${this.escapeHtml(value)}"`;
    if (typeof value === 'object') {
      if (value instanceof Set) return `Set(${value.size})`;
      if (value instanceof Map) return `Map(${value.size})`;
      if (Array.isArray(value)) return `Array(${value.length})`;
      return '{...}';
    }
    return String(value);
  }

  /**
   * Format timestamp
   */
  formatTimestamp(timestamp: unknown): string {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
export const stateDebugger = new StateDebugger();

// Debug access
if (typeof window !== 'undefined') {
  window.chressDebugger = stateDebugger;

  // Add keyboard shortcut: Ctrl+Shift+D
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      stateDebugger.toggle();
    }
  });
}
