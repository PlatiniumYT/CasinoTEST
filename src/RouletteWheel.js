const ROUE_ORDRE_EU = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,
  10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];
const ROUGES = [32,19,21,25,34,27,36,30,23,5,16,1,14,9,18,7,12,3];
const NOIRS = [15,4,2,17,6,13,11,8,10,24,33,20,31,22,29,28,35,26];
function getRouletteColor(n) {
  if (n === 0) return "#1fad3d";
  if (ROUGES.includes(n)) return "#d03b2d";
  if (NOIRS.includes(n)) return "#232323";
  return "#888";
}

export function RouletteWheel({
  size = 340,
  showNumbers = true,
  onAnalyseClick,
  selectedNumber,
  highlightNumbers = []
}) {
  const cx = size / 2, cy = size / 2, rExt = size * 0.46, rInt = size * 0.36;
  const N = ROUE_ORDRE_EU.length;
  const angle = 2 * Math.PI / N;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={rExt + 6} fill="#000" opacity="0.32" />
      <circle cx={cx} cy={cy} r={rExt + 2} fill="#b6a179" />
      {ROUE_ORDRE_EU.map((num, i) => {
        const a0 = angle * i - Math.PI / 2;
        const a1 = angle * (i + 1) - Math.PI / 2;
        const x0 = cx + rInt * Math.cos(a0), y0 = cy + rInt * Math.sin(a0);
        const x1 = cx + rExt * Math.cos(a0), y1 = cy + rExt * Math.sin(a0);
        const x2 = cx + rExt * Math.cos(a1), y2 = cy + rExt * Math.sin(a1);
        const x3 = cx + rInt * Math.cos(a1), y3 = cy + rInt * Math.sin(a1);
        const fill = getRouletteColor(num);
        const isSelected = num === selectedNumber;
        const isHighlight = highlightNumbers.includes(num);

        return (
          <g key={num + "-" + i} style={{ cursor: "pointer" }}
             onClick={onAnalyseClick ? () => onAnalyseClick(num) : undefined}>
            <path
              d={`
                M ${x0} ${y0}
                L ${x1} ${y1}
                A ${rExt} ${rExt} 0 0 1 ${x2} ${y2}
                L ${x3} ${y3}
                A ${rInt} ${rInt} 0 0 0 ${x0} ${y0}
                Z
              `}
              fill={fill}
              stroke={
                isSelected ? "#ffe34d"
                : isHighlight ? "#4dfcff"
                : "#fff"
              }
              strokeWidth={isSelected || isHighlight ? 4 : 2}
              style={
                isSelected
                  ? { filter: "drop-shadow(0 0 10px #ffe34d99)" }
                  : isHighlight
                  ? { filter: "drop-shadow(0 0 7px #40ffe699)" }
                  : {}
              }
            />
            {showNumbers && (
              <text
                x={cx + (size * 0.41) * Math.cos((a0 + a1) / 2)}
                y={cy + (size * 0.41) * Math.sin((a0 + a1) / 2)}
                fill="#fff"
                fontSize={size * 0.06}
                fontWeight={num === 0 ? 900 : 600}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  paintOrder: "stroke fill",
                  stroke: "#111",
                  strokeWidth: 2,
                  letterSpacing: 1.2
                }}
              >
                {num}
              </text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={size * 0.18} fill="#26251f" />
      <circle cx={cx} cy={cy} r={size * 0.08} fill="#fff" />
      <circle cx={cx} cy={cy} r={size * 0.045} fill="#b1a172" />
    </svg>
  );
}
