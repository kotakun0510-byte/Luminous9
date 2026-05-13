/* =============================
  1. 変数・定数の定義
============================== */

let gameState = {
  board: [],
  solution: [],
  selectedCell: null,
  memoMode: false,
  memos: [],
  isRunning: false,
  isPaused: false,
  difficulty: 'easy',
  hintCount: 0
};

let timerInterval = null;
let timerSeconds = 0;

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const eraserBtn = document.getElementById('eraserBtn');
const hintBtn = document.getElementById('hintBtn');
const numBtns = document.querySelectorAll('.num-btn');
const difficultyBtns = document.querySelectorAll('input[name="difficulty"]');
const clearArea = document.getElementById('clearArea');
const clearTimeEl = document.getElementById('clearTime');
const retryBtn = document.getElementById('retryBtn');

/* =============================
  2. パズル生成
============================== */

function initGame() {
  const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
  gameState.difficulty = selectedDifficulty;

  const result = generatePuzzle(gameState.difficulty);
  gameState.board = result.puzzle;
  gameState.solution = result.solution;
  gameState.preset = result.puzzle.map(row => row.map(val => val !== 0));
  gameState.memos = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );
  gameState.selectedCell = null;
  gameState.hintCount = 0;
  clearArea.classList.remove('show');
  updateHintButton();
  renderBoard();
  updateNumberButtonStates();
}

/* =============================
  3. 初期表示
============================== */

function showStartScreen() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    const row = Math.floor(i / 9);
    const col = i % 9;
    if (col === 2 || col === 5) cell.classList.add('border-right');
    if (row === 2 || row === 5) cell.classList.add('border-bottom');
    boardEl.appendChild(cell);
  }
  const overlay = document.createElement('div');
  overlay.classList.add('start-overlay');
  overlay.innerHTML = `
    <p class="start-title">GAME START</p>
    <p class="start-sub">▶ STARTボタンでスタート</p>
  `;
  boardEl.appendChild(overlay);
}

showStartScreen();

/* =============================
  4. 入力処理
============================== */

function selectCell(row, col) {
  if (!gameState.isRunning || gameState.isPaused) return;
  gameState.selectedCell = [row, col];
  renderBoard();
}

function inputNumber(num) {
  if (!gameState.isRunning || gameState.isPaused) return;
  if (!gameState.selectedCell) return;

  const [row, col] = gameState.selectedCell;
  if (isPreset(row, col)) return;

  if (gameState.memoMode) {
    if (gameState.board[row][col] === 0) {
      if (gameState.memos[row][col].has(num)) {
        gameState.memos[row][col].delete(num);
      } else {
        gameState.memos[row][col].add(num);
      }
    }
  } else {
    if (gameState.board[row][col] === num) {
      gameState.board[row][col] = 0;
    } else {
      gameState.board[row][col] = num;
      gameState.memos[row][col].clear();
    }
    updateNumberButtonStates();
  }

  if (!isValidInput(row, col, gameState.board[row][col])) {
    playSoundError();
  } else {
    playSoundInput();
  }

  renderBoard();
  checkClear();
}

function eraseCell() {
  if (!gameState.isRunning || gameState.isPaused) return;
  if (!gameState.selectedCell) return;

  const [row, col] = gameState.selectedCell;
  if (isPreset(row, col)) return;

  gameState.board[row][col] = 0;
  gameState.memos[row][col].clear();
  renderBoard();
  updateNumberButtonStates();
}

function isPreset(row, col) {
  return gameState.preset[row][col] === true;
}

/* =============================
  5. バリデーション
============================== */

function isValidInput(row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && gameState.board[row][i] === num) return false;
  }
  for (let i = 0; i < 9; i++) {
    if (i !== row && gameState.board[i][col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (
        (startRow + i !== row || startCol + j !== col) &&
        gameState.board[startRow + i][startCol + j] === num
      ) return false;
    }
  }
  return true;
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.row = row;
      cell.dataset.col = col;

      if (col === 2 || col === 5) cell.classList.add('border-right');
      if (row === 2 || row === 5) cell.classList.add('border-bottom');

      const value = gameState.board[row][col];

      if (gameState.selectedCell) {
        const [sr, sc] = gameState.selectedCell;
        if (row === sr && col === sc) {
          cell.classList.add('selected');
        } else if (
          row === sr || col === sc ||
          (Math.floor(row / 3) === Math.floor(sr / 3) &&
          Math.floor(col / 3) === Math.floor(sc / 3))
        ) {
          cell.classList.add('highlight');
        }
      }

      if (value !== 0) {
        if (isPreset(row, col)) {
          cell.classList.add('preset');
        } else {
          if (!isValidInput(row, col, value)) {
            cell.classList.add('error');
          } else {
            cell.classList.add('user-input');
          }
        }
        cell.textContent = value;
      } else if (gameState.memos[row][col] && gameState.memos[row][col].size > 0) {
        const memoGrid = document.createElement('div');
        memoGrid.classList.add('memo-grid');
        for (let n = 1; n <= 9; n++) {
          const span = document.createElement('span');
          span.textContent = gameState.memos[row][col].has(n) ? n : '';
          memoGrid.appendChild(span);
        }
        cell.appendChild(memoGrid);
      }

      cell.addEventListener('click', () => selectCell(row, col));
      boardEl.appendChild(cell);
    }
  }
}

function updateNumberButtonStates() {
  const counts = Array(10).fill(0);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = gameState.board[r][c];
      if (val >= 1 && val <= 9) counts[val]++;
    }
  }
  document.querySelectorAll('.num-btn').forEach(btn => {
    const num = parseInt(btn.dataset.num);
    if (counts[num] >= 9) {
      btn.disabled = true;
      btn.classList.add('grayed-out');
    } else {
      btn.disabled = false;
      btn.classList.remove('grayed-out');
    }
  });
}

