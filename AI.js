// AI.js

export function getAIMove(board, aiColor) {
    // Collect all pieces of the AI's color
    let aiPieces = [];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const piece = board[row][col];
            if (piece && piece.color === aiColor) {
                aiPieces.push({ piece, position: { row, col } });
            }
        }
    }

    // Collect all valid moves for each piece
    let allValidMoves = [];
    aiPieces.forEach(({ piece, position }) => {
        const validMoves = piece.getValidMoves(position.row, position.col, board);
        validMoves.forEach(move => {
            allValidMoves.push({
                from: position,
                to: { row: move.row, col: move.col },
                moveDetails: move,
                piece: piece,
            });
        });
    });

    // If there are no valid moves, return null
    if (allValidMoves.length === 0) {
        return null;
    }

    // For simplicity, select a random valid move
    const selectedMove = allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
    return selectedMove;
}
