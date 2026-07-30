# Primitives — State Matrix

The contract for every primitive in `components/ui/`. Before introducing any new pattern, consult this table. Before adding a new state, check that the state is documented here.

Every primitive documents these states: **default, hover, pressed, focused, disabled, loading, success, error, empty**. Some states don't apply to some primitives — those rows say "n/a".

| Primitive | default | hover | pressed | focused | disabled | loading | success | error | empty |
|---|---|---|---|---|---|---|---|---|---|
| Button | default variant | bg tint | scale-down (subtle) | ring | 50% opacity, no pointer | spinner, no label change | n/a | destructive variant | n/a |
| Input | empty | border tint | n/a | ring | muted, no cursor | n/a | success icon | destructive icon, ring | n/a |
| Label | medium | n/a | n/a | peer-focused highlight | muted | n/a | n/a | destructive | n/a |
| Card | flat | shadow lift (when interactive) | scale (when interactive) | ring (when interactive) | 50% opacity | skeleton | n/a | destructive border | n/a |
| Badge | default variant | tint | n/a | ring | muted | n/a | success variant | destructive variant | n/a |
| Avatar | fallback initials | n/a | n/a | ring | muted | skeleton | n/a | fallback on img error | n/a |
| Checkbox | unchecked | border tint | checked fill | ring | muted | n/a | checked (success) | destructive variant | n/a |
| Select | placeholder | border tint | n/a | ring | muted | spinner | n/a | destructive icon | n/a |
| Textarea | empty | border tint | n/a | ring | muted | n/a | success icon | destructive icon | n/a |
| Dialog | closed | overlay darkens | n/a | trap focus | n/a | n/a | n/a | n/a | n/a |
| DropdownMenu | closed | bg tint on item | bg stronger on active | ring on trigger | items muted | n/a | n/a | destructive variant for delete | n/a |
| Tooltip | hidden | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Sonner (Toast) | n/a | n/a | n/a | n/a | n/a | default | success variant | destructive variant | info variant |
| Tabs | active pill | underline (when underlined variant) | n/a | ring | muted | n/a | n/a | n/a | n/a |
| Separator | line | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| Switch | off | thumb tint | thumb shift | ring | muted | n/a | n/a | n/a | n/a |
| Skeleton | pulse | n/a | n/a | n/a | muted | pulse | n/a | n/a | n/a |
| Sheet | closed | overlay darkens | n/a | trap focus | n/a | n/a | n/a | n/a | n/a |
| Popover | closed | n/a | n/a | ring on trigger | items muted | n/a | n/a | n/a | n/a |
| RadioGroup | unselected | ring tint | filled dot | ring | muted | n/a | n/a | n/a | n/a |

## Variants

Variants are token-driven; **never add a new variant without approval**.

- **Button**: default, secondary, outline, ghost, destructive, link. Sizes: default, sm, lg, icon.
- **Badge**: default, secondary, outline, destructive, **success** (custom), **warning** (custom).
- **Card**: default (uses `bg-card text-card-foreground`). No variants by design — content inside.

## Composition rules

- Primitives accept `className` for layout positioning only (margin, flex, sizing). They do **not** accept color overrides. If a primitive needs a different color, propose a new variant.
- All primitives use design tokens. Zero raw colors. Verified by `no-restricted-syntax` in `.eslintrc.cjs`.
- All primitives import `cn` from `@/lib/utils`. No other utility imports.
