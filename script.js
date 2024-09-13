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

    // Base method for attack; override in subclasses
    canEat(targetPiece) {
        return false;
    }

    // Determine if the attack comes from a weak side based on the attacker and defender's direction
    isWeakSideAttack(direction) {
        return false;  // Base class has no weak side; override in subclasses
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

    // Logic to calculate moves, checking for merges and eating other pieces
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
                    } else if (this.canEat(board[newRow][newCol], row, col)) {
                        // If the triangle can eat the target piece
                        possibleMoves.push({ row: newRow, col: newCol, eat: true });
                        break; // Stop further movement after eating
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

    // Eating logic with directional restrictions
    canEat(targetPiece, rowDir, colDir) {
        // Triangle can eat anything larger in angle size (Square, Hexagon, Octagon)
        const shapeAngles = {
            triangle: 30,
            square: 90,
            hexagon: 120,
            octagon: 135
        };

        // Triangle can eat other triangles only if attacking from specific directions
        const allowedDirections = [
            { row: 0, col: -1 },   // W
            { row: 0, col: 1 },    // E
            { row: -1, col: -1 },  // NW
            { row: -1, col: 1 },   // NE
            { row: 1, col: 0 }     // S
        ];

        const isAllowedDirection = allowedDirections.some(dir => dir.row === rowDir && dir.col === colDir);

        if (targetPiece.shape === 'triangle' && isAllowedDirection) {
            return true;  // Triangle can eat another triangle from these directions
        }

        return shapeAngles[this.shape] < shapeAngles[targetPiece.shape];
    }
}


class Square extends Piece {
    constructor(color) {
        super(color, 'square');
        this.steps = 4; // Square can move up to 4 steps
    }

    // Define valid movement directions for squares: N, S, W, E
    getValidMoves(fromRow, fromCol, board) {
        const directions = [
            { row: -1, col: 0 },  // N (north)
            { row: 1, col: 0 },   // S (south)
            { row: 0, col: -1 },  // W (west)
            { row: 0, col: 1 }    // E (east)
        ];

        return this.calculateMoves(fromRow, fromCol, directions, board);
    }

    // Logic to calculate moves, checking for merges and eating other pieces
    calculateMoves(fromRow, fromCol, directions, board) {
        const possibleMoves = [];

        directions.forEach(({ row, col }) => {
            for (let i = 1; i <= this.steps; i++) {
                const newRow = fromRow + row * i;
                const newCol = fromCol + col * i;

                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    if (board[newRow][newCol] === null) {
                        // Move is possible if the tile is empty
                        possibleMoves.push({ row: newRow, col: newCol });
                    } else if (board[newRow][newCol].shape === this.shape && board[newRow][newCol].color === this.color) {
                        // Handle merging logic for two squares
                        let mergedPiece = this.mergeWith(board[newRow][newCol]);
                        if (mergedPiece) {
                            possibleMoves.push({ row: newRow, col: newCol, merge: mergedPiece });
                        }
                        break; // Stop further movement in this direction after merging
                    } else if (this.canEat(fromRow, fromCol, newRow, newCol, board[newRow][newCol])) {
                        // Eating logic if square can eat the target piece
                        possibleMoves.push({ row: newRow, col: newCol, eat: true });
                        break; // Stop further movement after eating
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

    // Merging logic for squares: two squares combine into a hexagon
    mergeWith(otherPiece) {
        if (otherPiece.shape === 'square' && otherPiece.color === this.color) {
            // Merge into a Hexagon
            return new Hexagon(this.color);
        }
        return null;  // No merge possible
    }

    // Eating logic for squares
    canEat(fromRow, fromCol, targetRow, targetCol, targetPiece) {
        if (targetPiece.shape === 'triangle') {
            const rowDiff = targetRow - fromRow;
            const colDiff = targetCol - fromCol;

            if (this.color === 'red') {
                // Red squares can eat triangles from N, W, or E
                return (
                    (rowDiff === -1 && colDiff === 0) ||  // N (north)
                    (colDiff === -1 && rowDiff === 0) ||  // W (west)
                    (colDiff === 1 && rowDiff === 0)      // E (east)
                );
            } else {
                // Black squares can eat triangles from S, W, or E
                return (
                    (rowDiff === 1 && colDiff === 0) ||   // S (south)
                    (colDiff === -1 && rowDiff === 0) ||  // W (west)
                    (colDiff === 1 && rowDiff === 0)      // E (east)
                );
            }
        }
        return false;
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

    // Calculate possible moves and check for merges
    calculateMoves(fromRow, fromCol, directions, board) {
        const possibleMoves = [];

        directions.forEach(({ row, col }) => {
            for (let i = 1; i <= this.steps; i++) {
                const newRow = fromRow + row * i;
                const newCol = fromCol + col * i;

                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    if (board[newRow][newCol] === null) {
                        // Move is possible if the tile is empty
                        possibleMoves.push({ row: newRow, col: newCol });
                    } else if (board[newRow][newCol].shape === this.shape && board[newRow][newCol].color === this.color) {
                        // Handle merging logic for two hexagons
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

    // Merging logic for hexagons: two hexagons combine into an octagon
    mergeWith(otherPiece) {
        if (otherPiece.shape === 'hexagon' && otherPiece.color === this.color) {
            // Merge into an Octagon
            return new Octagon(this.color);
        }
        return null;  // No merge possible
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

    calculateMoves(fromRow, fromCol, directions, board) {
        const possibleMoves = [];

        directions.forEach(({ row, col }) => {
            for (let i = 1; i <= this.steps; i++) {
                const newRow = fromRow + row * i;
                const newCol = fromCol + col * i;

                if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
                    if (board[newRow][newCol] === null) {
                        // Move is possible if the tile is empty
                        possibleMoves.push({ row: newRow, col: newCol });
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
