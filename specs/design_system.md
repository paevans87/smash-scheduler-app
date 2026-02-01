# SmashScheduler Design System

## Overview
SmashScheduler is a mobile-first badminton session management app. The design prioritises speed, clarity, and efficiency for club organisers managing sessions in real-time. The visual language should feel modern, sporty, and energetic whilst maintaining professional functionality.

---

## Design Principles

### 1. Speed First
- Actions should require minimal taps
- Critical information visible at a glance
- Fast access to matchmaking (primary use case)

### 2. Clarity Over Complexity
- Clear visual hierarchy
- Single-purpose screens
- Unambiguous action buttons

### 3. Real-Time Feedback
- Immediate visual confirmation of actions
- Loading states for async operations
- Clear error messaging

### 4. Touch-Optimised
- Minimum touch target: 44×44 points
- Thumb-friendly navigation
- Swipe gestures for common actions

---

## Component Library

### .NET MAUI Foundation
- **Base Framework**: .NET MAUI standard controls
- **Enhanced Controls**: CommunityToolkit.Maui
- **Icons**: Material Design Icons or SF Symbols
- **Animations**: CommunityToolkit.Maui animations

### Custom Components Required
1. **PlayerCard** - Displays player info with skill level badge
2. **MatchCard** - Shows court assignment and player list
3. **CourtDisplay** - Visual representation of court layout
4. **SkillLevelPicker** - 1-10 slider with visual feedback
5. **SessionStateIndicator** - Draft/Active/Complete badge

---

## Colour Palette (UK Spelling)

### Primary Colours
```
Primary (Badminton Green):
- Primary-500: #2ECC71 (Main brand colour)
- Primary-600: #27AE60 (Hover/Active)
- Primary-700: #229954 (Pressed)

Accent (Court Blue):
- Accent-500: #3498DB (Secondary actions)
- Accent-600: #2980B9 (Hover)
- Accent-700: #2471A3 (Pressed)
```

### Semantic Colours
```
Success: #27AE60 (Match completed, session active)
Warning: #F39C12 (Draft mode, pending actions)
Error: #E74C3C (Validation errors, blacklist violations)
Info: #3498DB (Informational messages)
```

### Neutral Colours
```
Background:
- Surface: #FFFFFF (Cards, sheets)
- Background: #F8F9FA (App background)
- Elevated: #FFFFFF with shadow

Text:
- Primary: #2C3E50 (Headings, primary text)
- Secondary: #7F8C8D (Supporting text)
- Tertiary: #BDC3C7 (Disabled, placeholders)
- Inverse: #FFFFFF (Text on dark backgrounds)

Borders:
- Default: #E8ECEF
- Focus: #3498DB
- Error: #E74C3C
```

### Skill Level Gradient
```
Level 1-3 (Beginner): #E74C3C → #EC7063
Level 4-6 (Intermediate): #F39C12 → #F8C471
Level 7-10 (Advanced): #27AE60 → #52BE80
```

---

## Typography

### Font Family
```
Primary: System Default
- iOS: SF Pro
- Android: Roboto
```

### Type Scale
```
Display Large: 34pt / Bold / -0.5% tracking
Display Medium: 28pt / Bold / -0.5% tracking

Heading 1: 24pt / Semibold / -0.3% tracking
Heading 2: 20pt / Semibold / -0.3% tracking
Heading 3: 18pt / Semibold / 0% tracking

Body Large: 17pt / Regular / 0% tracking
Body Medium: 15pt / Regular / 0% tracking
Body Small: 13pt / Regular / 0% tracking

Label Large: 15pt / Medium / 0% tracking
Label Medium: 13pt / Medium / 0% tracking
Label Small: 11pt / Medium / 0.5% tracking

Caption: 12pt / Regular / 0.5% tracking
```

### Text Colour Usage
```
Headings: Text-Primary
Body: Text-Primary
Supporting: Text-Secondary
Captions: Text-Tertiary
```

---

## Spacing System

### Base Unit: 4pt

### Spacing Scale
```
XXS: 4pt (Tight spacing within components)
XS:  8pt (Component internal padding)
S:   12pt (Related elements)
M:   16pt (Default spacing)
L:   24pt (Section spacing)
XL:  32pt (Major sections)
XXL: 48pt (Screen sections)
```

