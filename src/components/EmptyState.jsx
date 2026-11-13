export default function EmptyState({ emoji, title, hint, action }) {
  return (
    <div className="empty" role="status">
      <div className="big" aria-hidden="true">{emoji}</div>
      <h2>{title}</h2>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  );
}
