function NotAuthorized() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 px-4">
      <div className="text-center max-w-md bg-glass border border-glass-border rounded-xl shadow-glass p-8">
        <h1 className="text-3xl font-bold mb-4 text-red-400">Not Authorized</h1>
        <p className="text-slate-300 mb-6">You do not have permission to access this page.</p>
        <a
          href="/"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-violet-500 hover:bg-violet-600 rounded-lg transition-violet"
        >
          Go Home
        </a>
      </div>
    </div>
  )
}

export default NotAuthorized
