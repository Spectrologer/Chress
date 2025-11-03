// NoteStack.ts
// Handles the UI logic for the note stack (add/remove notes)
import { logger } from '../core/logger';
import { UI_CONSTANTS, UI_TIMING_CONSTANTS } from '../core/constants/ui';
import { EventListenerManager } from '../utils/EventListenerManager';

export class NoteStack {
    private noteIdCounter: number = 0;
    private activeNotes: Map<string, number> = new Map(); // id -> timeoutId
    private eventManager: EventListenerManager;

    constructor() {
        this.eventManager = new EventListenerManager();
    }

    addNoteToStack(text: string, imageSrc: string | null = null, timeout: number = UI_TIMING_CONSTANTS.NOTE_DEFAULT_TIMEOUT): string | null {
        try {
            const container = document.getElementById('noteStack');
            if (!container) return null;

            const id = `note-${++this.noteIdCounter}`;
            const card = document.createElement('div');
            card.className = 'note-card';
            card.id = id;

            if (imageSrc) {
                const img = document.createElement('img');
                img.className = 'note-thumb';
                img.src = imageSrc;
                img.alt = '';
                card.appendChild(img);
            }

            const textNode = document.createElement('div');
            textNode.className = 'note-text';
            textNode.innerHTML = text;
            card.appendChild(textNode);

            // Insert at top so newest notes are at top of stack
            container.insertBefore(card, container.firstChild);

            // Force reflow then animate in
            void card.offsetWidth;
            card.classList.add('show');

            // Auto-remove after timeout
            const removeFn = (): void => {
                card.classList.remove('show');
                setTimeout(() => {
                    if (card.parentNode) card.parentNode.removeChild(card);
                    this.activeNotes.delete(id);
                }, UI_TIMING_CONSTANTS.NOTE_TRANSITION_DURATION);
            };

            const tId = setTimeout(removeFn, timeout) as unknown as number;
            this.activeNotes.set(id, tId);

            // Allow manual click to dismiss sooner
            this.eventManager.add(card, 'click', () => {
                const existing = this.activeNotes.get(id);
                if (existing) clearTimeout(existing);
                removeFn();
            });

            return id;
        } catch (e) {
            logger.error('Failed to add note to stack', e);
            return null;
        }
    }

    removeNoteFromStack(id: string | null): void {
        if (!id) return;
        const timeoutId = this.activeNotes.get(id);
        if (timeoutId) clearTimeout(timeoutId);
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('show');
            setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, UI_CONSTANTS.CSS_TRANSITION_DURATION);
        }
        this.activeNotes.delete(id);
    }

    /**
     * Cleanup all event listeners
     * Call this when destroying the NoteStack instance
     */
    cleanup(): void {
        this.eventManager.cleanup();
    }
}
