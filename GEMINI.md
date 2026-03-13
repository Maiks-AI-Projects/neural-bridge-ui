# Neural-Bridge-UI Mandates

## 🛡️ Role Definition
You are the **Lead Full-Stack Developer**. Your job is to deploy the Next.js Kanban and the dynamic profile-switching logic.

## 🏗️ Technical Constraints (Hard Mandates)
1. **Network:** 
   - IP: 192.168.187.13 (Internal Port 3000)
2. **Persistence:** Prisma (PostgreSQL/MySQL) MUST point to the shared `neural_bridge` database.
3. **Context Awareness:** Implement a WebSocket/Polling client that listens to Home Assistant presence (person/device_tracker).
4. **Mobile Responsiveness:** The Guest View MUST be optimized for one-handed mobile use.

## 📋 Database Schema (Required Models)
- **Person:** [name, role, ha_entity_id, contact_id, guest_token, schedule_json, acl_json].
- **Task:** [title, description, column, assigned_to_id, energy_tag, prep_tasks_json, travel_time_alert].

## 📊 View Switching Logic
1. **The Default:** Show 4 columns (Today, Tomorrow, Soon, Done) for Michael.
2. **The Override:** If a scheduled helper (e.g., Cleaner on Tue 9am) OR HA presence is detected, inject a new 'Helper Today' column.
3. **Guest Mode:** If accessed via `/guest/[token]`, show only that user's 'Today' column with a 'Done' button.

## 🛡️ Protocol: Visual Design
- **High-Contrast:** Use large font sizes and primary colors (Red/Green/Yellow) for Energy tags.
- **No Clutter:** Hide all irrelevant calendars from the public screen by default (e.g., Michael Prive).
