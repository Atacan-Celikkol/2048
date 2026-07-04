
const SIZE = 4;
let board = [];
let score = 0;
let best = 0;
let won = false;
let over = false;
let undoStack = [];
let theme = 0;

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const gameOverEl = document.getElementById('game-over');
const gameWonEl = document.getElementById('game-won');
const restartBtn = document.getElementById('restart');
const undoBtn = document.getElementById('undo');
const themeBtn = document.getElementById('theme');
const boardContainer = document.getElementById('board-container');
const body = document.body;

function emptyBoard() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}
function copyBoard(b) {
    return b.map(row => row.slice());
}
function randomEmptyCell(b) {
    const empties = [];
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c)
            if (b[r][c] === 0) empties.push([r, c]);
    if (empties.length === 0) return null;
    return empties[Math.floor(Math.random() * empties.length)];
}
function addRandomTile(b) {
    const cell = randomEmptyCell(b);
    if (!cell) return false;
    b[cell[0]][cell[1]] = Math.random() < 0.9 ? 2 : 4;
    return true;
}
function boardsEqual(a, b) {
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c)
            if (a[r][c] !== b[r][c]) return false;
    return true;
}
function canMove(b) {
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c) {
            if (b[r][c] === 0) return true;
            if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
            if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
        }
    return false;
}
function has2048(b) {
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c)
            if (b[r][c] === 2048) return true;
    return false;
}
function hasLegendary(b) {
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c)
            if (b[r][c] >= 4096) return true;
    return false;
}
function slide(row) {
    let arr = row.filter(v => v);
    for (let i = 0; i < arr.length - 1; ++i) {
        if (arr[i] && arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            score += arr[i];
            arr[i + 1] = 0;
        }
    }
    arr = arr.filter(v => v);
    while (arr.length < SIZE) arr.push(0);
    return arr;
}
function moveLeft(b) {
    let moved = false;
    let merged = emptyBoard();
    let newB = b.map((row, r) => {
        let old = row.slice();
        let newRow = slide(row);
        for (let c = 0; c < SIZE; ++c)
            if (newRow[c] !== old[c]) moved = true;
        for (let c = 0; c < SIZE - 1; ++c)
            if (old[c] && old[c] === old[c + 1]) merged[r][c] = 1;
        return newRow;
    });
    return { board: newB, moved, merged };
}
function rotate(b) {
    let res = emptyBoard();
    for (let r = 0; r < SIZE; ++r)
        for (let c = 0; c < SIZE; ++c)
            res[c][SIZE - 1 - r] = b[r][c];
    return res;
}
function move(dir) {
    let b = copyBoard(board);
    let merged = emptyBoard();
    let rot = 0;
    if (dir === 'down') rot = 1;
    if (dir === 'right') rot = 2;
    if (dir === 'up') rot = 3;
    for (let i = 0; i < rot; ++i) b = rotate(b);
    let { board: newB, moved, merged: m } = moveLeft(b);
    for (let i = 0; i < (4 - rot) % 4; ++i) newB = rotate(newB), m = rotate(m);
    return { board: newB, moved, merged: m };
}
function render() {
    boardEl.innerHTML = '';
    for (let r = 0; r < SIZE; ++r) {
        for (let c = 0; c < SIZE; ++c) {
            const v = board[r][c];
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.setAttribute('data-value', v);
            if (v === 0) tile.textContent = '';
            else tile.textContent = v;
            if (tile.classList.contains('tile')) {
                if (newTiles[r][c]) tile.classList.add('new');
                if (mergedTiles[r][c]) tile.classList.add('merged');
            }
            boardEl.appendChild(tile);
        }
    }
    scoreEl.textContent = score;
    if (score > best) {
        best = score;
        bestEl.textContent = best;
        localStorage.setItem('2048-best', best);
        bestEl.classList.add('animated');
        setTimeout(() => bestEl.classList.remove('animated'), 400);
    }
    scoreEl.classList.add('animated');
    setTimeout(() => scoreEl.classList.remove('animated'), 400);

    if (over) {
        gameOverEl.style.display = '';
    } else {
        gameOverEl.style.display = 'none';
    }
    if (won && !over) {
        gameWonEl.style.display = '';
    } else {
        gameWonEl.style.display = 'none';
    }
}
let newTiles = emptyBoard();
let mergedTiles = emptyBoard();
function setNewMergedTiles(merged, prev, curr) {
    newTiles = emptyBoard();
    mergedTiles = emptyBoard();
    for (let r = 0; r < SIZE; ++r) {
        for (let c = 0; c < SIZE; ++c) {
            if (curr[r][c] && !prev[r][c]) newTiles[r][c] = 1;
            if (merged && merged[r][c]) mergedTiles[r][c] = 1;
        }
    }
}
function restartGame() {
    score = 0;
    board = emptyBoard();
    addRandomTile(board);
    addRandomTile(board);
    over = false;
    won = false;
    undoStack = [];
    setNewMergedTiles(null, emptyBoard(), board);
    render();
}
function continueGame() {
    won = false;
    render();
}
function undoGame() {
    if (undoStack.length > 0) {
        let prev = undoStack.pop();
        board = copyBoard(prev.board);
        score = prev.score;
        over = false;
        won = false;
        setNewMergedTiles(null, emptyBoard(), board);
        render();
    }
}
function handleMove(dir) {
    if (over || (won && !hasLegendary(board))) return;
    let prev = copyBoard(board);
    let prevScore = score;
    let { board: newB, moved, merged } = move(dir);
    if (!moved) return;
    undoStack = [{ board: prev, score: prevScore }];
    board = newB;
    addRandomTile(board);
    setNewMergedTiles(merged, prev, board);
    if (has2048(board) && !won) {
        won = true;
    }
    if (!canMove(board)) {
        over = true;
    }
    render();
}
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft') handleMove('left');
    if (e.key === 'ArrowRight') handleMove('right');
    if (e.key === 'ArrowUp') handleMove('up');
    if (e.key === 'ArrowDown') handleMove('down');
});
let touchStartX = 0, touchStartY = 0;
boardContainer.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
});
boardContainer.addEventListener('touchend', e => {
    if (e.changedTouches.length === 1) {
        let dx = e.changedTouches[0].clientX - touchStartX;
        let dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
            handleMove(dx > 0 ? 'right' : 'left');
        } else if (Math.abs(dy) > 30) {
            handleMove(dy > 0 ? 'down' : 'up');
        }
    }
});
boardContainer.addEventListener('touchmove', function (e) {
    if (e.cancelable) e.preventDefault();
}, { passive: false });
restartBtn.onclick = restartGame;
undoBtn.onclick = undoGame;
themeBtn.onclick = () => {
    theme = (theme + 1) % 3;
    if (theme === 0) {
        body.classList.value = '';
    } else if (theme === 1) {
        body.classList.value = 'purple-neon';
    } else {
        body.classList.value = 'light-mode';
    }
};
function loadBest() {
    let b = localStorage.getItem('2048-best');
    if (b) best = parseInt(b);
    bestEl.textContent = best;
}
function init() {
    loadBest();
    restartGame();
}
init();