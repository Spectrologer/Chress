// Small utilities for inventory items (tooltip text, image helpers)
export function getItemTooltipText(item) {
    let disabledText = item.disabled ? ' (DISABLED)' : '';
    switch (item.type) {
        case 'food': {
            let foodName = item.foodType || '';
            try {
                const parts = foodName.split('/');
                if (parts.length >= 2) {
                    foodName = parts[1];
                } else {
                    foodName = parts.pop().replace('.png', '');
                }
            } catch (e) {
                foodName = (item.foodType || '').split('/').pop().replace('.png', '');
            }
            const foodQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `${foodName}${foodQuantity} - Restores 10 hunger`;
        }
        case 'water': {
            const waterQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `Water${waterQuantity} - Restores 10 thirst`;
        }
        case 'axe':
            return 'Axe - Chops grass and shrubbery to create pathways';
        case 'hammer':
            return 'Hammer - Breaks rocks to create pathways';
        case 'bishop_spear':
            return `Bishop Spear${disabledText} - Charge diagonally towards enemies, has ${item.uses} charges`;
        case 'horse_icon':
            return `Horse Icon${disabledText} - Charge in L-shape (knight moves) towards enemies, has ${item.uses} charges`;
        case 'bomb': {
            const bombQuantity = item.quantity > 1 ? ` (x${item.quantity})` : '';
            return `Bomb${bombQuantity} - Blasts through walls to create exits`;
        }
        case 'heart':
            return 'Heart - Restores 1 health';
        case 'note':
            return 'Map Note - Marks an undiscovered location 15-20 zones away on the map';
        case 'book_of_time_travel':
            return `Book of Time Travel - Passes one turn, allowing enemies to move. Has ${item.uses} charges.`;
        case 'bow':
            return `Bow${disabledText} - Fires an arrow in an orthogonal direction. Has ${item.uses} charges.`;
        case 'shovel':
            return `Shovel - Digs a hole in an adjacent empty tile. Has ${item.uses} uses.`;
        default:
            return '';
    }
}
