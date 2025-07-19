import React, { useState, useEffect } from 'react';
import './App.css';

// Helper for deep copy
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Game logic
const emptyBoard = () => Array(3).fill(null).map(() => Array(3).fill(null));

// AI logic: returns [row, col] for O's move
function findBestMove(board, isX) {
  // For simplicity, computer makes a random available move.
  const empty = [];
  for (let i = 0; i < 3; ++i)
    for (let j = 0; j < 3; ++j)
      if (board[i][j] === null) empty.push([i, j]);
  // Optional: add simple strategy (block win, win if possible)
  // Check for win or block
  for (let [letter, aiTurn] of [["O", !isX], ["X", isX]]) {
    for (let [i, j] of empty) {
      const copy = deepCopy(board);
      copy[i][j] = letter;
      if (calculateWinner(copy)) return [i, j];
    }
  }
  // Else pick random
  return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : null;
}

// PUBLIC_INTERFACE
function calculateWinner(board) {
  // Returns "X", "O" or null (or "draw")
  // Rows, columns, diagonals
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] && board[i][0] === board[i][1] && board[i][1] === board[i][2]
    )
      return board[i][0];
    if (
      board[0][i] && board[0][i] === board[1][i] && board[1][i] === board[2][i]
    )
      return board[0][i];
  }
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  )
    return board[0][0];
  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  )
    return board[0][2];

  // Draw detection: all filled
  if ([...board[0], ...board[1], ...board[2]].every(c => !!c)) return "draw";
  return null;
}

function Board({ board, winnerLine, onCellClick }) {
  // Responsive board grid
  return (
    <div className="ttt-board">
      {board.map((row, i) =>
        row.map((cell, j) => {
          let isWinnerCell = false;
          if (winnerLine) {
            for (const [wi, wj] of winnerLine) {
              if (wi === i && wj === j) isWinnerCell = true;
            }
          }
          return (
            <button
              className={`ttt-cell${isWinnerCell ? " ttt-cell-winner" : ""}`}
              key={`${i}-${j}`}
              onClick={() => onCellClick(i, j)}
              aria-label={`cell ${i},${j}`}
              style={{
                background: 'var(--cell-bg)',
                color:
                  cell === "X"
                    ? 'var(--primary)'
                    : cell === "O"
                    ? 'var(--secondary)'
                    : undefined,
                borderColor: 'var(--accent)',
              }}
              disabled={cell !== null}
            >
              {cell ? cell : ""}
            </button>
          );
        })
      )}
    </div>
  );
}

// Returns an array of [i, j] for winner cells if winner, else null
function getWinnerLine(board) {
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] &&
      board[i][0] === board[i][1] &&
      board[i][1] === board[i][2]
    )
      return [
        [i, 0],
        [i, 1],
        [i, 2],
      ];
    if (
      board[0][i] &&
      board[0][i] === board[1][i] &&
      board[1][i] === board[2][i]
    )
      return [
        [0, i],
        [1, i],
        [2, i],
      ];
  }
  if (
    board[0][0] &&
    board[0][0] === board[1][1] &&
    board[1][1] === board[2][2]
  )
    return [
      [0, 0],
      [1, 1],
      [2, 2],
    ];
  if (
    board[0][2] &&
    board[0][2] === board[1][1] &&
    board[1][1] === board[2][0]
  )
    return [
      [0, 2],
      [1, 1],
      [2, 0],
    ];
  return null;
}

