import { BOARD_SIZE } from './Constants.js';
import { Triangle, Square, Hexagon, Octagon } from './Piece.js';

let selectedPiece = null;
let selectedPosition = null;
let highlightedMoves = [];
let currentPlayer = 'red'; // Game starts with red player

// Function to initialize the board
function initializeBoard() {
    return Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => {
            // Black pieces start at top
            if (row === 0 && col === 4) return new Octagon('black'); // Black octagon at the 1st row, 5th tile
            if (row < 2) return new Triangle('black');
            
            // Red pieces start at bottom
            if (row === 7 && col === 3) return new Octagon('red');   // Red octagon at the 8th row, 4th tile
            if (row > 5) return new Triangle('red');

            return null;
        })
    );
}

// Initialize the board with pieces
let board = initializeBoard();

// Check if a player has won by merging two octagons
function checkWinByMergingOctagons(piece) {
    // Ensure it's only octagons
    if (!(piece instanceof Octagon)) return;

    const octagonCount = board.flat().filter(tile => tile instanceof Octagon && tile.color === piece.color).length;

    // The player wins only when there's exactly 1 octagon left after the merge
    if (octagonCount === 1) {  
        alert(`${piece.color.toUpperCase()} player wins by merging two octagons!`);
        resetGame();
    }
}

// Check if a player has lost by losing all their octagons
function checkLoseCondition() {
    const redOctagons = board.flat().filter(tile => tile instanceof Octagon && tile.color === 'red').length;
    const blackOctagons = board.flat().filter(tile => tile instanceof Octagon && tile.color === 'black').length;

    if (redOctagons === 0) {
        alert('BLACK player wins! RED has no octagons left.');
        resetGame();
    } else if (blackOctagons === 0) {
        alert('RED player wins! BLACK has no octagons left.');
        resetGame();
    }
}

// Render the board
function renderBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            const div = document.createElement('div');
            div.classList.add('tile', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            div.dataset.row = rowIndex;
            div.dataset.col = colIndex;
            div.addEventListener('click', handleTileClick);

            if (tile) {
                const text = document.createElement('span');
                text.className = tile.getClass();
                text.textContent = tile.getSymbol();
                div.appendChild(text);
            }

            if (highlightedMoves.some(move => move.row === rowIndex && move.col === colIndex)) {
                div.classList.add('selected');
            }

            gameBoard.appendChild(div);
        });
    });

    // Update current player display
    document.getElementById('current-player').textContent = `Current Player: ${currentPlayer.toUpperCase()}`;
}

// Handle tile click
function handleTileClick(event) {
    const row = parseInt(event.currentTarget.dataset.row);
    const col = parseInt(event.currentTarget.dataset.col);
    selectPiece(row, col);
}

// Select and move pieces
function selectPiece(row, col) {
    const piece = board[row][col];

    if (selectedPiece) {
        // Move or merge selected piece
        const move = highlightedMoves.find(move => move.row === row && move.col === col);

        if (move) {
            if (move.merge) {
                board[row][col] = move.merge;
                board[selectedPosition.row][selectedPosition.col] = null;
                checkWinByMergingOctagons(move.merge); // Check if merging octagons causes a win
            } else if (move.eat) {
                if (move.both) {
                    // Both pieces are removed
                    board[row][col] = null;
                    board[selectedPosition.row][selectedPosition.col] = null;
                } else {
                    // Remove the target piece and move the selected piece
                    board[row][col] = selectedPiece;
                    board[selectedPosition.row][selectedPosition.col] = null;
                }
            } else {
                // Just move the selected piece
                board[row][col] = selectedPiece;
                board[selectedPosition.row][selectedPosition.col] = null;
            }

            // Switch player after a successful move
            currentPlayer = currentPlayer === 'red' ? 'black' : 'red';
            checkLoseCondition(); // Check if any player has lost all octagons
        }

        selectedPiece = null;
        selectedPosition = null;
        highlightedMoves = [];
    } else if (piece && piece.color === currentPlayer) {
        // Select a new piece and highlight its moves
        selectedPiece = piece;
        selectedPosition = { row, col };
        highlightedMoves = selectedPiece.getValidMoves(row, col, board);
    }

    renderBoard();
}

// Reset game
function resetGame() {
    selectedPiece = null;
    selectedPosition = null;
    highlightedMoves = [];
    currentPlayer = 'red';
    board = initializeBoard();
    renderBoard();
}

document.getElementById('reset-btn').addEventListener('click', resetGame);

// Initial render
renderBoard();
