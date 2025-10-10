// Sign class, refactored to be a static utility class for message handling.
export class Sign {
    // Static properties for message generation
    static spawnedMessages = new Set();

    // Area definitions for messages
    static messageSets = {
        home: [
            "Tap to move.",
            "Tap adjacent objects to interact.",
            "Find food to survive.",
            "The Club has lots of good info.",
            "Double tap to exit quickly."
        ],
        woods: [
            "Hammer for grey.",
            "Beware the Knight. It moves in L-shapes.",
            "Some foes leap.",
            "The woods are deep.",
            "Axe is for wood, not stone."
        ],
        wilds: [
            "Seek the Spear. It strikes from afar.",
            "Hold down items in the inventory to disable them.",
            "Bombs can clear paths... or send you flying.",
            "Trade with the locals. They have their needs.",
            "The rules are different out here."
        ],
        frontier: [
            "Beware the Rook. It charges in straight lines.",
            "The world frays at the edges.",
            "Turn back.",
            "The end is not the end.",
            "Read between the lines."
        ],
        canyon: [
            "Echoes of the past.",
            "Ancient secrets.",
            "The walls are watching.",
            "Whose footsteps?",
            "The wind whispers."
        ]
    };

    // Statue dialogue content
    static statueData = {
        lizardy: {
            message: 'Moves <strong>north and south</strong> one tile at a time and can only attack diagonally in the direction it is traveling.<br><br><em>If it could only be so simple.</em>'
        },
        lizardo: {
            message: 'Moves <strong>orthogonally and diagonally</strong> (8-way).<br><br><em>Wants to be like the lazerd.</em>'
        },
        lizardeaux: {
            message: '<strong>Charges</strong> in straight lines to ram players from any distance.<br><br><em>A powerful linear combatant.</em>'
        },
        zard: {
            message: 'Moves and <strong>charges diagonally</strong> to attack from a distance.<br><br><em>Hard to catch, too.</em>'
        },
        lazerd: {
            message: 'Moves and <strong>charges in any direction</strong>.<br><br><em>A master of all directional movement.</em>'
        },
        lizord: {
            message: 'Moves in <strong>L-shapes</strong>.<br><br><em>A real fork in the road.</em>'
        },
        default: {
            message: 'An ancient statue depicting a mysterious creature from the wilderness.'
        }
    };

    // Barter dialogue content
    static barterNpcData = {
        lion: {
            name: 'Penne',
            portrait: 'Images/fauna/lionface.png',
            message: 'Give me meat!',
            requiredItem: 'food/meat',
            requiredItemImg: 'images/food/meat/beaf.png',
            requiredItemName: 'Meat',
            receivedItemImg: 'Images/items/water.png',
            receivedItemName: 'Water'
        },
        squig: {
            name: 'Squig',
            portrait: 'Images/fauna/squigface.png',
            message: 'I\'m nuts for nuts!',
            requiredItem: 'food/veg',
            requiredItemImg: 'images/food/veg/nut.png',
            requiredItemName: 'Nut',
            receivedItemImg: 'Images/items/water.png',
            receivedItemName: 'Water'
        },
        rune: {
            name: 'Rune', // This is now a header for the NPC
            portrait: 'Images/fauna/runeface.png', // Shared portrait
            message: 'I smell it... Points. Feed it me.', // Shared message
            trades: [
                {
                    id: 'rune_food',
                    requiredItem: 'points',
                    requiredAmount: 5,
                    requiredItemImg: 'images/items/points.png',
                    receivedItemName: 'Random Food',
                    receivedItemImg: 'images/items/chest.png'
                },
                {
                    id: 'rune_item',
                    requiredItem: 'points',
                    requiredAmount: 5,
                    requiredItemImg: 'images/items/points.png',
                    receivedItemName: 'Random Item',
                    receivedItemImg: 'images/items/chest.png'
                }
            ]
        },
    };

    static getProceduralMessage(zoneX, zoneY, usedMessagesSet = Sign.spawnedMessages) {
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

    static getStatueData(statueType) {
        return Sign.statueData[statueType] || Sign.statueData.default;
    }

    static getBarterNpcData(npcType) {
        return Sign.barterNpcData[npcType];
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
        // Use the dedicated sign message method for persistent display
        gameInstance.showSignMessage(signData.message, 'images/sign.png');
        gameInstance.displayingMessageForSign = signData;
    }

    // Static method to hide the currently displayed sign message
    static hideMessageForSign(gameInstance) {
        if (gameInstance.displayingMessageForSign) {
            gameInstance.hideOverlayMessage();
            gameInstance.displayingMessageForSign = null;
        }
    }

    // Dialogue NPC content
    static dialogueNpcData = {
        crayn: {
            name: 'Crayn',
            portrait: 'Images/fauna/craynface.png',
            currentMessageIndex: 0,
            messages: [
                "There is no end to the frontier.",
                "Trees must be chopped.",
                "They say you are descended from a King.",
                "The Woodcutter's Club is members only.",
                "Spears can be used to get past obstacles.",
                "Bombs can send you flying.",
                "You can only hold six items, but you can use as many as you like.",
                "The path gets harder the farther you go.",
                "Beyond the frontier is the adjudicator",
                "Sometimes enemies are simply in a better position.",
            ]
        },
        felt: {
            name: 'Felt',
            portrait: 'Images/fauna/feltface.png',
            currentMessageIndex: 0,
            messages: [
                "Crayn is like, so smart.",
                "I want to be like Crayn.",
                "Word around town is Crayn has 4 hearts.",
                "I wonder if Crayn likes standing too.",
                "I hear Crayn can put down food after he picks it up! Couldn't be me.",
                "Forge is a LIAR.",
            ]
        },
        forge: {
            name: 'Forge',
            portrait: 'Images/fauna/forgeface.png',
            currentMessageIndex: 0,
            messages: [
                "I can move between tiles.",
                "I'm not in your way, am I?",
                "There was so much food in here earlier. Yumm!",
                "Did you get a chance to play with the horse icons in here a minute ago?",
                "I always file my taxes as married. It's foolish not to.",
                "If you stand still for long enough, enemies can't hurt you.",
                "The walls are edible. You just need to be hungry enough.",
                "Water actually makes you thirstier the more you drink it.",
                "I taught Crayn everything he knows.",
                "The further you go, the easier it gets.",
                "I invented moving in an L-shape.",
                "Sometimes Crayn goes fishing.",
            ]
        }
    };

    static getDialogueNpcData(npcType) {
        return Sign.dialogueNpcData[npcType];
    }
}
