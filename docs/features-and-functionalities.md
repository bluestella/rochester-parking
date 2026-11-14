# Features and Functionalities: Condo ParkTrack

## 1. Core Parking Management (Guards & Admins)

The heart of the system, designed for operational efficiency at entry and exit points.

### Vehicle Entry
-   **Digital Entry Form:** Streamlined interface to record vehicle details.
-   **Data Capture:**
    -   Plate Number (Auto-formatted & validated).
    -   Entry Timestamp (Auto-generated).
    -   Building & Unit Number.
    -   Parking Slot / Codename assignment.
    -   Resident Association (Optional).
-   **Duplicate Prevention:** System checks to prevent checking in a vehicle that is already marked as "Parked".

### Vehicle Exit
-   **Quick Search:** Find active vehicles instantly by plate number.
-   **Automated Calculations:**
    -   Auto-capture Exit Timestamp.
    -   Auto-calculate **Duration of Stay**.
-   **Status Update:** One-click transition from "Parked" to "Exited".

### Real-Time Monitoring
-   **Active Parking Dashboard:** Live view of all currently parked vehicles.
-   **Status Indicators:** Visual badges (Green for Parked, Gray for Exited) for quick scanning.
-   **Filtering & Sorting:** Filter by Building, Status, or Date.

## 2. User Management (Admin Only)

Comprehensive control over system access and user roles.

-   **User CRUD:** Create, Read, Update, and Soft-Delete user accounts.
-   **Role Assignment:** Assign specific roles to users:
    -   **Admin:** Full system access.
    -   **Guard:** Operational access (Entry/Exit).
    -   **Resident:** View-only access to personal records.
-   **Audit Trail:** Logs tracking who created or modified user accounts for accountability.

## 3. Resident Portal (Self-Service)

Empowering residents with transparency regarding their vehicle history.

-   **Personal Dashboard:** Dedicated view for logged-in residents.
-   **Active Status:** View currently parked vehicles registered to their unit.
-   **History Log:** Access complete historical records of their vehicle entries and exits.
-   **Data Export:** Capability to export parking history as CSV for personal records.

## 4. Security & Access Control

Security features to protect data and operations.

-   **Role-Based Access Control (RBAC):** Custom permission matrix (Admin, Guard, Resident) enforced via middleware and server-side helpers.
    -   *Example:* Residents cannot see other residents' logs; Guards cannot delete users.
-   **Authentication:** NextAuth.js with credentials provider and JWT sessions.
-   **Audit Logging:** Detailed logs of critical actions (Record Creation, Updates, Deletions) including User ID, Timestamp, and IP Address.

## 5. Reporting & Analytics

-   **Summary Cards:** Visual metrics showing:
    -   Total visits (Monthly).
    -   Average duration of stay.
    -   Most frequently used parking slots.
-   **Exportable Data:** Admins can export system-wide parking logs for offline analysis or reporting.


## Condominium management (added)

### Units
- Register each unit with its building, floor area, type, owner and occupancy.
- A resident is linked to a unit as its owner, or by the building and unit number on their account.

### Dues and billing (`/admin/billing`, `/resident/dues`)
- **Rates**: dues per sqm, parking fee per reserved slot, due day, late-charge percentage, payment instructions.
- **Issue statements**: one statement of account per active unit per month (dues = floor area × rate, plus each reserved parking slot). Running it twice never double-bills.
- **One-off statements** and **extra charges** (utilities, repairs).
- **Payments**: the office records a payment and gets an official receipt number; residents report a transfer, which waits for the office to confirm it.
- **Late charges**: applied to overdue balances at most once per calendar month.
- **Receivables**: collection rate, ageing buckets, largest overdue balances, CSV export.

### Parking additions
- Slots have a use (visitor, reserved, PWD, motorcycle); reserved slots belong to a unit and are billed monthly.
- **Deck map** (`/parking/map`): every bay drawn live; select a free bay to record an entry.
- **Visitors** (`/parking/visitors`, `/resident/visitors`): residents pre-register guests and get a pass code; guards check visitors in and out and log walk-ins.

### Facilities
- **Amenities and bookings**: opening hours, capacity, hourly fee, optional approval. Clash detection for exclusive spaces. An approved paid booking adds the fee to the unit's account.
- **Service requests**: residents and staff file tickets; the office assigns, prioritises, replies and resolves, with a full history on each ticket.
- **Equipment**: maintenance due within two weeks surfaces on the overview.

### Community and admin
- **Announcements**: pinned, per-building, with expiry.
- **Overview**: a work queue of what needs a person today.
- **Activity log** (`/admin/logs`): who changed what.
