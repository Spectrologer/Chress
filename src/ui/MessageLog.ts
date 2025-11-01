import { logger } from '../core/logger.ts';

interface GameInstance {
    messageLog: string[];
    gameLoop: () => void;
}

/**
 * Manages message history tracking and display.
 * Handles coordinate highlighting and log UI.
 */
export class MessageLog {
    private game: GameInstance;
    private messageLogOverlay: HTMLElement | null;
    private messageLogContent: HTMLElement | null;
    private closeMessageLogButton: HTMLElement | null;

    constructor(game: GameInstance) {
        this.game = game;
        this.messageLogOverlay = document.getElementById('messageLogOverlay');
        this.messageLogContent = document.getElementById('messageLogContent');
        this.closeMessageLogButton = document.getElementById('closeMessageLogButton');

        this.setupEventHandlers();
    }

    /**
     * Set up event handlers for message log UI
     */
    private setupEventHandlers(): void {
        // Set up close button
        if (this.closeMessageLogButton) {
            this.closeMessageLogButton.addEventListener('click', () => {
                this.hide();
                this.game.gameLoop();
            });
        }

        // Set up message log button
        const messageLogButton = document.getElementById('message-log-button');
        if (messageLogButton) {
            // Desktop click
            messageLogButton.addEventListener('click', () => {
                this.show();
            });

            // Mobile / pointer
            messageLogButton.addEventListener('pointerdown', (e) => {
                try {
                    e.preventDefault();
                } catch (err) {}
                this.show();
            });
        }
    }

    /**
     * Show the message log overlay
     */
    show(): void {
        if (!this.messageLogContent) return;

        this.messageLogContent.innerHTML = '';

        if (this.game.messageLog.length === 0) {
            this.messageLogContent.innerHTML = '<p>No messages yet.</p>';
        } else {
            // Show newest messages first
            [...this.game.messageLog].reverse().forEach(msg => {
                const p = document.createElement('p');
                p.style.fontVariant = 'small-caps';
                p.style.fontWeight = 'bold';
                p.innerHTML = msg; // Use innerHTML to support HTML tags
                this.messageLogContent!.appendChild(p);
            });
        }

        this.messageLogOverlay?.classList.add('show');
    }

    /**
     * Hide the message log overlay
     */
    hide(): void {
        this.messageLogOverlay?.classList.remove('show');
    }

    /**
     * Add a message to the log with coordinate highlighting
     * @returns Extracted coordinates if found
     */
    addMessage(message: string): string | null {
        let coordinates: string | null = null;

        // Color coordinates in dark green and extract them
        const coloredMessage = message.replace(/\((-?\d+),\s*(-?\d+)\)/g, (match, x, y) => {
            if (!coordinates) {
                // Only capture the first set of coordinates
                coordinates = match;
            }
            return `<span style="color: darkgreen">${match}</span>`;
        });

        // Only add if not already in the log
        if (!this.game.messageLog.includes(coloredMessage)) {
            this.game.messageLog.push(coloredMessage);
        }

        return coordinates;
    }
}
