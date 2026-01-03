# Design Guidelines: Sports Organization Lead Generation & CRM System

## Design Approach

**Selected Framework:** Material Design / Fluent Design hybrid
**Rationale:** Data-heavy B2B application requiring efficient information display, robust search functionality, and clear workflow patterns. Focus on productivity and usability over visual storytelling.

---

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts)
- **Headings:** 600 weight, sizes: text-3xl (dashboards), text-xl (section headers), text-lg (card titles)
- **Body:** 400 weight, text-base for content, text-sm for metadata/captions
- **Data/Numbers:** 500 weight, tabular-nums for consistent alignment

### Layout System
**Spacing Units:** Tailwind 2, 4, 6, 8, 12 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Page margins: p-8 to p-12
- Card spacing: p-6 internal, gap-4 between elements

**Grid Structure:**
- Sidebar navigation: 64-72px collapsed, 240-280px expanded
- Main content: max-w-7xl with responsive padding
- Data tables: Full width with horizontal scroll on mobile

---

## Component Library

### Navigation
**Sidebar (Primary):**
- Fixed left position with collapsible functionality
- Icon-first design (collapsed state)
- Grouped menu items: Dashboard, Search, Leads, Meetings, Reports
- Active state with subtle accent indicator

**Top Bar:**
- Search bar (center/left-aligned) with autocomplete
- Filter quick-access buttons
- User profile and notifications (right-aligned)

### Search Interface
**Advanced Search Panel:**
- Segmented control for sport types (Society/Futsal/Field)
- Multi-select dropdowns for: Organization type, Location, Status
- Date range picker for event/championship dates
- Tag-based filter chips showing active filters
- "Clear All" and "Save Search" actions

**Search Results:**
- Card-based layout (not table) for preview richness
- Each card includes: Organization name, sport type, location, contact status, last activity date, quick action buttons
- Hover state reveals additional details
- Bulk selection checkboxes
- Pagination at bottom

### Lead Management
**Lead Cards:**
- Organization name (text-lg, 600 weight)
- Championship/event details (text-sm)
- Contact information (collapsible section)
- Status badges (New, Contacted, Meeting Scheduled, Converted)
- Action buttons: Schedule Meeting, Send Email, Add Notes

**Detail View (Modal/Slide-over):**
- Two-column layout: Lead info (left), Activity timeline (right)
- Editable fields with inline save
- Meeting history with timestamps
- Notes section with rich text editor

### Meeting Scheduler
**Calendar Integration:**
- Week/month view toggle
- Drag-and-drop time slot selection
- Color-coded by organization/sport type
- Availability indicators
- Quick reschedule functionality

**Scheduling Form:**
- Organization auto-populate from lead
- Date/time picker with timezone detection
- Meeting type selection (Virtual/In-person)
- Notes field
- Automatic email confirmation preview

### Dashboard
**Metrics Grid (Top):**
- Four stat cards: Total Leads, Meetings Scheduled, Conversion Rate, Active Campaigns
- Large numbers with trend indicators (↑↓)

**Activity Feed (Center):**
- Chronological list of recent activities
- Icon-based activity types
- Expandable details

**Quick Actions (Right Sidebar):**
- Create New Search
- Schedule Meeting
- Export Data
- View Reports

### Data Tables (Reports Section)
- Sortable columns with click indicators
- Row hover highlights
- Inline edit for specific fields
- Export to CSV/PDF buttons
- Customizable column visibility

### Forms
**Consistent Pattern:**
- Labels above inputs (text-sm, 500 weight)
- Input height: h-10 to h-12
- Clear focus states with accent outline
- Helper text below (text-xs)
- Error states with icon + red accent
- Required field indicators (*)

---

## Images

**Dashboard Header:** Abstract geometric pattern or subtle gradient (150px height) behind dashboard title - adds visual interest without distraction

**Empty States:** Friendly illustrations for:
- No search results
- No scheduled meetings
- Empty lead pipeline

**Organization Logos:** Circular avatars (40x40px) in lead cards and lists

---

## Interaction Patterns

### Micro-interactions (Minimal)
- Checkbox animations on selection
- Badge fade-in for status changes
- Smooth slide-in for modals/panels
- Loading skeleton screens for data fetch

### Toast Notifications
- Success: Green accent, 3-second auto-dismiss
- Error: Red accent, manual dismiss
- Info: Blue accent, 4-second auto-dismiss

---

## Responsive Behavior

**Desktop (1024px+):** Full sidebar + two-column layouts
**Tablet (768-1023px):** Collapsed sidebar + single column
**Mobile (<768px):** Bottom navigation + stacked content + horizontal scroll for tables

---

This design prioritizes efficient data management, quick lead processing, and seamless meeting scheduling while maintaining a professional, trustworthy appearance suitable for B2B interactions.