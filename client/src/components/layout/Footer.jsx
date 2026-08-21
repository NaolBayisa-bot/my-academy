export default function Footer() {
  return (
    <footer className="bg-white dark:bg-tech-surface border-t border-slate-200 dark:border-tech-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">IS</span>
            </div>
            <span className="text-sm text-slate-400 dark:text-slate-500">
              IS Hub Academy &copy; {new Date().getFullYear()}
            </span>
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-600 font-mono tracking-wider">
            Learn. Build. Innovate.
          </p>
        </div>
      </div>
    </footer>
  )
}
