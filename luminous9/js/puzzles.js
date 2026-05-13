/* =============================
  問題自動生成ロジック
============================== */

function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }
  return true;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function solveBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let num of nums) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveBoard(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// 解が何通りあるか正確にカウント
function countSolutions(board, limit = 2) {
  let count = 0;

  function solve(board) {
    if (count >= limit) return;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              solve(board);
              board[row][col] = 0;
            }
          }
          return;
        }
      }
    }
    count++;
  }

  const copy = board.map(r => [...r]);
  solve(copy);
  return count;
}

function removeNumbers(board, difficulty) {
  const removeCount = {
    easy: 81 - (Math.floor(Math.random() * 6) + 45),
    normal: 81 - (Math.floor(Math.random() * 10) + 35),
    hard: 81 - (Math.floor(Math.random() * 8) + 27),
    expert: 81 - (Math.floor(Math.random() * 10) + 17)
  };

  const puzzle = board.map(row => [...row]);
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let removed = 0;

  for (let i = 0; i < positions.length; i++) {
    if (removed >= removeCount[difficulty]) break;

    const pos = positions[i];
    const row = Math.floor(pos / 9);
    const col = pos % 9;
    const backup = puzzle[row][col];

    puzzle[row][col] = 0;

    if (countSolutions(puzzle) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
}

function generatePuzzle(difficulty) {
  const board = createEmptyBoard();
  solveBoard(board);
  const puzzle = removeNumbers(board, difficulty);
  return {
    puzzle: puzzle,
    solution: board
  };
}