// TypewriterEffect.js
// Handles typewriter animation for text nodes in a DOM element.
export class TypewriterEffect {
    constructor({ speed = 28, onChar = null, onComplete = null } = {}) {
        this.speed = speed;
        this.onChar = onChar;
        this.onComplete = onComplete;
        this._interval = null;
    }

    start(element) {
        // Collect text nodes in document order, skipping .character-name descendants
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (!node || !node.textContent || node.textContent.trim().length === 0) continue;
            let parent = node.parentElement;
            let insideCharacterName = false;
            while (parent) {
                if (parent.classList && parent.classList.contains('character-name')) {
                    insideCharacterName = true;
                    break;
                }
                parent = parent.parentElement;
            }
            if (!insideCharacterName) {
                textNodes.push(node);
            }
        }
        if (!textNodes.length) {
            this.onComplete && this.onComplete();
            return;
        }
        const originals = textNodes.map(n => n.textContent.replace(/^\s+/, ''));
        textNodes.forEach(n => { n.textContent = ''; });
        let nodeIndex = 0;
        let charIndex = 0;
        const tick = () => {
            const node = textNodes[nodeIndex];
            const orig = originals[nodeIndex] || '';
            if (charIndex < orig.length) {
                const ch = orig.charAt(charIndex);
                node.textContent += ch;
                if (this.onChar) this.onChar(ch);
                charIndex++;
                return false;
            }
            nodeIndex++;
            charIndex = 0;
            if (nodeIndex >= textNodes.length) {
                return true;
            }
            return false;
        };
        // Start animation
        const startInterval = () => {
            const finishedNow = tick();
            if (finishedNow) {
                this.onComplete && this.onComplete();
                return;
            }
            let last = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const step = (now) => {
                if (!now) now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
                const elapsed = now - last;
                if (elapsed >= this.speed) {
                    last = now;
                    const finished = tick();
                    if (finished) {
                        if (this._interval) {
                            cancelAnimationFrame(this._interval);
                            this._interval = null;
                        }
                        this.onComplete && this.onComplete();
                        return;
                    }
                }
                this._interval = requestAnimationFrame(step);
            };
            this._interval = requestAnimationFrame(step);
        };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(startInterval);
        } else {
            setTimeout(startInterval, 0);
        }
    }

    stop() {
        if (this._interval) {
            cancelAnimationFrame(this._interval);
            this._interval = null;
        }
    }
}