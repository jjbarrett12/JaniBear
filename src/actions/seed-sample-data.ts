'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireOrg } from '@/lib/auth';

const SAMPLE_LOCATIONS = [
  { name: 'Riverside Office Park – Bldg A', address: '100 Riverside Dr', city: 'Riverside', state: 'CA' },
  { name: 'Tech Campus West', address: '200 Innovation Way', city: 'San Jose', state: 'CA' },
  { name: 'Medical Plaza Suite 200', address: '300 Health Ave', city: 'Sacramento', state: 'CA' },
  { name: 'Downtown Financial Center', address: '400 Main St', city: 'Los Angeles', state: 'CA' },
  { name: 'Industrial Complex – Warehouse', address: '500 Industrial Blvd', city: 'Ontario', state: 'CA' },
  { name: 'Retail Strip Mall', address: '600 Commerce St', city: 'Fresno', state: 'CA' },
  { name: 'School District #7', address: '700 Education Ln', city: 'Bakersfield', state: 'CA' },
  { name: 'Municipal Building', address: '800 Civic Center', city: 'Oakland', state: 'CA' },
  { name: 'Hotel North', address: '900 Hospitality Dr', city: 'San Diego', state: 'CA' },
  { name: 'Warehouse Logistics', address: '1000 Distribution Way', city: 'Long Beach', state: 'CA' },
  { name: 'Office Tower East', address: '1100 Corporate Blvd', city: 'Irvine', state: 'CA' },
  { name: 'Medical Center South', address: '1200 Hospital Way', city: 'Anaheim', state: 'CA' },
  { name: 'Retail Hub', address: '1300 Mall Dr', city: 'Santa Ana', state: 'CA' },
  { name: 'Tech Park North', address: '1400 Silicon Rd', city: 'Sunnyvale', state: 'CA' },
  { name: 'Government Plaza', address: '1500 Capitol St', city: 'Sacramento', state: 'CA' },
  { name: 'University Annex', address: '1600 Campus Dr', city: 'Berkeley', state: 'CA' },
  { name: 'Shopping Center West', address: '1700 Retail Ave', city: 'Stockton', state: 'CA' },
  { name: 'Office Complex Central', address: '1800 Business Park', city: 'San Francisco', state: 'CA' },
  { name: 'Clinic Building B', address: '1900 Care Ln', city: 'Modesto', state: 'CA' },
  { name: 'Distribution Center', address: '2000 Logistics Way', city: 'Fontana', state: 'CA' },
  { name: 'Bank Branch Main', address: '2100 Finance St', city: 'Glendale', state: 'CA' },
  { name: 'Gym & Fitness Plaza', address: '2200 Wellness Blvd', city: 'Huntington Beach', state: 'CA' },
  { name: 'Restaurant Row', address: '2300 Food Court', city: 'Santa Monica', state: 'CA' },
  { name: 'Auto Service Center', address: '2400 Garage Way', city: 'Pomona', state: 'CA' },
];

const SAMPLE_CREWS = [
  'Evening Crew Alpha',
  'Night Shift Bravo',
  'Weekend Team',
  'Morning Crew Delta',
  'Swing Shift Echo',
  'Deep Clean Team',
  'Floor Care Crew',
  'Special Projects',
];

const SAMPLE_LEADS = [
  { contact_name: 'Devin Clark', company: 'LVT Facilities', email: 'devin.clark@lvt.com', phone: '385-685-3097', status: 'new' as const },
  { contact_name: 'Maria Santos', company: 'Pacific Property Group', email: 'msantos@pacificprop.com', phone: '415-222-1000', status: 'contacted' as const },
  { contact_name: 'James Chen', company: 'Tech Campus West', email: 'jchen@techcampus.com', phone: '408-555-0123', status: 'walkthrough_scheduled' as const },
  { contact_name: 'Sarah Miller', company: 'Downtown Financial Center', email: 'sarah.m@downtownfin.com', phone: '213-444-5678', status: 'proposal_sent' as const },
  { contact_name: 'Robert Davis', company: 'Riverside Office Park', email: 'rdavis@riverside.com', phone: '951-333-7890', status: 'won' as const },
  { contact_name: 'Lisa Park', company: 'Medical Plaza LLC', email: 'lpark@medicalplaza.org', phone: '916-666-2345', status: 'new' as const },
  { contact_name: 'Michael Torres', company: 'Industrial Complex Mgmt', email: 'mtorres@indcomplex.com', phone: '909-777-3456', status: 'contacted' as const },
  { contact_name: 'Emily Wong', company: 'Retail Strip Mall Co', email: 'ewong@retailstrip.com', phone: '559-888-4567', status: 'lost' as const },
  { contact_name: 'David Brown', company: 'School District #7', email: 'dbrown@district7.edu', phone: '661-999-5678', status: 'new' as const },
  { contact_name: 'Jennifer Lee', company: 'Municipal Building Authority', email: 'jlee@municipal.gov', phone: '510-111-6789', status: 'walkthrough_done' as const },
];

