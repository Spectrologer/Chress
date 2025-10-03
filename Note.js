export class Note {
    constructor(message, x, y) {
        this.message = message;
        this.x = x;
        this.y = y;
    }

    static getProceduralMessage(zoneX, zoneY) {
        // Predefined messages by area using RiveScript-like triggers
        const messageSets = {
            home: [
                "Hope you don't mind, but I borrowed yer aks. I'll leave it nearby when I'm done! Thanks - Crayn.",
                "Who's scattering this weird food everywhere? - Crayn.",
                "Chopping wood sure makes me hungry. - Crayn.",
                "Theres this guy leaving placeholder notes or something. Really corny stuff. - Crayn",
                "I heard if you don't eat enough food, you die or something. - Crayn"
            ],
            wilds: [
                "Cracking rocks is like, twice as tiring as chopping wood. - Crayn",
                "Nature tests the unwavering; bend but do not break.",
                "Every step reveals wonders hidden from the tame world.",
                "Perseverance through peril yields untold rewards.",
                "The forest hides secrets for those brave enough to seek."
            ],
            frontier: [
                "The frontier holds secrets untold. Tread lightly, adventurer.",
                "Legends speak of treasures and terrors beyond the horizon.",
                "The unknown calls; will you answer or retreat?",
                "Beyond this point, only legends return unchanged.",
                "The outer reaches demand courage and cunning alike."
            ]
        };

        // Determine area based on zone distance
        const dist = Math.max(Math.abs(zoneX), Math.abs(zoneY));
        let area = 'home';
        if (dist > 1) area = 'wilds';
        if (dist > 7) area = 'frontier';

        const messages = messageSets[area];
        // Use zone position to seed deterministic random selection
        const seed = Math.abs(zoneX * 7 + zoneY * 13);  // Simple hash
        const index = seed % messages.length;
        return messages[index];
    }
}
