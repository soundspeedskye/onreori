import type {HTMLAttributes} from 'react';

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'brand' | 'action';
};

export function Chip({
  children,
  className,
  tone = 'brand',
  ...props
}: ChipProps) {
  const classes = ['ui-chip', `ui-chip-${tone}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}
