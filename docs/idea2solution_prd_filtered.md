# Product Requirements Document (PRD)

## Product Name: Idea2Solution Platform

---

## 1. Purpose
To streamline the process of collecting, tracking, and managing digitalization ideas submitted by internal employees. This web-based application enables users to submit new ideas, view existing ones, and stay informed about their idea’s status throughout the evaluation workflow.

---

## 2. Core Features

### 2.1 Idea Submission
- Authenticated users can submit a new idea via a form.
- Fields included:
  - **Title** (`cr6df_name`) — required, user-provided
  - **Description** (`cr6df_beschreibung`) — required, user-provided
  - **Submitted by** (`cr6df_ideengeber`) — system-generated (from MS account)
  - **Type** (`cr6df_typ`) — defaulted by system
  - **Date Submitted** (`CreatedOn`) — system-generated
  - **Current Status** (`cr6df_lifecyclestatus`) — defaulted by system

### 2.2 Idea Pool / List View
- Authenticated users can view a list of all submitted ideas.
- Display key fields: `Title`, `Submitted by`, `Date Submitted`, `Current Status`.
- Search, filter, or sort options (future enhancement).

### 2.3 Idea Detail View
- Users can click on an idea to view full details including all metadata.
- Read-only fields: Title, Submitted by, Date Submitted, Type, Current Status.

### 2.4 Edit Submitted Idea
- Users can edit the **Description** field only for ideas they originally submitted.
- On save, update system-managed fields:
  - `ModifiedOn`
  - `ModifiedBy`

### 2.5 User Authentication
- Microsoft Account authentication is required for all actions.
- Authentication grants:
  - Read access to all ideas
  - Submit/edit access to own ideas

### 2.6 (Future Feature) Notifications
- Users receive notification (email or in-app) when they are requested to edit/update their idea.
- Notification content includes a short message describing the needed change.

---

## 3. Technical Architecture

### 3.1 Frontend
- **Framework**: Next.js
- **Styling**: Tailwind CSS + daisyUI
- **Icons**: Lucide
- **Form Handling**: React Hook Form
- **Validation**: Zod

### 3.2 Backend/API Integration
- API calls made from frontend to **Microsoft Dataverse** for all CRUD operations:
  - Fetch all ideas (`sgsw_digitalisierungsvorhabens` table)
  - Submit new idea
  - Edit existing idea (owned by user)
  - Read details by ID
- Use Microsoft Authentication to pass access tokens for authorized API calls.

### 3.3 Deployment
- Hosted on **Vercel** for CI/CD, environment management, and scalability.

---

## 4. Roles & Permissions

| Role | Capabilities |
|------|--------------|
| Internal Employee | View all ideas, submit new idea, edit own idea |
| Digital Solution Engineer | Review/update idea status (handled in Power Apps) |
| ITOT-Board | Review/update idea status (Power Apps) |
| Leitungsteam | Review/update idea status (Power Apps) |

---

## 5. Future Enhancements (Nice-to-Have)
- In-app dashboard with analytics (e.g., idea counts per status, submission trends).
- Role-based notifications and reminders.
- Comment threads under each idea.
- Voting mechanism or likes to gauge idea popularity.
- Integration with Microsoft Teams.

---

## 6. Assumptions & Constraints
- All users must have Microsoft Accounts and permissions to access Dataverse.
- Dataverse table `sgsw_digitalisierungsvorhabens` is properly configured with required fields.
- Workflow automation is maintained separately within Power Platform.
- API endpoints from Dataverse must support CORS and secure authentication.
