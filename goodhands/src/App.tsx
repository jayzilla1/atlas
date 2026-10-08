import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SessionProvider, useSession } from '@/state/session'
import { DataProvider } from '@/state/store'
import { DialogHost } from '@/state/dialogs'
import { ToastProvider } from '@/components/ui/Toast'
import { AssistantProvider } from '@/ai/AssistantContext'
import { AppShell } from '@/layouts/AppShell'
import { RestrictedState, PageSkeleton } from '@/components/ui/States'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { OWNER_NAV } from '@/state/permissions'

/**
 * Pages are loaded on demand ("lazy"): the browser only downloads the Reports code when someone
 * opens Reports. That keeps the first load quick, especially on a phone.
 */
const Home = lazy(() => import('@/pages/Home'))
const Attendance = lazy(() => import('@/pages/Attendance'))
const Children = lazy(() => import('@/pages/Children'))
const ChildProfile = lazy(() => import('@/pages/ChildProfile'))
const Payments = lazy(() => import('@/pages/Payments'))
const TasksReminders = lazy(() => import('@/pages/TasksReminders'))
const Employees = lazy(() => import('@/pages/Employees'))
const EmployeeProfile = lazy(() => import('@/pages/EmployeeProfile'))
const OwnerSchedule = lazy(() => import('@/pages/OwnerSchedule'))
const Documents = lazy(() => import('@/pages/Documents'))
const Reports = lazy(() => import('@/pages/Reports'))
const Settings = lazy(() => import('@/pages/Settings'))
const DesignSystem = lazy(() => import('@/pages/DesignSystem'))
const StaffToday = lazy(() => import('@/pages/staff/StaffToday'))
const MySchedule = lazy(() => import('@/pages/staff/MySchedule'))
const MyTasks = lazy(() => import('@/pages/staff/MyTasks'))
const Closeout = lazy(() => import('@/pages/staff/Closeout'))

export function App() {
  return (
    <SessionProvider>
      <DataProvider>
        <ToastProvider>
          <AssistantProvider>
            <DialogHost>
              <Suspense fallback={<div className="p-8"><PageSkeleton /></div>}>
                <RoleRoutes />
              </Suspense>
            </DialogHost>
          </AssistantProvider>
        </ToastProvider>
      </DataProvider>
    </SessionProvider>
  )
}

/** Owner and employee get different route tables — an employee typing /payments simply gets the "owner only" screen. */
function RoleRoutes() {
  const { role } = useSession()
  return role === 'owner' ? (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="children" element={<Children />} />
        <Route path="children/:id" element={<ChildProfile />} />
        <Route path="payments" element={<Payments />} />
        <Route path="tasks" element={<TasksReminders />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeProfile />} />
        <Route path="schedule" element={<OwnerSchedule />} />
        <Route path="documents" element={<Documents />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="design-system" element={<DesignSystem />} />
        <Route path="today" element={<Navigate to="/" replace />} />
        <Route path="closeout" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  ) : (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today" element={<StaffToday />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="schedule" element={<MySchedule />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="closeout" element={<Closeout />} />
        <Route path="design-system" element={<DesignSystem />} />
        <Route path="*" element={<StaffBlocked />} />
      </Route>
    </Routes>
  )
}

function StaffBlocked() {
  const { pathname } = useLocation()
  const area = OWNER_NAV.find((n) => n.to !== '/' && pathname.startsWith(n.to))?.label
  if (!area) return <NotFound />
  return <RestrictedState area={area} action={<Link to="/today"><Button variant="primary">Back to Today</Button></Link>} />
}
function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <h1 className="text-h2">We can’t find that page</h1>
      <p className="mt-2 text-ink-secondary">The link may be old, or the page may have moved.</p>
      <Link to="/" className="mt-5 inline-block"><Button variant="primary">Go home</Button></Link>
    </div>
  )
}
