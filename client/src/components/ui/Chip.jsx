// Reusable badge/pill. `variant` maps to the .chip-* design-system classes.
//   variant: neutral | cyan | success | warning | danger  (default: neutral)
export default function Chip({
  variant = 'neutral',
  size = 'md',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'chip',
    `chip-${variant}`,
    size === 'sm' ? 'chip-sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} {...rest}>
      {children}
    </span>
  )
}