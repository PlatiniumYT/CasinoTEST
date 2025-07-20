import React, { useState } from "react";
import "./App.css";

const TABLE = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
];

const REDS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
function getColor(n) {
  if (n === 0) return "green";
  return REDS.includes(n) ? "red" : "black";
}
const rouletteNumbers = Array.from({ length: 37 }, (_, i) => i);

function getDozen(n) {
  if (n >= 1 && n <= 12) return 0;
  if (n >= 13 && n <= 24) return 1;
  if (n >= 25 && n <= 36) return 2;
  return -1;
}
function getColumn(n) {
  if (n === 0) return -1;
  return (n - 1) % 3;
}
function getRange(n) {
  if (n >= 1 && n <= 18) return 0;
  if (n >= 19 && n <= 36) return 1;
  return -1;
}
function getEvenOdd(n) {
  if (n === 0) return -1;
  return n % 2 === 0 ? 0 : 1;
}

export default function App() {
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const delayCounts = rouletteNumbers.map((num) => {
    let lastIndex = history.lastIndexOf(num);
    return lastIndex === -1 ? history.length : history.length - lastIndex - 1;
  });

  const dozenDelay = [0,1,2].map(idx => {
    let last = history.length - 1;
    while (last >= 0 && getDozen(history[last]) !== idx) last--;
    return last === -1 ? history.length : history.length - last - 1;
  });

  const colDelay = [0,1,2].map(idx => {
    let last = history.length - 1;
    while (last >= 0 && getColumn(history[last]) !== idx) last--;
    return last === -1 ? history.length : history.length - last - 1;
  });

  const colorDelay = ["red", "black"].map(clr => {
    let last = history.length - 1;
    while (last >= 0 && getColor(history[last]) !== clr) last--;
    return last === -1 ? history.length : history.length - last - 1;
  });

  const evenOddDelay = [0,1].map(idx => {
    let last = history.length - 1;
    while (last >= 0 && getEvenOdd(history[last]) !== idx) last--;
    return last === -1 ? history.length : history.length - last - 1;
  });

  const rangeDelay = [0,1].map(idx => {
    let last = history.length - 1;
    while (last >= 0 && getRange(history[last]) !== idx) last--;
    return last === -1 ? history.length : history.length - last - 1;
  });

  const maxDelayDozen = [
    { idx: 0, delay: dozenDelay[0] },
    { idx: 1, delay: dozenDelay[1] },
    { idx: 2, delay: dozenDelay[2] }
  ].sort((a, b) => b.delay - a.delay)[0];
  const maxDelayCol = [
    { idx: 0, delay: colDelay[0] },
    { idx: 1, delay: colDelay[1] },
    { idx: 2, delay: colDelay[2] }
  ].sort((a, b) => b.delay - a.delay)[0];
  const maxDelayColor = [
    { idx: 0, delay: colorDelay[0] },
    { idx: 1, delay: colorDelay[1] }
  ].sort((a, b) => b.delay - a.delay)[0];
  const maxDelayEvenOdd = [
    { idx: 0, delay: evenOddDelay[0] },
    { idx: 1, delay: evenOddDelay[1] }
  ].sort((a, b) => b.delay - a.delay)[0];
  const maxDelayRange = [
    { idx: 0, delay: rangeDelay[0] },
    { idx: 1, delay: rangeDelay[1] }
  ].sort((a, b) => b.delay - a.delay)[0];

  function handleAddNumber(num) {
    if (!rouletteNumbers.includes(num)) return;
    setHistory((h) => [...h, num]);
    setInputValue("");
  }
  function handleInputChange(e) {
    setInputValue(e.target.value.replace(/[^0-9]/g, ""));
  }
  function handleInputSubmit(e) {
    e.preventDefault();
    let num = Number(inputValue);
    if (rouletteNumbers.includes(num)) handleAddNumber(num);
  }
  function handleClearHistory() {
    setHistory([]);
  }

  return (
    <div className="casino-bg">
      <h1 className="casino-title">Roulette Casino Tracker</h1>
      <form onSubmit={handleInputSubmit} className="casino-form">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Numéro sorti"
          maxLength={2}
          className="casino-input"
        />
        <button type="submit" className="casino-btn add">Ajouter</button>
        <button type="button" className="casino-btn reset" onClick={handleClearHistory}>
          Réinitialiser
        </button>
        <button
          type="button"
          className="casino-btn undo"
          onClick={() => setHistory(history.slice(0, -1))}
          disabled={history.length === 0}
        >
          Retour arrière
        </button>
      </form>

      <div className="table-roulette">
        <div className="main-table-v2">
          <div className="zero-row">
            <button
              className={`case num0 ${history[history.length - 1] === 0 ? "selected" : ""}`}
              onClick={() => handleAddNumber(0)}
            >
              0
              <span className="delay">{delayCounts[0]}</span>
            </button>
          </div>
          <div className="main-grid">
            {[...Array(12)].map((_, row) => (
              <div className="table-row" key={row}>
                {TABLE.map((col, cIdx) => {
                  const n = col[row];
                  return (
                    <button
                      key={n}
                      className={`case num${n} ${getColor(n)} ${
                        history[history.length - 1] === n ? "selected" : ""
                      }`}
                      onClick={() => handleAddNumber(n)}
                    >
                      {n}
                      <span className="delay">{delayCounts[n]}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="dozen-row">
            <div className="dozen-cell">
              1st 12
              <span className="zone-delay">{dozenDelay[0]}</span>
            </div>
            <div className="dozen-cell">
              2nd 12
              <span className="zone-delay">{dozenDelay[1]}</span>
            </div>
            <div className="dozen-cell">
              3rd 12
              <span className="zone-delay">{dozenDelay[2]}</span>
            </div>
          </div>
          <div className="outside-row">
            <div className="outside-cell">
              1 to 18
              <span className="zone-delay">{rangeDelay[0]}</span>
            </div>
            <div className="outside-cell">
              EVEN
              <span className="zone-delay">{evenOddDelay[0]}</span>
            </div>
            <div className="outside-cell red-case">
              RED
              <span className="zone-delay">{colorDelay[0]}</span>
            </div>
            <div className="outside-cell black-case">
              BLACK
              <span className="zone-delay">{colorDelay[1]}</span>
            </div>
            <div className="outside-cell">
              ODD
              <span className="zone-delay">{evenOddDelay[1]}</span>
            </div>
            <div className="outside-cell">
              19 to 36
              <span className="zone-delay">{rangeDelay[1]}</span>
            </div>
          </div>
          <div className="col-row">
            <div className="col-cell">
              2 to 1
              <span className="zone-delay">{colDelay[0]}</span>
            </div>
            <div className="col-cell">
              2 to 1
              <span className="zone-delay">{colDelay[1]}</span>
            </div>
            <div className="col-cell">
              2 to 1
              <span className="zone-delay">{colDelay[2]}</span>
            </div>
          </div>
        </div>

        {/* CLASSEMENT DU RETARD */}
        <div className="side-ranking">
          <h2>Classement retard (Numéros)</h2>
          <ul>
            {delayCounts
              .map((delay, num) => ({ num, delay }))
              .sort((a, b) => b.delay - a.delay)
              .slice(0, 10)
              .map((item) => (
                <li key={item.num}>
                  <b>
                    {item.num}
                  </b>
                  <span className="rank-delay">{item.delay} tours</span>
                </li>
              ))}
          </ul>
          <hr className="hr-sep" />
          <h2>Classement retard (Catégories)</h2>
          <table className="side-ranking-list">
            <tbody>
              <tr>
                <td className="side-ranking-label">Douzaine</td>
                <td className="side-ranking-value">{["1st 12", "2nd 12", "3rd 12"][maxDelayDozen.idx]}</td>
                <td className="side-ranking-delay">{maxDelayDozen.delay} tours</td>
              </tr>
              <tr>
                <td className="side-ranking-label">Colonne</td>
                <td className="side-ranking-value">{["Colonne 1", "Colonne 2", "Colonne 3"][maxDelayCol.idx]}</td>
                <td className="side-ranking-delay">{maxDelayCol.delay} tours</td>
              </tr>
              <tr>
                <td className="side-ranking-label">Couleur</td>
                <td className="side-ranking-value">{["Rouge", "Noir"][maxDelayColor.idx]}</td>
                <td className="side-ranking-delay">{maxDelayColor.delay} tours</td>
              </tr>
              <tr>
                <td className="side-ranking-label">Pair/Impair</td>
                <td className="side-ranking-value">{["Pair", "Impair"][maxDelayEvenOdd.idx]}</td>
                <td className="side-ranking-delay">{maxDelayEvenOdd.delay} tours</td>
              </tr>
              <tr>
                <td className="side-ranking-label">1-18/19-36</td>
                <td className="side-ranking-value">{["1-18", "19-36"][maxDelayRange.idx]}</td>
                <td className="side-ranking-delay">{maxDelayRange.delay} tours</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique */}
      <div className="casino-history">
        <b>Historique :</b>
        <div className="history-list">
          {history.length === 0 ? (
            <span className="history-empty">Aucun numéro saisi.</span>
          ) : (
            history.map((num, i) => (
              <span
                key={i}
                className={`history-num ${getColor(num)} ${
                  i === history.length - 1 ? "last" : ""
                }`}
              >
                {num}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
