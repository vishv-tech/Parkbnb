import type { ReactNode } from "react";

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
};

type InfoCardProps = {
  title: string;
  children: ReactNode;
};

export function PublicPageShell({ eyebrow, title, intro, children }: PublicPageShellProps) {
  return (
    <main className="safe-bottom">
      <section className="border-b border-[#dbe3df] bg-white">
        <div className="app-shell py-10 sm:py-14">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#28a58b]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-[#11312c] sm:text-5xl">
            {title}
          </h1>
          {intro && <p className="mt-5 max-w-3xl text-lg leading-8 text-[#40514b]">{intro}</p>}
        </div>
      </section>
      <section className="app-shell grid gap-5 py-8 sm:py-10">{children}</section>
    </main>
  );
}

export function InfoCard({ title, children }: InfoCardProps) {
  return (
    <section className="card grid gap-4 p-5 sm:p-7">
      <h2 className="text-2xl font-black text-[#11312c]">{title}</h2>
      <div className="grid gap-4 text-base leading-7 text-[#40514b]">{children}</div>
    </section>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li className="flex gap-3" key={item}>
          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#ff6b4a]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
