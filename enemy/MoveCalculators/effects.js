export function addSmokeTrail(enemy, next) {
    const chargeTypes = new Set(['lizardeaux', 'zard']);
    if (chargeTypes.has(enemy.enemyType)) {
        const startX = enemy.x; const startY = enemy.y;
        const dx = next.x - startX; const dy = next.y - startY;
        const distX = Math.abs(dx); const distY = Math.abs(dy);
        if (distX >= distY) {
            const stepX = dx > 0 ? 1 : -1; const stepY = dy === 0 ? 0 : dy / distX;
            for (let i = 1; i < distX; i++) enemy.smokeAnimations.push({ x: startX + i * stepX, y: startY + Math.round((i * dy) / distX), frame: 18 });
        } else {
            const stepY = dy > 0 ? 1 : -1; const stepX = dx === 0 ? 0 : dx / distY;
            for (let i = 1; i < distY; i++) enemy.smokeAnimations.push({ x: startX + Math.round((i * dx) / distY), y: startY + i * stepY, frame: 18 });
        }
    }
}

export function playSound(name) { if (window.soundManager) window.soundManager.playSound(name); }
