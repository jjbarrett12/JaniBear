'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface FilterConfig {
  field: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  onFilterChange: (filters: Record<string, any>) => void;
  savedFilters?: Array<{ id: string; name: string; filters: Record<string, any> }>;
  onSaveFilter?: (name: string, filters: Record<string, any>) => void;
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  savedFilters = [],
  onSaveFilter,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const { toast } = useToast();

  const handleFilterChange = (field: string, value: any) => {
    const newFilters = { ...filterValues, [field]: value };
    setFilterValues(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    setFilterValues({});
    onFilterChange({});
    toast({
      title: 'Filters cleared',
      description: 'All filters have been reset',
    });
  };

  const handleSaveFilter = () => {
    if (!saveFilterName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this filter',
        variant: 'destructive',
      });
      return;
    }

    if (onSaveFilter) {
      onSaveFilter(saveFilterName, filterValues);
      toast({
        title: 'Filter saved',
        description: `"${saveFilterName}" has been saved`,
      });
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const handleLoadFilter = (savedFilter: { filters: Record<string, any> }) => {
    setFilterValues(savedFilter.filters);
    onFilterChange(savedFilter.filters);
    setIsOpen(true);
  };

  const activeFilterCount = Object.values(filterValues).filter((v) => v !== '' && v !== null && v !== undefined).length;

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="lg"
        className="h-12"
      >
        <Filter className="h-5 w-5 mr-2" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-2 right-0 z-50 w-96 shadow-xl border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
            <div className="flex gap-2">
              {onSaveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {savedFilters.length > 0 && (
              <div className="space-y-2 pb-4 border-b">
                <Label className="text-sm font-semibold">Saved Filters</Label>
                <div className="space-y-1">
                  {savedFilters.map((saved) => (
                    <Button
                      key={saved.id}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-sm"
                      onClick={() => handleLoadFilter(saved)}
                    >
                      {saved.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {showSaveDialog && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
                <Label>Save Filter As</Label>
                <div className="flex gap-2">
                  <Input
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    placeholder="Filter name"
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleSaveFilter}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowSaveDialog(false);
                      setSaveFilterName('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {filters.map((filter) => (
              <div key={filter.field} className="space-y-2">
                <Label htmlFor={filter.field}>{filter.label}</Label>
                {filter.type === 'text' && (
                  <Input
                    id={filter.field}
                    value={filterValues[filter.field] || ''}
                    onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                  />
                )}
                {filter.type === 'select' && filter.options && (
                  <Select
                    value={filterValues[filter.field] || ''}
                    onValueChange={(value) => handleFilterChange(filter.field, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All</SelectItem>
                      {filter.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {filter.type === 'date' && (
                  <Input
                    id={filter.field}
                    type="date"
                    value={filterValues[filter.field] || ''}
                    onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                  />
                )}
                {filter.type === 'number' && (
                  <Input
                    id={filter.field}
                    type="number"
                    value={filterValues[filter.field] || ''}
                    onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                    placeholder={`Filter by ${filter.label.toLowerCase()}`}
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1"
                size="lg"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                className="flex-1"
                size="lg"
              >
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
