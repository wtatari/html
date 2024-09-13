// Game.js

import { BOARD_SIZE } from './Constants.js';
import { Triangle, Square, Hexagon, Octagon } from './Piece.js';

let selectedPiece = null;
let selectedPosition = null;
let highlightedMoves = [];
let currentPlayer = 'red'; // Game starts with red player

// Initialize the board with pieces
let board = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
        if (row < 2) return new Triangle('black'); // Black pieces start at top
        if (row > 5) return new Triangle('red');   // Red pieces start at bottom
        return null;
    })
);

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
document.getElementById('reset-btn').addEventListener('click', () => {
    selectedPiece = null;
    selectedPosition = null;
    highlightedMoves = [];
    currentPlayer = 'red';
    board = Array.from({ length: BOARD_SIZE }, (_, row) =>
        Array.from({ length: BOARD_SIZE }, (_, col) => {
            if (row < 2) return new Triangle('black'); // Black pieces start at top
            if (row > 5) return new Triangle('red');   // Red pieces start at bottom
            return null;
        })
    );
    renderBoard();
});

// Initial render
renderBoard();
