import { BarChart3, CalendarCheck, CalendarDays, FolderOpen, House, ListChecks, LogOut, Settings, Baby, Users, Wallet, ClipboardCheck } from 'lucide-react'

const MAP: Record<string, typeof House> = {
  home: House, attendance: CalendarCheck, children: Baby, payments: Wallet, tasks: ListChecks, employees: Users,
  schedule: CalendarDays, documents: FolderOpen, reports: BarChart3, settings: Settings, closeout: ClipboardCheck, logout: LogOut,
}
export function NavIcon({ name, className }: { name: string; className?: string }) {
  const I = MAP[name] ?? House
  return <I className={className ?? 'h-5 w-5'} aria-hidden />
}
