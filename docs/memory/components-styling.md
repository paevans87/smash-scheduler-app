# Components & Styling

## UI Component Library

Uses **shadcn/ui** built on **Radix UI** primitives.

### Available Components
Located in `src/components/ui/`:
- `button.tsx` - Button variants (default, outline, ghost, etc.)
- `card.tsx` - Card container
- `input.tsx` - Text input
- `label.tsx` - Form labels
- `badge.tsx` - Status badges
- `dialog.tsx` - Modal dialogs
- `select.tsx` - Dropdown select
- `checkbox.tsx` - Checkbox input
- `slider.tsx` - Range slider
- `accordion.tsx` - Collapsible sections
- `alert-dialog.tsx` - Confirmation dialogs
- `popover.tsx` - Popover containers
- `calendar.tsx` - Date picker calendar
- `avatar.tsx` - User avatars
- `tooltip.tsx` - Hover tooltips
- `dropdown-menu.tsx` - Context menus
- `separator.tsx` - Visual dividers
- `switch.tsx` - Toggle switch

### Usage Pattern
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Button variant="outline" size="sm">
  Click me
</Button>
```

## Styling with Tailwind v4

Uses Tailwind CSS v4 with custom theme.

### Theme Configuration
In `globals.css`:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... */
}
```

**IMPORTANT**: Do NOT put `--spacing-*`, `--shadow-*`, or `--transition-*` in `@theme inline`. These override defaults.

### CSS Variables (globals.css)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... */
}
```

### Common Utility Classes

**Layout:**
- `container` - Max-width container
- `flex`, `grid` - Layout modes
- `gap-4`, `space-y-4` - Spacing
- `p-6`, `m-4` - Padding/margin

**Typography:**
- `text-3xl`, `text-sm` - Font sizes
- `font-bold`, `font-medium` - Font weights
- `text-muted-foreground` - Secondary text color
- `tracking-tight` - Letter spacing

**Colors:**
- `bg-primary`, `text-primary` - Primary color
- `bg-secondary`, `text-secondary` - Secondary
- `bg-muted`, `text-muted` - Muted
- `bg-destructive`, `text-destructive` - Error/danger
- `border-primary` - Border colors

**Interactive:**
- `hover:bg-muted` - Hover state
- `disabled:opacity-50` - Disabled state
- `cursor-pointer`
- `transition-colors`

**Sizing:**
- `w-full`, `h-full` - Full size
- `min-h-screen` - Minimum height
- `max-w-2xl` - Max width

## Component Patterns

### Card Pattern
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Form Pattern
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input
      id="name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      required
    />
  </div>
  <Button type="submit">Save</Button>
</form>
```

### Loading State
```tsx
{isLoading ? (
  <div className="text-center py-12">Loading...</div>
) : (
  <DataDisplay />
)}
```

### Empty State
```tsx
{data.length === 0 && (
  <div className="text-center py-12 text-muted-foreground">
    No items yet.
  </div>
)}
```

## Custom Components

### Side Navigation
File: `src/components/side-nav.tsx`

Features:
- Collapsible (w-16 or w-60)
- Current page highlighting
- Tooltips when collapsed
- Switch club link
- User profile menu

### Offline Indicator
File: `src/components/offline-indicator.tsx`

Shows banner when offline with sync status.

### Profile Menu
File: `src/components/profile-menu.tsx`

Dropdown with:
- User email display
- Switch clubs link
- Sign out

## Design Principles

1. **No custom CSS files** - Use Tailwind only
2. **Server components by default** - Use "use client" only when needed
3. **Consistent spacing** - Use Tailwind scale (4 = 1rem)
4. **Accessible** - shadcn/ui components are WCAG compliant
5. **Responsive** - Mobile-first with sm:, md:, lg: prefixes

## Adding New shadcn Components

```bash
npx shadcn@latest add [component-name]
```

Example: `npx shadcn@latest add tabs`

This downloads the component to `src/components/ui/`

## Color Usage Guide

**Primary actions**: `bg-primary text-primary-foreground`
**Secondary actions**: `bg-secondary text-secondary-foreground`
**Destructive actions**: `bg-destructive text-destructive-foreground`
**Ghost buttons**: `hover:bg-muted`
**Disabled**: `disabled:opacity-50`
**Success**: `bg-green-50 text-green-700`
**Warning**: `bg-amber-50 text-amber-700`

## Common Mistakes to Avoid

1. ❌ Don't use arbitrary values: `w-[100px]`
   ✅ Use standard: `w-24`

2. ❌ Don't add custom colors inline
   ✅ Use CSS variables in globals.css

3. ❌ Don't use !important
   ✅ Adjust specificity or use cn() utility

4. ❌ Don't use style prop
   ✅ Use Tailwind classes

5. ❌ Don't create one-off components
   ✅ Use shadcn/ui primitives