const SAMPLE_ACCOUNTS = [
  { name: 'Riverside Office Park – Bldg A', status: 'active' as const },
  { name: 'Tech Campus West', status: 'active' as const },
  { name: 'Pacific Property Group', status: 'active' as const },
  { name: 'Downtown Financial Center', status: 'active' as const },
  { name: 'Medical Plaza Suite 200', status: 'active' as const },
  { name: 'Industrial Complex – Warehouse', status: 'inactive' as const },
  { name: 'Retail Strip Mall', status: 'active' as const },
  { name: 'School District #7', status: 'active' as const },
];

export type SeedResult = { ok: true; message: string } | { ok: false; error: string };

const TABLE_MISSING_MSG =
  "The leads or accounts table isn't in your database. Run Supabase migrations so the table exists: in Supabase Dashboard open SQL Editor and run the migration that creates the 'leads' table (e.g. supabase/migrations/008_sales_and_qc.sql), or run: supabase db push";

function isTableMissingError(msg: string): boolean {
  return /schema cache|could not find the table|relation.*does not exist/i.test(msg ?? '');
}

/** Seed leads and accounts so you can test Sales (Leads, Pipeline) and CRM. Safe to run multiple times only when org has no leads. */
export async function seedSampleSalesData(): Promise<SeedResult> {
  try {
    const org = await requireOrg();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };
    const orgId = org.org_id;
    const userId = user.id;

    const { count: leadCount, error: countErr } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
    if (countErr && isTableMissingError(countErr.message)) {
      return { ok: false, error: TABLE_MISSING_MSG };
    }
    if ((leadCount ?? 0) > 0) {
      return { ok: false, error: 'You already have leads. Seed is for empty orgs only (or delete leads first).' };
    }

    // 1. Leads
    const { error: leadErr } = await supabase.from('leads').insert(
      SAMPLE_LEADS.map((l) => ({
        org_id: orgId,
        source: 'paste',
        contact_name: l.contact_name,
        company: l.company,
        email: l.email,
        phone: l.phone,
        status: l.status,
        created_by_user_id: userId,
      }))
    );
    if (leadErr) {
      return { ok: false, error: isTableMissingError(leadErr.message) ? TABLE_MISSING_MSG : `Leads: ${leadErr.message}` };
    }

    // 2. Accounts
    const { error: accErr } = await supabase.from('accounts').insert(
      SAMPLE_ACCOUNTS.map((a) => ({
        org_id: orgId,
        name: a.name,
        status: a.status,
      }))
    );
    if (accErr) {
      return { ok: false, error: isTableMissingError(accErr.message) ? TABLE_MISSING_MSG : `Accounts: ${accErr.message}` };
    }

    revalidatePath('/app/sales/leads');
    revalidatePath('/app/sales');
    revalidatePath('/app/crm');
    revalidatePath('/app/settings/test-data');
    return { ok: true, message: `Added ${SAMPLE_LEADS.length} leads and ${SAMPLE_ACCOUNTS.length} accounts. Check Leads and CRM.` };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error };
  }
}

