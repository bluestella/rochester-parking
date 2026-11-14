'use client';

import { Deck, EmptyState, Meter, Page, PageHeader, PlateTag, SlotBay, Stat, StatStrip, StatusBadge } from '@/components/ds';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Inbox } from 'lucide-react';

const colours = [
  { token: 'background', name: 'Concrete', use: 'Page surface' },
  { token: 'card', name: 'Paper', use: 'Raised surfaces, tables, inputs' },
  { token: 'foreground', name: 'Ink', use: 'Body text' },
  { token: 'primary', name: 'Deck green', use: 'Primary actions, links' },
  { token: 'sidebar', name: 'Pillar', use: 'Navigation column' },
  { token: 'line', name: 'Painted line', use: 'Parking markings and “you are here” only' },
  { token: 'asphalt', name: 'Asphalt', use: 'Deck map surface' },
  { token: 'muted', name: 'Kerb', use: 'Quiet fills, meter tracks' },
];
const tones = ['success', 'warning', 'danger', 'info'] as const;
const statuses = ['paid', 'partial', 'overdue', 'unpaid', 'void', 'pending', 'approved', 'rejected', 'open', 'in_progress', 'on_hold', 'resolved', 'expected', 'arrived', 'departed', 'urgent'];

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-6">
      <h2 className="type-title">{title}</h2>
      <p className="mb-4 mt-1 max-w-[70ch] text-sm text-muted-foreground">{note}</p>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <Page>
      <PageHeader
        title="Design system"
        description="The parts every screen is built from. Tokens live in src/app/globals.css, components in src/components/ds, and the rules in docs/design-system.md."
      />
      <div className="space-y-8">
        <Section title="Colour" note="Drawn from the parking deck. Use the token, never a raw hex or a Tailwind palette colour, so both themes stay correct.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colours.map((c) => (
              <li key={c.token} className="overflow-hidden rounded-lg border bg-card">
                <div className="h-14 border-b" style={{ background: `var(--${c.token})` }} />
                <div className="p-2.5 text-sm">
                  <p className="font-semibold">{c.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">--{c.token}</p>
                  <p className="mt-1 text-xs">{c.use}</p>
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tones.map((t) => (
              <li key={t} className="rounded-lg border p-2.5 text-sm" style={{ background: `var(--${t === 'danger' ? 'danger' : t}-subtle)`, color: `var(--${t === 'danger' ? 'destructive' : t})` }}>
                <p className="font-semibold capitalize">{t}</p>
                <p className="font-mono text-xs">text-{t} on bg-{t}-subtle</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Type" note="Barlow for reading, Barlow Condensed for titles, figures and anything stencilled. Both come from road signs and licence plates.">
          <div className="space-y-4 rounded-lg border bg-card p-5">
            <div><p className="type-display">Dues and billing</p><p className="font-mono text-xs text-muted-foreground">type-display: page titles, one per page</p></div>
            <div><p className="type-title">Waiting for confirmation</p><p className="font-mono text-xs text-muted-foreground">type-title: section headings</p></div>
            <div><p className="type-numeral text-3xl">₱18,450.00</p><p className="font-mono text-xs text-muted-foreground">type-numeral: money and counts, tabular figures</p></div>
            <div><p className="type-stencil">P1-A07 · K7M2QX</p><p className="font-mono text-xs text-muted-foreground">type-stencil: slot codes, pass codes, plates</p></div>
            <div><p className="max-w-[65ch]">Body text is Barlow at 16px on phones and 14px in dense tables. Keep lines under about 70 characters and write in sentence case.</p><p className="font-mono text-xs text-muted-foreground">default body</p></div>
          </div>
        </Section>

        <Section title="Status" note="One map (components/ds/status-badge.tsx) decides the colour of every state, so “pending” looks the same on a payment, a booking and a visitor. Colour is never the only signal: the label always says the state.">
          <div className="flex flex-wrap gap-2">{statuses.map((s) => <StatusBadge key={s} status={s} />)}</div>
        </Section>

        <Section title="Parking" note="The one place the system is allowed to be loud. Bays are drawn as painted on the deck; plates stay light in both themes because plates do.">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <PlateTag plate="NGA 4821" />
            <PlateTag plate="ABC 1234" size="sm" />
          </div>
          <Deck className="max-w-xl">
            <SlotBay slot={{ slotCode: 'P1-A01', isOccupied: true, currentVehicle: 'NGA 4821' }} />
            <SlotBay slot={{ slotCode: 'P1-A02', isOccupied: false }} />
            <SlotBay slot={{ slotCode: 'P1-A03', isOccupied: false, type: 'assigned', assignedTo: '12A' }} />
            <SlotBay slot={{ slotCode: 'P1-A04', isOccupied: false, type: 'pwd' }} />
            <SlotBay slot={{ slotCode: 'P1-A05', isOccupied: false, type: 'motorcycle' }} />
          </Deck>
        </Section>

        <Section title="Figures" note="Related numbers share one bordered strip instead of separate cards. A meter always sits beside the figure it illustrates.">
          <StatStrip>
            <Stat label="Billed, November 2026" value="₱412,300.00" hint="48 statements" />
            <Stat label="Collected" value="₱301,150.00" hint={<span className="mt-1.5 block"><Meter value={73} tone="success" label="Collection rate" /><span className="mt-1 block">73% of billed</span></span>} />
            <Stat label="Overdue" value="₱56,200.00" tone="danger" />
          </StatStrip>
        </Section>

        <Section title="Actions" note="One filled button per view, named for what it does (“Record payment”, not “Submit”). The toast repeats the same verb in the past tense.">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Record payment</Button>
            <Button variant="outline">Export CSV</Button>
            <Button variant="secondary">Search</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Void statement</Button>
            <Badge variant="line">3</Badge>
          </div>
        </Section>

        <Section title="Forms" note="Every create and edit dialog is a FormDialog: a list of field definitions. Labels sit above fields, optional fields say so, and hints explain consequences.">
          <div className="grid max-w-md gap-1.5">
            <Label htmlFor="ds-example">Floor area (sqm)</Label>
            <Input id="ds-example" defaultValue="42" />
            <p className="text-xs text-muted-foreground">Monthly dues are floor area × the rate per sqm.</p>
          </div>
        </Section>

        <Section title="Empty and error states" note="Say what belongs here and what to do next. Errors state what happened and offer a retry; they do not apologise.">
          <EmptyState icon={Inbox} title="No statements for November 2026" action={<Button>Issue statements</Button>}>
            Issue statements to bill every active unit its dues and parking fees for the month.
          </EmptyState>
        </Section>
      </div>
    </Page>
  );
}
