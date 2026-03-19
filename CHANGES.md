# Required Changes for Neural-Bridge-UI

## 🛡️ Context-Awareness Mandate
1. **Home Assistant Integration:** Verify the `/api/webhook` implementation. It must accept presence data from Home Assistant (e.g., `person` or `device_tracker` states) and update the `Person.acl` JSON (specifically the `is_present` bit) to trigger the dynamic column injection in the Kanban board.
2. **Guest View Polish:** Ensure the `/guest/[token]` view is fully optimized for one-handed mobile use as per the mandate.

## 📊 View Switching Logic
- The `KanbanBoard.tsx` already has the injection logic, but it needs to be verified against real presence data updates to ensure it's "live" without manual refreshes (consider using polling or WebSockets if not already implemented).
