# FindIt: Comprehensive Project Documentation
**Lost & Found Management System**

---

## 1. Executive Summary

FindIt is a modern, full-stack Single Page Application (SPA) designed to streamline the lost and found process within organizations or communities. By leveraging a robust Python FastAPI backend and a lightweight Vanilla JavaScript frontend, FindIt provides an elegant, highly responsive platform for reporting, discovering, and reclaiming lost items. 

The system implements advanced features typical of enterprise-grade applications, including a custom deterministic smart-matching algorithm, Role-Based Access Control (RBAC), secure claims management, and comprehensive auditing and logging. This documentation provides an exhaustive technical and functional overview of the FindIt platform, intended for developers, system administrators, and project stakeholders.

---

## 2. System Architecture

The FindIt application follows a decoupled client-server architecture, communicating exclusively via RESTful JSON APIs.

### 2.1 Backend Architecture
* **Framework:** FastAPI (Python 3.x)
* **Design Pattern:** Resource-oriented REST API
* **Database:** SQLite (via SQLAlchemy 2.0 ORM)
* **Data Validation:** Pydantic v2 schemas
* **Authentication:** Stateless JWT (JSON Web Tokens) using `python-jose` and `bcrypt` for password hashing.
* **Concurrency:** Asynchronous route handlers (`async def`) ensuring non-blocking I/O operations.

### 2.2 Frontend Architecture
* **Paradigm:** Single Page Application (SPA)
* **Core Engine:** Custom built in `js/app.js`. It handles client-side state (`State`), routing (`Router`), and view rendering (`Shell`).
* **Templating:** JavaScript string literals for component rendering, categorized by "Pages".
* **Styling:** Vanilla CSS (`css/design-system.css`) utilizing CSS variables (custom properties) for a consistent, scalable design system. No external CSS frameworks (like Bootstrap or Tailwind) are used.
* **API Communication:** A custom wrapper around the native `fetch` API, automatically handling JWT Bearer tokens and intercepting 401 Unauthorized responses for seamless logouts.

---

## 3. Role-Based Access Control (RBAC)

Security and privacy are paramount in a system where users report lost valuables. FindIt categorizes users into three distinct roles, each with strict system boundaries enforced at both the frontend UI level and the backend API middleware level.

### 3.1 Regular User (`user`)
* **Capabilities:** Register, login, view public items, report lost/found items, view their own items, submit claims on found items, view their own claims.
* **Restrictions:** Cannot view items flagged as `private` (unless they own them), cannot view the full description/brand/color of *any* item (unless they reported it), cannot access logs or manage users.

### 3.2 Security Officer (`security`)
* **Capabilities:** All User permissions PLUS the ability to view all private items, view full item descriptors (brand, color, descriptions), view system activity logs, resolve escalating items, and execute anonymous handoffs.
* **Restrictions:** Cannot manage other users' roles or delete users.

### 3.3 Administrator (`admin`)
* **Capabilities:** Superuser access. Includes all Security permissions PLUS the ability to view all users, mutate user roles, delete any item or user, and resolve/reject any claim overriding the item reporter.

---

## 4. Core Modules & Features

### 4.1 Authentication & Profile Management
The authentication module (`js/pages-auth.js` and `/api/auth/*`) handles user onboarding and sessions.
* **Registration & Login:** Standard email/password entry. The backend verifies credentials, hashes new passwords with a unique salt using `bcrypt`, and generates an HS256 JWT valid for 24 hours.
* **Demo Accounts:** Pre-seeded database comes with `admin@lf.com`, `alice@lf.com` (user), and `security@lf.com` for immediate environment testing.
* **Profile Management:** Users can update their display name, phone number, and password dynamically without dropping the session.

### 4.2 Item Management & Discovery
The core entities of the app are "Items", which can be either `lost` or `found` (`js/pages-browse.js`, `js/pages-report.js`).
* **Reporting Workflow:** Users provide Title, Category, Description, Location, Date, Time, Color, Brand, and comma-separated Tags.
* **Ticket ID Generation:** Upon submission, the backend automatically generates a sequential tracking number (e.g., `TKT-0042`) for administrative tracking.
* **Privacy Toggle:** Users can flag a report as "Private". Private reports are stripped from the standard user feed and are strictly visible to Admins/Security.
* **Data Masking:** To prevent fraudulent claims, the `pages-browse.js` logic and API hides the `desc`, `color`, and `brand` attributes from regular users. A user browsing found items only sees the Title, Category, Location, and Date. They must submit a "Proof of Ownership" claim detailing the hidden attributes to recover the item.
* **Dynamic Search & Filtering:** The "Browse Items" dashboard allows multi-faceted filtering by Search Query (title/location), Type, Category, and Status, updating the UI instantly via client-side state filtering.

### 4.3 Smart Matching Engine
FindIt features a deterministic matching algorithm designed to instantly bridge the gap between reporters of lost items and finders.

