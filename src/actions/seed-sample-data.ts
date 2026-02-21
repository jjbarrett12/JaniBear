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

export type SeedResult = { ok: true; message: string } | { ok: false; error: string };

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
