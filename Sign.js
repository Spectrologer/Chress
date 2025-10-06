// Sign class, refactored to be a static utility class for message handling.
export class Sign {
    // Static properties for message generation
    static spawnedMessages = new Set();

    // Area definitions for messages
    static messageSets = {
        home: [
            "Don't try to chop shrubs or enemies down without your axe.",
            "Chop.",
            "H.",
            "Even a woodcutter has to eat eat.",
            "Try walking."
        ],
        woods: [
            "The stumps weep. Or maybe that's just sap.",
            "Axe ahead. Therefore, try chopping.",
            "The leaping ones mock our steps. Show them the woodcutter's way.",
            "To shatter stone, one needs more than a sharp edge. Seek the hammer.",
            "Beware, the 'knight'. Its path is crooked."
        ],
        wilds: [
            "The rules fray at the edges here. Chaos seeps in.",
            "They say a long-reaching weapon lies amidst the chaos. A tool to strike from where you are not.",
            "The 'bishop' slides through the world's cracks. Do not let it corner you.",
            "To pass, you need the tools of the Club. The axe for the green, the hammer for the grey.",
            "Liar ahead. Or, treasure?"
        ],
        frontier: [
            "The world is undone. The Ent's heart is near.",
            "The 'rook' sees only straight lines. Use this to your advantage.",
            "Here, the rules are but a suggestion. And the Ent does not play fair.",
            "Turn back. Or, don't. What do I care?",
            "A little know woodcutter power is reading signs sideways and backwards."
        ],
        canyon: [
            "Echoes of the past whisper through these walls. Listen carefully.",
            "The canyon breathes with ancient secrets. Can you hear them?",
            "Strange formations line the path. They seem to watch you.",
            "Footsteps echo endlessly here. Are they yours, or something else's?",
            "The wind carries voices from another time. What are they saying?"
        ]
    };

    static getProceduralMessage(zoneX, zoneY, usedMessagesSet) {
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        let area = 'wilds'; // Default to wilds as it's the only level with procedural notes.
        // The logic could be expanded if other levels get procedural notes.

        const messages = Sign.messageSets[area];
        // Find an unused message from 'messages' that is not in 'usedMessagesSet'
        const availableMessages = messages.filter(msg => !usedMessagesSet.has(msg));
        if (availableMessages.length > 0) {
            const index = Math.floor(Math.random() * availableMessages.length);
            return availableMessages[index];
        }

        return messages[0]; // Fallback
    }

    static getMessageByIndex(area, index) {
        return Sign.messageSets[area][index];
    }

    static getCanyonMessage() {
        const messages = Sign.messageSets.canyon;
        return messages[Math.floor(Math.random() * messages.length)];
    }

    // Handle click interaction (toggle message display)
    static handleClick(signData, gameInstance, playerAdjacent) {
        if (!playerAdjacent) {
            return; // Only respond to clicks when adjacent
        }

        // Check if this specific sign's message is currently displayed
        const isDisplayed = gameInstance.displayingMessageForSign &&
                           gameInstance.displayingMessageForSign.message === signData.message;

        if (isDisplayed) {
            // Message is showing, hide it
            Sign.hideMessageForSign(gameInstance);
        } else {
            // If another sign message is showing, hide it first to avoid overlap
            if (gameInstance.displayingMessageForSign) {
                Sign.hideMessageForSign(gameInstance);
            }
            // Now, display the new one
            Sign.displayMessageForSign(signData, gameInstance);
        }
    }

    // Static method to display message for a sign object
    static displayMessageForSign(signData, gameInstance) {
        console.log('Sign.displayMessageForSign called', signData.message);
        // Use the dedicated sign message method for persistent display
        gameInstance.showSignMessage(signData.message, 'Images/sign.png');
        gameInstance.displayingMessageForSign = signData;
    }

    // Static method to hide the currently displayed sign message
    static hideMessageForSign(gameInstance) {
        console.log('Sign.hideMessageForSign called');
        if (gameInstance.displayingMessageForSign) {
            gameInstance.hideOverlayMessage();
            gameInstance.displayingMessageForSign = null;
        }
    }
}
