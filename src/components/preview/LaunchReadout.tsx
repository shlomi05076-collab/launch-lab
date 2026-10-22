/**
 * Static preview of a guided result on the landing page. The numbers are the engine's output for
 * the online-store example ($5,000 over 2 months, every answer "not sure"), shown in the same
 * plain words as the real results screen. Hand-drawn SVG; the live result is at /idea.
 */

const WEEKS = 8;
const likely = [0, 6, 14, 24, 35, 47, 61, 76];
const downside = likely.map((v) => Math.round(v * 0.53));
const upside = likely.map((v) => Math.round(v * 1.71));
const NEEDED = 100;

const numbers = [
  { label: "Customers you'd likely get", value: "76", note: "40 ↔ 130" },
  { label: "Needed to earn it back", value: "100", note: "within a year" },
  { label: "Chance to earn it back", value: "29%", note: "within a year" },
];

const rows = [
  {
    label: "Visitors who add something to their cart",
    typical: "similar stores: 1 in 20",
    needed: "at least 1 in 14",
    status: "Rarely seen",
    tone: "text-risk",
    mattersMost: true,
  },
  {
    label: "Cost per visitor from ads",
    typical: "similar stores: $1.15",
    needed: "at most $0.78",
    status: "Needs above-typical results",
    tone: "text-warning",
    mattersMost: false,
  },
  {
    label: "Price",
    typical: "similar stores: $66–$130",
    needed: "at least $125",
    status: "Needs above-typical results",
    tone: "text-warning",
    mattersMost: false,
  },
];

const W = 560;
const H = 170;
const PAD = { top: 14, right: 70, bottom: 22, left: 34 };
const Y_MAX = 140;
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
    <figure className="flex flex-col gap-5">
      <figcaption className="flex flex-col gap-2">
        <span className="label">Example result · an online store · $5,000 over 2 months</span>
        <p className="text-lg leading-snug text-pretty">
          You&apos;d likely get 40–130 customers. To earn that back within a year you&apos;d need
          about 100, so roughly <span className="figures text-accent-ink">1 in 14</span> visitors
          would have to add something to their cart; similar stores usually get 1 in 20.
        </p>
      </figcaption>

      <dl className="grid grid-cols-3 gap-px border-y border-rule">
        {numbers.map((n) => (
          <div key={n.label} className="flex flex-col gap-1 py-3 pr-2">
            <dt className="label">{n.label}</dt>
            <dd className="figures text-2xl leading-none font-medium">{n.value}</dd>
            <dd className="figures text-xs text-ink-muted">{n.note}</dd>
          </div>
        ))}
      </dl>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Customers over the 8-week launch: likely 76, downside 40, upside 130. About 100 are needed to earn back the spend."
      >
        {[0, 50, 100].map((tick) => (
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
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(NEEDED)}
          y2={y(NEEDED)}
          className="stroke-ink"
          strokeDasharray="3 3"
        />
        <text
          x={W - PAD.right + 8}
          y={y(NEEDED)}
          dominantBaseline="middle"
          className="figures fill-ink text-[10px]"
        >
          needed
        </text>
        <path d={band} className="fill-ink opacity-[0.07]" />
        <path d={line(likely)} className="fill-none stroke-ink" strokeWidth={1.5} />
        <circle cx={x(last)} cy={y(likely[last] ?? 0)} r={3} className="fill-ink" />
        <text
          x={x(last) + 8}
          y={y(likely[last] ?? 0)}
          dominantBaseline="middle"
          className="figures fill-ink-muted text-[10px]"
        >
          likely
        </text>
      </svg>

      <ul className="flex flex-col">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex flex-col gap-0.5 border-b border-rule py-2 last:border-b-0"
          >
            <span className={`text-sm ${r.mattersMost ? "text-accent-ink" : ""}`}>
              {r.label}
              {r.mattersMost && <span className="label ml-2 text-accent-ink">◀ matters most</span>}
            </span>
            <span className="figures flex flex-wrap gap-x-3 text-xs text-ink-muted">
              <span>{r.typical}</span>
              <span className="text-ink">needed {r.needed}</span>
              <span className={r.tone}>{r.status}</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
