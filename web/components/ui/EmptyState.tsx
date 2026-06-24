type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({className, description, title}: EmptyStateProps) {
  const classes = ['ui-empty-state', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <h2 className="ui-empty-state-title">{title}</h2>
      {description ? (
        <p className="ui-empty-state-description">{description}</p>
      ) : null}
    </div>
  );
}
