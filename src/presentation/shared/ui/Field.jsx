import { useId } from 'react';
export function Field({ label, error, hint, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        {children}
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error || hint ? `${id}-help` : undefined}
          {...props}
        />
      </div>
      {(error || hint) && (
        <span
          id={`${id}-help`}
          className={error ? 'field-error' : 'field-hint'}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}
