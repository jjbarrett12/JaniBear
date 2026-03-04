import { requireOrg } from '@/lib/auth';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { ScopeBuilderSplitView } from '@/components/sales/scope-builder-split-view';

export default async function ScopeBuilderPage() {
  await requireOrg();
  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Scope Builder</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Scope Builder"
          description="Define areas, frequencies, tasks, staffing, and supplies. Generate proposal when ready."
        />
        <ScopeBuilderSplitView />
      </div>
    </SalesPageShell>
  );
}
