function Placeholder({ title }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-4">
      <div className="text-center max-w-md bg-glass border border-glass-border rounded-xl shadow-glass p-8">
        <h1 className="text-3xl font-bold mb-4 text-violet-500">{title}</h1>
        <p className="text-slate-300">Coming soon.</p>
      </div>
    </div>
  )
}

export default Placeholder
