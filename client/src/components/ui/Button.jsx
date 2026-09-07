// Shared button with consistent styling. Maps a semantic variant to the
// consolidated `.btn-*` design-system classes defined in index.css.
//
//   <Button variant="primary" size="sm" onClick={...} disabled>Label</Button>
//   variant: primary | secondary | danger | ghost  (default: primary)
//   size:    sm | md | lg                              (default: md)
//
// Accepts any extra props (type, aria-*, disabled, onClick) which are spread
// onto the underlying <button>. `renderAs` can be used to render a Link/`a`
// instead: pass a component and (for links) `to`/`href` via props.
export default function Button({
  variant = 'primary',
  size = 'md',
  renderAs,
  className = '',
  ...rest
}) {
  const Tag = renderAs || 'button'
  const classes = `btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${className}`.trim()
  return <Tag className={classes} {...rest} />
}