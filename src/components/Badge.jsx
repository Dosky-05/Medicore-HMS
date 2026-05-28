export default function Badge({ status }) {
  const normalized = status?.toLowerCase().replace(/\s+/g, '-') || '';
  return <span className={`badge badge-${normalized}`}>{status}</span>;
}
