-- Seed Member Pro Gear: 4 gloves, 6 equipment (2 with private label, 3 with labor savings)
-- Run after 031_pro_gear_module.sql

INSERT INTO pro_gear_products (
  slug, name, category, brand, description, images,
  retail_price_cents, member_price_cents, savings_percent, shipping_estimate_days, featured, active,
  glove_fields, equipment_fields,
  estimated_labor_hours_saved_per_week, avg_operator_hourly_rate_cents, recommended_sqft_min, recommended_sqft_max,
  private_label_available, private_label_moq_units, private_label_notes
) VALUES
-- Gloves (4)
('nitrile-gloves-4mil-m', 'Nitrile Gloves 4mil M', 'gloves', 'Bear Supply', 'Heavy-duty nitrile, medium. Ideal for janitorial and kitchen.', '[]', 2499, 1899, 24, 3, true, true,
  '{"material": "nitrile", "color": "blue", "thickness_mil": 4, "size_range": "M", "case_count": 1000}'::jsonb, NULL, NULL, 2000, NULL, NULL, false, NULL, NULL),
('vinyl-gloves-clear-l', 'Vinyl Gloves Clear L', 'gloves', 'Bear Supply', 'Clear vinyl, large. Light duty, food safe.', '[]', 1299, 999, 23, 3, false, true,
  '{"material": "vinyl", "color": "clear", "thickness_mil": 2, "size_range": "L", "case_count": 1000}'::jsonb, NULL, NULL, 2000, NULL, NULL, false, NULL, NULL),
('nitrile-gloves-6mil-xl', 'Nitrile Gloves 6mil XL', 'gloves', 'Bear Supply', 'Extra thick nitrile, XL. Chemical resistance.', '[]', 3499, 2699, 23, 5, true, true,
  '{"material": "nitrile", "color": "black", "thickness_mil": 6, "size_range": "XL", "case_count": 500}'::jsonb, NULL, NULL, 2000, NULL, NULL, false, NULL, NULL),
('latex-gloves-powdered-m', 'Latex Gloves Powdered M', 'gloves', 'Bear Supply', 'Powdered latex, medium. Comfort fit.', '[]', 1999, 1499, 25, 3, false, true,
  '{"material": "latex", "color": "natural", "thickness_mil": 3, "size_range": "M", "case_count": 1000}'::jsonb, NULL, NULL, 2000, NULL, NULL, false, NULL, NULL),

-- Equipment (6) — 2 with private label, 3 with labor savings
('autoscrubber-20', 'Auto Scrubber 20"', 'equipment', 'ProClean', '20" walk-behind auto scrubber. Battery or cord.', '[]', 899900, 749900, 17, 7, true, true,
  NULL, '{"type": "auto_scrubber", "power": "battery", "width_in": 20, "battery": "36V", "warranty_years": 2}'::jsonb,
  8, 2000, 15000, 50000, true, 10, 'MOQ 10 units for custom branding.'),

('vacuum-commercial-14', 'Commercial Upright Vacuum 14"', 'equipment', 'ProClean', '14" commercial upright. HEPA filter.', '[]', 44900, 37900, 16, 5, true, true,
  NULL, '{"type": "upright_vacuum", "power": "corded", "width_in": 14, "battery": null, "warranty_years": 1}'::jsonb,
  3, 2000, 5000, 25000, false, NULL, NULL),

('burnisher-21', 'Floor Burnisher 21"', 'equipment', 'ProClean', '21" high-speed burnisher. Propane or electric.', '[]', 429900, 359900, 16, 10, true, true,
  NULL, '{"type": "burnisher", "power": "electric", "width_in": 21, "battery": null, "warranty_years": 2}'::jsonb,
  4, 2000, 20000, 80000, true, 5, 'Private label available; MOQ 5.'),

('extractor-portable', 'Portable Carpet Extractor', 'equipment', 'ProClean', 'Portable carpet extractor. Hot water.', '[]', 189900, 159900, 16, 7, false, true,
  NULL, '{"type": "extractor", "power": "corded", "width_in": 12, "battery": null, "warranty_years": 1}'::jsonb,
  2, 2000, 3000, 15000, false, NULL, NULL),

('backpack-vac-18l', 'Backpack Vacuum 18L', 'equipment', 'ProClean', '18L backpack vacuum. HEPA. Corded.', '[]', 59900, 49900, 17, 5, false, true,
  NULL, '{"type": "backpack_vacuum", "power": "corded", "width_in": null, "battery": null, "warranty_years": 1}'::jsonb,
  5, 2000, 10000, 50000, false, NULL, NULL),

('wet-dry-vac-16gal', 'Wet/Dry Vac 16 Gal', 'equipment', 'ProClean', '16 gallon wet/dry vac. Stainless tank.', '[]', 29900, 24900, 17, 5, false, true,
  NULL, '{"type": "wet_dry_vac", "power": "corded", "width_in": null, "battery": null, "warranty_years": 1}'::jsonb,
  NULL, 2000, NULL, NULL, false, NULL, NULL)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  brand = EXCLUDED.brand,
  description = EXCLUDED.description,
  retail_price_cents = EXCLUDED.retail_price_cents,
  member_price_cents = EXCLUDED.member_price_cents,
  savings_percent = EXCLUDED.savings_percent,
  glove_fields = EXCLUDED.glove_fields,
  equipment_fields = EXCLUDED.equipment_fields,
  estimated_labor_hours_saved_per_week = EXCLUDED.estimated_labor_hours_saved_per_week,
  private_label_available = EXCLUDED.private_label_available,
  private_label_moq_units = EXCLUDED.private_label_moq_units,
  private_label_notes = EXCLUDED.private_label_notes,
  updated_at = NOW();
