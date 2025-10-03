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
                "Hope you don't mind, but I borrowed yer axe. I'll leave it nearby when I'm done! Thanks - Crayn.",
                "The house feels warm and safe. Maybe someone will visit soon.",
                "A note: 'Don't forget to water the plants.'",
                "You hear distant laughter from the woods.",
                "A memory of home comforts you as you rest."
            ],
            woods: [
                "Heard a rumor: a hammer is hidden somewhere in these woods.",
                "A patch of mushrooms grows where the sun barely reaches.",
                "The trees whisper secrets to those who listen.",
                "A hammer lies beneath the roots, waiting for a worthy hand."
            ],
            wilds: [
                "Some say a spear is lost in the wilds. Only the brave will find it.",
                "A spear glints in the tall grass—watch out for lizards!",
                "The wind howls, carrying distant cries.",
                "The wilds test your courage. Seek the spear, and beware the lizards.",
                "Every step deeper feels like a step into legend."
            ],
            frontier: [
                "Lizardos roam the frontier. Only legends return from here.",
                "The horizon stretches on, daring you to go further.",
                "The air is thin, and the ground is scarred by old battles.",
                "The unknown calls; will you answer or retreat?",
                "The outer reaches demand courage and cunning alike."
            ]
        };

    static getProceduralMessage(zoneX, zoneY) {
    // Determine area based on zone distance
    const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
    let area = 'home';
    if (dist > 2 && dist <= 8) area = 'woods';
    else if (dist > 8 && dist <= 16) area = 'wilds';
    else if (dist > 16) area = 'frontier';

    const messages = Note.messageSets[area];

    // Track used messages per region
    if (!Note.usedMessages) Note.usedMessages = {};
    if (!Note.usedMessages[area]) Note.usedMessages[area] = new Set();

    // If all messages have been used, reset for this region
    if (Note.usedMessages[area].size >= messages.length) {
        Note.usedMessages[area].clear();
    }

    // Find an unused message
    for (let attempt = 0; attempt < messages.length; attempt++) {
        const seed = Math.abs(zoneX * 7 + zoneY * 13 + attempt * 23);
        const index = seed % messages.length;
        const selectedMessage = messages[index];
        if (!Note.usedMessages[area].has(selectedMessage)) {
            Note.usedMessages[area].add(selectedMessage);
            return selectedMessage;
        }
    }

    // Fallback: just return the first message (should never happen)
    const fallbackMessage = messages[0];
    Note.usedMessages[area].add(fallbackMessage);
    return fallbackMessage;
    }

    static getMessageByIndex(area, index) {
        return Note.messageSets[area][index];
    }
}
