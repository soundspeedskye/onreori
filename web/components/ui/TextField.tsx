import type {InputHTMLAttributes} from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export function TextField({className, type = 'text', ...props}: TextFieldProps) {
  const classes = ['ui-text-field', className].filter(Boolean).join(' ');

  return <input className={classes} type={type} {...props} />;
}
