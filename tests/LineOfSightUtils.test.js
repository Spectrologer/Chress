import {
    calculateStepDirection,
    getLineType,
    checkLineOfSight,
    checkOrthogonalLineOfSight,
    checkDiagonalLineOfSight,
    checkQueenLineOfSight
} from '@utils/LineOfSightUtils.js';

console.log('Testing LineOfSightUtils...\n');

// Test calculateStepDirection
console.log('Testing calculateStepDirection:');
const step1 = calculateStepDirection(5, 5, 8, 5); // East
console.assert(step1.stepX === 1 && step1.stepY === 0, 'East direction failed');
console.log('  ✓ East direction');

const step2 = calculateStepDirection(5, 5, 5, 2); // North
console.assert(step2.stepX === 0 && step2.stepY === -1, 'North direction failed');
console.log('  ✓ North direction');

const step3 = calculateStepDirection(5, 5, 8, 8); // Southeast
console.assert(step3.stepX === 1 && step3.stepY === 1, 'Southeast direction failed');
console.log('  ✓ Southeast direction');

// Test getLineType
console.log('\nTesting getLineType:');
console.assert(getLineType(5, 5, 8, 5) === 'orthogonal', 'Orthogonal detection failed');
console.log('  ✓ Orthogonal (horizontal)');

console.assert(getLineType(5, 5, 5, 8) === 'orthogonal', 'Orthogonal detection failed');
console.log('  ✓ Orthogonal (vertical)');

console.assert(getLineType(5, 5, 8, 8) === 'diagonal', 'Diagonal detection failed');
console.log('  ✓ Diagonal');

console.assert(getLineType(5, 5, 7, 9) === null, 'Invalid line detection failed');
console.log('  ✓ Invalid line');

// Test checkOrthogonalLineOfSight
console.log('\nTesting checkOrthogonalLineOfSight:');

// Create a simple test grid (1 = walkable, 0 = wall)
const testGrid = [
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1]
];

const isWalkable = (x, y, grid) => {
    if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return false;
    return grid[y][x] === 1;
};

// Clear horizontal line
const clear1 = checkOrthogonalLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
console.assert(clear1 === true, 'Clear horizontal line failed');
console.log('  ✓ Clear horizontal line');

// Blocked horizontal line
const blocked1 = checkOrthogonalLineOfSight(0, 1, 4, 1, testGrid, { isWalkable });
console.assert(blocked1 === false, 'Blocked horizontal line failed');
console.log('  ✓ Blocked horizontal line');

// Clear vertical line
const clear2 = checkOrthogonalLineOfSight(0, 0, 0, 4, testGrid, { isWalkable });
console.assert(clear2 === true, 'Clear vertical line failed');
console.log('  ✓ Clear vertical line');

// Blocked vertical line
const blocked2 = checkOrthogonalLineOfSight(1, 0, 1, 4, testGrid, { isWalkable });
console.assert(blocked2 === false, 'Blocked vertical line failed');
console.log('  ✓ Blocked vertical line');

// Non-orthogonal should fail
const invalid1 = checkOrthogonalLineOfSight(0, 0, 3, 3, testGrid, { isWalkable });
console.assert(invalid1 === false, 'Non-orthogonal line should fail');
console.log('  ✓ Non-orthogonal rejection');

// Test checkDiagonalLineOfSight
console.log('\nTesting checkDiagonalLineOfSight:');

// Clear diagonal line
const clear3 = checkDiagonalLineOfSight(0, 0, 4, 4, testGrid, { isWalkable });
console.assert(clear3 === true, 'Clear diagonal line failed');
console.log('  ✓ Clear diagonal line');

// Non-diagonal should fail
const invalid2 = checkDiagonalLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
console.assert(invalid2 === false, 'Non-diagonal line should fail');
console.log('  ✓ Non-diagonal rejection');

// Test checkQueenLineOfSight
console.log('\nTesting checkQueenLineOfSight:');

// Queen can move orthogonally
const queen1 = checkQueenLineOfSight(0, 0, 4, 0, testGrid, { isWalkable });
console.assert(queen1 === true, 'Queen orthogonal movement failed');
console.log('  ✓ Queen orthogonal movement');

// Queen can move diagonally
const queen2 = checkQueenLineOfSight(0, 0, 4, 4, testGrid, { isWalkable });
console.assert(queen2 === true, 'Queen diagonal movement failed');
console.log('  ✓ Queen diagonal movement');

// Queen cannot move in invalid directions
const queen3 = checkQueenLineOfSight(0, 0, 3, 1, testGrid, { isWalkable });
console.assert(queen3 === false, 'Queen invalid movement should fail');
console.log('  ✓ Queen invalid movement rejection');

// Test with enemy blocking
console.log('\nTesting enemy blocking:');

const enemies = [{ x: 2, y: 0 }]; // Enemy at position (2, 0)

const blocked3 = checkOrthogonalLineOfSight(0, 0, 4, 0, testGrid, {
    isWalkable,
    checkEnemies: true,
    enemies
});
console.assert(blocked3 === false, 'Enemy blocking should fail');
console.log('  ✓ Enemy blocking orthogonal line');

const notBlocked = checkOrthogonalLineOfSight(0, 2, 4, 2, testGrid, {
    isWalkable,
    checkEnemies: true,
    enemies
});
console.assert(notBlocked === true, 'Enemy not blocking should pass');
console.log('  ✓ Enemy not blocking different line');

console.log('\n✅ All tests passed!');
