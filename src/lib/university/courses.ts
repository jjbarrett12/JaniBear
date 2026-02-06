/**
 * Jani-Bear University course catalog and lesson content.
 * Premium subscribers (Grizzly / Kodiak) get full access.
 */

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  content: string[];
  tips?: string[];
  equipment?: string[];
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide icon name
  totalLessons: number;
  estimatedTime: string;
  lessons: Lesson[];
}

export const universityCourses: Course[] = [
  {
    slug: 'carpet-extraction',
    title: 'Carpet Extraction',
    description: 'Learn proper carpet cleaning with extractors: pre-vacuuming, spotting, solution application, and extraction techniques for commercial carpets.',
    icon: 'Layers',
    totalLessons: 4,
    estimatedTime: '45 min',
    lessons: [
      {
        id: '1',
        title: 'Introduction to Carpet Extraction',
        duration: '8 min',
        content: [
          'Carpet extraction removes deep soil and allergens using hot water extraction (steam cleaning). Understanding fiber types (nylon, olefin, polyester) helps you choose the right chemicals and settings.',
          'Commercial carpets typically have a shorter pile and denser construction than residential. Always check the manufacturer tag for cleaning codes (W, S, WS, X) before cleaning.',
          'Pre-inspection: identify stains, high-traffic areas, and any damage. Document and report to the client before starting.',
        ],
        tips: ['Always pre-vacuum to remove dry soil—it extends carpet life and improves extraction results.', 'Test spotting agents in an inconspicuous area first.'],
        equipment: ['Extractor (portable or truckmount)', 'Vacuum (upright or backpack)', 'Sprayer', 'Carpet rake'],
      },
      {
        id: '2',
        title: 'Pre-Vacuuming and Spotting',
        duration: '10 min',
        content: [
          'Pre-vacuum thoroughly in multiple directions to loosen and remove dry soil. Use a carpet rake or brush attachment; avoid beater bars on delicate or loop piles.',
          'Spot treatment: apply appropriate spotting agent (protein, tannin, oil, dye) based on stain type. Agitate gently with a soft brush, then allow dwell time before extraction.',
          'Never overwet spots—blot and extract; overwetting can cause browning or wicking.',
        ],
        tips: ['Work in sections (e.g., 4x4 or 6x6) to avoid missing areas.', 'Keep a spotting guide handy for common stains (coffee, gum, blood, grease).'],
        equipment: ['Upright or backpack vacuum', 'Spotting kit', 'White towels', 'Soft brush'],
      },
      {
        id: '3',
        title: 'Solution Application and Dwell Time',
        duration: '12 min',
        content: [
          'Dilute prespray or encapsulation product per label. Apply evenly with a sprayer or rotary with spray bar; do not overwet. Typical dwell time is 5–15 minutes—check product label.',
          'Encapsulation products crystallize soil when dry and are removed by vacuuming; hot water extraction may follow for deeper cleaning.',
          'For hot water extraction: fill tank with hot water and approved detergent at correct dilution. Agitation (optional) helps loosen soil before extraction.',
        ],
        tips: ['Use a consistent overlap (e.g., 50%) when spraying to avoid streaks.', 'In high-traffic areas, allow slightly longer dwell and consider a second pass.'],
        equipment: ['Sprayer or rotary with spray bar', 'Prespray/encapsulation product', 'Extractor with solution tank'],
      },
      {
        id: '4',
        title: 'Extraction Passes and Drying',
        duration: '15 min',
        content: [
          'Make slow, overlapping passes with the extractor wand. Pull trigger to apply solution (if inline) and release to extract. Overlap each pass by several inches. Multiple dry passes remove more moisture.',
          'Keep the vacuum running and move at a steady pace—too fast leaves moisture and residue; too slow overwets. Empty recovery tank when it reaches 2/3 full.',
          'After extraction: ensure adequate airflow (open doors, use fans or air movers). Do not allow foot traffic until carpet is dry to prevent resoiling and matting.',
        ],
        tips: ['Two slow dry passes often outperform one fast wet pass.', 'Place “Wet floor” or “Carpet drying” signs and block off area if possible.'],
        equipment: ['Extractor wand and hose', 'Air movers or fans', 'Wet floor signs'],
      },
    ],
  },
  {
    slug: 'floor-buffing-stripping',
    title: 'Floor Buffing & Stripping',
    description: 'Master burnishing, buffing, and stripping of hard floors: VCT, tile, and sealed concrete. Learn pad selection, chemical use, and finish application.',
    icon: 'Square',
    totalLessons: 5,
    estimatedTime: '55 min',
    lessons: [
      {
        id: '1',
        title: 'Hard Floor Types and Finish Basics',
        duration: '10 min',
        content: [
          'Common commercial hard floors: VCT (vinyl composition tile), luxury vinyl, tile, sealed concrete, and wood. Each has specific care requirements; always confirm floor type before cleaning.',
          'Floor finish (wax) protects the floor and provides shine. Multiple coats build durability. Finish can be water-based (most common) or solvent-based. Stripping removes old finish; buffing/burnishing restores shine without removing finish.',
          'Burnishing uses high-speed machines (1000+ RPM) with a burnishing pad to create a glossy surface. Buffing uses lower RPM and can be dry (maintenance) or spray-buff (light cleaning and shine).',
        ],
        tips: ['Check SDS and compatibility before using any chemical on a floor.', 'Use walk-off mats at entrances to reduce soil and extend finish life.'],
        equipment: ['Burnisher or buffer', 'Pads (burnishing, buffing, stripping)', 'Mop bucket and wringer', 'Finish'],
      },
      {
        id: '2',
        title: 'Daily and Periodic Maintenance',
        duration: '8 min',
        content: [
          'Daily: dust mop or dry vacuum to remove grit; damp mop with neutral cleaner at proper dilution. Avoid overwetting—excess moisture dulls finish and can damage seams.',
          'Periodic: spray-buff or burnish to restore shine without stripping. Use a red or tan pad with spray-buff product, or a burnishing pad (e.g., white or blue) for high-speed burnishing.',
          'Burnisher pads are color-coded by aggressiveness; use the least aggressive pad that achieves the desired shine to extend finish life.',
        ],
        tips: ['Burnish in one direction for a consistent look.', 'Empty the burnisher pad frequently to avoid scratching.'],
        equipment: ['Burnisher', 'Spray bottle with spray-buff solution', 'Burnishing pad'],
      },
      {
        id: '3',
        title: 'Stripping: When and How',
        duration: '12 min',
        content: [
          'Strip when finish is heavily worn, discolored, or building up. Typically 1–4 times per year depending on traffic. Use a stripper designed for your finish type at the recommended dilution.',
          'Process: sweep/vacuum, apply stripper solution and allow dwell (5–15 min), scrub with a stripping pad (black or brown) under an auto-scrubber or floor machine. Pick up solution with a wet vac or auto-scrubber. Rinse with clean water and pick up. Let floor dry completely before applying new finish.',
          'Never mix chemicals. Work in sections; avoid walking on wet stripper to prevent slips and contamination.',
        ],
        tips: ['Use a test area to confirm stripper dilution and dwell time.', 'Multiple rinse passes may be needed to remove all residue—residue causes poor adhesion of new finish.'],
        equipment: ['Floor machine or auto-scrubber', 'Stripping pad', 'Stripper chemical', 'Wet vac or recovery tank', 'Neutral rinse'],
      },
      {
        id: '4',
        title: 'Applying Finish',
        duration: '10 min',
        content: [
          'Apply finish only to a clean, dry, residue-free floor. Use a clean applicator (lambswool or foam pad) or pour and spread with a mop. Apply thin, even coats; 3–4 coats are typical for commercial.',
          'Allow each coat to dry completely (usually 20–30 min) before applying the next. Drying time depends on temperature and humidity. Cross-hatch or use a finish applicator for even coverage.',
          'After final coat is dry, allow 1–2 hours before light traffic and 24 hours before heavy traffic or burnishing.',
        ],
        tips: ['Label finish bottles with open date; use within recommended shelf life.', 'Work from the far corner toward the exit to avoid walking on wet finish.'],
        equipment: ['Finish applicator or mop', 'Finish product', 'Barrier tape or signs'],
      },
      {
        id: '5',
        title: 'Burnishing for Maximum Shine',
        duration: '15 min',
        content: [
          'After finish has fully cured, burnish with a high-speed burnisher (1000–2000 RPM) and a suitable pad. This compacts the finish and produces a high gloss.',
          'Use consistent, overlapping passes; keep the machine moving to avoid burning the finish. Burnish regularly (e.g., weekly) as part of maintenance to maintain shine and extend time between recoats.',
          'Different pads (e.g., white, blue) offer different levels of cut and shine; follow manufacturer guidelines for your machine and finish.',
        ],
        tips: ['Clean the pad often; embedded debris can scratch the floor.', 'Burnish when the area is free of dust and traffic for best results.'],
        equipment: ['High-speed burnisher', 'Burnishing pads', 'Pad driver'],
      },
    ],
  },
  {
    slug: 'equipment-operation',
    title: 'Equipment Operation',
    description: 'Learn to safely and effectively operate commercial janitorial equipment: extractors, floor machines, burnishers, auto-scrubbers, and vacuums.',
    icon: 'Settings',
    totalLessons: 5,
    estimatedTime: '50 min',
    lessons: [
      {
        id: '1',
        title: 'Vacuums: Upright, Backpack, and Wet/Dry',
        duration: '10 min',
        content: [
          'Upright vacuums: best for large open carpeted areas. Adjust height for pile; empty bag or canister when full to maintain suction. Check belts and brushes periodically.',
          'Backpack vacuums: ideal for multiple rooms and stairs. Wear straps adjusted for comfort; use the correct wand and attachments. Empty before the filter is overloaded.',
          'Wet/dry vacuums: used for liquid pickup (extraction recovery, spills). Ensure tank is rated for liquid use; never use with flammable liquids. Empty and rinse tank after use.',
        ],
        tips: ['Replace bags or empty canisters before they are completely full.', 'Inspect hoses and wands for clogs if suction drops.'],
        equipment: ['Upright vacuum', 'Backpack vacuum', 'Wet/dry vac'],
      },
      {
        id: '2',
        title: 'Carpet Extractors',
        duration: '10 min',
        content: [
          'Portable extractors: carry solution and recovery tanks; good for smaller areas and spot work. Fill with hot water and approved detergent; use correct hose and wand for the unit.',
          'Truckmount extractors: powerful units mounted in a vehicle; hose runs to the building. Higher flow and vacuum improve cleaning and dry times. Ensure proper chemical injection and recovery tank drainage.',
          'Always follow the manufacturer’s operating instructions: solution temperature, flow rate, and vacuum settings. Overwetting damages carpet and backing.',
        ],
        tips: ['Pre-vacuum before extraction to protect the machine and improve results.', 'Rinse solution and recovery tanks after each use; sanitize periodically.'],
        equipment: ['Portable extractor', 'Wand and hose', 'Solution and recovery tanks'],
      },
      {
        id: '3',
        title: 'Floor Machines and Auto-Scrubbers',
        duration: '10 min',
        content: [
          'Floor machines (rotary): single disc, 17–20 inch typical. Used for scrubbing, stripping, and spray-buffing. Pad selection (color-coded) matches task: stripping (black/brown), scrubbing (green), buffing (red/tan), burnishing (white/blue).',
          'Auto-scrubbers: walk-behind or ride-on; dispense solution, scrub with pads or brushes, and pick up solution in one pass. Ideal for large hard floors. Set solution flow and vacuum to avoid leaving excess water.',
          'Safety: keep cords and hoses clear of the path; watch for wet floors and obstacles. Use in well-ventilated areas when using chemicals.',
        ],
        tips: ['Match pad type to the task to avoid damaging floors or wasting effort.', 'Change pads when they are worn or heavily soiled.'],
        equipment: ['Floor machine', 'Auto-scrubber', 'Pads and brushes', 'Squeegee and vacuum'],
      },
      {
        id: '4',
        title: 'Burnishers',
        duration: '10 min',
        content: [
          'Burnishers run at high speed (1000–2500 RPM) to polish floor finish. They do not dispense solution; use on dry, finished floors. Pad spins horizontally under the machine.',
          'Pad types: ultra-high-speed (UHS) pads for maximum shine; standard burnishing pads for routine use. Always use a pad driver; never run without a pad.',
          'Operation: start at the edge, make overlapping passes, and work in sections. Keep the machine moving to prevent burning or swirl marks.',
        ],
        tips: ['Let new finish cure 24–48 hours before burnishing.', 'Clean and store pads properly to extend life.'],
        equipment: ['Burnisher', 'Pad driver', 'Burnishing pads'],
      },
      {
        id: '5',
        title: 'Safety and Maintenance',
        duration: '10 min',
        content: [
          'Read the operator manual for each piece of equipment. Use PPE as required: slip-resistant footwear, gloves when handling chemicals, eye protection if splashing is possible.',
          'Inspect equipment before use: cords, hoses, tanks, pads, and safety guards. Report damage or malfunction; do not use defective equipment.',
          'Routine maintenance: empty and rinse tanks, clean filters, check belts and brushes, store in a dry area. Follow the manufacturer’s schedule for deeper maintenance.',
        ],
        tips: ['Complete any required training or certification before operating equipment.', 'Keep a maintenance log for each machine.'],
        equipment: ['Operator manuals', 'PPE', 'Maintenance checklist'],
      },
    ],
  },
];

export function getCourseBySlug(slug: string): Course | undefined {
  return universityCourses.find((c) => c.slug === slug);
}

export function getAllCourseSlugs(): string[] {
  return universityCourses.map((c) => c.slug);
}
