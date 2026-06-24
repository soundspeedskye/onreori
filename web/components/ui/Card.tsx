import {createElement, type HTMLAttributes} from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  asButton?: boolean;
  onClick?: () => void;
};

export function Card({
  asButton = false,
  children,
  className,
  onClick,
  ...props
}: CardProps) {
  const classes = ['ui-card', className].filter(Boolean).join(' ');

  if (asButton || onClick) {
    return createElement(
      'button',
      {
        className: classes,
        onClick,
        type: 'button',
        ...props,
      },
      children,
    );
  }

  return createElement(
    'div',
    {
      className: classes,
      ...props,
    },
    children,
  );
}
