import React, { useState, useRef } from "react";
import "./App.css";
import { RouletteWheel } from "./RouletteWheel";

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

const PROBA = {
  number: 1 / 37, red: 18 / 37, black: 18 / 37, green: 1 / 37,
  dozen: 12 / 37, column: 12 / 37, even: 18 / 37, odd: 18 / 37, low: 18 / 37, high: 18 / 37,
};
const ESPERANCE = {
  number: 1 / PROBA.number, red: 1 / PROBA.red, black: 1 / PROBA.black, green: 1 / PROBA.green,
  dozen: 1 / PROBA.dozen, column: 1 / PROBA.column, even: 1 / PROBA.even, odd: 1 / PROBA.odd,
  low: 1 / PROBA.low, high: 1 / PROBA.high,
};

const ALL_NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const ALL_DOZENS = [1, 2, 3];
const ALL_COLUMNS = [1, 2, 3];
const ALL_COLORS = ["red", "black", "green"];
const ALL_PARITIES = ["even", "odd"];
const ALL_HALVES = ["low", "high"];

// Dégradé couleurs retard (personnalisé)
function getRetardColor(ratio) {
  if (ratio < 0.2) ratio = 0.2;
  if (ratio > 9) ratio = 9;
  const colors = [
    { stop: 1, color: [39, 224, 76] },    // Vert (normal)
    { stop: 3, color: [255, 224, 54] },   // Jaune (retard modéré)
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

function App() {
  const [tirages, setTirages] = useState([]); // [{num: 32, sens: "G"}, ...]
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [keyNumber, setKeyNumber] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const [analyseSens, setAnalyseSens] = useState("G"); // G ou D

  // --- SYNCHRONISATION WEBSOCKET ---
  function handleSyncWebSocket() {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    const ws = new window.WebSocket("ws://localhost:8765");
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        if (typeof data.result !== "undefined") {
          const sens = ((tirages.length) % 2 === 0) ? "G" : "D";
          setUndoStack(current => [...current, tirages]);
          setTirages(current => [...current, { num: Number(data.result), sens }]);
          setSelected(Number(data.result));
        }
      } catch (e) { /* ignore */ }
    };
  }

  // --- AJOUT MANUEL / ALEATOIRE ---
  function handleAdd(numArg) {
    const num = typeof numArg === "number" ? numArg : Number(input);
    if (!Number.isInteger(num) || num < 0 || num > 36) return;
    const sens = ((tirages.length) % 2 === 0) ? "G" : "D";
    setUndoStack([...undoStack, tirages]);
    setTirages([...tirages, { num, sens }]);
    setInput("");
    setSelected(num);
  }
  function handleReset() {
    setUndoStack([...undoStack, tirages]);
    setTirages([]);
    setSelected(null);
    setKeyNumber(null);
  }
  function handleUndo() {
    if (undoStack.length === 0) return;
    setTirages(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
    setSelected(null);
    setKeyNumber(null);
  }
  function handleRandom() {
    const num = Math.floor(Math.random() * 37);
    handleAdd(num);
  }

  // --- IMPORT/EXPORT ---
  function handleExport() {
    const exportArr = tirages.map(t => t.num);
    const blob = new Blob([JSON.stringify(exportArr)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historique-roulette.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data) && data.every(n => Number.isInteger(n) && n >= 0 && n <= 36)) {
          setUndoStack([...undoStack, tirages]);
          // Ajoute chaque tirage en alternant G/D
          const start = tirages.length % 2;
          const imported = data.map((num, i) => ({
            num,
            sens: ( (i+start) % 2 === 0 ) ? "G" : "D"
          }));
          setTirages([...tirages, ...imported]);
          setSelected(imported.length ? imported[imported.length-1].num : null);
          setKeyNumber(null);
        } else {
          alert("Fichier invalide (attendu : liste de numéros 0-36)");
        }
      } catch {
        alert("Fichier invalide ou corrompu.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // --- CALCULS ---
  function calcRetards(type, items, fn) {
    let retards = {};
    for (let val of items) {
      let count = 0;
      for (let i = tirages.length - 1; i >= 0; i--) {
        if (fn(tirages[i].num) === val) break;
        count++;
      }
      if (!tirages.some(t => fn(t.num) === val)) count = tirages.length;
      retards[val] = count;
    }
    return retards;
  }

  const retardsNum = calcRetards("number", ALL_NUMBERS, t => t);
  const retardsColor = calcRetards("color", ALL_COLORS, getColor);
  const retardsDozen = calcRetards("dozen", ALL_DOZENS, getDozen);
  const retardsColumn = calcRetards("column", ALL_COLUMNS, getColumn);
  const retardsParity = calcRetards("parity", ALL_PARITIES, getParity);
  const retardsHalf = calcRetards("half", ALL_HALVES, getHalf);

  function retardColor(type, value, retard) {
    let esperance = 1;
    switch (type) {
      case "number": esperance = ESPERANCE.number; break;
      case "color": esperance = value === "green" ? ESPERANCE.green : ESPERANCE.red; break;
      case "dozen": esperance = ESPERANCE.dozen; break;
      case "column": esperance = ESPERANCE.column; break;
      case "parity": esperance = ESPERANCE.even; break;
      case "half": esperance = ESPERANCE.low; break;
      default: esperance = 1;
    }
    const ratio = retard / esperance;
    return getRetardColor(ratio);
  }
  function isSelected(num) {
    return selected === num;
  }

  // --- ANALYSE SEQUENCE, filtrée sur sens ---
 let keyAnalysis = null;
if (keyNumber !== null && tirages.length > 1) {
  const afters = [];
  for (let i = 0; i < tirages.length - 1; i++) {
    if (tirages[i].num === keyNumber && tirages[i].sens === analyseSens) {
      // Prend le suivant, qui sera toujours l'autre sens
      afters.push(tirages[i + 1].num);
    }
  }
  const freq = {};
  afters.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const principaux = sorted.slice(0, 3).map(([n, count]) => Number(n));
  let zone = null;
  if (principaux.length >= 2) {
    const min = Math.min(...principaux);
    const max = Math.max(...principaux);
    if (max - min <= 5) zone = `${min} - ${max}`;
  }
  keyAnalysis = { afters, freq: sorted, principaux, zone, total: afters.length };
}


  // -- surlignage des "numéros prédits" sur la roue --
  let highlightNumbers = [];
  if (keyAnalysis && keyAnalysis.freq.length) {
    highlightNumbers = keyAnalysis.freq.slice(0, 3).map(([n]) => Number(n));
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
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
        />
        <button className="casino-btn add" onClick={() => handleAdd()}>Ajouter</button>
        <button
          className="casino-btn random"
          style={{ background: "#ffe34d", color: "#232", fontWeight: 700 }}
          onClick={handleRandom}
        >
          🎲 Aléatoire
        </button>
        <button className="casino-btn reset" onClick={handleReset}>Reset</button>
        <button className="casino-btn undo" onClick={handleUndo} disabled={undoStack.length === 0}>Annuler</button>
        <button
          className="casino-btn export"
          style={{ background: "#2bd26c", color: "#232" }}
          onClick={handleExport}
        >
          📥 Exporter
        </button>
        <label
          className="casino-btn import"
          style={{
            background: "#ffe34d", color: "#232",
            fontWeight: 700, cursor: "pointer", display: "inline-block"
          }}
        >
          📤 Importer
          <input
            type="file"
            accept=".json"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </label>
        <button
          className="casino-btn sync"
          style={{
            background: wsConnected ? "#2bd26c" : "#ffad0e",
            color: wsConnected ? "#181" : "#222",
            fontWeight: 700
          }}
          onClick={handleSyncWebSocket}
        >
          {wsConnected ? "🟢 Synchro active" : "🔄 Synchroniser"}
        </button>
      </div>

      {/* Historique des tirages */}
      <div className="casino-history">
        <b>Historique des tirages :</b>
        <div className="history-list">
          {tirages.length === 0 ? (
            <span className="history-empty">Aucun tirage.</span>
          ) : (
            tirages.slice(-30).map((item, idx) => (
              <span
                key={idx}
                className={
                  `history-num ${getColor(item.num)}${idx === tirages.length - 1 ? " last" : ""}`
                }
                title={item.sens === "G" ? "Gauche" : "Droite"}
              >
                {item.num}
                <span style={{
                  fontSize: "0.82em",
                  marginLeft: 5,
                  opacity: 0.85,
                  fontWeight: "bold",
                  letterSpacing: "0.2em"
                }}>
                  {item.sens}
                </span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Table roulette */}
      <div className="table-roulette">
        <div className="main-table-v2">
          {/* Ligne du zéro */}
          <div className="zero-row">
            <div
              className={`case num0 green${isSelected(0) ? " selected" : ""}`}
              onClick={() => handleAdd(0)}
            >
              0
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
                      onClick={() => handleAdd(num)}
                    >
                      {num}
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

      {/* Choix de l'analyse sur G ou D */}
      <div style={{ display: "flex", justifyContent: "center", margin: "15px 0 0 0", gap: 12 }}>
        <button
          className={`sens-btn${analyseSens === "G" ? " selected" : ""}`}
          onClick={() => setAnalyseSens("G")}
        >Analyser Gauche</button>
        <button
          className={`sens-btn${analyseSens === "D" ? " selected" : ""}`}
          onClick={() => setAnalyseSens("D")}
        >Analyser Droite</button>
      </div>

      {/* Roue SVG centrée */}
      <div style={{ margin: "32px auto 14px auto", display: "flex", justifyContent: "center" }}>
        <RouletteWheel
          size={320}
          onAnalyseClick={num => {
            setKeyNumber(num);
            setSelected(num);
          }}
          selectedNumber={keyNumber}
          highlightNumbers={highlightNumbers}
        />
      </div>

      {/* Analyse séquence */}
      {keyNumber !== null && (
        <div className="casino-history" style={{ marginTop: 20, background: "#202c2c" }}>
          <b>
            Analyse de séquence pour le numéro&nbsp;{keyNumber} 
            {analyseSens === "G" ? " (Gauche)" : " (Droite)"} :
          </b>
          {keyAnalysis && keyAnalysis.total > 0 ? (
            <>
              <div style={{ margin: "6px 0" }}>
                Après le <span style={{ color: "#ffe34d" }}>{keyNumber}</span> ({analyseSens}), les tirages suivants sont :
                <ul>
                  {keyAnalysis.freq.map(([n, count], i) => (
                    <li key={n}>
                      {n} <span style={{ color: "#2bd26c" }}>({count}x)</span>
                    </li>
                  ))}
                </ul>
              </div>
              {keyAnalysis.zone && (
                <div style={{ color: "#ff9933", fontWeight: 600, marginBottom: 4 }}>
                  ➡ Les numéros les plus fréquents après {keyNumber} sont regroupés dans la zone&nbsp;: {keyAnalysis.zone}
                </div>
              )}
              <div style={{ color: "#aaa", fontSize: "0.95em" }}>
                (Clique à nouveau sur la roue sur un autre numéro pour changer la séquence)
              </div>
            </>
          ) : (
            <div style={{ color: "#ff5959" }}>
              Pas assez de données pour une analyse sur ce numéro.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
