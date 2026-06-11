/**
 * Avero Merge - Core Engine Module Execution Logic
 */

let gridSize = 4;
let boardState = []; // Logical coordinate grid mapping matrix tracking ID elements
let score = 0;
let isGameOver = false;

const container = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const gridSelect = document.getElementById('grid-select');
const restartBtn = document.getElementById('restart-btn');
const modalRestartBtn = document.getElementById('modal-restart-btn');
const statusOverlay = document.getElementById('status-overlay');

// Mobile Touch Vector Variables
let touchStartX = 0;
let touchStartY = 0;

/**
 * START SYSTEM ROUTINES
 */
function initializeGame() {
    gridSize = parseInt(gridSelect.value, 10);
    boardState = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    score = 0;
    isGameOver = false;
    
    scoreDisplay.innerText = score;
    statusOverlay.style.display = 'none';
    
    setupGridUI();
    spawnRandomTile();
    spawnRandomTile();
    updateRenderedPositions();
}

/**
 * UI GRID BASE GENERATOR
 */
function setupGridUI() {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    // Output structural cells blocks placeholders background depth elements
    for (let i = 0; i < gridSize * gridSize; i++) {
        const structuralCell = document.createElement('div');
        structuralCell.className = 'grid-cell';
        container.appendChild(structuralCell);
    }
}

/**
 * TILE SPAWNER AGENT LOGIC
 */
function spawnRandomTile() {
    let emptyCoordinates = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (boardState[r][c] === 0) {
                emptyCoordinates.push({ r, c });
            }
        }
    }

    if (emptyCoordinates.length > 0) {
        const selection = emptyCoordinates[Math.floor(Math.random() * emptyCoordinates.length)];
        // 90% chance for 2, 10% chance for 4
        boardState[selection.r][selection.c] = Math.random() < 0.9 ? 2 : 4;
        
        // Render dynamic element instance explicitly for spawn tracking animations hook
        const tileElement = document.createElement('div');
        tileElement.id = `tile-${selection.r}-${selection.c}`;
        tileElement.className = `tile-element tile-${boardState[selection.r][selection.c]} tile-spawn`;
        tileElement.innerText = boardState[selection.r][selection.c];
        
        container.appendChild(tileElement);
    }
}

/**
 * VECTOR TRANSLATION POSITIONER ENGINE
 */
function updateRenderedPositions() {
    // Purge previous dynamically assigned element loops safely
    const activeTiles = container.querySelectorAll('.tile-element');
    activeTiles.forEach(tile => tile.remove());

    const containerRect = container.getBoundingClientRect();
    const cellPadding = 8;
    const innerWidth = containerRect.width - (cellPadding * 2);
    const cellSize = (innerWidth - (cellPadding * (gridSize - 1))) / gridSize;

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const value = boardState[r][c];
            if (value > 0) {
                const tile = document.createElement('div');
                tile.innerText = value;
                
                // Set class depth assignments
                const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
                tile.className = `tile-element ${tileClass}`;
                
                // Explicit positioning computations mapping container pixels layout geometry directly
                const leftPos = cellPadding + c * (cellSize + cellPadding);
                const topPos = cellPadding + r * (cellSize + cellPadding);
                
                tile.style.width = `${cellSize}px`;
                tile.style.height = `${cellSize}px`;
                tile.style.left = `${leftPos}px`;
                tile.style.top = `${topPos}px`;
                
                container.appendChild(tile);
            }
        }
    }
}

/**
 * DIRECTIONAL TRANSITION MATRIX SHIFTER
 */
function handleMove(direction) {
    if (isGameOver) return;

    let rowMoved = false;
    let combinedScoreGained = 0;

    // Helper functions for rotating processing structures dynamically
    function compressLine(line) {
        let cleanLine = line.filter(val => val !== 0);
        let completedLine = [];
        
        for (let i = 0; i < cleanLine.length; i++) {
            if (cleanLine[i] === cleanLine[i + 1] && cleanLine[i] !== undefined) {
                const mergedValue = cleanLine[i] * 2;
                completedLine.push(mergedValue);
                combinedScoreGained += mergedValue;
                i++; // Skip index context
            } else {
                completedLine.push(cleanLine[i]);
            }
        }
        
        while (completedLine.length < gridSize) {
            completedLine.push(0);
        }
        return completedLine;
    }

    let previousSnapshot = JSON.stringify(boardState);

    // Process orientations transforms shifting vectors processing lines structures
    if (direction === 'LEFT' || direction === 'RIGHT') {
        for (let r = 0; r < gridSize; r++) {
            let row = [...boardState[r]];
            if (direction === 'RIGHT') row.reverse();
            
            let processedRow = compressLine(row);
            if (direction === 'RIGHT') processedRow.reverse();
            
            boardState[r] = processedRow;
        }
    } else if (direction === 'UP' || direction === 'DOWN') {
        for (let c = 0; c < gridSize; c++) {
            let column = [];
            for (let r = 0; r < gridSize; r++) column.push(boardState[r][c]);
            
            if (direction === 'DOWN') column.reverse();
            let processedColumn = compressLine(column);
            if (direction === 'DOWN') processedColumn.reverse();
            
            for (let r = 0; r < gridSize; r++) {
                boardState[r][c] = processedColumn[r];
            }
        }
    }

    if (previousSnapshot !== JSON.stringify(boardState)) {
        score += combinedScoreGained;
        scoreDisplay.innerText = score;
        spawnRandomTile();
        updateRenderedPositions();
        evaluateGameStatus();
    }
}

/**
 * SCANNER LOGIC FOR END GAME CONDITIONS EVALUATION
 */
function evaluateGameStatus() {
    // Verify if open elements space block remains
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (boardState[r][c] === 0) return; // Keep going
        }
    }

    // Verify adjacency structures horizontal combinations check
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
            if (boardState[r][c] === boardState[r][c + 1]) return;
        }
    }

    // Verify adjacency structures vertical combinations check
    for (let c = 0; c < gridSize; c++) {
        for (let r = 0; r < gridSize - 1; r++) {
            if (boardState[r][c] === boardState[r + 1][c]) return;
        }
    }

    // No operational exit states left triggers game-over execution overlay
    isGameOver = true;
    statusOverlay.style.display = 'flex';
}

/**
 * KEYBOARD EVENT EVENT BINDINGS
 */
window.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            handleMove('UP');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            handleMove('DOWN');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            handleMove('LEFT');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            handleMove('RIGHT');
            break;
    }
});

/**
 * MOBILE SWIPE INTERPRETATION ENGINE
 */
window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;

    let deltaX = e.changedTouches[0].clientX - touchStartX;
    let deltaY = e.changedTouches[0].clientY - touchStartY;

    const gestureThreshold = 40; // Pixels minimum move threshold boundary

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) > gestureThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            handleMove(deltaX > 0 ? 'RIGHT' : 'LEFT');
        } else {
            handleMove(deltaY > 0 ? 'DOWN' : 'UP');
        }
    }

    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

/**
 * COMPONENT HOOK ATTACHMENTS FOR GAME DRIVERS
 */
gridSelect.addEventListener('change', initializeGame);
restartBtn.addEventListener('click', initializeGame);
modalRestartBtn.addEventListener('click', initializeGame);
window.addEventListener('resize', updateRenderedPositions);

// Initial Execution Run Entry Point
window.addEventListener('DOMContentLoaded', initializeGame);