**Algorithm Implementation (`main.py` -> `match_score`):**
The backend iterates through all "open" lost and found items. It calculates a maximum score of 100 points based on the following weighted criteria:
1. **Title Similarity (25 points):** Calculates Jaccard Index (Word Overlap = Intersection / Union) between both titles. Multiplied by 25.
2. **Category Match (15 points):** Exact match yields 15 points.
3. **Brand Match (15 points):** Case-insensitive exact match yields 15 points.
4. **Description Similarity (15 points):** Jaccard Index of words in descriptions. Multiplied by 15.
5. **Color Match (10 points):** Case-insensitive exact match yields 10 points.
6. **Tags Overlap (10 points):** Jaccard Index of the array of tags. Multiplied by 10.
7. **Location Similarity (5 points):** Jaccard Index of location strings. Multiplied by 5.

* **Thresholds:** A pair must score at least 20 points to be appended to the matches list. In the UI (`pages-match.js`), scores >= 70% are flagged as "High Confidence", 40-69% as "Medium", and 20-39% as "Low".

### 4.4 Claims & Resolution Workflow
When a regular user identifies an item they believe is theirs, they initiate a Claim (`js/pages-match.js`).
* **Submission:** The user provides a textual "Proof of Ownership" (e.g., "The background screen is a picture of my dog" or "It contains a receipt from Starbucks dated Monday").
* **Review Process:** The reporter of the item (or an Admin) reviews the claim.
* **Resolution:** If the proof aligns with the masked item details, the reviewer clicks "Approve". 
* **State Updates:** Approving a claim automatically sets the Claim status to `approved` AND updates the associated Item status to `matched`, effectively closing the case cycle.

### 4.5 Administration & Auditing
The `pages-admin.js` module provides overarching control.
* **User Management Matrix:** Admins view all registered users, their join dates, and their total active reports. Admins can promote regular users to Security or Admin roles via a dropdown interface.
* **Global Item Management:** Bypass all privacy rules to view the global item ledger. Includes a "Danger Zone" to hard-delete items from the SQLite database.
* **Escalations Dashboard:** If an item is deemed dangerous, suspicious, or highly valuable, an Admin can click "Escalate". Escalated items are routed to a dedicated, high-priority dashboard for Security personnel.
* **Anonymous Return System:** A specialized feature for Security. If a finder wishes to remain anonymous, the Security officer facilitates the physical handoff and logs the transaction via the `logAnonReturn` function, which closes the ticket and writes a high-severity internal log with handoff notes.

### 4.6 System Audit Logs
A write-only (from the frontend perspective) logging system (`models.Log`).
* Automatic triggers write to the `logs` table for critical state changes:
  * `LOGIN`, `REGISTER`, `PROFILE_UPDATE`
  * `ITEM_REPORTED`, `ITEM_STATUS` updates, `ESCALATION`
  * `CLAIM_SUBMITTED`, `CLAIM_APPROVED`, `CLAIM_REJECTED`
  * `ROLE_CHANGE` (Admin action)
  * `ANON_RETURN` (Security action)
* Logs are viewable by Security and Admins in a scrollable, severity-color-coded terminal UI.

---

## 5. Database Schema & Models

The SQLite database (`findit.db`) utilizes SQLAlchemy ORM with four primary tables.

### 5.1 `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Unique `u-[hash]` ID |
| `name` | String | Not Null | Full display name |
| `email`| String | Unique, Index | Email address |
| `password` | String | Not Null | bcrypt hashed password |
| `role` | String | Default `user` | Enum: `user`, `admin`, `security` |
| `phone`| String | Nullable | Contact number |
| `joined` | String | | Date string of account creation |

### 5.2 `items` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Unique `i-[hash]` ID |
| `type` | String | Not Null | Enum: `lost`, `found` |
| `title`| String | Not Null | Item subject |
| `category` | String | | Classification (e.g. Electronics) |
| `desc` | String | | Granular description |
| `location` | String | | Where lost/found |
| `date` | String | | Date of incident |
| `time` | String | | Time of incident |
| `color` | String | | Primary color |
| `brand` | String | | Manufacturer |
| `userId` | String | ForeignKey | Reporter's User ID |
| `status` | String | Default `open` | Enum: `open`, `matched`, `closed` |
| `private`| Boolean| Default `False`| Privacy flag |
| `escalated`| Boolean| Default `False`| Security escalation flag |
| `ticketId` | String | Unique, Index | Human readable tracking code |
| `tags` | JSON | | Array of strings for search optimization |
| `created` | Integer| | Unix timestamp (ms) |

### 5.3 `claims` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Unique `c-[hash]` ID |
| `itemId` | String | ForeignKey | Associated Item ID |
| `claimantId`| String | ForeignKey | Submitting User ID |
| `proof` | String | | Description of ownership proof |
| `status` | String | Default `pending`| Enum: `pending`, `approved`, `rejected`|
| `adminNote` | String | Nullable | Admin resolution notes |
| `created` | Integer| | Unix timestamp (ms) |

