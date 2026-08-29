export default function Skeleton() {
  return (
    <div className="stack">
      <div className="card skeleton-card">
        <div className="skeleton-line" style={{ width: '55%', height: 20 }} />
        <div className="skeleton-line" style={{ width: '35%', height: 13, marginTop: 10 }} />
        <div className="skeleton-line" style={{ width: '45%', height: 16, marginTop: 16 }} />
      </div>
      <div className="card skeleton-card">
        <div className="skeleton-line" style={{ width: '40%', height: 13 }} />
        <div className="skeleton-line" style={{ width: '70%', height: 22, marginTop: 10 }} />
      </div>
    </div>
  );
}
