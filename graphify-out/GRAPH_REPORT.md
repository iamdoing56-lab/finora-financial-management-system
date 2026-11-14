# Graph Report - FCM_Project  (2026-11-14)

## Corpus Check
- 115 files · ~119,005 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .example 2, .css 2)

## Summary
- 298 nodes · 496 edges · 27 communities (17 shown, 10 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 55 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Frontend API Client Layer
- Frontend Build & Dependencies
- Backend Express Application Server
- Backend Database & Dependencies
- Accounts & Transactions Controllers
- Authentication & User Management
- Application Layout & Routing
- Admin Dashboard & Design System
- User Dashboard & Visual Assets
- Admin Reports & Route Guards
- Linting & Oxlint Rules
- Admin User Management Views
- Financial Analytics & Reports
- Admin Settings UI View
- Admin Transactions UI View
- Budgets Management UI View
- Notifications Center UI View
- Portfolio Creative Asset
- Board Preview Graphic Asset
- User Avatar Visual Asset
- Screenshot Visual Reference

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 22 edges
2. `AppRoutes()` - 19 edges
3. `react` - 14 edges
4. `lucide-react` - 13 edges
5. `express` - 11 edges
6. `scripts` - 7 edges
7. `react-router-dom` - 7 edges
8. `@prisma/client` - 6 edges
9. `authMiddleware()` - 6 edges
10. `prisma` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Visual Asset: Account Details (screen.png)` --references--> `Finora UI Mockup: Account Details`  [EXTRACTED]
  web_desgine/finora_financial_management_platform_1/finora_account_details/screen.png → web_desgine/finora_financial_management_platform_1/finora_account_details/code.html
- `Visual Asset: Accounts Management (screen.png)` --references--> `Finora UI Mockup: Accounts Management`  [EXTRACTED]
  web_desgine/finora_financial_management_platform_1/finora_accounts_management/screen.png → web_desgine/finora_financial_management_platform_1/finora_accounts_management/code.html
- `Visual Asset: Add Transaction Modal (screen.png)` --references--> `Finora UI Mockup: Add Transaction Modal`  [EXTRACTED]
  web_desgine/finora_financial_management_platform_1/finora_add_transaction_modal/screen.png → web_desgine/finora_financial_management_platform_1/finora_add_transaction_modal/code.html
- `Visual Asset: Categories Management (screen.png)` --references--> `Finora UI Mockup: Categories Management`  [EXTRACTED]
  web_desgine/finora_financial_management_platform_1/finora_categories_management/screen.png → web_desgine/finora_financial_management_platform_1/finora_categories_management/code.html
- `Visual Asset: Logo (screen.png)` --references--> `Finora UI Mockup: Logo`  [EXTRACTED]
  web_desgine/finora_financial_management_platform_1/finora_logo/screen.png → web_desgine/finora_financial_management_platform_1/finora_logo/code.html

## Import Cycles
- None detected.

## Communities (27 total, 10 thin omitted)

### Community 0 - "Frontend API Client Layer"
Cohesion: 0.07
Nodes (44): accountsApi, authApi, categoriesApi, client, transactionsApi, AccountModal(), Navbar(), ADMIN_NAV (+36 more)

### Community 1 - "Frontend Build & Dependencies"
Cohesion: 0.06
Nodes (38): Frontend HTML Entry Point, dependencies, axios@^1.7.7, lucide-react@^0.447.0, react@^19.2.8, react-dom@^19.2.8, react-router-dom@^6.27.0, recharts@^2.13.3 (+30 more)

### Community 2 - "Backend Express Application Server"
Cohesion: 0.10
Nodes (23): app, cors, express, helmet, authMiddleware(), express, router, express (+15 more)

### Community 3 - "Backend Database & Dependencies"
Cohesion: 0.08
Nodes (32): dependencies, bcryptjs@^2.4.3, cors@^2.8.5, dotenv@^16.4.5, express@^4.21.1, helmet@^8.0.0, jsonwebtoken@^9.0.2, pdfkit@^0.15.0 (+24 more)

### Community 4 - "Accounts & Transactions Controllers"
Cohesion: 0.10
Nodes (6): @prisma/client@^5.20.0, { Prisma }, { Prisma }, prisma, { PrismaClient }, @prisma/client

### Community 5 - "Authentication & User Management"
Cohesion: 0.19
Nodes (13): login(), register(), updateProfile(), DEFAULT_CATEGORIES, DEFAULT_SETTINGS, main(), prisma, { PrismaClient } (+5 more)

### Community 6 - "Application Layout & Routing"
Cohesion: 0.23
Nodes (9): App(), AppLayout(), ProtectedRoute(), Sidebar(), handleLogout(), AuthProvider(), logout(), updateUser() (+1 more)

### Community 7 - "Admin Dashboard & Design System"
Cohesion: 0.25
Nodes (7): AdminDashboard(), Finora UI Mockup: Admin Dashboard, Visual Asset: Admin Dashboard (screen.png), Finora Platform 2 (Admin) Color System, Finora Platform 2 (Admin) Design Tokens, Finora UI Mockup: System Analytics, Visual Asset: System Analytics (screen.png)

### Community 8 - "User Dashboard & Visual Assets"
Cohesion: 0.25
Nodes (7): Dashboard(), Finora Platform 1 Color System, Finora Platform 1 Design Tokens, Finora UI Mockup: Main User Dashboard, Visual Asset: Main User Dashboard (screen.png), Finora UI Mockup: Reimagined Dashboard, Visual Asset: Reimagined Dashboard (screen.png)

### Community 9 - "Admin Reports & Route Guards"
Cohesion: 0.29
Nodes (6): AdminRoute(), AppRoutes(), AdminReports(), Register(), Finora UI Mockup: Admin Reports, Visual Asset: Admin Reports (screen.png)

### Community 10 - "Linting & Oxlint Rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 11 - "Admin User Management Views"
Cohesion: 0.33
Nodes (5): AdminUsers(), Finora UI Mockup: Admin User Details, Visual Asset: Admin User Details (screen.png), Finora UI Mockup: Admin User Management, Visual Asset: Admin User Management (screen.png)

### Community 12 - "Financial Analytics & Reports"
Cohesion: 0.33
Nodes (5): Reports(), Finora UI Mockup: Financial Analytics, Visual Asset: Financial Analytics (screen.png), Finora UI Mockup: Financial Reports, Visual Asset: Financial Reports (screen.png)

### Community 13 - "Admin Settings UI View"
Cohesion: 0.50
Nodes (3): AdminSettings(), Finora UI Mockup: Admin Settings, Visual Asset: Admin Settings (screen.png)

### Community 14 - "Admin Transactions UI View"
Cohesion: 0.50
Nodes (3): AdminTransactions(), Finora UI Mockup: Admin Transactions, Visual Asset: Admin Transactions (screen.png)

### Community 15 - "Budgets Management UI View"
Cohesion: 0.50
Nodes (3): Budgets(), Finora UI Mockup: Budgets Management, Visual Asset: Budgets Management (screen.png)

### Community 16 - "Notifications Center UI View"
Cohesion: 0.50
Nodes (3): Notifications(), Finora UI Mockup: Notifications, Visual Asset: Notifications (screen.png)

## Knowledge Gaps
- **36 isolated node(s):** `Vite React Template Specification`, `Frontend HTML Entry Point`, `Finora Platform 1 Color System`, `Finora Platform 2 (Admin) Color System`, `Visual Asset: Public (favicon.svg)` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 117 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Frontend API Client Layer` to `Frontend Build & Dependencies`, `Application Layout & Routing`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **What connects `Vite React Template Specification`, `Frontend HTML Entry Point`, `Finora Platform 1 Color System` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Client Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06597222222222222 - nodes in this community are weakly interconnected._
- **Why does `react-router-dom` connect `Frontend API Client Layer` to `Frontend Build & Dependencies`, `Application Layout & Routing`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Frontend Build & Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0641025641025641 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Frontend API Client Layer` to `Frontend Build & Dependencies`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Backend Express Application Server` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._