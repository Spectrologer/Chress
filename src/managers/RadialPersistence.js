// Simple localStorage-backed persistence for player's radial inventory
const STORAGE_KEY = 'chress:radialInventory:v1';

export function saveRadialInventory(game) {
    try {
        if (!game || !game.player) return;
        const radial = game.player.radialInventory || [];
        // Only store serializable fields
        const serial = radial.map(i => ({ type: i.type, quantity: i.quantity, uses: i.uses, foodType: i.foodType, disabled: i.disabled, image: i.image }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serial));
    } catch (e) {
        try { console.warn('[RadialPersistence] save failed', e); } catch (er) {}
    }
}

export function loadRadialInventory(game) {
    try {
        if (!game || !game.player) return;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        let parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        game.player.radialInventory = parsed.map(i => ({ type: i.type, quantity: i.quantity, uses: i.uses, foodType: i.foodType, disabled: i.disabled, image: i.image }));
    } catch (e) {
        try { console.warn('[RadialPersistence] load failed', e); } catch (er) {}
    }
}

export function clearRadialInventory() { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} }
