// Labeled form field wrapper that standardizes the label + control layout
// used across every form in the app.
//
//   <Field label="Email" htmlFor="email">
//     <input id="email" ... />
//   </Field>
export default function Field({ label, htmlFor, hint, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && <p className="m-0 text-xs text-muted">{hint}</p>}
    </div>
  )
}