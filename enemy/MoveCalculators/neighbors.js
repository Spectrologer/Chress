export function adjacentTiles(x,y, allowDiagonal = true) {
    const dirs = allowDiagonal ? [
        {x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0},{x:-1,y:-1},{x:1,y:-1},{x:-1,y:1},{x:1,y:1}
    ] : [ {x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0} ];
    return dirs.map(d => ({ x: x + d.x, y: y + d.y }));
}

export function neighborsFiltered(x,y,grid,entity,allowDiagonal = true) {
    const candidates = adjacentTiles(x,y,allowDiagonal);
    return candidates.filter(pos => pos.y >= 0 && pos.y < grid.length && pos.x >= 0 && pos.x < grid[0].length && entity.isWalkable(pos.x,pos.y,grid));
}