### Layout Margins
```
Screen Edge: 16pt (horizontal)
Card Padding: 16pt (all sides)
List Item Padding: 12pt vertical, 16pt horizontal
Button Padding: 12pt vertical, 24pt horizontal
```

---

## Component Specifications

### Buttons

#### Primary Button
```
Background: Primary-500
Text: White / Label Large / Medium
Padding: 16pt vertical, 32pt horizontal
Border Radius: 12pt
Minimum Width: 120pt
Minimum Height: 48pt

States:
- Default: Primary-500
- Hover: Primary-600
- Pressed: Primary-700
- Disabled: Neutral-200, Text-Tertiary
```

#### Secondary Button
```
Background: Transparent
Border: 2pt solid Primary-500
Text: Primary-500 / Label Large / Medium
Padding: 16pt vertical, 32pt horizontal
Border Radius: 12pt
```

#### Icon Button
```
Size: 44×44pt minimum
Icon Size: 24×24pt
Background: Transparent
Active State: Surface with 10% opacity overlay
```

### Cards

#### Standard Card
```
Background: Surface
Border Radius: 16pt
Shadow: 0 2pt 8pt rgba(0,0,0,0.1)
Padding: 16pt
Margin: 8pt bottom
```

#### Player Card
```
Height: 72pt
Border Radius: 12pt
Display: Avatar (40pt) + Name + Skill Badge
Tap: Navigate to player detail
Swipe Right: Quick edit
Swipe Left: Remove from session
```

#### Match Card
```
Height: Auto (min 96pt)
Border Radius: 12pt
Display: Court Number + 4 Player Slots + Status Badge
Tap: Expand for match details
```

### Form Controls

#### Text Input
```
Height: 48pt
Border: 1pt solid Border-Default
Border Radius: 8pt
Padding: 12pt horizontal
Font: Body Large

States:
- Focus: Border-Focus, 2pt border
- Error: Border-Error with error message below
- Disabled: Background-Neutral-100
```

#### Picker/Dropdown
```
Height: 48pt
Chevron Icon: 24×24pt
Border Radius: 8pt
```

#### Slider (Skill Level)
```
Track Height: 8pt
Thumb Size: 28×28pt
Active Track: Primary-500
Inactive Track: Neutral-300
```

### Navigation

#### Bottom Tab Bar (Primary Navigation)
```
Height: 56pt + safe area
Background: Surface
Shadow: 0 -2pt 8pt rgba(0,0,0,0.1)

Tabs:
- Clubs (Home icon)
- Sessions (Calendar icon)
- Analytics (Chart icon)

Active State: Primary-500 icon + label
Inactive State: Text-Secondary icon + label
```

#### Top Navigation Bar
```
Height: 56pt + safe area
Background: Surface
Title: Heading 3 / Semibold
Back Button: 44×44pt touch target
Actions: Icon buttons 44×44pt
```

### Status Badges

#### Session State Badge
```
Draft: Warning colour, "Draft" label
Active: Success colour, "Active" label
Complete: Text-Secondary colour, "Complete" label

Style:
- Padding: 4pt vertical, 12pt horizontal
- Border Radius: 16pt (pill shape)
- Font: Label Small / Medium
```

#### Skill Level Badge
```
Size: 32×32pt circle
Background: Gradient based on skill level
Text: White / Label Medium / Bold
Border: 2pt white
```

### Lists

#### Standard List Item
```
Height: 64pt minimum
Padding: 12pt vertical, 16pt horizontal
Separator: 1pt Border-Default, inset 16pt left
Tap: Full row interactive
```

#### Swipeable List Item
```
Swipe Right Actions: Green background, edit icon
Swipe Left Actions: Red background, delete icon
Swipe Threshold: 60pt
```

---

## User Flows

### Flow 1: Create Club (First-Time Setup)
```
1. Launch App (Empty State)
   └─> "Create Your First Club" card with illustration
       └─> Tap "Get Started"

2. Club Creation Form
   ├─> Club Name (text input)
   ├─> Default Court Count (picker: 1-10)
   └─> Game Type (segmented control: Singles | Doubles)
       └─> Tap "Create Club"

3. Club Created (Success)
   └─> Navigate to Club Detail
       └─> "Add Players" empty state
```

