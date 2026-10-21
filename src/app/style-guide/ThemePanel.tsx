import { LaunchReadout } from "@/components/preview/LaunchReadout";
import { fontNames } from "@/design/fonts";
import { palettes, type ThemeName, tokenRoles } from "@/design/palette";
import { contrastRatio, toOklch } from "@/lib/color";

const minContrast = { text: 4.5, graphic: 3 } as const;

/** One theme of the style guide: type, every color token, and the readout in context. */
export function ThemePanel({ theme }: { theme: ThemeName }) {
  const palette = palettes[theme];

  return (
    <section
      data-theme={theme}
      className="flex flex-col gap-8 bg-bg p-5 text-ink sm:p-8"
      aria-label={`${theme} theme`}
    >
      <header className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <span className="label text-ink">{theme} theme</span>
        <span className="label">Analytical instrument</span>
      </header>

      <div className="flex flex-col gap-4">
        <p className="display text-4xl text-balance sm:text-[2.75rem]">
          Balanced pays back in <span className="text-accent-ink">7 months.</span>
        </p>
        <p className="max-w-prose text-pretty text-ink-muted">
          Cool-gray neutrals with almost no color, so the one ultramarine accent marks the key
          insight on each screen. Green, amber and red are reserved for good, warning and risk.
        </p>
        <p className="figures text-lg">0123456789 · $41,280.50 · −12.4% · 7.1 mo</p>
        <dl className="grid grid-cols-3 gap-3 border-t border-rule pt-3">
          {(
            [
              ["Headings", fontNames.display],
              ["Body", fontNames.body],
              ["Figures", fontNames.mono],
            ] as const
          ).map(([role, name]) => (
            <div key={role} className="flex flex-col gap-1">
              <dt className="label">{role}</dt>
              <dd className="text-sm text-pretty">{name}</dd>
            </div>
          ))}
        </dl>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 xl:grid-cols-5">
        {tokenRoles.map((role) => {
          const hex = palette[role.key];
          const { c } = toOklch(hex);
          const min = role.kind === "surface" ? null : minContrast[role.kind];
          const ratio = contrastRatio(hex, palette.bg);
          return (
            <li key={role.key} className="flex flex-col gap-1">
              <span className="mb-0.5 h-8 border border-rule" style={{ background: hex }} />
              <span className="label text-ink">{role.label}</span>
              <span className="figures text-xs text-ink-muted">
                {hex} · C {c.toFixed(3)}
              </span>
              {min !== null && (
                <span
                  className={`figures text-xs ${ratio >= min ? "text-ink-muted" : "text-risk"}`}
                >
                  {ratio.toFixed(2)}:1 {ratio >= min ? "pass" : "fail"}
                  <span className="sr-only"> (needs {min}:1 on background)</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="border border-rule bg-surface p-4 sm:p-5">
        <LaunchReadout />
      </div>
    </section>
  );
}
