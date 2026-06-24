import type {HTMLAttributes} from 'react';

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
    return (
      <button className={classes} onClick={onClick} type="button">
        {children}
      </button>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
