'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatPrice } from '@/components/pro-gear/product-card';

export function ProGearROICardClient({
  hoursPerWeek,
  defaultHourlyRateCents,
  productPriceCents,
}: {
  hoursPerWeek: number;
  defaultHourlyRateCents: number;
  productPriceCents: number;
}) {
  const [hourlyRateCents, setHourlyRateCents] = useState(defaultHourlyRateCents);
  const weeklyCents = hoursPerWeek * hourlyRateCents;
  const annualCents = weeklyCents * 52;
  const paybackWeeks =
    productPriceCents <= 0 || weeklyCents <= 0
      ? 0
      : Math.ceil(productPriceCents / weeklyCents);

  return (
    <div className="space-y-3 text-sm">
      <div className="grid gap-2">
        <Label htmlFor="hourly-rate">Your hourly rate ($/hr)</Label>
        <Input
          id="hourly-rate"
          type="number"
          min={0}
          step={0.5}
          value={(hourlyRateCents / 100).toFixed(2)}
          onChange={(e) =>
            setHourlyRateCents(Math.round(parseFloat(e.target.value || '0') * 100))
          }
          className="w-24"
        />
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Weekly savings</span>
        <span className="font-medium">{formatPrice(weeklyCents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Annual savings</span>
        <span className="font-medium">{formatPrice(annualCents)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Payback</span>
        <span className="font-medium">~{paybackWeeks} weeks</span>
      </div>
    </div>
  );
}
