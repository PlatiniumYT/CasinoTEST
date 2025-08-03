import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import { RouletteWheel } from "./RouletteWheel";

const CARRES = [
  [1,2,4,5],   [2,3,5,6],
  [4,5,7,8],   [5,6,8,9],
  [7,8,10,11], [8,9,11,12],
  [10,11,13,14], [11,12,14,15],
  [13,14,16,17], [14,15,17,18],
  [16,17,19,20], [17,18,20,21],
  [19,20,22,23], [20,21,23,24],
  [22,23,25,26], [23,24,26,27],
  [25,26,28,29], [26,27,29,30],
  [28,29,31,32], [29,30,32,33],
  [31,32,34,35], [32,33,35,36]
];

const ROULETTE_ORDER = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,
  10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];

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

function getRetardColor(ratio) {
  if (ratio < 0.2) ratio = 0.2;
  if (ratio > 9) ratio = 9;
  const colors = [
    { stop: 1, color: [39, 224, 76] },    // Vert
    { stop: 3, color: [255, 224, 54] },   // Jaune
    { stop: 5, color: [255, 143, 40] },   // Orange
    { stop: 6, color: [255, 48, 48] },    // Rouge vif
    { stop: 9, color: [130, 0, 30] }      // Bordeaux foncé
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

// Fonction utilitaire pour calculer le pourcentage du dégradé
function getRetardPercent(ratio) {
  // ratio 1 => 0% (vert), ratio 9 => 100% (rouge foncé)
  if (ratio <= 1) return 0;
  if (ratio >= 9) return 100;
  return Math.round(((ratio - 1) / 8) * 100);
}

function calcRetardCarre(nums, tirages) {
  let count = 0;
  for (let i = tirages.length - 1; i >= 0; i--) {
    if (nums.includes(tirages[i].num)) break;
    count++;
  }
  if (!tirages.some(t => nums.includes(t.num))) count = tirages.length;
  return count;
}

function calcTopRetardRouletteGroups(n, tirages) {
  let bestGroup = null;
  let bestRetard = -1;

  for (let i = 0; i < ROULETTE_ORDER.length; i++) {
    let group = [];
    for (let j = 0; j < n; j++) {
      group.push(ROULETTE_ORDER[(i + j) % ROULETTE_ORDER.length]);
    }
    let count = 0;
    for (let t = tirages.length - 1; t >= 0; t--) {
      if (group.includes(tirages[t].num)) break;
      count++;
    }
    if (!tirages.some(t => group.includes(t.num))) count = tirages.length;
    if (count > bestRetard) {
      bestRetard = count;
      bestGroup = group;
    }
  }
  return { group: bestGroup, retard: bestRetard };
}

function App() {
  const [tirages, setTirages] = useState([]);
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [keyNumber, setKeyNumber] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const [analyseSens, setAnalyseSens] = useState("G");
  const [highlightCarre, setHighlightCarre] = useState([]);
  const tapisScrollRef = useRef(null);
  const [showRoulette, setShowRoulette] = useState(true);
  const [highlightGroup, setHighlightGroup] = useState([]);

  useEffect(() => {
    if (tirages.length > 0) {
      const last = tirages[tirages.length - 1];
      setKeyNumber(last.num);
      setAnalyseSens(last.sens);
      setSelected(last.num);
    }
    if (tapisScrollRef.current) {
      tapisScrollRef.current.scrollLeft = 0;
    }
  }, [tirages.length]);

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
      } catch (e) {}
    };
  }

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
    setHighlightCarre([]);
  }
  function handleUndo() {
    if (undoStack.length === 0) return;
    setTirages(undoStack[undoStack.length - 1]);
    setUndoStack(undoStack.slice(0, -1));
    setSelected(null);
    setKeyNumber(null);
    setHighlightCarre([]);
  }
  function handleRandom() {
    const num = Math.floor(Math.random() * 37);
    handleAdd(num);
  }

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
          const start = tirages.length % 2;
          const imported = data.map((num, i) => ({
            num,
            sens: ((i + start) % 2 === 0) ? "G" : "D"
          }));
          setTirages([...tirages, ...imported]);
          setSelected(imported.length ? imported[imported.length - 1].num : null);
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
  function retardPercent(type, value, retard) {
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
    return getRetardPercent(ratio);
  }
  function isSelected(num) {
    return selected === num;
  }

  const carreRetards = CARRES.map(nums => ({
    nums,
    retard: calcRetardCarre(nums, tirages)
  })).sort((a, b) => b.retard - a.retard);

  const TOP_GROUPS = [];
  for (let n = 2; n <= 12; n++) {
    TOP_GROUPS.push({
      n,
      ...calcTopRetardRouletteGroups(n, tirages)
    });
  }

  let keyAnalysis = null;
  if (keyNumber !== null && tirages.length > 1) {
    const afters = [];
    for (let i = 0; i < tirages.length - 1; i++) {
      if (tirages[i].num === keyNumber && tirages[i].sens === analyseSens) {
        afters.push(tirages[i + 1].num);
      }
    }
    const freq = {};
    afters.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    const lastIndex = {};
    afters.forEach((n, idx) => { lastIndex[n] = idx; });
    const sorted = Object.entries(freq).sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      } else {
        return lastIndex[b[0]] - lastIndex[a[0]];
      }
    });
    const principaux = sorted.slice(0, 5).map(([n, count]) => Number(n));
    let zone = null;
    if (principaux.length >= 2) {
      const min = Math.min(...principaux);
      const max = Math.max(...principaux);
      if (max - min <= 5) zone = `${min} - ${max}`;
    }
    keyAnalysis = { afters, freq: sorted, principaux, zone, total: afters.length };
  }

  let highlightNumbers = [];
  if (highlightCarre.length > 0) {
    highlightNumbers = highlightCarre;
  } else if (keyAnalysis && keyAnalysis.freq.length) {
    highlightNumbers = keyAnalysis.freq.slice(0, 5).map(([n]) => Number(n));
  }

  const CARRE_ESPERANCE = 37 / 4;

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

      {/* Plateau tapis roulette classique */}
      <div
        className="roulette-tapis-fr-scroll"
        ref={tapisScrollRef}
        style={{
          width: "100%",
          overflowX: "auto",
          paddingBottom: 8,
          marginBottom: 18,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div className="roulette-tapis-fr" style={{ display: "flex", alignItems: "flex-start", minWidth: 0		}}>
          <div
            className={`case zero green${isSelected(0) ? " selected" : ""} ${highlightNumbers.includes(0) ? "highlight" : ""}`}
            style={{ width: 42, height: 42, marginRight: 10, fontWeight: 900, fontSize: "1.13em" }}
            onClick={() => { handleAdd(0); setHighlightCarre([]); }}
          >
            0
          </div>
          <div>
            {[0, 1, 2].map(line => (
              <div key={line} style={{ display: "flex", marginBottom: 2 }}>
                {[...Array(12)].map((_, col) => {
                  const num = col * 3 + (3 - line);
                  if (num > 36) return null;
                  const color = getColor(num);
                  return (
                    <div
                      className={`case ${color}${isSelected(num) ? " selected" : ""} ${highlightNumbers.includes(num) ? "highlight" : ""}`}
                      key={num}
                      style={{ width: 42, height: 42, marginRight: 2 }}
                      onClick={() => { handleAdd(num); setHighlightCarre([]); }}
                    >
                      {num}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historique des tirages + compteur */}
      <div className="casino-history">
        <b>
          Historique des tirages <span style={{color:'#ffe34d'}}>({tirages.length})</span> :
        </b>
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
                onClick={() => {
                  setKeyNumber(item.num);
                  setAnalyseSens(item.sens);
                  setSelected(item.num);
                  setHighlightCarre([]);
                }}
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

      {/* BOUTON AFFICHER/MASQUER LA ROULETTE & L'ANALYSE */}
      <button
        className="casino-btn"
        style={{
          margin: "16px auto 10px auto",
          display: "block",
          background: "#ffe34d",
          color: "#232",
          fontWeight: 700
        }}
        onClick={() => setShowRoulette(s => !s)}
      >
        {showRoulette ? "Masquer la roulette & l'analyse" : "Afficher la roulette & l'analyse"}
      </button>

      {/* Bloc roulette + analyse conditionnel */}
      {showRoulette && (
        <>
          {/* Boutons d'analyse gauche/droite */}
          <div style={{ display: "flex", justifyContent: "center", margin: "15px 0 10px 0", gap: 12 }}>
            <button
              className={`sens-btn${analyseSens === "G" ? " selected" : ""}`}
              onClick={() => { setAnalyseSens("G"); setHighlightCarre([]); }}
            >Analyser Gauche</button>
            <button
              className={`sens-btn${analyseSens === "D" ? " selected" : ""}`}
              onClick={() => { setAnalyseSens("D"); setHighlightCarre([]); }}
            >Analyser Droite</button>
          </div>
          {/* Roulette */}
          <div style={{ margin: "32px auto 14px auto", display: "flex", justifyContent: "center" }}>
            <RouletteWheel
              size={320}
              onAnalyseClick={num => {
                setKeyNumber(num);
                setSelected(num);
                setHighlightCarre([]);
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
                    (Clique à nouveau sur la roue ou l’historique, ou double-clique sur un carré pour annuler la surbrillance)
                  </div>
                </>
              ) : (
                <div style={{ color: "#ff5959" }}>
                  Pas assez de données pour une analyse sur ce numéro.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ------- CLASSEMENTS RETARDS ------- */}
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
              .slice(0, 5)
              .map(({ num, retard }, i) => {
                const ratio = retard / ESPERANCE.number;
                const percent = getRetardPercent(ratio);
                return (
                  <tr key={num}>
                    <td className="side-ranking-label">{num}</td>
                    <td
                      className="side-ranking-delay"
                      style={{
                        color: getRetardColor(ratio)
                      }}>
                      {retard}
                      <span style={{
                        fontSize: "0.85em",
                        marginLeft: 5,
                        opacity: 0.75,
                        fontWeight: 500,
                        verticalAlign: "middle"
                      }}>
                        {percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        <hr className="hr-sep" />
        <h2>Classement Retards — Catégories</h2>
        <ul>
          {[
            { label: "Rouge", val: "red", type: "color", delay: retardsColor.red },
            { label: "Noir", val: "black", type: "color", delay: retardsColor.black },
            { label: "Douzaine 1", val: 1, type: "dozen", delay: retardsDozen[1] },
            { label: "Douzaine 2", val: 2, type: "dozen", delay: retardsDozen[2] },
            { label: "Douzaine 3", val: 3, type: "dozen", delay: retardsDozen[3] },
            { label: "Colonne 1", val: 1, type: "column", delay: retardsColumn[1] },
            { label: "Colonne 2", val: 2, type: "column", delay: retardsColumn[2] },
            { label: "Colonne 3", val: 3, type: "column", delay: retardsColumn[3] },
            { label: "Pair", val: "even", type: "parity", delay: retardsParity.even },
            { label: "Impair", val: "odd", type: "parity", delay: retardsParity.odd },
            { label: "Manque (1-18)", val: "low", type: "half", delay: retardsHalf.low },
            { label: "Passe (19-36)", val: "high", type: "half", delay: retardsHalf.high }
          ]
            .sort((a, b) => b.delay - a.delay)
            .slice(0, 5)
            .map(cat => {
              let esperance = 1;
              switch (cat.type) {
                case "color": esperance = cat.val === "green" ? ESPERANCE.green : ESPERANCE.red; break;
                case "dozen": esperance = ESPERANCE.dozen; break;
                case "column": esperance = ESPERANCE.column; break;
                case "parity": esperance = ESPERANCE.even; break;
                case "half": esperance = ESPERANCE.low; break;
                default: esperance = 1;
              }
              const ratio = cat.delay / esperance;
              const percent = getRetardPercent(ratio);
              return (
                <li key={cat.label}>
                  <span>{cat.label}</span>
                  <span
                    className="rank-delay"
                    style={{ color: getRetardColor(ratio) }}
                  >
                    {cat.delay}
                    <span style={{
                      fontSize: "0.85em",
                      marginLeft: 5,
                      opacity: 0.75
                    }}>
                      {percent}%
                    </span>
                  </span>
                </li>
              );
            })}
        </ul>
        <hr className="hr-sep" />
        <h2>Classement Retards — Catégorie 2 (Carrés)</h2>
        <ul>
          {carreRetards.slice(0, 5).map((carre, i) => {
            const ratio = carre.retard / CARRE_ESPERANCE;
            const percent = getRetardPercent(ratio);
            return (
              <li key={carre.nums.join("-")} style={{marginBottom: 5, cursor: "pointer"}}
                onClick={() => setHighlightCarre(carre.nums)}
                onDoubleClick={() => setHighlightCarre([])}
                title="Cliquer pour surligner les cases du carré">
                <span>
                  {carre.nums.join(", ")}
                </span>
                <span
                  className="rank-delay"
                  style={{ color: getRetardColor(ratio) }}
                >
                  {carre.retard}
                  <span style={{
                    fontSize: "0.85em",
                    marginLeft: 5,
                    opacity: 0.75
                  }}>
                    {percent}%
                  </span>
                </span>
              </li>
            );
          })}
        </ul>

        {/* -------- CLASSEMENTS GROUPES CÔTE À CÔTE & SURBRILLANCE -------- */}
        <hr className="hr-sep" />
        <h2>Classements Retard — Groupes consécutifs sur la roue</h2>
        <ul>
          {TOP_GROUPS.map(item => {
            const esperance = 37 / item.n;
            const ratio = item.retard / esperance;
            const percent = getRetardPercent(ratio);
            return (
              <li key={item.n} style={{marginBottom: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                <span>
                  <b>{item.n}</b>&nbsp;:&nbsp;{item.group.join(", ")}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="rank-delay"
                    style={{
                      color: getRetardColor(ratio),
                      minWidth: 24,
                      display: "inline-block",
                      fontWeight: 700
                    }}
                    title={`Espérance : ${esperance.toFixed(1)}`}
                  >
                    {item.retard}
                    <span style={{
                      fontSize: "0.85em",
                      marginLeft: 5,
                      opacity: 0.75
                    }}>
                      {percent}%
                    </span>
                  </span>
                  <button
                    style={{
                      background: highlightGroup.join('-') === item.group.join('-') ? '#23c6ff' : '#eee',
                      color: highlightGroup.join('-') === item.group.join('-') ? '#fff' : '#333',
                      border: 'none',
                      borderRadius: 6,
                      padding: '3px 8px',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                    title="Afficher ce groupe sur la roulette"
                    onClick={() => setHighlightGroup(item.group)}
                  >
                    👁️
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
        {/* 2e roulette visuelle pour le surlignage groupes */}
        {highlightGroup.length > 0 && (
          <>
            <div style={{ margin: "24px auto 10px auto", display: "flex", justifyContent: "center" }}>
              <RouletteWheel
                size={320}
                highlightNumbers={highlightGroup}
                highlightColor="#23c6ff"
                disableInteractions={true}
              />
            </div>
            <div style={{textAlign: 'center', marginTop: -10, marginBottom: 20}}>
              <button
                onClick={() => setHighlightGroup([])}
                style={{
                  background: '#ffe34d',
                  color: '#333',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  padding: '5px 16px',
                  cursor: 'pointer'
                }}
              >
                Réinitialiser surbrillance
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default App;
