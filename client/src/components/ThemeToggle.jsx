import { useTheme } from '../context/ThemeToggleContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant rounded-full p-2 transition-transform duration-300 hover:rotate-180 cursor-pointer"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="material-symbols-outlined">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  )
}

export default ThemeToggle
