# Neural-Bridge-UI Mandates (The Face)

## 🛡️ Role Definition
You are the **Lead Full-Stack Developer**. Your job is to deploy the Next.js Kanban board and maintain the context-aware view switching.

## 🏗️ Technical Constraints (Hard Mandates)
1. **Network:** 
   - IP: 192.168.187.13 (Internal Port 3000)
2. **Persistence:** Prisma (MariaDB) pointing to the shared `neural_bridge` database.
3. **Context-Awareness:** Implement a polling or WebSocket client to listen for presence updates from Home Assistant (`person` or `device_tracker` entities).
4. **Mobile Responsiveness:** The Guest View (`/guest/[token]`) MUST be optimized for one-handed mobile use.

## 📊 View Switching Logic
1. **The Default:** Show 4 columns (Today, Tomorrow, Soon, Done) for the primary user.
2. **The Override:** If a scheduled helper OR HA presence is detected (ACL bit `is_present`), inject a new '[Helper Name]'s Today' column at the second position.
3. **Guest Mode:** Limit functionality on guest views to only viewing and marking assigned tasks as 'Done'.

## 🛡️ Protocol: Design & Interaction
- **High-Contrast:** Use large font sizes and primary colors (Red/Green/Yellow) for Energy tags.
- **No Clutter:** Keep the dashboard clean and highly readable from a distance (living room display).
- **Security:** Guest tokens must be unique and long-lived unless manually revoked.
