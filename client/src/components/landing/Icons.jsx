// Landing-page icon set.
//
// Inline SVGs rather than emoji on purpose: emoji glyphs are supplied by the
// OS/browser, so they change shape and colour per platform and break brand
// consistency. These are stroke-based, 24x24, and inherit `currentColor`, so
// they take on whatever text colour their container sets.

const ICONS = {
  // ── learning categories ──────────────────────────────────────────
  shield: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  code: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 3.5 9 14 14 0 0 1-3.5 9 14 14 0 0 1-3.5-9A14 14 0 0 1 12 3z" />
    </>
  ),
  palette: (
    <>
      <circle cx="13.6" cy="6.6" r="1.1" />
      <circle cx="17.4" cy="10.4" r="1.1" />
      <circle cx="8.6" cy="7.6" r="1.1" />
      <circle cx="6.6" cy="12.4" r="1.1" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7h2c3 0 5.5-2.5 5.5-5.5C22 6 17.5 2 12 2z" />
    </>
  ),

  // ── bento feature tiles ──────────────────────────────────────────
  instructors: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.7 3 6 3s6-2 6-3v-5" />
      <path d="M22 10v6" />
    </>
  ),
  paths: (
    <>
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
    </>
  ),
  certificate: (
    <>
      <circle cx="12" cy="8" r="6" />
      <path d="m15.5 12.9 1.5 9.1-5-3-5 3 1.5-9.1" />
    </>
  ),
  projects: (
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.1 14a4.6 4.6 0 0 0 1.4-2.5A4.7 4.7 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5A4.6 4.6 0 0 1 8.9 14" />
    </>
  ),
  progress: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 16v-3" />
      <path d="M12 16V9" />
      <path d="M17 16V6" />
    </>
  ),
  community: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),

  // ── misc ─────────────────────────────────────────────────────────
  check: <path d="M20 6 9 17l-5-5" />,
}

/**
 * <Icon name="shield" className="w-6 h-6" />
 *
 * `name` must be one of the keys above; unknown names render nothing rather
 * than throwing, so a typo degrades instead of crashing the page.
 */
export default function Icon({ name, className = 'w-6 h-6', strokeWidth = 1.75 }) {
  const glyph = ICONS[name]
  if (!glyph) return null

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  )
}