### Flow 2: Add Players to Club
```
1. Club Detail Screen
   └─> Tap "Add Player" FAB (bottom right)

2. Player Creation Form
   ├─> Name (text input)
   ├─> Skill Level (1-10 slider with live preview)
   ├─> Gender (picker)
   └─> Play Style (picker: Level | Mixed | Open)
       └─> Tap "Save Player"

3. Player Added
   └─> Return to Club Detail
   └─> Player appears in list with skill badge
```

### Flow 3: Create and Run Session (Primary Flow)
```
1. Sessions Tab
   └─> Tap "New Session" button

2. Session Creation (Draft Mode)
   ├─> Date/Time picker (defaults to now)
   ├─> Court Count (defaults to club default, editable)
   └─> Tap "Create Session"

3. Session Draft Screen
   ├─> Empty player roster
   └─> Tap "Add Players"
       ├─> Club roster list with checkboxes
       ├─> Select attending players
       └─> Tap "Add Selected" (X players)

4. Attendance Check
   ├─> Review player list
   ├─> Swipe left to remove no-shows
   └─> Tap "Start Session" button

5. Session Active Screen
   ├─> Court grid showing empty courts
   ├─> Bench list showing all players
   └─> Tap "Generate Matches" FAB

6. Matchmaking in Progress
   └─> Loading indicator (2-5 seconds)
       └─> Algorithm running

7. Matches Generated
   ├─> Court cards populate with player assignments
   ├─> Court 1: [Player A, B, C, D]
   ├─> Court 2: [Player E, F, G, H]
   ├─> Bench: [Player I, J]
   └─> Green checkmark animation

8. During Play
   ├─> Tap match card to expand
   └─> Options:
       ├─> "Complete Match" button
       ├─> "Edit Players" (manual override)
       └─> Record score (optional)

9. Match Completed
   ├─> Match card fades/moves to history
   ├─> Players return to bench
   └─> Generate next round

10. End Session
    └─> Tap "Complete Session" in menu
        └─> Session moves to Complete state
        └─> Analytics summary shown
```

### Flow 4: Manual Override (Secondary Flow)
```
1. Active Session with Generated Matches
   └─> Tap match card

2. Match Detail Sheet
   └─> Tap "Edit Players"

3. Player Selection
   ├─> Current players shown with remove buttons
   ├─> Bench players shown with add buttons
   ├─> Tap to swap players
   └─> Tap "Save Changes"

4. Match Updated
   └─> Match card updates
   └─> "Manual" badge appears
   └─> Override count increments
```

### Flow 5: View Analytics
```
1. Analytics Tab
   ├─> Session List (Recent sessions)
   └─> Tap session

2. Session Analytics
   ├─> Override Rate: 15% (visual gauge)
   ├─> Total Matches: 24
   ├─> Average Play Time per Player
   └─> Player participation breakdown

3. Player Analytics (Future)
   ├─> Top partners
   └─> Win/loss ratios
```

---

## Screen Layouts

### 1. Club List Screen
```
┌─────────────────────────────────┐
│ ←  Clubs               [+]      │ Top Bar
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏸 Riverside Badminton  │   │ Club Card
│  │ 4 courts · Doubles      │   │
│  │ 28 players · 12 sessions│   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🏸 City Sports Club     │   │
│  │ 6 courts · Doubles      │   │
│  │ 45 players · 31 sessions│   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
│  Clubs    Sessions   Analytics  │ Tab Bar
└─────────────────────────────────┘
```

### 2. Session Active Screen (Key Screen)
```
┌─────────────────────────────────┐
│ ←  Session       [⋮] Complete   │ Top Bar
├─────────────────────────────────┤
│ 🟢 Active  |  4 courts  |  ⏱️   │ Status Bar
├─────────────────────────────────┤
│                                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Court 1            [✓]     ┃ │ Match Card
│ ┃ 👤 Alice (7)  👤 Bob (6)   ┃ │ (In Progress)
│ ┃ 👤 Carol (8)  👤 Dave (7)  ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Court 2            [✓]     ┃ │
│ ┃ 👤 Eve (5)    👤 Frank (6) ┃ │
│ ┃ 👤 Grace (5)  👤 Henry (6) ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                 │
│ ──────── Bench (4) ──────────  │ Section Header
│ 👤 Ivy (9)      👤 Jack (4)    │ Bench List
│ 👤 Kate (7)     👤 Leo (6)     │
│                                 │
│                         [⚡]    │ FAB: Generate
└─────────────────────────────────┘
```

