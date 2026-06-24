import type {ReactNode} from 'react';

type ScreenHeaderProps = {
  title: string;
  description?: string;
  trailing?: ReactNode;
  className?: string;
};

export function ScreenHeader({
  className,
  description,
  title,
  trailing,
}: ScreenHeaderProps) {
  const classes = ['ui-screen-header', className].filter(Boolean).join(' ');

  return (
    <header className={classes}>
      <div>
        <h1 className="ui-screen-header-title">{title}</h1>
        {description ? (
          <p className="ui-screen-header-description">{description}</p>
        ) : null}
      </div>
      {trailing ? <div className="ui-screen-header-trailing">{trailing}</div> : null}
    </header>
  );
}
