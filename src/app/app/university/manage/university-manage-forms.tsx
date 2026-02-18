'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createUniversityCategory, createUniversityFolder } from '../actions';
import { Loader2 } from 'lucide-react';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

interface UniversityManageFormsProps {
  orgId: string;
  categories: CategoryRow[];
}

export function UniversityManageForms({ orgId, categories }: UniversityManageFormsProps) {
  const { toast } = useToast();
  const [catName, setCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [folderCategoryId, setFolderCategoryId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderLoading, setFolderLoading] = useState(false);

  const onAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = catName.trim();
    if (!name) {
      toast({ title: 'Enter a name', variant: 'destructive' });
      return;
    }
    setCatLoading(true);
    try {
      const result = await createUniversityCategory(orgId, name);
      if (result.error) {
        toast({ title: 'Could not add category', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Category added', description: name });
      setCatName('');
    } finally {
      setCatLoading(false);
    }
  };

  const onAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = folderName.trim();
    if (!name) {
      toast({ title: 'Enter a folder name', variant: 'destructive' });
      return;
    }
    if (!folderCategoryId) {
      toast({ title: 'Select a category', variant: 'destructive' });
      return;
    }
    setFolderLoading(true);
    try {
      const result = await createUniversityFolder(orgId, folderCategoryId, name);
      if (result.error) {
        toast({ title: 'Could not add folder', description: result.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Folder added', description: name });
      setFolderName('');
    } finally {
      setFolderLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add category</CardTitle>
          <CardDescription>
            e.g. Floor Care, Terminal Cleaning, Chemical SDS, Customer Service
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddCategory} className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="cat-name" className="sr-only">
                Category name
              </Label>
              <Input
                id="cat-name"
                placeholder="Category name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                disabled={catLoading}
              />
            </div>
            <Button type="submit" disabled={catLoading}>
              {catLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add folder</CardTitle>
          <CardDescription>
            Sub-folders under a category, e.g. Carpet extraction, Bonnet cleaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onAddFolder} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="folder-cat">Category</Label>
              <Select
                value={folderCategoryId}
                onValueChange={setFolderCategoryId}
                disabled={folderLoading || !categories.length}
              >
                <SelectTrigger id="folder-cat">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="folder-name" className="sr-only">
                  Folder name
                </Label>
                <Input
                  id="folder-name"
                  placeholder="Folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  disabled={folderLoading}
                />
              </div>
              <Button type="submit" disabled={folderLoading || !categories.length}>
                {folderLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
