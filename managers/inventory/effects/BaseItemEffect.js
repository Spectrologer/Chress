/**
 * BaseItemEffect - Abstract base class for all item effects
 *
 * All item effect classes should extend this and implement the apply() method.
 */
export class BaseItemEffect {
    /**
     * Apply the item effect
     * @param {Object} game - Game instance
     * @param {Object} item - Item being used
     * @param {Object} context - Context (fromRadial, targetX, targetY, etc.)
     * @returns {Object} - { consumed: bool, quantity/uses: number, success: bool }
     */
    apply(game, item, context = {}) {
        throw new Error('BaseItemEffect.apply() must be implemented by subclass');
    }

    /**
     * Play sound effect for item usage
     * @protected
     */
    _playSound(game, soundName) {
        if (game && game.soundManager && typeof game.soundManager.playSound === 'function') {
            game.soundManager.playSound(soundName);
        } else if (typeof window !== 'undefined' && window.soundManager?.playSound) {
            window.soundManager.playSound(soundName);
        }
    }

    /**
     * Show overlay message
     * @protected
     */
    _showMessage(game, text, imageSrc = null, instant = true, noTypewriter = false) {
        if (game.uiManager && typeof game.uiManager.showOverlayMessage === 'function') {
            game.uiManager.showOverlayMessage(text, imageSrc, instant, true, noTypewriter);
        }
    }
}
