import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, CheckCircle, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

export default async function DashboardPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  // Fetch KPI data (Mock/Stub for now, or simple queries)
  // In a real implementation, we would call the KPI server actions/queries
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/walkthroughs/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Walkthrough
            </Button>
          </Link>
          <Link href="/crm/opportunities/new">
            <Button variant="outline">
              New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 sent today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inspections</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 overdue</p>
          </CardContent>
        </Card>
        {/* Add more KPIs as needed */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Activity List Stub */}
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Proposal accepted</p>
                  <p className="text-sm text-muted-foreground">Acme Corp signed contract</p>
                </div>
                <div className="ml-auto font-medium">+$1,999.00</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Walkthrough completed</p>
                  <p className="text-sm text-muted-foreground">Westside Office Park</p>
                </div>
                <div className="ml-auto font-medium">Just now</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/qc/inspections/new" className="block">
                <Button variant="ghost" className="w-full justify-start">Run Inspection</Button>
              </Link>
              <Link href="/crm/clients/new" className="block">
                <Button variant="ghost" className="w-full justify-start">Add Client</Button>
              </Link>
              <Link href="/settings/users" className="block">
                <Button variant="ghost" className="w-full justify-start">Invite User</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
