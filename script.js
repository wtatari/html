class Piece {
    constructor(color, shape) {
        this.color = color;
        this.shape = shape;
    }

    getSymbol() {
        switch (this.shape) {
            case 'triangle': return '▲';
            case 'square': return '♦';
            case 'hexagon': return '⬢';
            case 'octagon': return '⯃';
            default: return '';
        }
    }

    getClass() {
        return `piece piece-${this.color}`;
    }
}


class Triangle extends Piece {
    constructor(color) {
        super(color, 'triangle');
        this.steps = 3;
    }

    // Define valid movement directions for black and red triangles
    getValidMoves(fromRow, fromCol, board) {
        let directions;

        if (this.color === 'red') {
            // Red pieces move down and diagonally backward (reversed compared to black)
            directions = [
                { row: 1, col: 0 },   // S (south)
                { row: -1, col: -1 }, // NW (northwest)
                { row: -1, col: 1 }   // NE (northeast)
            ];
        } else {
            // Black pieces move up and diagonally backward
            directions = [
                { row: -1, col: 0 },  // N (north)
                { row: 1, col: -1 },  // SW (southwest)
                { row: 1, col: 1 }    // SE (southeast)
            ];
        }

        return this.calculateMoves(fromRow, fromCol, directions, board);
    }

    // Logic to calculate moves, checking for merges
    calculateMoves(fromRow, fromCol, directions, board) {
        const possibleMoves = [];
    
        directions.forEach(({ row, col }) => {
            for (let i = 1; i <= this.steps; i++) {
                const newRow = fromRow + row * i;
                const newCol = fromCol + col * i;
    
                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    if (board[newRow][newCol] === null) {
                        possibleMoves.push({ row: newRow, col: newCol });
                    } else if (board[newRow][newCol].shape === this.shape && board[newRow][newCol].color === this.color) {
                        // If the piece is the same color and shape, merge into a stronger piece
                        let mergedPiece = this.mergeWith(board[newRow][newCol]);
                        if (mergedPiece) {
                            possibleMoves.push({ row: newRow, col: newCol, merge: mergedPiece });
                        }
                        break; // Stop further movement in this direction after merging
                    } else {
                        break; // Stop if there is any other piece
                    }
                } else {
                    break; // Stop if out of bounds
                }
            }
        });
    
        return possibleMoves;
    }
    
    // Merging logic
    mergeWith(otherPiece) {
        if (otherPiece.shape === 'triangle' && otherPiece.color === this.color) {
            // Merge into a Square
            return new Square(this.color);
        }
        return null;  // No merge possible
    }
}

class Square extends Piece {
    constructor(color) {
        super(color, 'square');
        this.steps = 4;
    }

    getValidMoves(fromRow, fromCol, board) {
        const directions = [
            { row: -1, col: 0 },  // N
            { row: 1, col: 0 },   // S
            { row: 0, col: -1 },  // W
            { row: 0, col: 1 }    // E
        ];

        return this.calculateMoves(fromRow, fromCol, directions, board);
    }

    // Adding the calculateMoves method to Square class
    calculateMoves(fromRow, fromCol, directions, board) {
        const possibleMoves = [];

        directions.forEach(({ row, col }) => {
            for (let i = 1; i <= this.steps; i++) {
                const newRow = fromRow + row * i;
                const newCol = fromCol + col * i;

                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    if (board[newRow][newCol] === null) {
                        possibleMoves.push({ row: newRow, col: newCol });
                    } else {
                        break; // Stop if any piece is encountered
                    }
                } else {
                    break; // Stop if out of bounds
                }
            }
        });

        return possibleMoves;
    }
}

class Hexagon extends Piece {
    constructor(color) {
        super(color, 'hexagon');
        this.steps = 6;
    }

    getValidMoves(fromRow, fromCol, board) {
        const directions = [
            { row: -1, col: -1 },  // NW
            { row: -1, col: 1 },   // NE
            { row: 1, col: -1 },   // SW
            { row: 1, col: 1 },    // SE
            { row: -1, col: 0 },   // N
            { row: 1, col: 0 }     // S
        ];

        return this.calculateMoves(fromRow, fromCol, directions, board);
    }
}

class Octagon extends Piece {
    constructor(color) {
        super(color, 'octagon');
        this.steps = 8;
    }

    getValidMoves(fromRow, fromCol, board) {
        const directions = [
            { row: -1, col: 0 },  // N
            { row: 1, col: 0 },   // S
            { row: 0, col: -1 },  // W
            { row: 0, col: 1 },   // E
            { row: -1, col: -1 }, // NW
            { row: -1, col: 1 },  // NE
            { row: 1, col: -1 },  // SW
            { row: 1, col: 1 }    // SE
        ];

        return this.calculateMoves(fromRow, fromCol, directions, board);
    }
}


const BOARD_SIZE = 8;
let selectedPiece = null;
let selectedPosition = null;
let highlightedMoves = [];

// Initialize the board with pieces
const initialBoard = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col) => {
        if (row < 2) return new Triangle('red');
        if (row > 5) return new Triangle('black');
        return null;
    })
);

// Render the board
function renderBoard(board) {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';

    board.forEach((row, rowIndex) => {
        row.forEach((tile, colIndex) => {
            const div = document.createElement('div');
            div.classList.add('tile', (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            div.addEventListener('click', () => selectPiece(rowIndex, colIndex));

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
}

// Select and move pieces
function selectPiece(row, col) {
    const piece = initialBoard[row][col];

    if (selectedPiece) {
        // Move or merge selected piece
        const move = highlightedMoves.find(move => move.row === row && move.col === col);

        if (move) {
            if (move.merge) {
                // If the move results in a merge, merge the pieces
                initialBoard[row][col] = move.merge;
                initialBoard[selectedPosition.row][selectedPosition.col] = null;
            } else {
                // If no merge, just move the selected piece
                initialBoard[row][col] = selectedPiece;
                initialBoard[selectedPosition.row][selectedPosition.col] = null;
            }
        }

        selectedPiece = null;
        selectedPosition = null;
        highlightedMoves = [];
    } else if (piece) {
        // Select a new piece and highlight its moves
        selectedPiece = piece;
        selectedPosition = { row, col };
        highlightedMoves = selectedPiece.getValidMoves(row, col, initialBoard);
    }

    renderBoard(initialBoard);
}

// Initial render
renderBoard(initialBoard);

// Reset button functionality
document.getElementById('reset-btn').addEventListener('click', () => {
    selectedPiece = null;
    selectedPosition = null;
    renderBoard(initialBoard);
});
