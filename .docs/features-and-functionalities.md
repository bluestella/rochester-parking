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

Enterprise-grade security features to protect data and operations.

-   **Role-Based Access Control (RBAC):** Strict permission enforcement via Permit.io.
    -   *Example:* Residents cannot see other residents' logs; Guards cannot delete users.
-   **Secure Authentication:** Encrypted login sessions using JWT.
-   **Audit Logging:** Detailed logs of critical actions (Record Creation, Updates, Deletions) including User ID, Timestamp, and IP Address.

## 5. Reporting & Analytics

-   **Summary Cards:** Visual metrics showing:
    -   Total visits (Monthly).
    -   Average duration of stay.
    -   Most frequently used parking slots.
-   **Exportable Data:** Admins can export system-wide parking logs for offline analysis or reporting.
