import { Link } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-tech-card border border-slate-200 dark:border-tech-border rounded-tech flex items-center justify-center mx-auto mb-4">
          <span className="text-lg font-mono font-bold text-slate-400 dark:text-slate-500">
            404
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-mono">
          The page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button variant="secondary">Go Home</Button>
        </Link>
      </Card>
    </div>
  )
}
