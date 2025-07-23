import React, { useState } from "react";
import "./App.css";

// Fonction utilitaire couleur dynamique selon le ratio
function getRetardColor(ratio) {
  // Clamp le ratio pour éviter les extrêmes
  if (ratio < 0.2) ratio = 0.2;
  if (ratio > 9) ratio = 9;

  const colors = [
    { stop: 1, color: [39, 224, 76] },    // Vert (normal)
    { stop: 3, color: [255, 224, 54] },   // Jaune (petit retard)
    { stop: 5, color: [255, 143, 40] },   // Orange (retard fort)
    { stop: 6, color: [255, 48, 48] },    // Rouge clair (retard très fort)
    { stop: 9, color: [130, 0, 30] }      // Rouge foncé (retard extrême)
  ];

  let from, to;
  for (let i = 0; i < colors.length - 1; i++) {
    if (ratio >= colors[i].stop && ratio <= colors[i + 1].stop) {
      from = colors[i];
      to = colors[i + 1];
      break;
    }
  }
  if (!from) { from = colors[0]; to = colors[1]; }
  if (!to) { from = colors[colors.length - 2]; to = colors[colors.length - 1]; }
  const t = (ratio - from.stop) / (to.stop - from.stop);
  const color = from.color.map((c, i) => Math.round(c + (to.color[i] - c) * t));
  return `rgb(${color[0]},${color[1]},${color[2]})`;
}



// Helpers pour la roulette
const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK_NUMBERS = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function getColor(num) {
  if (num === 0) return "green";
  if (RED_NUMBERS.includes(num)) return "red";
  if (BLACK_NUMBERS.includes(num)) return "black";
  return "";
}

function getDozen(num) {
  if (num === 0) return null;
  if (num <= 12) return 1;
  if (num <= 24) return 2;
  return 3;
}

function getColumn(num) {
  if (num === 0) return null;
  return ((num - 1) % 3) + 1;
}

function getParity(num) {
  if (num === 0) return null;
  return num % 2 === 0 ? "even" : "odd";
}

function getHalf(num) {
  if (num === 0) return null;
  return num <= 18 ? "low" : "high";
}

// Probas
const PROBA = {
  number: 1 / 37,
  red: 18 / 37,
  black: 18 / 37,
  green: 1 / 37,
  dozen: 12 / 37,
  column: 12 / 37,
  even: 18 / 37,
  odd: 18 / 37,
  low: 18 / 37,
  high: 18 / 37,
};

// Espérance
const ESPERANCE = {
  number: 1 / PROBA.number,     // 37
  red: 1 / PROBA.red,           // ~2.06
  black: 1 / PROBA.black,
  green: 1 / PROBA.green,       // 37
  dozen: 1 / PROBA.dozen,       // ~3.08
  column: 1 / PROBA.column,
  even: 1 / PROBA.even,
  odd: 1 / PROBA.odd,
  low: 1 / PROBA.low,
  high: 1 / PROBA.high,
};

const ALL_NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const ALL_DOZENS = [1, 2, 3];
const ALL_COLUMNS = [1, 2, 3];
const ALL_COLORS = ["red", "black", "green"];
const ALL_PARITIES = ["even", "odd"];
const ALL_HALVES = ["low", "high"];

