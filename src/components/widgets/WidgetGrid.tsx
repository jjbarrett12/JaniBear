'use client';

import './widgets-grid.css';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Save, RotateCcw, Plus, Copy, Lock, Unlock, Users, LayoutTemplate } from 'lucide-react';
import { WidgetFrame } from './WidgetFrame';
import { AddWidgetDrawer } from './AddWidgetDrawer';
import { LayoutModeSelector } from './LayoutModeSelector';
import { ConfirmReplaceLayoutModal } from './ConfirmReplaceLayoutModal';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { LayoutLockedBanner } from './LayoutLockedBanner';
import { ApplyToTeamModal } from './ApplyToTeamModal';
import { SAVE_AS_TEMPLATE_BUTTON } from './layout-selector-copy';
import type { BreakpointKey, LayoutItem, WidgetDefinition } from '@/lib/widgets/types';
import {
  fetchSavedLayoutsForModule,
  getLayoutFromLocalStorage,
  saveLayout,
  resetLayoutsForModule,
  mergeLayoutWithDefaults,
  getDefaultLayoutForBreakpoint,
} from '@/lib/widgets/layoutPersistence';
import { loadCollapsedWidgets, saveCollapsedWidgets } from '@/lib/widgets/widget-collapsed-persistence';
import {
  saveOrgTemplate,
  setOrgTemplateLock,
  applyTemplateToTeam,
} from '@/actions/widget-layouts';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  fetchTemplates,
  getActiveLayoutMode,
  setActiveLayoutMode,
  selectActiveLayout,
  getRecommendedLayoutForBreakpoint,
  getOrgTemplateLayoutForBreakpoint,
  toTemplateRole,
  getRoleDisplayLabel,
} from '@/lib/ui/layouts';
import type { LayoutMode, TemplateRoleKey } from '@/lib/ui/layouts';
import type { ResolvedTemplates } from '@/lib/ui/layouts';

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };
const COLS = { lg: 4, md: 2, sm: 1 };
const ROW_HEIGHT = 120;
const DRAG_HANDLE = '[data-widget-drag-handle]';

export interface WidgetGridProps {
  moduleKey: string;
  orgId: string;
  widgets: WidgetDefinition[];
  /** Role for recommended/org template lookup (org_members.role or role_enum). If not set, uses "manager". */
  role?: string | null;
  roleEnum?: string | null;
  /** Optional header slot above the grid (e.g. CommandCenterHeader) */
  header?: React.ReactNode;
  /** True if current user can save/lock org template and apply to team (owner, admin, manager). */
  isAdmin?: boolean;
  className?: string;
}

