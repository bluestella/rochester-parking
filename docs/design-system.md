# Design system

A live reference renders at `/admin/design-system`. This file holds the rules.

## Where things live

| What | Where |
| --- | --- |
| Colour, radius and type tokens (light and dark) | `src/app/globals.css` |
| Product name, locale, currency, timezone | `src/lib/brand.ts` |
| Primitives (button, input, dialog, table, badge) | `src/components/ui/` |
| Composites every page uses | `src/components/ds/` |
| Status → colour map | `src/components/ds/status-badge.tsx` |
| Enumerations and their display labels | `src/lib/constants.ts` |
| Money and date formatting | `src/lib/format.ts` |
| Navigation per role | `src/components/layout/nav.ts` |

## Direction

The product runs a building whose most-used surface is its parking deck, so the
visual language comes from there: concrete surfaces, deep signage green for
structure, and painted-line yellow. Type is Barlow (drawn from road signs and
licence plates) with Barlow Condensed for titles, figures and stencilled codes.

Yellow is reserved. It marks parking bays, the current page in the sidebar
("you are here"), and counts that need action. It is never a general accent.

## Colour tokens

Use the Tailwind class for the token (`bg-card`, `text-muted-foreground`,
`text-danger`). Never use a raw hex or a Tailwind palette colour such as
`text-red-600`: it will be wrong in one of the two themes.

| Token | Role |
| --- | --- |
| `background` / `foreground` | Page surface (concrete) and body text (ink) |
| `card` | Raised surfaces: tables, lists, inputs |
| `primary` | The main action on a view, links |
| `muted` / `muted-foreground` | Quiet fills and secondary text |
| `sidebar-*` | The navigation column (dark green in both themes) |
| `line` / `line-foreground` | Painted-line yellow |
| `asphalt` / `asphalt-foreground` | Deck map surface |
| `success`, `warning`, `danger`, `info` (+ `-subtle`) | Status text and its tinted background |

## Type roles

| Utility | Use |
| --- | --- |
| `type-display` | Page title, one per page (`<PageHeader>`) |
| `type-title` | Section headings (`<SectionTitle>`) |
| `type-numeral` | Money and counts; tabular figures |
| `type-stencil` | Slot codes, pass codes, plates |

Sentence case everywhere. No all-caps labels.

## Components

- `Page`, `PageHeader`, `SectionTitle`: page gutter, title, actions.
- `StatStrip` + `Stat`: related figures share one bordered strip, not separate cards. `Meter` sits beside the figure it illustrates and always has a text value.
- `StatusBadge`: pass the raw status string. The map decides the tone, so "pending" looks the same on a payment, a booking and a visitor. Add new states to the map, not to the page.
- `PlateTag`: a licence plate. Light in both themes.
- `SlotBay` + `Deck`: a parking bay as painted, on asphalt.
- `FormDialog`: every create/edit dialog. Describe fields as data; it handles labels, "(optional)", hints, errors, saving state and button order.
- `EmptyState`, `DataState`: empty, loading and error states.
- `NativeSelect`: the platform select, used in forms because guards work on phones.

## Writing

- Buttons say what happens: "Record payment", "Issue statements". The success toast repeats the verb in the past tense: "Payment recorded".
- Name things as residents and staff do: "statement", "dues", "pass code", not "invoice document" or "token".
- Errors say what went wrong and what to do. They do not apologise.
- Empty states say what belongs here and offer the first action.

## Accessibility floor

- Text contrast meets WCAG AA in both themes; status is never colour-only.
- Every control is reachable by keyboard with a visible focus ring; the shell has a skip link.
- Icon-only buttons carry an `aria-label`.
- Layouts work from 360px wide; the sidebar becomes a drawer below `lg`.
- `prefers-reduced-motion` disables transitions.

## Adding a screen

1. Wrap it in `<Page>` with a `<PageHeader>`.
2. Fetch with `useApi`, show `<DataState>` and an `<EmptyState>`.
3. Use `FormDialog` for input and `StatusBadge` for state.
4. Add it to `nav.ts` for the roles that should see it.
