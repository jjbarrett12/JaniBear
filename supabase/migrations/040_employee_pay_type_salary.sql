-- Add pay type (hourly vs salary) and salary amount for employees.
-- hourly_rate remains for hourly; salary_amount is annual salary when pay_type = 'salary'.

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'hourly' CHECK (pay_type IN ('hourly', 'salary'));

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(12, 2);

COMMENT ON COLUMN employees.pay_type IS 'hourly = use hourly_rate; salary = use salary_amount (annual)';
COMMENT ON COLUMN employees.salary_amount IS 'Annual salary in dollars when pay_type = salary';