export function WidgetGrid({ moduleKey, orgId, widgets, role, roleEnum, header, isAdmin, className }: WidgetGridProps) {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [savedByBp, setSavedByBp] = useState<Partial<Record<BreakpointKey, { layout: LayoutItem[]; hiddenWidgets: string[] }>>>({});
  const [currentBp, setCurrentBp] = useState<BreakpointKey>('lg');
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLayoutMode, setActiveLayoutModeState] = useState<LayoutMode>('recommended');
  const [templates, setTemplates] = useState<ResolvedTemplates | null>(null);
  const [replaceConfirmOpen, setReplaceConfirmOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [applyToTeamOpen, setApplyToTeamOpen] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [collapsedWidgets, setCollapsedWidgets] = useState<string[]>([]);

  const templateRole = toTemplateRole(role ?? null, roleEnum ?? null);
  const roleLabel = getRoleDisplayLabel(templateRole);
  const hasOrgTemplate = Boolean(templates?.orgRows?.length);
  const isTemplateLocked = templates?.orgTemplateLocked ?? false;
  const templateName = templates?.orgTemplateName ?? null;
  const canEditLayout = !isTemplateLocked || isAdmin === true;
  const widgetMap = new Map(widgets.map((w) => [w.id, w]));

  // When template is locked (non-admin), exit edit mode so no write path is available
  useEffect(() => {
    if (!canEditLayout) setEditMode(false);
  }, [canEditLayout]);

  const resolveBreakpoint = useCallback((width: number): BreakpointKey => {
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    return 'sm';
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted && user) setUserId(user.id);
    });
    return () => { mounted = false; };
  }, []);

  // Seed from localStorage immediately so layout is visible before DB returns
  useEffect(() => {
    if (!orgId || !userId || !moduleKey) return;
    const fromLocal = getLayoutFromLocalStorage(orgId, userId, moduleKey);
    if (Object.keys(fromLocal).length > 0) {
      setSavedByBp((prev) => ({ ...fromLocal, ...prev }));
    }
  }, [orgId, userId, moduleKey]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    fetchSavedLayoutsForModule(orgId, userId, moduleKey).then((data) => {
      if (mounted) setSavedByBp(data);
    });
    return () => { mounted = false; };
  }, [orgId, userId, moduleKey]);

  useEffect(() => {
    if (!userId) return;
    setCollapsedWidgets(loadCollapsedWidgets(orgId, userId, moduleKey));
  }, [orgId, userId, moduleKey]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let mounted = true;
    Promise.all([
      fetchTemplates(supabase, orgId, moduleKey, templateRole),
      getActiveLayoutMode(supabase, userId, orgId, moduleKey),
    ]).then(([tpls, mode]) => {
      if (mounted) {
        setTemplates(tpls);
        setActiveLayoutModeState(mode);
      }
    });
    return () => { mounted = false; };
  }, [orgId, userId, moduleKey, templateRole]);

  useEffect(() => {
    if (!userId) return;
    const onResize = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : BREAKPOINTS.lg;
      setCurrentBp(resolveBreakpoint(w));
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [userId, resolveBreakpoint]);

  useEffect(() => {
    const saved = savedByBp[currentBp] ?? null;
    const recommended = templates ? getRecommendedLayoutForBreakpoint(templates, currentBp) : null;
    const orgTemplate = templates ? getOrgTemplateLayoutForBreakpoint(templates, currentBp) : null;
    const selected = selectActiveLayout(
      activeLayoutMode,
      currentBp,
      saved,
      recommended,
      orgTemplate
    );
    const merged = mergeLayoutWithDefaults(
      selected.layout.length ? { layout: selected.layout, hiddenWidgets: selected.hiddenWidgets ?? [] } : null,
      widgets,
      currentBp
    );
    setLayout(merged);
    setHiddenWidgets(selected.hiddenWidgets ?? []);
    setIsLoading(false);
  }, [savedByBp, currentBp, widgets, moduleKey, activeLayoutMode, templates]);

  const handleLayoutChange = useCallback((newLayout: LayoutItem[]) => {
    setLayout(newLayout);
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await saveLayout(orgId, userId, moduleKey, currentBp, layout, hiddenWidgets);
      setSavedByBp((prev) => ({
        ...prev,
        [currentBp]: { layout, hiddenWidgets },
      }));
      setEditMode(false);
      toast({ title: 'Layout saved', description: 'Your widget layout has been saved.' });
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Could not save layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [orgId, userId, moduleKey, currentBp, layout, hiddenWidgets, toast]);

  const handleReset = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await resetLayoutsForModule(orgId, userId, moduleKey);
      const defaultLayout = getDefaultLayoutForBreakpoint(widgets, currentBp, []);
      setLayout(defaultLayout);
      setHiddenWidgets([]);
      setSavedByBp({});
      setEditMode(false);
      toast({ title: 'Reset to default', description: 'Layout has been reset.' });
    } catch (e: unknown) {
      toast({
        title: 'Reset failed',
        description: e instanceof Error ? e.message : 'Could not reset layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [orgId, userId, moduleKey, widgets, currentBp, toast]);

  const handleRemove = useCallback((widgetId: string) => {
    setLayout((prev) => prev.filter((item) => item.i !== widgetId));
    setHiddenWidgets((prev) => (prev.includes(widgetId) ? prev : [...prev, widgetId]));
  }, []);

  const handleCollapsedToggle = useCallback(
    (widgetId: string) => {
      if (!userId) return;
      setCollapsedWidgets((prev) => {
        const next = prev.includes(widgetId)
          ? prev.filter((id) => id !== widgetId)
          : [...prev, widgetId];
        saveCollapsedWidgets(orgId, userId, moduleKey, next);
        return next;
      });
    },
    [orgId, userId, moduleKey]
  );

  const handleResetSize = useCallback(
    (widgetId: string) => {
      const def = widgetMap.get(widgetId);
      if (!def) return;
      const d = def.default[currentBp] ?? def.default.lg ?? def.default.md ?? def.default.sm;
      setLayout((prev) =>
        prev.map((item) =>
          item.i === widgetId ? { ...item, w: d?.w ?? 1, h: d?.h ?? 1 } : item
        )
      );
    },
    [widgetMap, currentBp]
  );

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      const def = widgetMap.get(widgetId);
      if (!def) return;
      setHiddenWidgets((prev) => prev.filter((id) => id !== widgetId));
      const defaultLayout = getDefaultLayoutForBreakpoint([def], currentBp, []);
      const newItem = defaultLayout[0];
      if (!newItem) return;
      const maxY = layout.length ? Math.max(...layout.map((i) => i.y + i.h)) : 0;
      newItem.y = maxY;
      setLayout((prev) => [...prev, newItem]);
    },
    [widgetMap, currentBp, layout]
  );

  const handleLayoutModeChange = useCallback(
    async (mode: LayoutMode) => {
      setActiveLayoutModeState(mode);
      if (!userId) return;
      const supabase = createClient();
      await setActiveLayoutMode(supabase, userId, orgId, moduleKey, mode);
    },
    [userId, orgId, moduleKey]
  );

  const handleReplaceMyLayout = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await saveLayout(orgId, userId, moduleKey, currentBp, layout, hiddenWidgets);
      setSavedByBp((prev) => ({
        ...prev,
        [currentBp]: { layout, hiddenWidgets },
      }));
      setActiveLayoutModeState('my');
      const supabase = createClient();
      await setActiveLayoutMode(supabase, userId, orgId, moduleKey, 'my');
      toast({ title: 'Layout updated', description: 'Current layout saved as My Layout.' });
    } catch (e: unknown) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : 'Could not replace layout',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [orgId, userId, moduleKey, currentBp, layout, hiddenWidgets, toast]);

  const refetchTemplates = useCallback(async () => {
    const supabase = createClient();
    const tpls = await fetchTemplates(supabase, orgId, moduleKey, templateRole);
    setTemplates(tpls);
  }, [orgId, moduleKey, templateRole]);

  const handleSaveAsTemplate = useCallback(
    async (params: {
      name: string;
      role: TemplateRoleKey;
      isLocked: boolean;
      applyNow: boolean;
    }) => {
      const layoutsByBreakpoint: Record<BreakpointKey, LayoutItem[]> = {
        lg: currentBp === 'lg' ? layout : savedByBp.lg?.layout ?? [],
        md: currentBp === 'md' ? layout : savedByBp.md?.layout ?? [],
        sm: currentBp === 'sm' ? layout : savedByBp.sm?.layout ?? [],
      };
      const { error } = await saveOrgTemplate(
        orgId,
        moduleKey,
        params.role,
        params.name,
        layoutsByBreakpoint,
        params.isLocked
      );
      if (error) {
        toast({ title: 'Failed to save template', description: error, variant: 'destructive' });
        throw new Error(error);
      }
      if (params.applyNow) {
        const applyRes = await applyTemplateToTeam(orgId, moduleKey, params.role, true);
        if (applyRes.error) {
          toast({ title: 'Template saved, apply failed', description: applyRes.error, variant: 'destructive' });
        } else {
          toast({
            title: 'Template saved and applied',
            description:
              applyRes.appliedCount != null ? `Layout pushed to ${applyRes.appliedCount} user(s).` : 'Layout pushed to team.',
          });
        }
      } else {
        toast({ title: 'Template saved', description: 'Org template updated.' });
      }
      await refetchTemplates();
      setActiveLayoutModeState('org_template');
      if (userId) {
        const supabase = createClient();
        await setActiveLayoutMode(supabase, userId, orgId, moduleKey, 'org_template');
      }
    },
    [
      orgId,
      moduleKey,
      currentBp,
      layout,
      savedByBp,
      refetchTemplates,
      toast,
      userId,
    ]
  );

  const handleSetLock = useCallback(
    async (locked: boolean) => {
      const { error } = await setOrgTemplateLock(orgId, moduleKey, templateRole, locked);
      if (error) {
        toast({ title: 'Failed to update lock', description: error, variant: 'destructive' });
        return;
      }
      toast({ title: locked ? 'Layout locked' : 'Layout unlocked', description: locked ? 'Only admins can edit.' : 'Team can customize again.' });
      await refetchTemplates();
    },
    [orgId, moduleKey, templateRole, refetchTemplates, toast]
  );

  const handleApplyToTeam = useCallback(
    async (pushToUsers: boolean) => {
      const { error, appliedCount } = await applyTemplateToTeam(orgId, moduleKey, templateRole, pushToUsers);
      if (error) {
        toast({ title: 'Apply failed', description: error, variant: 'destructive' });
        return;
      }
      toast({
        title: 'Applied to team',
        description: pushToUsers && appliedCount != null ? `Layout pushed to ${appliedCount} user(s).` : 'Org template is now the default for this view.',
      });
    },
    [orgId, moduleKey, templateRole, toast]
  );

  if (isLoading || !userId) {
    return (
      <div className={cn('space-y-4', className)}>
        {header}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[200px] animate-pulse rounded-2xl bg-muted/30" />
      </div>
    );
  }

  const visibleIds = layout.map((i) => i.i);

  return (
    <div className={cn('space-y-4', className)}>
      {header}
      {isTemplateLocked && !isAdmin && <LayoutLockedBanner />}
      <div className="flex flex-wrap items-center gap-2">
        <LayoutModeSelector
          value={activeLayoutMode}
          onChange={handleLayoutModeChange}
          hasOrgTemplate={hasOrgTemplate}
          roleLabel={roleLabel}
          disabled={!userId}
          onRestoreDefault={canEditLayout ? handleReset : undefined}
        />
        {canEditLayout && activeLayoutMode !== 'my' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setReplaceConfirmOpen(true)}
            disabled={isSaving}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Replace my layout
          </Button>
        )}
        {canEditLayout && (
          <Button
            variant={editMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setEditMode((e) => !e)}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Customize layout
          </Button>
        )}
        {editMode && (
          <>
            <Button size="sm" onClick={() => setAddDrawerOpen(true)} className="gap-2" variant="outline">
              <Plus className="h-4 w-4" />
              Add widget
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || activeLayoutMode !== 'my'}
              className="gap-2"
              title={activeLayoutMode !== 'my' ? 'Switch to My Layout to save, or use Replace my layout' : undefined}
            >
              <Save className="h-4 w-4" />
              Save layout
            </Button>
            <Button size="sm" variant="ghost" onClick={handleReset} disabled={isSaving} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset to default
            </Button>
          </>
        )}
        {isAdmin && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSaveTemplateOpen(true)}
              disabled={isSaving || isSavingTemplate}
              className="gap-2"
            >
              <LayoutTemplate className="h-4 w-4" />
              {SAVE_AS_TEMPLATE_BUTTON}
            </Button>
            {hasOrgTemplate && (
              <Button
                size="sm"
                variant={isTemplateLocked ? 'secondary' : 'outline'}
                onClick={() => handleSetLock(!isTemplateLocked)}
                disabled={isSaving}
                className="gap-2"
                title={isTemplateLocked ? 'Unlock so team can customize' : 'Lock so only admins can edit'}
              >
                {isTemplateLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isTemplateLocked ? 'Unlock layout' : 'Lock layout'}
              </Button>
            )}
            {hasOrgTemplate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setApplyToTeamOpen(true)}
                disabled={isSaving}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Apply to team
              </Button>
            )}
          </>
        )}
      </div>

      {layout.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">No widgets on this view.</p>
          {editMode ? (
            <Button variant="outline" size="sm" onClick={() => setAddDrawerOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add widget
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">Turn on Customize layout to add widgets.</p>
          )}
        </div>
      ) : (
        <WidgetGridInner
          layout={layout}
          onLayoutChange={handleLayoutChange}
          editMode={editMode}
          widgets={widgets}
          widgetMap={widgetMap}
          orgId={orgId}
          onRemove={handleRemove}
          onResetSize={handleResetSize}
          breakpoint={currentBp}
          collapsedWidgets={collapsedWidgets}
          onCollapsedToggle={handleCollapsedToggle}
        />
      )}

      <AddWidgetDrawer
        open={addDrawerOpen}
        onClose={() => setAddDrawerOpen(false)}
        widgets={widgets}
        visibleIds={visibleIds}
        hiddenIds={hiddenWidgets}
        onAdd={handleAddWidget}
      />

      <ConfirmReplaceLayoutModal
        open={replaceConfirmOpen}
        onClose={() => setReplaceConfirmOpen(false)}
        onConfirm={handleReplaceMyLayout}
        isLoading={isSaving}
      />
      <SaveAsTemplateModal
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        onSave={async (params) => {
          setIsSavingTemplate(true);
          try {
            await handleSaveAsTemplate(params);
            setSaveTemplateOpen(false);
          } finally {
            setIsSavingTemplate(false);
          }
        }}
        isLoading={isSavingTemplate}
        defaultName={templateName ?? undefined}
        defaultRole={templateRole}
        defaultLock={isTemplateLocked}
      />
      <ApplyToTeamModal
        open={applyToTeamOpen}
        onClose={() => setApplyToTeamOpen(false)}
        onConfirm={handleApplyToTeam}
        isLoading={isSaving}
      />
    </div>
  );
}