export async function seedSampleData(): Promise<SeedResult> {
  try {
    const org = await requireOrg();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'Not signed in' };

    const orgId = org.org_id;
    const userId = user.id;

    const { count } = await supabase.from('locations').select('*', { count: 'exact', head: true }).eq('org_id', orgId);
    if ((count ?? 0) > 0) {
      return { ok: false, error: 'You already have locations. Seed is for empty orgs only.' };
    }

    // 1. Locations
    const { data: locRows, error: locErr } = await supabase
      .from('locations')
      .insert(
        SAMPLE_LOCATIONS.map((l) => ({
          org_id: orgId,
          name: l.name,
          address: l.address,
          city: l.city,
          state: l.state,
          status: 'active',
        }))
      )
      .select('id');
    if (locErr) return { ok: false, error: `Locations: ${locErr.message}` };
    const locationIds = (locRows ?? []).map((r) => r.id);

    // 2. Crews
    const { data: crewRows, error: crewErr } = await supabase
      .from('crews')
      .insert(SAMPLE_CREWS.map((name) => ({ org_id: orgId, name })))
      .select('id');
    if (crewErr) return { ok: false, error: `Crews: ${crewErr.message}` };
    const crewIds = crewRows ?? [];

    // 3. Template (minimal: one template, one section, one item for inspections/schedules)
    const { data: templateRow, error: templateErr } = await supabase
      .from('templates')
      .insert({ org_id: orgId, name: 'Standard Cleaning Checklist', is_active: true })
      .select('id')
      .single();
    if (templateErr) return { ok: false, error: `Template: ${templateErr.message}` };
    const templateId = templateRow!.id;

    const { data: sectionRow, error: sectionErr } = await supabase
      .from('template_sections')
      .insert({ org_id: orgId, template_id: templateId, title: 'General', sort_order: 0 })
      .select('id')
      .single();
    if (sectionErr) return { ok: false, error: `Template section: ${sectionErr.message}` };
    const sectionId = sectionRow!.id;

    await supabase.from('template_items').insert({
      org_id: orgId,
      template_section_id: sectionId,
      label: 'Area clean and ready',
      item_type: 'pass_fail',
      sort_order: 0,
    });

    // 4. Inspections (completed, with total_score) – use first 15 locations
    const locationsForInsp = locationIds.slice(0, 15);
    const scores = [88, 92, 91, 95, 94, 96, 89, 93, 90, 97, 94, 91, 92, 88, 94];
    for (let i = 0; i < locationsForInsp.length; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (14 - i));
      await supabase.from('inspections').insert({
        org_id: orgId,
        location_id: locationsForInsp[i],
        template_id: templateId,
        inspector_user_id: userId,
        started_at: d.toISOString(),
        completed_at: d.toISOString(),
        total_score: scores[i],
      });
    }

    // 5. Issues (open and resolved)
    const issueLocations = locationIds.slice(0, 8);
    const issues = [
      { title: 'Restroom dispenser low – 2nd floor', status: 'open' as const },
      { title: 'Spill in lobby – addressed', status: 'resolved' as const },
      { title: 'Light bulb out – hallway', status: 'open' as const },
      { title: 'Floor strip needs replacement', status: 'in_progress' as const },
      { title: 'HVAC filter due', status: 'open' as const },
      { title: 'Trash overflow – loading dock', status: 'resolved' as const },
      { title: 'Carpet stain – conference room', status: 'resolved' as const },
      { title: 'Supply cabinet restock', status: 'open' as const },
    ];
    for (let i = 0; i < issues.length; i++) {
      await supabase.from('issues').insert({
        org_id: orgId,
        location_id: issueLocations[i % issueLocations.length],
        title: issues[i].title,
        status: issues[i].status,
      });
    }

    // 6. Schedules (active, so “Today’s schedule” has data)
    const startDate = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < 5; i++) {
      await supabase.from('schedules').insert({
        org_id: orgId,
        location_id: locationIds[i],
        template_id: templateId,
        crew_id: crewIds[i % crewIds.length]?.id ?? null,
        start_date: startDate,
        recurrence: 'weekly',
        weekday: (new Date().getDay() + i) % 7,
        is_active: true,
      });
    }

    revalidatePath('/app/dashboard');
    revalidatePath('/app/locations');
    revalidatePath('/app/sites');
    revalidatePath('/app/inspections');
    revalidatePath('/app/issues');
    revalidatePath('/app/crews');
    revalidatePath('/app/schedules');
    return { ok: true, message: `Added ${locationIds.length} locations, ${crewIds.length} crews, inspections, issues, and schedules. Refresh the dashboard.` };
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    return { ok: false, error };
  }
}