function App() {
  const [tirages, setTirages] = useState([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);

  // Ajout tirage
  function handleAdd() {
    const num = Number(input);
    if (!Number.isInteger(num) || num < 0 || num > 36) return;
    setUndoStack([...undoStack, tirages]);
    setTirages([...tirages, num]);
    setInput("");
    setSelected(num);
  }

  // Reset tout
  function handleReset() {
    setUndoStack([...undoStack, tirages]);
    setTirages([]);
    setSelected(null);
  }

  // Undo
  function handleUndo() {
    if (undoStack.length === 0) return;
    setTirages(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
    setSelected(null);
  }

  // Retards calcul
  function calcRetards(type, items, fn) {
    let retards = {};
    for (let val of items) {
      let count = 0;
      for (let i = tirages.length - 1; i >= 0; i--) {
        if (fn(tirages[i]) === val) break;
        count++;
      }
      if (!tirages.some(t => fn(t) === val)) count = tirages.length;
      retards[val] = count;
    }
    return retards;
  }

  // Retards pour chaque zone
  const retardsNum = calcRetards("number", ALL_NUMBERS, t => t);
  const retardsColor = calcRetards("color", ALL_COLORS, getColor);
  const retardsDozen = calcRetards("dozen", ALL_DOZENS, getDozen);
  const retardsColumn = calcRetards("column", ALL_COLUMNS, getColumn);
  const retardsParity = calcRetards("parity", ALL_PARITIES, getParity);
  const retardsHalf = calcRetards("half", ALL_HALVES, getHalf);

  // Pour l'affichage table, colorier sélection
  function isSelected(num) {
    return selected === num;
  }

  // Pour affichage couleur retard selon ratio
  function retardColor(type, value, retard) {
    let esperance = 1;
    switch (type) {
      case "number":
        esperance = ESPERANCE.number;
        break;
      case "color":
        if (value === "green") esperance = ESPERANCE.green;
        else esperance = ESPERANCE.red; // Rouge ou noir
        break;
      case "dozen":
        esperance = ESPERANCE.dozen;
        break;
      case "column":
        esperance = ESPERANCE.column;
        break;
      case "parity":
        esperance = ESPERANCE.even;
        break;
      case "half":
        esperance = ESPERANCE.low;
        break;
      default:
        esperance = 1;
    }
    const ratio = retard / esperance;
    return getRetardColor(ratio);
  }

  return (
    <div className="casino-bg">
      <div className="casino-title">Roulette Casino — Tracker de Retards</div>
      <div className="casino-form">
        <input
          className="casino-input"
          type="number"
          min={0}
          max={36}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Numéro (0-36)"
          onKeyDown={e => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button className="casino-btn add" onClick={handleAdd}>
          Ajouter
        </button>
        <button className="casino-btn reset" onClick={handleReset}>
          Reset
        </button>
        <button className="casino-btn undo" onClick={handleUndo} disabled={undoStack.length === 0}>
          Annuler
        </button>
      </div>

      {/* Table roulette */}
      <div className="table-roulette">
        <div className="main-table-v2">
          {/* Ligne du zéro */}
          <div className="zero-row">
            <div
              className={`case num0 green${isSelected(0) ? " selected" : ""}`}
              onClick={() => {
                setUndoStack([...undoStack, tirages]);
                setTirages([...tirages, 0]);
                setSelected(0);
              }}
            >
              0
              <span className="delay"
                style={{
                  color: retardColor("number", 0, retardsNum[0])
                }}>
                {retardsNum[0]}
              </span>
            </div>
          </div>
          {/* Grille principale */}
          <div className="main-grid">
            {[...Array(12)].map((_, r) => (
              <div className="table-row" key={r}>
                {[...Array(3)].map((_, c) => {
                  const num = r * 3 + c + 1;
                  const color = getColor(num);
                  return (
                    <div
                      className={`case ${color}${isSelected(num) ? " selected" : ""}`}
                      key={num}
                      onClick={() => {
                        setUndoStack([...undoStack, tirages]);
                        setTirages([...tirages, num]);
                        setSelected(num);
                      }}
                    >
                      {num}
                      <span className="delay"
                        style={{
                          color: retardColor("number", num, retardsNum[num])
                        }}>
                        {retardsNum[num]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {/* Douzaines */}
          <div className="dozen-row">
            {ALL_DOZENS.map(doz => (
              <div className="dozen-cell" key={doz}>
                {doz}ᵉ Douzaine
                <span className="zone-delay"
                  style={{
                    color: retardColor("dozen", doz, retardsDozen[doz])
                  }}>
                  {retardsDozen[doz]}
                </span>
              </div>
            ))}
          </div>
          {/* Outside bets */}
          <div className="outside-row">
            <div className="outside-cell red-case">
              Rouge
              <span className="zone-delay"
                style={{
                  color: retardColor("color", "red", retardsColor.red)
                }}>
                {retardsColor.red}
              </span>
            </div>
            <div className="outside-cell black-case">
              Noir
              <span className="zone-delay"
                style={{
                  color: retardColor("color", "black", retardsColor.black)
                }}>
                {retardsColor.black}
              </span>
            </div>
            <div className="outside-cell">
              Pair
              <span className="zone-delay"
                style={{
                  color: retardColor("parity", "even", retardsParity.even)
                }}>
                {retardsParity.even}
              </span>
            </div>
            <div className="outside-cell">
              Impair
              <span className="zone-delay"
                style={{
                  color: retardColor("parity", "odd", retardsParity.odd)
                }}>
                {retardsParity.odd}
              </span>
            </div>
          </div>
          {/* High / Low */}
          <div className="outside-row">
            <div className="outside-cell">
              Manque (1-18)
              <span className="zone-delay"
                style={{
                  color: retardColor("half", "low", retardsHalf.low)
                }}>
                {retardsHalf.low}
              </span>
            </div>
            <div className="outside-cell">
              Passe (19-36)
              <span className="zone-delay"
                style={{
                  color: retardColor("half", "high", retardsHalf.high)
                }}>
                {retardsHalf.high}
              </span>
            </div>
          </div>
          {/* Colonnes */}
          <div className="col-row">
            {ALL_COLUMNS.map(col => (
              <div className="col-cell" key={col}>
                Col {col}
                <span className="zone-delay"
                  style={{
                    color: retardColor("column", col, retardsColumn[col])
                  }}>
                  {retardsColumn[col]}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Classement retards à droite */}
        <div className="side-ranking">
          <h2>Classement Retards — Numéros</h2>
          <table className="side-ranking-list">
            <tbody>
              {ALL_NUMBERS
                .map(n => ({
                  num: n,
                  retard: retardsNum[n]
                }))
                .sort((a, b) => b.retard - a.retard)
                .slice(0, 10)
                .map(({ num, retard }, i) => (
                  <tr key={num}>
                    <td className="side-ranking-label">{num}</td>
                    <td
                      className="side-ranking-delay"
                      style={{
                        color: retardColor("number", num, retard)
                      }}>
                      {retard}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <hr className="hr-sep" />
          <h2>Classement Retards — Catégories</h2>
          <ul>
            <li>
              <span>Rouge</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("color", "red", retardsColor.red) }}
              >
                {retardsColor.red}
              </span>
            </li>
            <li>
              <span>Noir</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("color", "black", retardsColor.black) }}
              >
                {retardsColor.black}
              </span>
            </li>
            <li>
              <span>Vert</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("color", "green", retardsColor.green) }}
              >
                {retardsColor.green}
              </span>
            </li>
            <li>
              <span>Douzaine 1</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("dozen", 1, retardsDozen[1]) }}
              >
                {retardsDozen[1]}
              </span>
            </li>
            <li>
              <span>Douzaine 2</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("dozen", 2, retardsDozen[2]) }}
              >
                {retardsDozen[2]}
              </span>
            </li>
            <li>
              <span>Douzaine 3</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("dozen", 3, retardsDozen[3]) }}
              >
                {retardsDozen[3]}
              </span>
            </li>
            <li>
              <span>Colonne 1</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("column", 1, retardsColumn[1]) }}
              >
                {retardsColumn[1]}
              </span>
            </li>
            <li>
              <span>Colonne 2</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("column", 2, retardsColumn[2]) }}
              >
                {retardsColumn[2]}
              </span>
            </li>
            <li>
              <span>Colonne 3</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("column", 3, retardsColumn[3]) }}
              >
                {retardsColumn[3]}
              </span>
            </li>
            <li>
              <span>Pair</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("parity", "even", retardsParity.even) }}
              >
                {retardsParity.even}
              </span>
            </li>
            <li>
              <span>Impair</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("parity", "odd", retardsParity.odd) }}
              >
                {retardsParity.odd}
              </span>
            </li>
            <li>
              <span>Manque (1-18)</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("half", "low", retardsHalf.low) }}
              >
                {retardsHalf.low}
              </span>
            </li>
            <li>
              <span>Passe (19-36)</span>
              <span
                className="rank-delay"
                style={{ color: retardColor("half", "high", retardsHalf.high) }}
              >
                {retardsHalf.high}
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Historique */}
      <div className="casino-history">
        <b>Historique des tirages :</b>
        <div className="history-list">
          {tirages.length === 0 ? (
            <span className="history-empty">Aucun tirage.</span>
          ) : (
            tirages.slice(-30).map((num, idx) => (
              <span
                key={idx}
                className={
                  `history-num ${getColor(num)}${idx === tirages.length - 1 ? " last" : ""}`
                }
                onClick={() => {
                  setUndoStack([...undoStack, tirages]);
                  setTirages([...tirages, num]);
                  setSelected(num);
                }}
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

export default App;
