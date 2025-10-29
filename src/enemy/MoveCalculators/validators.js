export function isOccupied(x,y,enemies) { return enemies.some(e => e.x === x && e.y === y); }

export function canEnterTile(x,y,grid,entity,options = {}) {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
    if (!entity.isWalkable(x,y,grid)) return false;
    if (!options.ignoreEnemies && isOccupied(x,y,options.enemies || [])) return false;
    return true;
}
