import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
const OverviewPage = lazy(() => import('./pages/Overview').then((m) => ({ default: m.OverviewPage })))
const RisksPage = lazy(() => import('./pages/Risks').then((m) => ({ default: m.RisksPage })))
const RiskDetailPage = lazy(() => import('./pages/RiskDetail').then((m) => ({ default: m.RiskDetailPage })))
const TasksPage = lazy(() => import('./pages/Tasks').then((m) => ({ default: m.TasksPage })))
const PeoplePage = lazy(() => import('./pages/People').then((m) => ({ default: m.PeoplePage })))
const PersonDetailPage = lazy(() => import('./pages/PersonDetail').then((m) => ({ default: m.PersonDetailPage })))
const ApplicationsPage = lazy(() => import('./pages/Applications').then((m) => ({ default: m.ApplicationsPage })))
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetail').then((m) => ({ default: m.ApplicationDetailPage })))
const VendorsPage = lazy(() => import('./pages/Vendors').then((m) => ({ default: m.VendorsPage })))
const VendorDetailPage = lazy(() => import('./pages/VendorDetail').then((m) => ({ default: m.VendorDetailPage })))
const PoliciesPage = lazy(() => import('./pages/Policies').then((m) => ({ default: m.PoliciesPage })))
const PolicyDetailPage = lazy(() => import('./pages/PolicyDetail').then((m) => ({ default: m.PolicyDetailPage })))
const ReportsPage = lazy(() => import('./pages/Reports').then((m) => ({ default: m.ReportsPage })))
const AssistantPage = lazy(() => import('./pages/Assistant').then((m) => ({ default: m.AssistantPage })))
const HelpPage = lazy(() => import('./pages/Help').then((m) => ({ default: m.HelpPage })))
const SettingsPage = lazy(() => import('./pages/Settings').then((m) => ({ default: m.SettingsPage })))
const DesignSystemPage = lazy(() => import('./pages/DesignSystem').then((m) => ({ default: m.DesignSystemPage })))
const NotFoundPage = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFoundPage })))

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="risks" element={<RisksPage />} />
        <Route path="risks/:id" element={<RiskDetailPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:id" element={<PersonDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="vendors/:id" element={<VendorDetailPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="policies/:id" element={<PolicyDetailPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="design-system" element={<DesignSystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
