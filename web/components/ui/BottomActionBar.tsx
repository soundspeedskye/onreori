import type {HTMLAttributes} from 'react';

type BottomActionBarProps = HTMLAttributes<HTMLDivElement>;

export function BottomActionBar({
  children,
  className,
  ...props
}: BottomActionBarProps) {
  const classes = ['ui-bottom-action-bar', className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      <div className="ui-bottom-action-bar-inner">{children}</div>
    </div>
  );
}