### 3. Player Detail Screen
```
┌─────────────────────────────────┐
│ ←  Alice Smith         [Edit]   │ Top Bar
├─────────────────────────────────┤
│         ┌─────────┐             │
│         │   👤    │             │ Avatar
│         │   (7)   │             │ + Skill Badge
│         └─────────┘             │
│                                 │
│ ──────── Details ────────       │
│ Skill Level:        ●●●●●●●○○○  │ Visual Skill
│ Gender:             Female      │
│ Play Style:         Level       │
│                                 │
│ ──────── Blacklists ────────    │
│ Partner Blacklist:              │
│   👤 Bob Jones    [×]           │ Removable
│                                 │
│ Opponent Blacklist:             │
│   (none)                        │
│                                 │
│ [+ Add to Blacklist]            │ Action Button
│                                 │
│ ──────── Statistics ────────    │
│ Games Played:       47          │
│ Sessions:           12          │
│ Avg Play Time:      42 min      │
└─────────────────────────────────┘
```

---

## Animations & Transitions

### Page Transitions
```
Navigation Push: Slide from right (300ms ease-out)
Navigation Pop: Slide to right (250ms ease-in)
Modal Present: Slide up from bottom (300ms ease-out)
Modal Dismiss: Slide down (250ms ease-in)
```

### Micro-interactions
```
Button Tap: Scale 0.95 (100ms ease-out)
Card Tap: Scale 0.98 + shadow reduce (100ms)
List Item Swipe: Follow finger, spring back
Toggle Switch: Slide + colour change (200ms ease-out)
```

### Loading States
```
Matchmaking: Pulsing gradient on FAB + "Generating..." text
Data Loading: Skeleton screens with shimmer effect
Success: Green checkmark scale animation (500ms bounce)
Error: Red shake animation (300ms)
```

### Feedback Animations
```
Match Generated: Green ripple from FAB (800ms)
Match Completed: Card fade out + slide up (400ms)
Player Added: Scale in from 0.8 to 1.0 (300ms bounce)
```

---

## Accessibility Requirements

### Touch Targets
```
Minimum Size: 44×44pt
Recommended: 48×48pt for primary actions
Spacing: 8pt minimum between adjacent targets
```

### Colour Contrast
```
Text on Background: 4.5:1 minimum (WCAG AA)
Large Text (18pt+): 3:1 minimum
Interactive Elements: 3:1 against adjacent colours
```

### Semantic Markup
```
Buttons: Descriptive labels (not just icons)
Form Inputs: Associated labels
Images: Alt text for decorative icons
```

### Keyboard Navigation (External Keyboard Support)
```
Tab Order: Logical top-to-bottom, left-to-right
Focus Indicators: 2pt border in Focus colour
Enter/Space: Activate buttons
Escape: Close modals/sheets
```

### Screen Reader Support
```
Heading Hierarchy: Proper H1-H6 structure
Button Labels: Action + Context ("Complete Match on Court 1")
Status Announcements: "Matchmaking complete, 4 matches generated"
Dynamic Content: Announce changes to session state
```

### Reduced Motion
```
Respect OS Settings: Disable animations if user prefers reduced motion
Alternative Feedback: Use opacity/colour changes instead of movement
Critical Animations: Keep for loading states, disable decorative ones
```

---

## Responsive Behaviour

### Breakpoints
```
Small Phone: < 375pt width
Standard Phone: 375pt - 428pt
Large Phone/Tablet: > 428pt
```

### Layout Adaptations
```
Small: Single column, compact spacing
Standard: Standard layouts as designed
Large: Consider two-column for lists, wider cards
```

### Orientation
```
Portrait: Primary orientation, optimised layouts
Landscape: Graceful degradation, reduce vertical spacing
```

---

## Dark Mode (Future Consideration)

