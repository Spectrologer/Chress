export class Note {
    constructor(message, x, y) {
        this.message = message;
        this.x = x;
        this.y = y;
    }

    // Static set to track spawned messages this session
    static spawnedMessages = new Set();

    // Area definitions for messages
    static messageSets = {
        home: [
            "Hope you don't mind, but I borrowed yer aks. I'll leave it nearby when I'm done! Thanks - Crayn.",
            "Who's scattering this weird food everywhere? - Crayn.",
            "Chopping wood sure makes me hungry. - Crayn.",
            "Theres this guy leaving placeholder notes or something. Really corny stuff. - Crayn",
            "I heard if you don't eat enough food, you die or something. - Crayn"
        ],
        wilds: [
            "Cracking rocks is like, twice as tiring as chopping wood. - Crayn",
            "Lizards are smart. It's almost like they know where you're going. - Crayn",
            "Every step reveals wonders hidden from the tame world.",
            "I hear theres a creature that can move diagonally. Messed up to think about. - Craynt",
            "I hear theres a room filed with differnt colored dirt somewhere. That's too freakin wild, man. - Crayn"
        ],
        frontier: [
            "The frontier holds secrets untold. Tread lightly, adventurer.",
            "Legends speak of treasures and terrors beyond the horizon.",
            "The unknown calls; will you answer or retreat?",
            "Beyond this point, only legends return unchanged.",
            "The outer reaches demand courage and cunning alike."
        ]
    };

    static getProceduralMessage(zoneX, zoneY) {
        // Determine area based on zone distance
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        let area = 'home';
        if (dist > 2) area = 'wilds';
        if (dist > 9) area = 'frontier';

        const messages = Note.messageSets[area];

        // Try up to messages.length times to find an unspawned message
        for (let attempt = 0; attempt < messages.length; attempt++) {
            // Use zone position + attempt number to seed random selection
            const seed = Math.abs(zoneX * 7 + zoneY * 13 + attempt * 23);  // Vary the hash for alternatives
            const index = seed % messages.length;
            const selectedMessage = messages[index];

            if (!Note.spawnedMessages.has(selectedMessage)) {
                // Mark this message as spawned and return it
                Note.spawnedMessages.add(selectedMessage);
                return selectedMessage;
            }
        }

        // If all messages in this area have been used (unlikely), use the seeded fallback
        const fallbackSeed = Math.abs(zoneX * 7 + zoneY * 13);
        const fallbackIndex = fallbackSeed % messages.length;
        const fallbackMessage = messages[fallbackIndex];
        Note.spawnedMessages.add(fallbackMessage); // Mark as used anyway
        return fallbackMessage;
    }

    static getMessageByIndex(area, index) {
        return Note.messageSets[area][index];
    }
}
