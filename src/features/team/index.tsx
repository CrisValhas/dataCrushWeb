import { PageHeader } from '../../components/layout/PageHeader';

export function Team() {
  const members = [
    { email: 'ana@example.com', role: 'admin' },
    { email: 'luis@example.com', role: 'editor' },
  ];
  return (
    <div>
      <PageHeader title="Equipo" />
      <div className="flex gap-2 mb-3">
        <input placeholder="email@empresa.com" />
        <select><option>admin</option><option>editor</option><option>viewer</option></select>
        <button>Invitar</button>
      </div>
      <table className="w-full text-sm bg-white rounded border">
        <thead><tr className="text-left"><th className="p-2">Miembro</th><th>Rol</th></tr></thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.email} className="border-t"><td className="p-2">{m.email}</td><td>{m.role}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
