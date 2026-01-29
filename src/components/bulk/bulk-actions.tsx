'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkActionsProps<T> {
  selectedItems: T[];
  onBulkDelete?: (items: T[]) => Promise<void>;
  onBulkUpdate?: (items: T[], updates: Record<string, any>) => Promise<void>;
  updateFields?: Array<{ field: string; label: string; options?: { value: string; label: string }[] }>;
  getItemId: (item: T) => string;
  getItemName?: (item: T) => string;
}

export function BulkActions<T>({
  selectedItems,
  onBulkDelete,
  onBulkUpdate,
  updateFields = [],
  getItemId,
  getItemName,
}: BulkActionsProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [updateValues, setUpdateValues] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (selectedItems.length === 0) {
    return null;
  }

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkDelete(selectedItems);
      toast({
        title: 'Items deleted',
        description: `Successfully deleted ${selectedItems.length} item(s)`,
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete items',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!onBulkUpdate) return;

    const updates = Object.fromEntries(
      Object.entries(updateValues).filter(([_, value]) => value !== '' && value !== null)
    );

    if (Object.keys(updates).length === 0) {
      toast({
        title: 'No updates',
        description: 'Please select at least one field to update',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedItems, updates);
      toast({
        title: 'Items updated',
        description: `Successfully updated ${selectedItems.length} item(s)`,
      });
      setUpdateValues({});
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update items',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <CheckSquare className="h-5 w-5 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        {selectedItems.length} item(s) selected
      </span>
      
      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {onBulkUpdate && updateFields.length > 0 && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              disabled={isProcessing}
            >
              <Edit className="h-4 w-4 mr-2" />
              Bulk Update
            </Button>
            
            {isOpen && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border-2 rounded-lg shadow-xl z-50 p-4 space-y-3">
                {updateFields.map((field) => (
                  <div key={field.field} className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      {field.label}
                    </label>
                    {field.options ? (
                      <Select
                        value={updateValues[field.field] || ''}
                        onValueChange={(value) =>
                          setUpdateValues({ ...updateValues, [field.field]: value })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No change</SelectItem>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <input
                        type="text"
                        value={updateValues[field.field] || ''}
                        onChange={(e) =>
                          setUpdateValues({ ...updateValues, [field.field]: e.target.value })
                        }
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full h-9 px-3 text-sm border rounded-md"
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    onClick={handleBulkUpdate}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsOpen(false);
                      setUpdateValues({});
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isProcessing}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