// PUBLIC_INTERFACE
function App() {
  // Modes: "2P" = two players, "AI" = vs computer
  const [mode, setMode] = useState("2P");
  // History: Each entry = {board, xIsNext, moveLoc, player}
  const [history, setHistory] = useState([
    { board: emptyBoard(), xIsNext: true, moveLoc: null, player: null },
  ]);
  const [stepNumber, setStepNumber] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Winner/calc
  const board = history[stepNumber].board;
  const xIsNext = history[stepNumber].xIsNext;
  const winner = calculateWinner(board);
  const winnerLine = getWinnerLine(board);

  // On mode change: restart game
  useEffect(() => {
    handleRestart();
    // eslint-disable-next-line
  }, [mode]);

  // If playing AI and not game over, and it's O's turn, make AI move
  useEffect(() => {
    if (
      mode === "AI" &&
      !gameOver &&
      !winner &&
      !xIsNext // O is AI
    ) {
      const [i, j] = findBestMove(board, xIsNext) || [];
      if (i !== undefined && j !== undefined) {
        setTimeout(() => handleCellClick(i, j), 400); // add slight delay
      }
    }
    // eslint-disable-next-line
  }, [mode, stepNumber, xIsNext, gameOver]);

  // PUBLIC_INTERFACE
  function handleCellClick(i, j) {
    if (gameOver || board[i][j] || winner) return;
    const newBoard = deepCopy(board);
    newBoard[i][j] = xIsNext ? "X" : "O";
    const loc = i * 3 + j + 1; // 1 to 9
    const nextHistory = history.slice(0, stepNumber + 1);
    nextHistory.push({
      board: newBoard,
      xIsNext: !xIsNext,
      moveLoc: [i, j],
      player: xIsNext ? "X" : "O",
    });
    setHistory(nextHistory);
    setStepNumber(nextHistory.length - 1);
    // Check for winner or draw
    const res = calculateWinner(newBoard);
    if (res) setGameOver(true);
  }

  // PUBLIC_INTERFACE
  function jumpTo(step) {
    setStepNumber(step);
    setGameOver(calculateWinner(history[step].board) ? true : false);
  }

  // PUBLIC_INTERFACE
  function handleRestart() {
    setHistory([{ board: emptyBoard(), xIsNext: true, moveLoc: null, player: null }]);
    setStepNumber(0);
    setGameOver(false);
  }

  // Move history display
  const moves = history.map((step, move) => {
    const desc =
      move === 0
        ? "Game start"
        : `Move #${move}: ${step.player} → (${step.moveLoc[0] + 1},${step.moveLoc[1] + 1})`;
    return (
      <li key={move}>
        <button
          className={`move-btn${move === stepNumber ? " move-btn-active" : ""}`}
          style={{
            borderColor: "var(--accent)",
            background: move === stepNumber ? "var(--move-btn-active-bg)" : "var(--move-btn-bg)",
            color: move === stepNumber ? "var(--primary)" : "var(--secondary)",
          }}
          onClick={() => jumpTo(move)}
        >
          {desc}
        </button>
      </li>
    );
  });

  // Status
  let status = "";
  if (winner) {
    if (winner === "draw") status = "Draw! No more moves.";
    else if (winner === "X" || winner === "O")
      status = `Winner: ${winner === "X" ? "Player 1 (X)" : mode === "AI" ? "Computer (O)" : "Player 2 (O)"}`;
  } else {
    if (mode === "2P")
      status = `Next: ${xIsNext ? "Player 1 (X)" : "Player 2 (O)"}`;
    else status = `Next: ${xIsNext ? "You (X)" : "Computer (O)"}`;
  }

  // Theme selection
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <div className="App ttt-wrap" style={{ background: "var(--bg-primary)" }}>
      <header className="App-header" style={{ minHeight: "100vh", justifyContent: "center" }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <div className="ttt-container">
          <div className="ttt-status" style={{ color: "var(--primary)", borderColor: "var(--accent)" }}>
            {status}
          </div>
          <div className="ttt-content-row">
            <aside className="ttt-history" aria-label="Move history" style={{ background: "var(--history-bg)" }}>
              <div className="ttt-history-title" style={{ color: "var(--secondary)" }}>Move History</div>
              <ol>{moves}</ol>
            </aside>
            <section className="ttt-center-block">
              <Board board={board} winnerLine={winnerLine} onCellClick={handleCellClick} />
              <div className="ttt-controls">
                <div className="ttt-modes" style={{ marginBottom: 10 }}>
                  <button
                    className={`ttt-mode-btn${mode === "2P" ? " ttt-mode-btn-active" : ""}`}
                    onClick={() => setMode("2P")}
                    style={{
                      background: mode === "2P" ? "var(--primary)" : "var(--move-btn-bg)",
                      color: mode === "2P" ? "var(--button-text)" : "var(--primary)",
                      borderColor: "var(--accent)",
                    }}
                  >
                    2 Player
                  </button>
                  <button
                    className={`ttt-mode-btn${mode === "AI" ? " ttt-mode-btn-active" : ""}`}
                    onClick={() => setMode("AI")}
                    style={{
                      background: mode === "AI" ? "var(--primary)" : "var(--move-btn-bg)",
                      color: mode === "AI" ? "var(--button-text)" : "var(--primary)",
                      borderColor: "var(--accent)",
                    }}
                  >
                    Vs Computer
                  </button>
                </div>
                <button
                  className="ttt-restart-btn"
                  onClick={handleRestart}
                  style={{
                    background: "var(--accent)",
                    color: "var(--secondary)",
                    borderColor: "var(--secondary)",
                    marginTop: 8,
                  }}
                  aria-label="Restart game"
                >
                  Restart Game
                </button>
              </div>
            </section>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
