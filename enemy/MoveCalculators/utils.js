export function coordKey(x,y) { return `${x},${y}`; }
export function chebyshev(aX,aY,bX,bY) { return Math.max(Math.abs(bX - aX), Math.abs(bY - aY)); }
export function manhattan(aX,aY,bX,bY) { return Math.abs(bX - aX) + Math.abs(bY - aY); }