interface WidgetGridInnerProps {
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  editMode: boolean;
  widgets: WidgetDefinition[];
  widgetMap: Map<string, WidgetDefinition>;
  orgId: string;
  onRemove: (widgetId: string) => void;
  onResetSize: (widgetId: string) => void;
  breakpoint: BreakpointKey;
  collapsedWidgets: string[];
  onCollapsedToggle: (widgetId: string) => void;
}

function WidgetGridInner({
  layout,
  onLayoutChange,
  editMode,
  widgetMap,
  orgId,
  onRemove,
  onResetSize,
  breakpoint,
  collapsedWidgets,
  onCollapsedToggle,
}: WidgetGridInnerProps) {
  const [GridLayout, setGridLayout] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('react-grid-layout').then((mod) => {
      setGridLayout(() => mod.default);
    });
  }, []);

  const cols = COLS[breakpoint];

  if (!GridLayout) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {layout.map((item) => {
          const def = widgetMap.get(item.i);
          if (!def) return null;
          const Comp = def.component;
          return (
            <div key={item.i} className="min-h-[120px]">
              <WidgetFrame
                widgetId={item.i}
                title={def.title}
                editMode={editMode}
                collapsed={collapsedWidgets.includes(item.i)}
                onCollapsedToggle={() => onCollapsedToggle(item.i)}
                onRemove={editMode ? () => onRemove(item.i) : undefined}
                onResetSize={editMode ? () => onResetSize(item.i) : undefined}
              >
                <Comp orgId={orgId} />
              </WidgetFrame>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('widget-grid-container', editMode && 'widget-grid-edit-mode', '[&_.react-grid-layout]:min-h-[200px]')}>
      <GridLayout
        layout={layout}
        cols={cols}
        rowHeight={ROW_HEIGHT}
        onLayoutChange={(newLayout: LayoutItem[]) => onLayoutChange(newLayout)}
        className="layout"
        draggableHandle={DRAG_HANDLE}
        isDraggable={editMode}
        isResizable={editMode}
        compactType="vertical"
        preventCollision={false}
        useCSSTransforms
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {layout.map((item) => {
          const def = widgetMap.get(item.i);
          if (!def) return null;
          const Comp = def.component;
          return (
            <div key={item.i} data-grid={{ ...item, minW: def.minW ?? 1, minH: def.minH ?? 1 }}>
              <WidgetFrame
                widgetId={item.i}
                title={def.title}
                editMode={editMode}
                collapsed={collapsedWidgets.includes(item.i)}
                onCollapsedToggle={() => onCollapsedToggle(item.i)}
                onRemove={editMode ? () => onRemove(item.i) : undefined}
                onResetSize={editMode ? () => onResetSize(item.i) : undefined}
              >
                <Comp orgId={orgId} />
              </WidgetFrame>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
}
