'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Calendar, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SectionHeader } from './SectionHeader';
import type {
  MissedTaskRecord,
  MissedTaskSeverity,
  MissedTaskReason,
  MissedTaskStatus,
} from '../types';

const REASON_LABELS: Record<MissedTaskReason, string> = {
  not_submitted: 'Not submitted',
  no_evidence: 'No evidence',
  qc_failed: 'QC failed',
  client_complaint: 'Client complaint',
};

const STATUS_LABELS: Record<MissedTaskStatus, string> = {
  unreviewed: 'Unreviewed',
  disputed: 'Disputed',
  confirmed: 'Confirmed',
  resolved: 'Resolved',
};

function formatShift(record: MissedTaskRecord): string {
  const start = new Date(record.shiftStart);
  const end = new Date(record.shiftEnd);
  const dateStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${dateStr} · ${startStr} – ${endStr}`;
}

function TaskChips({ tasks }: { tasks: MissedTaskRecord['tasks'] }) {
  const maxShow = 2;
  const rest = tasks.length - maxShow;
  return (
    <div className="flex flex-wrap gap-1">
      {tasks.slice(0, maxShow).map((t) => (
        <span
          key={t.taskId}
          className="inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-white/10 text-white/90 border border-white/15"
        >
          {t.taskName}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white/70">
          +{rest}
        </span>
      )}
    </div>
  );
}

interface MissedTasksPanelProps {
  records: MissedTaskRecord[];
  rightAction?: React.ReactNode;
}

export function MissedTasksPanel({ records, rightAction }: MissedTasksPanelProps) {
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');

  const locations = useMemo(() => {
    const set = new Set(records.map((r) => r.locationName));
    return Array.from(set).sort();
  }, [records]);

  const employees = useMemo(() => {
    const set = new Set(records.map((r) => r.employeeName));
    return Array.from(set).sort();
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (locationFilter !== 'all') {
      list = list.filter((r) => r.locationName === locationFilter);
    }
    if (employeeFilter !== 'all') {
      list = list.filter((r) => r.employeeName === employeeFilter);
    }
    if (severityFilter !== 'all') {
      list = list.filter((r) => r.severity === severityFilter);
    }
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (dateRange === '24h') {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - 24);
      list = list.filter((r) => new Date(r.createdAt) >= cutoff);
    } else if (dateRange === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      list = list.filter((r) => new Date(r.createdAt) >= cutoff);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [records, locationFilter, employeeFilter, severityFilter, statusFilter, dateRange]);

  const newestUnreviewedId = useMemo(() => {
    const unreviewed = filtered.filter((r) => r.status === 'unreviewed');
    return unreviewed.length > 0 ? unreviewed[0].id : null;
  }, [filtered]);

  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <SectionHeader
          title="Missed Tasks / Coverage Gaps"
          rightAction={
            rightAction ?? (
              <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/app/ops/missed-tasks">View all</Link>
              </Button>
            )}
        />
        {/* TODO: Replace with server-side filtering (org-scoped); wire location/employee to building detail and profile. */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px] h-9 bg-[#0F172A]/80 border-white/10 text-white text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-white/60" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="all" className="text-white focus:bg-white/10">
                All locations
              </SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc} className="text-white focus:bg-white/10">
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[160px] h-9 bg-[#0F172A]/80 border-white/10 text-white text-sm">
              <User className="h-3.5 w-3.5 mr-1.5 text-white/60" />
              <SelectValue placeholder="Employee" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="all" className="text-white focus:bg-white/10">
                All employees
              </SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp} value={emp} className="text-white focus:bg-white/10">
                  {emp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[120px] h-9 bg-[#0F172A]/80 border-white/10 text-white text-sm">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="all" className="text-white focus:bg-white/10">
                All
              </SelectItem>
              <SelectItem value="critical" className="text-white focus:bg-white/10">
                Critical
              </SelectItem>
              <SelectItem value="standard" className="text-white focus:bg-white/10">
                Standard
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-9 bg-[#0F172A]/80 border-white/10 text-white text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="all" className="text-white focus:bg-white/10">
                All statuses
              </SelectItem>
              {(['unreviewed', 'disputed', 'confirmed', 'resolved'] as const).map((s) => (
                <SelectItem key={s} value={s} className="text-white focus:bg-white/10">
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px] h-9 bg-[#0F172A]/80 border-white/10 text-white text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-white/60" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F172A] border-white/10">
              <SelectItem value="24h" className="text-white focus:bg-white/10">
                Last 24h
              </SelectItem>
              <SelectItem value="7d" className="text-white focus:bg-white/10">
                Last 7 days
              </SelectItem>
              <SelectItem value="all" className="text-white focus:bg-white/10">
                All
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60 font-medium w-[1%]"></TableHead>
              <TableHead className="text-white/60 font-medium">Location</TableHead>
              <TableHead className="text-white/60 font-medium">Shift</TableHead>
              <TableHead className="text-white/60 font-medium">Missed tasks</TableHead>
              <TableHead className="text-white/60 font-medium">Employee</TableHead>
              <TableHead className="text-white/60 font-medium">Supervisor</TableHead>
              <TableHead className="text-white/60 font-medium">Reason</TableHead>
              <TableHead className="text-white/60 font-medium">Severity</TableHead>
              <TableHead className="text-white/60 font-medium">Status</TableHead>
              <TableHead className="text-white/60 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-white/10">
                <TableCell colSpan={10} className="text-center text-white/50 py-8">
                  No missed tasks match the filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((record) => (
                <TableRow
                  key={record.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="w-6 py-3">
                    {newestUnreviewedId === record.id ? (
                      <span
                        className="relative flex h-2 w-2"
                        aria-label="Newest unreviewed"
                      >
                        <span className="absolute inline-flex h-2 w-2 w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="py-3">
                    <Link
                      href={`/app/sites/${record.locationId}`}
                      className="text-white font-medium hover:text-amber-400 transition-colors"
                    >
                      {record.locationName}
                    </Link>
                  </TableCell>
                  <TableCell className="py-3 text-white/80 text-sm whitespace-nowrap">
                    {formatShift(record)}
                  </TableCell>
                  <TableCell className="py-3">
                    <TaskChips tasks={record.tasks} />
                  </TableCell>
                  <TableCell className="py-3 text-white/90 text-sm">
                    {record.employeeName}
                  </TableCell>
                  <TableCell className="py-3 text-white/70 text-sm">
                    {record.supervisorName ?? '—'}
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                        record.reason === 'client_complaint'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : record.reason === 'qc_failed'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-white/10 text-white/80 border-white/20'
                      }`}
                    >
                      {REASON_LABELS[record.reason]}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                        record.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {record.severity === 'critical' ? 'Critical' : 'Standard'}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium border border-white/20 ${
                        record.status === 'unreviewed'
                          ? 'bg-rose-500/15 text-rose-300'
                          : record.status === 'resolved'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-white/10 text-white/80'
                      }`}
                    >
                      {STATUS_LABELS[record.status]}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        className="bg-amber-500/90 hover:bg-amber-500 text-white border-0 text-xs"
                        asChild
                      >
                        <Link href={`/app/ops/missed-tasks?review=${record.id}`}>
                          Review
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0F172A] border-white/10 min-w-[160px]"
                        >
                          {/* TODO: Wire action handlers — mark confirmed/resolved, create make-up, notify. */}
                          <DropdownMenuItem className="text-white focus:bg-white/10 focus:text-white">
                            Create make-up
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-white focus:bg-white/10 focus:text-white">
                            Notify supervisor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