### 5.4 `logs` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Primary Key | Unique `l-[hash]` ID |
| `event` | String | | Event category/type |
| `desc` | String | | Readable description |
| `userId` | String | | Triggering User ID |
| `severity` | String | Default `low` | Enum: `low`, `medium`, `high` |
| `time` | Integer| | Unix timestamp (ms) |

---

## 6. REST API Documentation (Endpoints)

The FastAPI backend exposes endpoints structured by domain. All state-mutating endpoints and secured `GET` endpoints require a Bearer token in the `Authorization` header.

### 6.1 Authentication API (`/api/auth`)
* `POST /api/auth/login`: Accepts `{"email", "password"}`. Returns `{"access_token", "token_type"}`.
* `POST /api/auth/register`: Accepts `UserCreate` schema. Validates email conflicts. Returns token.
* `GET /api/auth/me`: Validates JWT dependency and returns current `User` object.
* `PUT /api/auth/profile`: Updates current user details.

### 6.2 Items API (`/api/items`)
* `GET /api/items`: Retrieves items. **Security Constraint:** Backend automatically scrubs/filters items. If user is `admin`/`security`, returns all. If `user`, returns items where `private=false` OR `userId=currentUser.id`.
* `POST /api/items`: Accepts `ItemCreate` schema. Automatically attaches `userId` and assigns a sequential `ticketId`.
* `PUT /api/items/{id}`: Accepts `status` and `escalated` fields. **Security Constraint:** Only item owner or privileged user can update.
* `DELETE /api/items/{id}`: Hard deletes an item. Only Admin or Owner allowed.
* `GET /api/items/matches`: Executes the matching algorithm in-memory and returns sorted list of overlapping item pairs.

### 6.3 Claims API (`/api/claims`)
* `GET /api/claims`: Retrieves claims. Admins see all. Users see claims where `claimantId=currentUser` OR the claim is attached to an item where `userId=currentUser`.
* `POST /api/claims`: Creates a new claim and defaults status to `pending`.
* `PUT /api/claims/{id}`: Updates claim status to `approved` or `rejected`. If `approved`, automatically mutates parent item status to `matched`.

### 6.4 Admin API (`/api/admin`)
* `GET /api/admin/users`: Protected by `get_admin_user` dependency. Returns all users.
* `PUT /api/admin/users/{id}/role`: Elevates/demotes roles.
* `GET /api/admin/logs`: Protected by `get_security_user` dependency. Returns latest 100 system logs.
* `POST /api/admin/logs`: Manual arbitrary log creation.

---

## 7. Frontend Codebase Breakdown

The client application is fundamentally driven by `js/app.js` which orchestrates module loading.

### 7.1 `js/app.js`
* Contains `API` wrapper class.
* Contains `State` singleton which caches `currentUser`, `items`, `claims`, `users`, and `logs` in memory to prevent unnecessary network requests, syncing via `State.refresh()`.
* Contains `Router` logic handling hash-less navigation and swapping `appEl.innerHTML` with content from `Pages`.
* Defines the SPA `Shell` (Sidebar navigation and layout).

### 7.2 Page Modules
The UI is fragmented into components attached to the `Pages` object. UI Event listeners are mapped via the `Binders` object after DOM insertion.

* **`pages-auth.js`:** Contains HTML templates for `Pages.login`, `Pages.register`, `Pages.profile`. Methods: `doLogin()`, `doRegister()`, `saveProfile()`.
* **`pages-browse.js`:** Contains `Pages.dashboard` (KPIs, recent cards) and `Pages.browse` (Grid/List views, dynamic JS filtering on the cached `State.items`).
* **`pages-report.js`:** Contains `Pages.report` (Form processing, auto-tag generation array deduplication) and `Pages['my-reports']`.
* **`pages-match.js`:** Contains `Pages.matches` (renders algorithm results) and `Pages.claims` (Pending vs Resolved tab logic).
* **`pages-admin.js`:** Contains `Pages.admin` (User table, global items, claim overrides) and `Pages.security` (Escalation monitoring, log terminal UI, anonymous return processor).

---

## 8. Requirements & Dependencies

The backend requirements are specified in `requirements.txt`. Key dependencies include:
* `fastapi==0.128.8`: High performance API framework.
* `uvicorn==0.39.0`: ASGI server.
* `SQLAlchemy==2.0.49`: Enterprise ORM.
* `pydantic==2.12.5`: Data parsing and validation schemas.
* `python-jose==3.5.0` & `cryptography`: JWT encryption protocols.
* `bcrypt==5.0.0` & `passlib`: Secure password hashing.

---

## 9. Conclusion

FindIt is architected to be highly scalable and secure. The decision to use an in-memory client state coupled with an asynchronous backend ensures a near-instantaneous user experience. The strict separation of concerns—where business logic and RBAC constraints are enforced securely on the backend while the frontend merely dictates presentation—safeguards the system from malicious exploitation, ensuring that sensitive data concerning lost valuables is meticulously protected.
