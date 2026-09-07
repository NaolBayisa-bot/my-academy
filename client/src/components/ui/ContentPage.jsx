// Standard maximal page container used by every dashboard page.
// Consolidates the repeated `content-page max-w-[1200px] mx-auto w-full p-6`.
export default function ContentPage({ className = '', children }) {
  return <div className={`content-page ${className}`.trim()}>{children}</div>
}