import {createElement, type ButtonHTMLAttributes} from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'brand' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({
  children,
  className,
  disabled = false,
  loading = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const classes = ['ui-button', `ui-button-${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return createElement(
    'button',
    {
      className: classes,
      disabled: isDisabled,
      type,
      ...props,
    },
    loading ? '처리 중' : children,
  );
}
