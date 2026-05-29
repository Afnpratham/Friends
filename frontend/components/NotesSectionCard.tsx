type NotesSectionCardProps = {
  title: string;
  children: React.ReactNode;
};

export function NotesSectionCard({ title, children }: NotesSectionCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}
