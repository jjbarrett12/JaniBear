# JaniBear: Foundational Structure — Sales vs Operations/QC

## 1. How Teams Should Use the Platform (End-to-End)

Think of the platform as **one pipeline**: **Sales** turns prospects into signed clients; **Operations/QC** runs and improves service after the contract is won.

```
[Prospect] → Sales (CRM, walkthroughs, proposals) → [Signed client]
                                                           ↓
[Same client/site] → Operations (schedules, crews) → QC (inspections, issues, reports)
```

- **Sales** owns: who we're selling to, what we're proposing, and whether the deal is won.
- **Operations** owns: who cleans, when, and how much labor.
- **QC** owns: how well we're performing and what we're fixing (inspections → issues → work orders → client reports).

So: **one org, one set of Clients/Sites**, with Sales and Ops/QC looking at the same entities at different stages (before vs after contract).

---

## 2. Sales Side — What Belongs Here

**Goal:** Turn leads/opportunities into signed proposals and new clients/sites.

| Area | Features | Who Uses It |
|------|----------|-------------|
| **Leads / pipeline** | Lead capture (paste, email, text, 3rd party, voice, scan), status (new → contacted → walkthrough_scheduled → walkthrough_done → proposal_sent → won/lost) | Sales |
| **CRM** | **Clients** (billing, contacts), **Sites** (address, linked to client), **Opportunities** (one per deal: client + site + stage, est MRR/value) | Sales (and Ops for existing clients) |
| **Walkthroughs** | Schedule walkthrough to opportunity/site; capture media (photo, video, audio); optional AI extraction → scope | Sales |
| **Proposals** | Build from scope (and optional bid/formulas); HTML + scope_json + pricing_json; send link; **e-sign** (draw + signer name); status draft → sent → accepted/rejected | Sales |
| **Sequences** | Follow-up sequences (email/SMS/tasks) on opportunities; enroll when proposal sent or stage changes | Sales |
| **Tasks** | Sales tasks (e.g. "Call back", "Send revised proposal") tied to opportunities/leads | Sales |

**Important:**  
- **Lead** = raw prospect (might not be in CRM yet).  
- **Opportunity** = a real deal: Client + Site + stage.  
- When the proposal is **accepted**, that Opportunity becomes a "won" account; the same **Client** and **Site** then show up on the Operations/QC side. So Sales and Ops share the same **Clients** and **Sites**; Sales just cares about opportunities and proposals; Ops/QC care about schedules, inspections, issues, reports.

**Roles:**  
- **Sales** role: CRM (clients, sites, opportunities), leads, walkthroughs, proposals, sequences, sales tasks.  
- **Owner/Admin**: same as Sales, plus user/org management and visibility into Ops/QC.

---

## 3. Operations / QC Side — What Belongs Here

**Goal:** Deliver service, measure quality, fix issues, and report to the client.

| Area | Features | Who Uses It |
|------|----------|-------------|
| **Locations / sites** | Same **Sites** (and **Clients**) that Sales created; used for assigning crews, inspections, issues | Ops, Inspectors |
| **Inspections** | **Templates** (checklists, scoring), run inspections per site, scores, photos, GPS | Inspectors, Ops |
| **Issues** | Create from failed items or ad hoc; status, priority, SLA, assignee; link to **work orders** | Ops, Inspectors |
| **Work orders** | Generated from issues (or manual); assign to crew/person; due date; completion | Ops, Cleaners |
| **Scheduling** | Recurring (e.g. weekly) or one-time; what runs when at which site | Ops |
| **Workload / crews** | **Employees**, **workload_rules** (e.g. employees per site, minutes per clean, frequency), **shifts** | Ops |
| **Tasks** | Field/completion tasks (e.g. "Fix issue #12", "Restock") tied to sites/issues/work orders | Ops, Cleaners |
| **Client reports** | **report_runs**, **client_reports** (e.g. monthly HTML/PDF): scores, issues, highlights; send to client | Ops, Admin |
| **Contracts** | Store contract docs per site/client (reference only; contract *creation* is Sales) | Ops, Admin |

**Roles:**  
- **Ops**: schedules, workload, employees, issues, work orders, client reports, contracts.  
- **Inspector**: run inspections, create/view issues (and see sites).  
- **Cleaner**: view assigned tasks/work orders (and optionally minimal issue view).  
- **Owner/Admin**: full access to all of the above.

---

## 4. Handoff: When Does a Site Move from "Sales" to "Ops/QC"?

- **Before signature:**  
  - Entity = **Opportunity** (with Client + Site).  
  - Sales uses: Leads (optional), CRM (clients/sites), walkthroughs, proposals, sequences.  
  - Ops/QC: no inspections/schedules yet for that opportunity.

- **When proposal is accepted (e-sign):**  
  - Opportunity marked **won** (and optionally "convert to active site").  
  - Same **Client** and **Site** are now "live" for operations.  
  - Ops can: add schedules, workload rules, assign crews.  
  - QC can: assign inspection templates, run inspections, create issues/work orders.  
  - **Client reports** go to this client/site.

So: **one source of truth** — Clients and Sites. Sales creates/uses them for opportunities; when the deal is won, Ops/QC use the same records for delivery and quality.

---

## 5. Optional: Admin / Back-Office (Shared or Separate)

You already have admin-style features that support **both** Sales and Ops:

- **Employees** (used by Ops for workload/crews; could be referenced by Sales for "who did the walkthrough").  
- **Compliance, SDS, Purchase orders, Invoices, Phone calls** (optional modules).

Recommendation:  
- Treat these as **org-wide / Admin**: available to Owner/Admin; optionally to Ops (e.g. invoices, POs) or Sales (e.g. phone calls).  
- Keep them **out of** the core "Sales vs Ops/QC" split so the foundational structure stays: **Sales** = pipeline and proposals; **Ops/QC** = delivery and quality.

---

## 6. Summary: What Lives Where

| Side | Main Entities | Main Features |
|------|----------------|---------------|
| **Sales** | Leads, Clients, Sites, Opportunities, Walkthroughs, Proposals, Sequences, (sales) Tasks | Lead import & pipeline, CRM, walkthrough capture, AI scope, proposals & e-sign, follow-up sequences |
| **Operations / QC** | Same Clients/Sites + Inspections, Issues, Work orders, Schedules, Employees, Workload, Shifts, Client reports | Inspections & scoring, issue tracking & SLA, work orders, scheduling, workload/crews, monthly reports |
| **Shared** | Clients, Sites (and Org, Users, Roles) | Same data; Sales "creates" the relationship, Ops/QC "consumes" it after win. |

---

## Next Steps (Optional)

1. **Team guide** — One-pager for Sales vs Ops on "how to use the app day-to-day."
2. **UI/navigation** — Clear separation in the app (e.g. Sales vs Operations & QC sections) while sharing Clients and Sites.
