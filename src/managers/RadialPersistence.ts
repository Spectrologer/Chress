// Simple localStorage-backed persistence for player's radial inventory
import type { IGame } from '@core/context';

const STORAGE_KEY = 'chress:radialInventory:v1';

interface RadialItem {
    type: string;
    quantity: number;
    uses: number;
    foodType?: string;
    disabled?: boolean;
    image?: string;
}

export function saveRadialInventory(game: IGame): void {
    try {
        if (!game || !game.player) return;
        const radial = (game.player as any).radialInventory || [];
        // Only store serializable fields
        const serial = radial.map((i: RadialItem) => ({
            type: i.type,
            quantity: i.quantity,
            uses: i.uses,
            foodType: i.foodType,
            disabled: i.disabled,
            image: i.image
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serial));
    } catch (e) {
        try { console.warn('[RadialPersistence] save failed', e); } catch (er) {}
    }
}

export function loadRadialInventory(game: IGame): void {
    try {
        if (!game || !game.player) return;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;
        (game.player as any).radialInventory = parsed.map((i: any) => ({
            type: i.type,
            quantity: i.quantity,
            uses: i.uses,
            foodType: i.foodType,
            disabled: i.disabled,
            image: i.image
        }));
    } catch (e) {
        try { console.warn('[RadialPersistence] load failed', e); } catch (er) {}
    }
}

export function clearRadialInventory(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
}