/* =============================
  6. タイマー
============================== */

function startTimer() {
  timerSeconds = 0;
  timerEl.textContent = '00 : 00';
  timerInterval = setInterval(() => {
    timerSeconds++;
    const min = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const sec = String(timerSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${min} : ${sec}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resumeTimer() {
  timerInterval = setInterval(() => {
    timerSeconds++;
    const min = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const sec = String(timerSeconds % 60).padStart(2, '0');
    timerEl.textContent = `${min} : ${sec}`;
  }, 1000);
}

function getTimerText() {
  const min = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const sec = String(timerSeconds % 60).padStart(2, '0');
  return `${min} : ${sec}`;
}

/* =============================
  7. SE（サウンド）
============================== */

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(frequency, type, duration, volume) {
  if (!audioCtx) return;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playSoundInput() { playSound(1200, 'sine', 0.1, 0.3); }
function playSoundError() {
  playSound(220, 'triangle', 0.3, 0.4);
  setTimeout(() => playSound(180, 'triangle', 0.3, 0.3), 150);
}
function playSoundClear() {
  playSound(523, 'sine', 0.4, 0.5);
  setTimeout(() => playSound(659, 'sine', 0.4, 0.5), 200);
  setTimeout(() => playSound(784, 'sine', 0.6, 0.5), 400);
}

/* =============================
  8. クリア判定
============================== */

function checkClear() {
  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++)
      if (gameState.board[row][col] === 0) return;

  for (let row = 0; row < 9; row++)
    for (let col = 0; col < 9; col++)
      if (gameState.board[row][col] !== gameState.solution[row][col]) return;

  gameState.isRunning = false;
  stopTimer();
  playSoundClear();
  const time = getTimerText();
  clearTimeEl.textContent = time;
  clearArea.classList.add('show');
}

/* =============================
  9. イベントリスナー
============================== */

// ヒント機能
function updateHintButton() {
  const difficulty = gameState.difficulty;
  if (difficulty === 'easy') {
    hintBtn.disabled = true;
    hintBtn.querySelector('#hintCount').textContent = '';
  } else {
    const remaining = 3 - gameState.hintCount;
    hintBtn.disabled = remaining <= 0 || !gameState.isRunning;
    hintBtn.querySelector('#hintCount').textContent = `（残り${remaining}回）`;
  }
}

hintBtn.addEventListener('click', () => {
  if (!gameState.isRunning || gameState.isPaused) return;
  if (gameState.difficulty === 'easy') return;
  if (gameState.hintCount >= 3) return;
  if (!gameState.selectedCell) return;

  const [row, col] = gameState.selectedCell;
  if (isPreset(row, col)) return;

  gameState.board[row][col] = gameState.solution[row][col];
  gameState.memos[row][col].clear();
  gameState.hintCount++;
  updateHintButton();
  updateNumberButtonStates();
  renderBoard();
  checkClear();
});

// STARTボタン
let startLongPress = false;
let startPressTimer = null;

startBtn.addEventListener('mousedown', () => {
  initAudio();
  console.log('audioCtx:', audioCtx);
  startLongPress = false;
  startPressTimer = setTimeout(() => {
    startLongPress = true;
    stopTimer();
    gameState.isRunning = false;
    initGame();
    startTimer();
    gameState.isRunning = true;
    updateHintButton();
  }, 700);
});

startBtn.addEventListener('mouseup', () => {
  clearTimeout(startPressTimer);
  if (!startLongPress) {
    if (!gameState.isRunning) {
      initGame();
      startTimer();
      gameState.isRunning = true;
      updateHintButton();
    }
  }
});

startBtn.addEventListener('mouseleave', () => {
  clearTimeout(startPressTimer);
});

// 一時停止ボタン
pauseBtn.addEventListener('click', () => {
  if (!gameState.isRunning) return;
  if (gameState.isPaused) {
    gameState.isPaused = false;
    resumeTimer();
    boardEl.classList.remove('hidden');
    pauseBtn.textContent = '⏸';
  } else {
    gameState.isPaused = true;
    pauseTimer();
    boardEl.classList.add('hidden');
    pauseBtn.textContent = '▶';
  }
});

// 消しゴムボタン
eraserBtn.addEventListener('click', () => { eraseCell(); });

// 数字ボタン
numBtns.forEach(btn => {
  let numLongPress = false;
  let numPressTimer = null;

  btn.addEventListener('mousedown', () => {
    numLongPress = false;
    numPressTimer = setTimeout(() => {
      numLongPress = true;
      gameState.memoMode = true;
      inputNumber(parseInt(btn.dataset.num));
      gameState.memoMode = false;
    }, 500);
  });

  btn.addEventListener('mouseup', () => {
    clearTimeout(numPressTimer);
    if (!numLongPress) {
      gameState.memoMode = false;
      inputNumber(parseInt(btn.dataset.num));
    }
  });

  btn.addEventListener('mouseleave', () => { clearTimeout(numPressTimer); });
});

// 難易度選択
difficultyBtns.forEach(btn => {
  btn.addEventListener('change', () => {
    gameState.difficulty = btn.value;
  });
});

// もう一度ボタン
retryBtn.addEventListener('click', () => {
  stopTimer();
  gameState.isRunning = false;
  initGame();
  startTimer();
  gameState.isRunning = true;
  updateHintButton();
});

// キーボード操作
document.addEventListener('keydown', (e) => {
  if (!gameState.isRunning || gameState.isPaused) return;
  if (e.key >= '1' && e.key <= '9') inputNumber(parseInt(e.key));
  if (e.key === 'Delete' || e.key === 'Backspace') eraseCell();
  if (e.key === 'Escape') pauseBtn.click();
});