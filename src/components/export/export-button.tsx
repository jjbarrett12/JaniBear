'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  data: any[];
  filename: string;
  type?: 'csv' | 'json';
  formatData?: (data: any[]) => any[];
}

export function ExportButton({ data, filename, type = 'csv', formatData }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There is no data available to export',
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatData ? formatData(data) : data;
    const headers = Object.keys(formattedData[0]);
    const csvContent = [
      headers.join(','),
      ...formattedData.map((row) =>
        headers.map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There is no data available to export',
        variant: 'destructive',
      });
      return;
    }

    const formattedData = formatData ? formatData(data) : data;
    const jsonContent = JSON.stringify(formattedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (type === 'csv') {
        exportToCSV(data, filename);
      } else {
        exportToJSON(data, filename);
      }
      toast({
        title: 'Export successful',
        description: `Your data has been exported as ${type.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || data.length === 0}
      variant="outline"
      size="lg"
      className="h-12"
    >
      {isExporting ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : type === 'csv' ? (
        <FileSpreadsheet className="h-5 w-5 mr-2" />
      ) : (
        <FileText className="h-5 w-5 mr-2" />
      )}
      {isExporting ? 'Exporting...' : `Export ${type.toUpperCase()}`}
    </Button>
  );
}
