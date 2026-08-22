export default function Card({ children, className = '', padding = 'p-6' }) {
  return (
    <div className={`card-tech rounded-tech ${padding} ${className}`}>
      {children}
    </div>
  )
}
