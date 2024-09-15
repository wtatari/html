// AI.js

import { Triangle, Square, Hexagon, Octagon } from './Piece.js';

export function getAIMove(board, aiColor) {
    const depth = 3; // Adjust the depth as needed for performance vs. intelligence
    const { move } = minimax(board, depth, -Infinity, Infinity, true, aiColor);
    return move;
}

// Minimax function with alpha-beta pruning
function minimax(board, depth, alpha, beta, maximizingPlayer, aiColor) {
    const opponentColor = aiColor === 'red' ? 'black' : 'red';

    if (depth === 0 || isGameOver(board)) {
        const evalScore = evaluateBoard(board, aiColor);
        return { score: evalScore };
    }

    const validMoves = getAllValidMoves(board, maximizingPlayer ? aiColor : opponentColor);

    if (validMoves.length === 0) {
        // No valid moves, this is a terminal state
        const evalScore = evaluateBoard(board, aiColor);
        return { score: evalScore };
    }

    let bestMove = null;

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const move of validMoves) {
            const simulatedBoard = simulateMove(board, move);
            const { score } = minimax(simulatedBoard, depth - 1, alpha, beta, false, aiColor);
            if (score > maxEval) {
                maxEval = score;
                bestMove = move;
            }
            alpha = Math.max(alpha, maxEval);
            if (beta <= alpha) {
                break; // Beta cut-off
            }
        }
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        for (const move of validMoves) {
            const simulatedBoard = simulateMove(board, move);
            const { score } = minimax(simulatedBoard, depth - 1, alpha, beta, true, aiColor);
            if (score < minEval) {
                minEval = score;
                bestMove = move;
            }
            beta = Math.min(beta, minEval);
            if (beta <= alpha) {
                break; // Alpha cut-off
            }
        }
        return { score: minEval, move: bestMove };
    }
}

// Function to get all valid moves for a given color
function getAllValidMoves(board, color) {
    let pieces = [];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const piece = board[row][col];
            if (piece && piece.color === color) {
                pieces.push({ piece, position: { row, col } });
            }
        }
    }

    let allValidMoves = [];
    pieces.forEach(({ piece, position }) => {
        const validMoves = piece.getValidMoves(position.row, position.col, board);
        validMoves.forEach(moveDetails => {
            allValidMoves.push({
                from: position,
                to: { row: moveDetails.row, col: moveDetails.col },
                moveDetails,
                piece,
            });
        });
    });

    // Shuffle the moves to add variety
    allValidMoves = shuffleArray(allValidMoves);

    return allValidMoves;
}

// Function to simulate a move and return the new board state
function simulateMove(board, move) {
    const simulatedBoard = deepCopyBoard(board);
    applyMove(simulatedBoard, move);
    return simulatedBoard;
}

// Function to check if the game is over
function isGameOver(board) {
    const redOctagons = countPieces(board, 'red', 'octagon');
    const blackOctagons = countPieces(board, 'black', 'octagon');

    if (redOctagons === 0 || blackOctagons === 0) {
        return true;
    }

    // Check if a player has only one octagon left, which could mean a merge has occurred
    // You might need additional logic to accurately detect a win by merging octagons

    return false;
}

function getMergingPotential(board, color) {
    let mergingPotential = 0;
    const piecePositions = {};

    // Collect positions of pieces by shape
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const piece = board[row][col];
            if (piece && piece.color === color) {
                if (!piecePositions[piece.shape]) {
                    piecePositions[piece.shape] = [];
                }
                piecePositions[piece.shape].push({ row, col });
            }
        }
    }

    // Check for potential merges
    for (const shape in piecePositions) {
        const positions = piecePositions[shape];
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                if (areAdjacent(positions[i], positions[j])) {
                    mergingPotential += 1;
                }
            }
        }
    }

    return mergingPotential;
}

// Helper function to check adjacency
function areAdjacent(pos1, pos2) {
    const dx = Math.abs(pos1.row - pos2.row);
    const dy = Math.abs(pos1.col - pos2.col);
    return (dx + dy === 1); // Adjust based on your game's adjacency rules
}

// Evaluation function to assess the board state
function evaluateBoard(board, aiColor) {
    const opponentColor = aiColor === 'red' ? 'black' : 'red';
    let score = 0;

    // Material Score
    score += getMaterialScore(board, aiColor);
    score -= getMaterialScore(board, opponentColor);

    // Mobility Score
    const aiMoves = getAllValidMoves(board, aiColor).length;
    const opponentMoves = getAllValidMoves(board, opponentColor).length;
    score += aiMoves * 10;
    score -= opponentMoves * 10;

    // Merging Potential
    score += getMergingPotential(board, aiColor) * 50; // Adjust weight as needed
    score -= getMergingPotential(board, opponentColor) * 50;

    return score;
}


// Helper functions

function deepCopyBoard(board) {
    return board.map(row => row.map(piece => {
        if (piece) {
            // Clone the piece
            return clonePiece(piece);
        }
        return null;
    }));
}

function applyMove(board, move) {
    const { from, to, moveDetails, piece } = move;

    if (moveDetails.merge) {
        board[to.row][to.col] = moveDetails.merge;
        board[from.row][from.col] = null;
    } else if (moveDetails.eat) {
        if (moveDetails.both) {
            board[to.row][to.col] = null;
            board[from.row][from.col] = null;
        } else {
            board[to.row][to.col] = piece;
            board[from.row][from.col] = null;
        }
    } else {
        board[to.row][to.col] = piece;
        board[from.row][from.col] = null;
    }
}

function countPieces(board, color, shape) {
    return board.flat().filter(piece => piece && piece.color === color && piece.shape === shape).length;
}

function getMaterialScore(board, color) {
    let score = 0;
    board.flat().forEach(piece => {
        if (piece && piece.color === color) {
            score += getPieceValue(piece);
        }
    });
    return score;
}

function getPieceValue(piece) {
    switch (piece.shape) {
        case 'triangle': return 100;
        case 'square': return 300;   // Increased from 200
        case 'hexagon': return 900;  // Increased from 400
        case 'octagon': return 2700; // Increased from 800
        default: return 0;
    }
}

// Function to clone a piece
function clonePiece(piece) {
    // Use Object.create to preserve the prototype chain
    const clonedPiece = Object.create(Object.getPrototypeOf(piece));
    // Copy over the properties
    Object.assign(clonedPiece, piece);
    return clonedPiece;
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
}
