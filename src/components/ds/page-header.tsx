export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="type-display text-balance">{title}</h1>
        {description && <p className="mt-1 max-w-[65ch] text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/** Standard page gutter and width. Every signed-in page sits inside one. */
export function Page({ children, narrow }: { children: React.ReactNode; narrow?: boolean }) {
  return (
    <div className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${narrow ? 'max-w-3xl' : 'max-w-6xl'}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="type-title">{children}</h2>
      {action}
    </div>
  );
}
