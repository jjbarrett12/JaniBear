import { NextResponse } from 'next/server';
import { requireOperatorOrg } from '@/lib/api-guard';
import { getAIService } from '@/lib/ai/openai-service';

interface Location {
  name: string;
  address?: string;
  square_footage?: number;
  service_days?: string[];
  service_time?: string;
  frequency?: string;
  special_requirements?: string;
}

export async function POST(request: Request) {
  try {
    const guard = await requireOperatorOrg();
    if (!guard.ok) return guard.response;

    const orgId = guard.context.activeOrgId!;
    const body = await request.json();
    const { locations, numCrews, crewCapacities, optimizeFor = 'balanced' } = body;

    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty locations array' },
        { status: 400 }
      );
    }

    if (!numCrews || numCrews < 1) {
      return NextResponse.json(
        { error: 'Number of crews must be at least 1' },
        { status: 400 }
      );
    }

    const aiService = await getAIService(orgId);

    if (aiService) {
      const systemPrompt = `You are an expert at optimizing janitorial crew schedules for efficiency.

Given a list of locations with their service requirements and ${numCrews} crews available, create an optimized assignment plan.

Optimization goals (prioritize based on "${optimizeFor}"):
- "balanced": Even workload distribution across crews
- "geographic": Minimize travel between locations
- "efficiency": Maximize cleaning speed (sqft/hour)

Return your recommendation as JSON:

{
  "assignments": [
    {
      "crew_id": "crew_1",
      "crew_name": "Crew 1",
      "locations": [
        {
          "location_name": "Building A",
          "service_days": ["Monday", "Wednesday", "Friday"],
          "estimated_hours": 2.5,
          "notes": "Any special considerations"
        }
      ],
      "total_sqft": 15000,
      "total_hours_per_week": 7.5,
      "workload_score": 85
    }
  ],
  "summary": "Brief summary of the distribution",
  "recommendations": ["Any suggestions for optimization"],
  "warnings": ["Any potential issues with this schedule"]
}`;

      const userPrompt = `Please create an optimized crew assignment for these locations:

Locations:
${JSON.stringify(locations, null, 2)}

Number of crews: ${numCrews}
${crewCapacities ? `\nCrew capacities:\n${JSON.stringify(crewCapacities, null, 2)}` : ''}

Optimize for: ${optimizeFor}`;

      const aiResult = await aiService.generateJson(systemPrompt, userPrompt, { temperature: 0.4 });
      return NextResponse.json({
        success: true,
        data: aiResult,
        method: 'ai',
      });
    }

    // Fallback: Simple round-robin distribution when AI not configured
    const assignments: Array<{
      crew_id: string;
      crew_name: string;
      locations: Location[];
      total_sqft: number;
      total_hours_per_week: number;
    }> = [];

    for (let i = 0; i < numCrews; i++) {
      assignments.push({
        crew_id: `crew_${i + 1}`,
        crew_name: (crewCapacities as Array<{ name?: string }>)?.[i]?.name || `Crew ${i + 1}`,
        locations: [],
        total_sqft: 0,
        total_hours_per_week: 0,
      });
    }

    const sortedLocations = [...locations].sort(
      (a: Location, b: Location) => (b.square_footage || 0) - (a.square_footage || 0)
    );

    for (const location of sortedLocations) {
      const minWorkloadCrew = assignments.reduce((min, crew) =>
        crew.total_sqft < min.total_sqft ? crew : min
      );
      const sqft = location.square_footage || 5000;
      const estimatedHours = sqft / 3000;
      const daysPerWeek =
        location.service_days?.length ||
        (location.frequency?.match(/(\d+)x/)?.[1] ? parseInt(location.frequency.match(/(\d+)x/)![1], 10) : 3);

      minWorkloadCrew.locations.push(location);
      minWorkloadCrew.total_sqft += sqft;
      minWorkloadCrew.total_hours_per_week += estimatedHours * daysPerWeek;
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments,
        summary: `Distributed ${locations.length} locations across ${numCrews} crews using balanced workload algorithm.`,
        recommendations: [
          'Consider geographic clustering if locations are in different areas',
          'Review crew capacity if any crew has significantly more hours',
        ],
        warnings: [],
      },
      method: 'simple',
    });
  } catch (error) {
    console.error('Crew split error:', error);
    return NextResponse.json(
      { error: 'Failed to split crews' },
      { status: 500 }
    );
  }
}
