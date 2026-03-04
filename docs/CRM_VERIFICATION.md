# CRM canonical chain — verification checklist

After running migration `048_crm_canonical_chain.sql` and (optionally) the backfill script, use these checks to confirm links work.

## 1. Locations → Clients

```sql
-- Should return rows where client_id is set (after backfill or manual link)
SELECT id, name, client_id, org_id FROM locations WHERE client_id IS NOT NULL LIMIT 5;
-- Or for DBs that use sites:
SELECT id, name, client_id, org_id FROM sites WHERE client_id IS NOT NULL LIMIT 5;
```

## 2. Opportunities → Locations

```sql
-- Should return rows where location_id is set
SELECT id, stage, client_id, site_id, location_id, org_id FROM opportunities WHERE location_id IS NOT NULL LIMIT 5;
```

## 3. Walkthroughs → Locations

```sql
SELECT id, opportunity_id, site_id, location_id, org_id FROM walkthroughs WHERE location_id IS NOT NULL LIMIT 5;
```

## 4. Bids → Opportunities / Walkthroughs

```sql
SELECT id, opportunity_id, walkthrough_id, org_id FROM bids WHERE opportunity_id IS NOT NULL OR walkthrough_id IS NOT NULL LIMIT 5;
```

## 5. CRM activities and contacts

```sql
SELECT COUNT(*) FROM crm_activities;
SELECT COUNT(*) FROM crm_contacts;
```

## 6. Client status (optional columns)

```sql
SELECT id, name, status, industry, website, phone, owner_user_id FROM clients LIMIT 3;
```

## 7. RLS

As an org member, in the app:

- Open **CRM** → list clients (search and status filter).
- Open a client → tabs: Overview, Locations, Opportunities, Activity, Documents.
- Add an activity (type, subject, due date) and see it in Activity.
- Open an opportunity (from client or direct URL `/app/crm/opportunities/{id}`) → see client, location, bids, activities.

If any query fails with "column does not exist" or "relation does not exist", run the migration (and backfill) first.
