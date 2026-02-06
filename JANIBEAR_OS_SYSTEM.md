# JaniBear OS — System / Project Description

**Project Name:** JaniBear OS  
**Domain:** Janitorial Operations & Franchise Compliance SaaS  
**Primary Constraint:** Minimize joint-employer risk by enforcing operational and legal separation between franchisors and franchisees by design.

---

## 1. High-Level Goal

Build a single, multi-tenant SaaS platform that serves two legally distinct customer personas:

- **Operators / Franchisees / Crews** — manage labor, execution, and day-to-day operations  
- **Franchisors / Brand Owners** — define standards and audit outcomes, without controlling labor  

The system must prevent franchisors from exercising direct or indirect control over franchisee employees, even unintentionally.

---

## 2. Core Legal Design Principle (NON-NEGOTIABLE)

The platform must enforce this rule at every layer (DB, API, UI):

**Franchisors may define standards and review outcomes.**  
**Franchisees control how work is performed.**

If a feature could be interpreted as labor control, it must be:

- **Franchisee-initiated**
- **Optional**
- **Abstracted**
- Or **blocked entirely** for franchisor roles

---

## 3. Platform Structure

Single platform, single codebase, shared data spine.

**Multi-tenant hierarchy:**

```
Platform
 └── Organization
      ├── Type: Operator | Franchisor
      └── Locations (Units)
           └── Crews
                └── Users
```

Organizations never share write access across boundaries.

---

## 4. User Roles (Role-Based Access Control Required)

### Operator Side

- Crew Member  
- Crew Lead  
- Location Manager  
- Operator Admin  

### Franchisor Side

- Franchisee (owner/operator)  
- Regional Manager  
- HQ Admin  

Roles must be enforced via:

- Database row-level security (RLS)  
- API guards  
- UI feature gating  

---

## 5. Explicit Feature Separation (Critical)

### Franchisors CAN

- Publish brand standards (read-only templates)  
- Define inspection criteria  
- Set minimum outcome thresholds  
- View aggregated compliance scores  
- Access delayed, abstracted reports  
- Compare locations at a high level  

### Franchisors CANNOT

- Assign tasks  
- Create or enforce schedules  
- Track time or attendance  
- View individual worker data  
- Message crews directly  
- Require adoption of workflows  
- See real-time execution data  

### Operators / Franchisees CAN

- Create their own workflows  
- Manage crews and labor  
- Choose whether to adopt franchisor templates  
- Control visibility of their data  
- Certify compliance themselves  

**Adoption of franchisor tools must be:**

- **Opt-in**  
- **Pull-based** (never pushed)  
- **Revocable at any time**  

---

## 6. Data Visibility Rules (VERY IMPORTANT)

**Franchisors may only see:**

- Aggregated compliance scores  
- Location-level averages  
- Time-delayed reports (weekly/monthly)  
- No PII  
- No worker identifiers  
- No timestamps tied to labor activity  

Operators retain full ownership of execution data.

---

## 7. UX Language Constraints

All franchisor-facing UI copy must avoid command language.

**Use:**

- “Recommended”  
- “Optional”  
- “Suggested Standard”  
- “Self-Reported”  
- “Outcome Review”  

**Avoid:**

- “Required”  
- “Must”  
- “Assign”  
- “Enforce”  
- “Discipline”  
- “Non-compliant crew”  

---

## 8. Technical Expectations

The system should be designed for:

- **Supabase** (Postgres + RLS)  
- Role-based feature flags  
- Organization-scoped permissions  
- Audit logs for data access  
- Future AI analysis on **outcomes only**, not labor behavior  

**AI features must analyze:**

- Patterns  
- Trends  
- Risk signals  
- Quality outcomes  

**AI must never:**

- Recommend staffing changes  
- Suggest discipline  
- Evaluate individual worker performance  

---

## 9. Product Positioning

- **Externally marketed as:**  
  - JaniBear Crew (operators)  
  - JaniBear Franchise (franchisors)  
- **Internally built as:**  
  - JaniBear OS  

---

## 10. Success Criteria

- A **franchisor** using the platform:  
  - Cannot control labor  
  - Cannot directly interact with workers  
  - Cannot enforce execution methods  
  - Can only evaluate brand outcomes  

- A **franchisee** using the platform:  
  - Fully controls operations  
  - Chooses how standards are met  
  - Can demonstrate compliance without surrendering control  

---

## Implementation Notes (Codebase)

- **Org type:** `organizations.org_type` is `'operator' | 'franchisor'`. Default for existing orgs: `'operator'`.  
- **RLS helpers:** `is_franchisor_org(org_id)`, `is_operator_org(org_id)` — use these to gate labor data and franchisor-only features.  
- **Labor data:** Tables/views that expose crew, schedules, task assignments, time, or PII must be restricted so franchisor orgs (or franchisor-linked views) never get row-level access.  
- **Franchisor features:** Standards/templates published by franchisors are read-only for operators; adoption is opt-in and recorded (e.g. “adopted_template_id” with revocable link).  
- When adding features, ask: “Could this be interpreted as labor control?” If yes, make it operator-only or optional/pull-based for operators.
