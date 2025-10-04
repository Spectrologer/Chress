export class Note {
    constructor(message, x, y) {
        this.message = message;
        this.x = x;
        this.y = y;
    }

    // This should be managed by a central game state manager, not statically here.
    static spawnedMessages = new Set();

    // Area definitions for messages
        static messageSets = {
            home: [
                "Borrowed your axe. I'll leave it where it is when I'm done. - Crayn",
                "Chopping wood sure makes me hungry. -Crayn",
                "Stay hydrated. - Crayn",
                "I wouldn't wan't to get caught without an axe out here. - Crayn",
                "If you starve to death, you will die. - Crayn"
            ],
            woods: [
                "The rocks in this region look tougher. I might need a sturdy hammer to break them.",
                "I saw a strange glint in the distance. Could be a useful tool, like a hammer or a spear.",
                "The .",
                "Fighting is never worth it. Sometimes.",
                "Beware the Lizardo.'"
            ],
            wilds: [
                "I've heard tales of a powerful spear, lost somewhere in these wilds. It's said to be able to strike foes from a distance.",
                "The 'Lizardos' are no joke.",
                "Some exits are blocked by thick shrubbery or heavy rocks. An axe or hammer is essential out here.",
                "Frontier hint.",
                "I heard there was a place with rainbow dirt...'"
            ],
            frontier: [
                "The ground here is scorching. It feels like a desert. The walls are just dried-out husks.",
                "This is the Frontier. Few have returned from here. Every step is a risk.",
                "The creatures here are relentless. A spear is my only hope for survival.",
                "Water is almost impossible to find. I must conserve what I have.",
                "Is that... a puzzle? In the middle of nowhere? The colors... they must mean something."
            ]
        };

    // This logic should be moved to a manager that can handle state.
    // The Note class itself should be a simple data structure.
    static getProceduralMessage(zoneX, zoneY, usedMessagesSet) {
        // This is a simplified example. The full logic from the original function
        // for selecting an unused message would go here, using the passed 'usedMessagesSet'.
        // Procedural notes only spawn in the "wilds" (Level 3), so we only need that case.
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        let area = 'wilds'; // Default to wilds as it's the only level with procedural notes.
        // The logic could be expanded if other levels get procedural notes.
        
        const messages = Note.messageSets[area];
        // Find an unused message from 'messages' that is not in 'usedMessagesSet'
        const availableMessages = messages.filter(msg => !usedMessagesSet.has(msg));
        if (availableMessages.length > 0) {
            const index = Math.floor(Math.random() * availableMessages.length);
            return availableMessages[index];
        }
        
        return messages[0]; // Fallback
    }

    static getMessageByIndex(area, index) {
        return Note.messageSets[area][index];
    }
}
