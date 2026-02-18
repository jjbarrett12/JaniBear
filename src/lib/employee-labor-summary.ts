/**
 * Compute monthly labor cost from active employees (hourly + salary).
 * Used by Financial Health to show real payroll impact on cashflow and labor %.
 */

import { createClient } from '@/lib/supabase/server';

const HOURS_PER_MONTH = 160; // 40 hrs/week × 4 weeks

export interface EmployeeLaborSummary {
  monthlyLaborDollars: number;
  hourlyTotal: number;
  salaryTotal: number;
  activeCount: number;
  hourlyCount: number;
  salaryCount: number;
}

export async function getEmployeeLaborSummary(orgId: string): Promise<EmployeeLaborSummary> {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from('employees')
    .select('pay_type, hourly_rate, salary_amount')
    .eq('org_id', orgId)
    .eq('status', 'active');

  let monthlyLaborDollars = 0;
  let hourlyTotal = 0;
  let salaryTotal = 0;
  let hourlyCount = 0;
  let salaryCount = 0;

  for (const emp of employees ?? []) {
    const payType = emp.pay_type ?? 'hourly';
    if (payType === 'salary' && emp.salary_amount != null) {
      const annual = Number(emp.salary_amount);
      monthlyLaborDollars += annual / 12;
      salaryTotal += annual / 12;
      salaryCount += 1;
    } else if (emp.hourly_rate != null) {
      const rate = Number(emp.hourly_rate);
      monthlyLaborDollars += rate * HOURS_PER_MONTH;
      hourlyTotal += rate * HOURS_PER_MONTH;
      hourlyCount += 1;
    }
  }

  return {
    monthlyLaborDollars: Math.round(monthlyLaborDollars * 100) / 100,
    hourlyTotal: Math.round(hourlyTotal * 100) / 100,
    salaryTotal: Math.round(salaryTotal * 100) / 100,
    activeCount: employees?.length ?? 0,
    hourlyCount,
    salaryCount,
  };
}
