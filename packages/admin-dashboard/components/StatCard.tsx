// Chaos Creatures Admin Dashboard — Stat Card Component
// TODO: Implement metric display card in Wave 2

export default function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