### Colour Adjustments
```
Background: #121212
Surface: #1E1E1E
Elevated: #2C2C2C

Primary: Lighter shade (#48D98E)
Text-Primary: #FFFFFF
Text-Secondary: #B0B0B0
```

### Implementation
```
Respect OS Settings: Auto-switch based on system preference
Override: Allow manual toggle in settings (future)
```

---

## Error States & Empty States

### Empty States
```
Icon: Large (64×64pt) illustrative icon
Heading: Encouraging message
Description: Brief explanation
Action: Primary button with clear CTA

Example (No Players):
"Add Your First Player"
"Build your club roster to start organising sessions"
[+ Add Player]
```

### Error States
```
Icon: Warning/Error icon (48×48pt)
Message: Clear explanation in plain language
Action: Retry button or alternative action
Colour: Error red for icon, Text-Primary for message

Example (Matchmaking Failed):
"Unable to Generate Matches"
"Not enough players to fill courts. Add more players to the session or reduce court count."
[Adjust Courts] [Add Players]
```

### Loading States
```
Skeleton Screens: Use for initial loads
Spinners: Use for quick operations (< 3 seconds)
Progress Bars: Use for determinate operations
Pull-to-Refresh: Standard iOS/Android patterns
```

---

## Component States

### Interactive Component States
```
Default: Base appearance
Hover: Slight brightness increase (desktop/tablet)
Pressed: Scale 0.95, darker shade
Focus: 2pt border in Focus colour
Disabled: 40% opacity, no interaction
Loading: Spinner overlay, disabled interaction
```

### Data States
```
Empty: Empty state illustration + CTA
Loading: Skeleton or spinner
Loaded: Full content display
Error: Error state with retry option
```

---

## Platform-Specific Considerations

### iOS
```
Navigation: Large titles where appropriate
Swipe Back: Full support for edge swipe
Haptics: Use for confirmations and errors
Modals: Use iOS sheet style with drag handle
```

### Android
```
Navigation: Material Design top bar
Back Button: Hardware back button support
Floating Action Button: Material Design style
Modals: Full-screen or bottom sheet
```

---

## Performance Guidelines

### Image Optimisation
```
Format: WebP with PNG fallback
Resolution: 2x and 3x variants
Lazy Loading: Load images as needed
Caching: Cache player avatars locally
```

### Animation Performance
```
60fps Target: All animations
GPU Acceleration: Use transform properties
Reduce Complexity: Limit concurrent animations
```

### List Performance
```
Virtualisation: Use for lists > 20 items
Recycling: Reuse list item templates
Pagination: Load more on scroll (if needed)
```

---

## Implementation Priorities

### Phase 1 (MVP)
1. Core navigation structure
2. Session active screen (primary workflow)
3. Player and club management screens
4. Basic matchmaking display

### Phase 2 (Enhancement)
1. Animations and transitions
2. Empty and error states
3. Analytics visualisations
4. Advanced gestures

### Phase 3 (Polish)
1. Dark mode
2. Accessibility enhancements
3. Micro-interactions
4. Performance optimisations

---

## Design Tokens (For Implementation)

### Spacing Tokens
```csharp
SpacingXXS = 4
SpacingXS = 8
SpacingS = 12
SpacingM = 16
SpacingL = 24
SpacingXL = 32
SpacingXXL = 48
```

### Colour Tokens
```csharp
Primary500 = #2ECC71
Primary600 = #27AE60
Primary700 = #229954

TextPrimary = #2C3E50
TextSecondary = #7F8C8D
TextTertiary = #BDC3C7
```

### Border Radius Tokens
```csharp
RadiusS = 8
RadiusM = 12
RadiusL = 16
RadiusFull = 9999
```

---

## Summary

This design system provides a comprehensive foundation for implementing SmashScheduler's user interface. The focus is on:

1. **Speed** - Minimal taps to key actions
2. **Clarity** - Clear visual hierarchy and feedback
3. **Consistency** - Reusable components and patterns
4. **Accessibility** - WCAG AA compliance
5. **Modern Aesthetic** - Clean, sporty, professional

All specifications use UK English spelling and adhere to the project's coding standards. The designer has prioritised the core session management workflow whilst ensuring scalability for future features.
