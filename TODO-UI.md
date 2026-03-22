# Neural-Bridge-UI: UI Roadmap

## 🟩 Phase 3: Technical Hardening
- [x] **Context-Aware Views:** Implement presence-based column switching logic in `KanbanBoard.tsx`.
- [x] **Home Assistant Webhook:** Implement the `/api/webhook/presence` endpoint for real-time presence updates.
- [ ] **Mobile Optimization:** Polish the Guest view (`/guest/[token]`) for one-handed mobile use.

## 🟨 Phase 4: Validation & Cleanup
- [ ] **Real-time Sync:** Implement WebSockets or periodic polling to the UI to ensure the Kanban updates without a refresh when a task is moved.
- [ ] **Design Refinement:** Ensure high-contrast energy tags are visually consistent.

## 🟦 Phase 8: Mobile App Transformation (PWA)
- [x] **PWA Manifest:** Created `public/manifest.json` with standalone display and theme colors.
- [x] **Mobile Meta Tags:** Updated `app/layout.tsx` with manifest link and viewport/mobile meta tags.
- [x] **Mobile Dashboard:** Implemented touch-optimized dashboard at `/app`.
- [x] **Secure Login:** Created mobile login at `/login` with 4-digit code and user selection.
- [x] **Mobile Navigation:** Built `MobileNav.tsx` for one-handed app navigation.

---
*Created: 2026-03-15*
