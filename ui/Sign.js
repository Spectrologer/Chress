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
        // Item statue descriptions
        bomb: {
            message: 'Select from inventory to place on an adjacent tile. It explodes after two turns, or if you tap it.<br><br><em>Destroys walls, enemies, and can even launch you.</em>'
        },
        spear: {
            message: 'Tap an enemy on a diagonal line to charge through them.<br><br><em>Hold down to disable, tap to drop.</em>'
        },
        bow: {
            message: 'Tap an enemy in a straight line (up, down, left, or right) to shoot an arrow.<br><br><em>Patience is key.</em>'
        },
        horse: {
            message: 'Tap an enemy in an L-shape (like a knight) to charge them.<br><br><em>Hold down to disable, tap to drop.</em>'
        },
        book: {
            message: 'Use from inventory to pass your turn, allowing enemies to move while you stand still.<br><br><em>A tactical tool for repositioning foes.</em>'
        },
        shovel: {
            message: 'Select from inventory, then tap an adjacent empty floor tile to dig a hole.<br><br><em>What lies beneath?</em>'
        },
        default: {
            message: 'An ancient statue depicting a mysterious creature from the wilderness.'
        }
    };

    // Barter dialogue content
    static barterNpcData = {
        penne: {
            name: 'Penne',
            portrait: 'assets/fauna/lionface.png',
            message: 'Give me meat!',
            subclass: 'merchant',
            trades: [
                {
                    requiredItem: 'food/meat',
                    requiredAmount: 1,
                    requiredItemImg: 'assets/food/meat/beaf.png',
                    requiredItemName: 'Meat',
                    receivedItemImg: 'assets/items/water.png',
                    receivedItemName: 'Water'
                }
            ]
        },
        squig: {
            name: 'Squig',
            portrait: 'assets/fauna/squigface.png',
            message: 'I\'m nuts for nuts!',
            subclass: 'merchant',
            trades: [
                {
                    requiredItem: 'food/veg',
                    requiredAmount: 1,
                    requiredItemImg: 'assets/food/veg/nut.png',
                    requiredItemName: 'Nut',
                    receivedItemImg: 'assets/items/water.png',
                    receivedItemName: 'Water'
                }
            ]
        },
        rune: {
            name: 'Rune', // This is now a header for the NPC
            portrait: 'assets/fauna/runeface.png', // Shared portrait
            message: 'I smell it... Points. Feed it me.', // Shared message
            subclass: 'merchant',
            trades: [
                {
                    id: 'rune_item',
                    requiredItem: 'points',
                    requiredAmount: 10,
                    requiredItemImg: 'assets/items/points.png',
                    receivedItemName: 'Random Weapon',
                    receivedItemImg: 'assets/items/chest.png'
                }
            ]
        },
        nib: {
            name: 'Nib',
            portrait: 'assets/fauna/nibface.png',
            message: 'I offer knowledge for your points.',
            subclass: 'merchant',
            trades: [
                {
                    id: 'nib_item',
                    requiredItem: 'points',
                    requiredAmount: 10,
                    requiredItemImg: 'assets/items/points.png',
                    receivedItemName: 'Random Trinket',
                    receivedItemImg: 'assets/items/chest.png'
                }
            ]
        },
        mark: {
            name: 'Mark',
            portrait: 'assets/fauna/markface.png',
            message: 'Show me some new places.',
            subclass: 'merchant',
            trades: [
                {
                    id: 'mark_meat',
                    requiredItem: 'DISCOVERED',
                    requiredAmount: 10,
                    requiredItemName: 'Discoveries',
                    requiredItemImg: 'assets/ui/talk.png',
                    receivedItemName: 'Meat',
                    receivedItemImg: 'assets/food/meat/beaf.png'
                }
            ]
        },
        axelotl: {
            name: 'Axe-O-Lot\'l',
            portrait: 'assets/fauna/axolotlface.png',
            message: 'Wanna chop down trees? Show me some new places.',
            subclass: 'merchant',
            trades: [
                {
                    id: 'axelotl_axe',
                    requiredItem: 'DISCOVERED',
                    requiredAmount: 10,
                    requiredItemName: 'Discoveries',
                    requiredItemImg: 'assets/ui/talk.png',
                    receivedItemName: 'Axe Ability',
                    receivedItemImg: 'assets/items/axe.png'
                }
            ]
        },
        gouge: {
            name: 'Gouge',
            portrait: 'assets/fauna/gougeface.png',
            message: 'Gimme discoveries, I\'ll give you a hammer.',
            subclass: 'merchant',
            trades: [
                {
                    id: 'gouge_hammer',
                    requiredItem: 'DISCOVERED',
                    requiredAmount: 35,
                    requiredItemName: 'Discoveries',
                    requiredItemImg: 'assets/ui/talk.png',
                    receivedItemName: 'Hammer Ability',
                    receivedItemImg: 'assets/items/hammer.png'
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
            gameInstance.showSignMessage(signData.message, 'assets/sign.png');
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
            portrait: 'assets/fauna/craynface.png',
            subclass: 'dialogue',
            currentMessageIndex: 0,
            messages: [
                "You dropped your axe down the well.",
                "Press down on items to disable them.",
                "Sometimes I chop a tree to pass the time.",
                "They say you are descended from a King.",
                "The Woodcutter's Club is members only.",
                "Spears can be used to get past obstacles.",
                "Bombs can send you flying.",
                "You can only hold six items, but you can use as many as you like.",
                "The path gets harder the farther you go.",
                "Sometimes enemies simply have a better position.",
                "There is no end to the frontier.",
                "Beyond the frontier is the adjudicator",


            ]
        },
        felt: {
            name: 'Felt',
            portrait: 'assets/fauna/feltface.png',
            subclass: 'dialogue',
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
            portrait: 'assets/fauna/forgeface.png',
            subclass: 'dialogue',
            currentMessageIndex: 0,
            messages: [
                "I can move between tiles.",
                "I'm not in your way, am I?",
                "There was so much food in here earlier. Yumm!",
                "Did you get a chance to play with the horse icons in here a minute ago?",
                "If you stand still for long enough, enemies can't hurt you.",
                "The walls are edible. You just need to be hungry enough.",
                "Water actually makes you thirstier the more you drink it.",
                "I taught Crayn everything he knows.",
                "The further you go, the easier it gets.",
                "I invented moving in an L-shape.",
                "Sometimes Crayn goes fishing.",
                "If you drop food, it turns into gold.",
                "Enemies are friendly if you're only holding water.",
                "The world is a sphere. Go far enough east, you'll end up back at the start from the west.",
                "If you don't score points for 100 boards, you might find a secret.",
                "I once saw a Penne eat a nut.",
            ]
        },
        axelotl_post_trade: {
            name: 'Axe-O-Lot\'l',
            portrait: 'assets/fauna/axolotlface.png',
            subclass: 'dialogue',
            currentMessageIndex: 0,
            messages: [
                "The underground is dangerous."
            ]
        }
        ,
        gouge_post_trade: {
            name: 'Gouge',
            portrait: 'assets/fauna/gougeface.png',
            subclass: 'dialogue',
            currentMessageIndex: 0,
            messages: [
                "Mind the cracks. The hammer helps, but it won't fix everything."
            ]
        }
    };

    static getDialogueNpcData(npcType) {
        return Sign.dialogueNpcData[npcType];
    }
}
