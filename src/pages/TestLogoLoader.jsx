import React from 'react';

const CYAN = '#00B4E6';
const NAVY = '#0D2B4E';

const CX = 136;
const CY = 109;
const OPEN_DEG = 43;

function makePath(r) {
  const toRad = (d) => (d * Math.PI) / 180;
  const sx = CX + r * Math.cos(toRad(OPEN_DEG));
  const sy = CY + r * Math.sin(toRad(OPEN_DEG));
  const ex = CX + r * Math.cos(toRad(-OPEN_DEG));
  const ey = CY + r * Math.sin(toRad(-OPEN_DEG));
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function arcLen(r) {
  return r * ((360 - OPEN_DEG * 2) * Math.PI) / 180;
}

function pct(s, total = 4.2) {
  return `${((s / total) * 100).toFixed(2)}%`;
}

const ARCS = [
  { r: 148, sw: 13, color: CYAN, drawStart: 0, drawEnd: 0.75 },
  { r: 122, sw: 13, color: CYAN, drawStart: 0.28, drawEnd: 1.03 },
  { r: 96, sw: 13, color: CYAN, drawStart: 0.56, drawEnd: 1.31 },
];
const DARK_C = { r: 46, sw: 20, drawStart: 1.15, drawEnd: 1.82 };

const LETTER_FONT = "'Varela Round', 'Comfortaa', 'Nunito', sans-serif";

const LETTERS = [
  { char: 'C', x: 198, y: 158, fs: 58, sw: 2.8, color: NAVY, len: 100, delay: 1.85 },
  { char: 'o', x: 252, y: 158, fs: 58, sw: 2.6, color: NAVY, len: 78, delay: 1.98 },
  { char: 'r', x: 300, y: 158, fs: 58, sw: 2.6, color: NAVY, len: 58, delay: 2.10 },
  { char: 'e', x: 338, y: 158, fs: 58, sw: 2.6, color: NAVY, len: 72, delay: 2.21 },
  { char: 'N', x: 388, y: 158, fs: 58, sw: 2.8, color: NAVY, len: 82, delay: 2.32 },
  { char: 'e', x: 442, y: 158, fs: 58, sw: 2.6, color: NAVY, len: 72, delay: 2.43 },
  { char: 't', x: 488, y: 158, fs: 58, sw: 2.5, color: NAVY, len: 48, delay: 2.54 },
  { char: 'P', x: 468, y: 218, fs: 46, sw: 2.6, color: CYAN, len: 68, delay: 2.68 },
  { char: 'a', x: 518, y: 218, fs: 46, sw: 2.5, color: CYAN, len: 76, delay: 2.78 },
  { char: 'y', x: 568, y: 218, fs: 46, sw: 2.5, color: CYAN, len: 68, delay: 2.88 },
];

const HOLD_END = 3.4;
const FADE_END = 3.85;
const TOTAL = 4.2;

const TestLogoLoader = () => {
  const darkCLen = arcLen(DARK_C.r);

  const arcKeyframes = ARCS.map(({ r, drawStart, drawEnd }) => {
    const len = arcLen(r);
    return `
      @keyframes arc-r${r} {
        ${pct(0)}           { stroke-dashoffset: ${len.toFixed(1)}; opacity: 0; }
        ${pct(drawStart)}   { stroke-dashoffset: ${len.toFixed(1)}; opacity: 1; }
        ${pct(drawEnd)}     { stroke-dashoffset: 0; opacity: 1; }
        ${pct(HOLD_END)}    { stroke-dashoffset: 0; opacity: 1; }
        ${pct(FADE_END)}    { stroke-dashoffset: 0; opacity: 0; }
        100%                { stroke-dashoffset: ${len.toFixed(1)}; opacity: 0; }
      }
    `;
  }).join('\n');

  const letterKeyframes = LETTERS.map(({ len, delay }, i) => `
    @keyframes letter-${i} {
      ${pct(0)}              { stroke-dashoffset: ${len}; opacity: 0; }
      ${pct(delay)}          { stroke-dashoffset: ${len}; opacity: 1; }
      ${pct(delay + 0.22)}   { stroke-dashoffset: 0; opacity: 1; }
      ${pct(HOLD_END)}       { stroke-dashoffset: 0; opacity: 1; }
      ${pct(FADE_END)}       { stroke-dashoffset: 0; opacity: 0; }
      100%                   { stroke-dashoffset: ${len}; opacity: 0; }
    }
  `).join('\n');

  return (
    <div
      className="min-h-screen d-flex align-items-center justify-content-center"
      style={{ background: '#f0f4f8', minHeight: '100vh' }}
    >
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Varela+Round&family=Comfortaa:wght@400;600&display=swap"
      />
      <style>{`
        @keyframes arc-darkC {
          ${pct(0)}                { stroke-dashoffset: ${darkCLen.toFixed(1)}; opacity: 0; }
          ${pct(DARK_C.drawStart)} { stroke-dashoffset: ${darkCLen.toFixed(1)}; opacity: 1; }
          ${pct(DARK_C.drawEnd)}   { stroke-dashoffset: 0; opacity: 1; }
          ${pct(HOLD_END)}         { stroke-dashoffset: 0; opacity: 1; }
          ${pct(FADE_END)}         { stroke-dashoffset: 0; opacity: 0; }
          100%                     { stroke-dashoffset: ${darkCLen.toFixed(1)}; opacity: 0; }
        }

        @keyframes dot-in {
          ${pct(0)}        { opacity: 0; transform: scale(0); }
          ${pct(1.90)}     { opacity: 0; transform: scale(0); }
          ${pct(2.10)}     { opacity: 1; transform: scale(1.2); }
          ${pct(2.22)}     { opacity: 1; transform: scale(1); }
          ${pct(HOLD_END)} { opacity: 1; transform: scale(1); }
          ${pct(FADE_END)} { opacity: 0; transform: scale(0); }
          100%             { opacity: 0; transform: scale(0); }
        }

        ${arcKeyframes}
        ${letterKeyframes}

        .arc-anim {
          fill: none;
          animation-duration: ${TOTAL}s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }

        .letter-anim {
          fill: none;
          font-family: ${LETTER_FONT};
          stroke-linecap: round;
          stroke-linejoin: round;
          paint-order: stroke fill;
          animation-duration: ${TOTAL}s;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          animation-iteration-count: infinite;
          animation-fill-mode: both;
        }

        .dot-anim {
          transform-origin: ${CX - 18}px ${CY}px;
          animation: dot-in ${TOTAL}s cubic-bezier(0.34, 1.56, 0.64, 1) infinite both;
        }
      `}</style>

      <div style={{ padding: '48px', background: 'white', borderRadius: '24px', boxShadow: '0 8px 40px rgba(13,43,78,0.10)' }}>
        <svg
          viewBox="0 0 680 240"
          width="680"
          height="240"
          style={{ maxWidth: '90vw', height: 'auto', display: 'block' }}
          aria-label="CoreNet Pay loading"
        >
          <g transform={`translate(${CX}, 0) scale(-1, 1) translate(${-CX}, 0)`}>
          {ARCS.map(({ r, sw, color }) => (
            <path
              key={`arc-${r}`}
              d={makePath(r)}
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
              className="arc-anim"
              style={{
                strokeDasharray: arcLen(r).toFixed(1),
                strokeDashoffset: arcLen(r).toFixed(1),
                animationName: `arc-r${r}`,
              }}
            />
          ))}

          <path
            d={makePath(DARK_C.r)}
            stroke={NAVY}
            strokeWidth={DARK_C.sw}
            strokeLinecap="round"
            fill="none"
            className="arc-anim"
            style={{
              strokeDasharray: darkCLen.toFixed(1),
              strokeDashoffset: darkCLen.toFixed(1),
              animationName: 'arc-darkC',
            }}
          />
          </g>

          <circle
            cx={CX - 18}
            cy={CY}
            r={9.5}
            fill={CYAN}
            className="dot-anim"
            style={{ opacity: 0 }}
          />

          {LETTERS.map(({ char, x, y, fs, sw, color, len }, i) => (
            <text
              key={`letter-${i}`}
              x={x}
              y={y}
              fontSize={fs}
              fontFamily={LETTER_FONT}
              stroke={color}
              strokeWidth={sw}
              fill="none"
              className="letter-anim"
              style={{
                strokeDasharray: len,
                strokeDashoffset: len,
                animationName: `letter-${i}`,
              }}
            >
              {char}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default TestLogoLoader;
