// Reusable site footer shared by the landing page and the dashboard layout.
// Stretches to fill its container width unless a custom className is given;
// parents control placement (e.g. add mt-auto inside a flex column).
function Footer({ className = '' }) {
  return (
    <footer
      className={`site-footer relative z-[1] w-[min(1200px,calc(100%-48px))] mx-auto py-8 flex items-center justify-between border-t border-[rgba(148,175,211,0.15)] ${className}`}
    >
      <div className="footer-brand flex items-center gap-2.5">
        <div className="brand-mark small bg-gradient-to-br from-cyan-default to-cyan-strong text-[#021522] font-black text-[0.66rem] rounded-lg grid place-items-center w-5 h-5">
          IS
        </div>
        <span className="text-sm text-muted">IS Hub Academy © 2026</span>
      </div>

      <div className="footer-tagline text-sm text-muted">Learn. Build. Innovate.</div>
    </footer>
  )
}

export default Footer
