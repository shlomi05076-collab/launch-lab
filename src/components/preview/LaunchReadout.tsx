/**
 * Static, illustrative readout used on the landing page and the design specimen.
 * Hand-drawn SVG with fixed numbers. The real charts (d3-scale, live data) arrive in M2.
 */

const WEEKS = 12;
const likely = [0, 18, 41, 70, 102, 137, 171, 206, 240, 272, 303, 331];
const downside = likely.map((v) => Math.round(v * 0.62));
const upside = likely.map((v) => Math.round(v * 1.45));

const funnel = [
  { stage: "Reach → visit", rate: 0.065, kept: "11,260" },
  { stage: "Visit → sign-up", rate: 0.21, kept: "2,365" },
  { stage: "Sign-up → active", rate: 0.5, kept: "1,182" },
  { stage: "Active → paying", rate: 0.28, kept: "331" },
];
const leakIndex = funnel.reduce(
  (min, row, i, rows) => (row.rate < (rows[min]?.rate ?? 1) ? i : min),
  0,
);

const kpis = [
  { label: "Paying users", downside: "205", likely: "331", upside: "480" },
  { label: "Blended CAC", downside: "$61", likely: "$38", upside: "$26" },
  { label: "Payback", downside: "7.4 mo", likely: "4.3 mo", upside: "2.9 mo" },
];

// Chart geometry (viewBox units).
const W = 560;
const H = 200;
const PAD = { top: 12, right: 64, bottom: 24, left: 36 };
const Y_MAX = 500;
const x = (week: number) => PAD.left + (week / (WEEKS - 1)) * (W - PAD.left - PAD.right);
const y = (value: number) => PAD.top + (1 - value / Y_MAX) * (H - PAD.top - PAD.bottom);
const line = (values: number[]) =>
  values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
const band = `${line(upside)} ${downside
  .map((v, i) => [i, v] as const)
  .reverse()
  .map(([i, v]) => `L${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  .join(" ")} Z`;

const last = WEEKS - 1;

export function LaunchReadout() {
  return (
    <figure className="flex flex-col gap-6">
      <figcaption className="flex flex-col gap-2">
        <span className="label">Scenario · Balanced · illustrative</span>
        <p className="text-lg leading-snug text-pretty">
          Balanced likely pays back in <span className="figures text-accent-ink">4.3 months</span>,
          with a 1-in-10 chance it takes longer than 7.
        </p>
      </figcaption>

      <dl className="grid grid-cols-3 gap-px border-y border-rule">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 py-3 pr-2">
            <dt className="label">{kpi.label}</dt>
            <dd className="figures text-2xl leading-none font-medium">{kpi.likely}</dd>
            <dd className="figures text-xs text-ink-muted">
              <span className="sr-only">downside </span>
              {kpi.downside} <span aria-hidden="true">↔</span>
              <span className="sr-only">upside</span> {kpi.upside}
            </dd>
          </div>
        ))}
      </dl>
      <p className="label -mt-4">Large: likely · small: downside ↔ upside</p>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="label">Cumulative paying users</span>
          <span className="label">Weeks 1–12</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label="Cumulative paying users over 12 weeks: likely 331, downside 205, upside 480."
        >
          {[0, 100, 200, 300, 400, 500].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className="stroke-grid"
              />
              <text
                x={PAD.left - 8}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="figures fill-ink-muted text-[10px]"
              >
                {tick}
              </text>
            </g>
          ))}
          {likely.map((_, i) => (
            <line
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static axis
              key={i}
              x1={x(i)}
              x2={x(i)}
              y1={H - PAD.bottom}
              y2={H - PAD.bottom + 4}
              className="stroke-ink-faint"
            />
          ))}
          <path d={band} className="fill-ink opacity-[0.07]" />
          <path d={line(upside)} className="fill-none stroke-ink-faint" strokeDasharray="2 3" />
          <path d={line(downside)} className="fill-none stroke-ink-faint" strokeDasharray="2 3" />
          <path d={line(likely)} className="fill-none stroke-ink" strokeWidth={1.5} />
          <circle cx={x(last)} cy={y(likely[last] ?? 0)} r={3} className="fill-ink" />
          {(
            [
              ["upside", upside[last]],
              ["likely", likely[last]],
              ["downside", downside[last]],
            ] as const
          ).map(([name, value]) => (
            <text
              key={name}
              x={x(last) + 8}
              y={y(value ?? 0)}
              dominantBaseline="middle"
              className={`figures text-[10px] ${name === "likely" ? "fill-ink" : "fill-ink-muted"}`}
            >
              {value} {name}
            </text>
          ))}
        </svg>
      </div>

      <div>
        <span className="label mb-2 block">Drop-off by stage</span>
        <ul className="flex flex-col">
          {funnel.map((row, i) => {
            const isLeak = i === leakIndex;
            return (
              <li
                key={row.stage}
                className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 border-b border-rule py-1.5 last:border-b-0"
              >
                <span className="text-sm text-ink-muted">{row.stage}</span>
                <span className="relative h-1.5 bg-inset">
                  <span
                    className={`absolute inset-y-0 left-0 ${isLeak ? "bg-accent" : "bg-ink"}`}
                    style={{ width: `${row.rate * 100}%` }}
                  />
                </span>
                <span className={`figures text-right text-sm ${isLeak ? "text-accent-ink" : ""}`}>
                  {(row.rate * 100).toFixed(1)}%
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 text-sm text-ink-muted">
          Biggest leak: <span className="text-ink">reach → visit</span>. 93.5% of people reached
          never visit.
        </p>
      </div>
    </figure>
  );
}
