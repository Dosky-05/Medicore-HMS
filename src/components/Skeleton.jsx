export default function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, flexShrink: 0, ...style }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-card">
      <Skeleton width={48} height={48} radius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton width="50%" height={28} radius={6} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 3 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} style={{ padding: '14px 16px' }}>
          <Skeleton height={14} width={c === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  ));
}
