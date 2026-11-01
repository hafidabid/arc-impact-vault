import { Route, Routes } from 'react-router-dom'
import { AdminShell } from '@/components/layout/AdminShell'
import { Shell } from '@/components/layout/Shell'
import AccountPage from '@/pages/AccountPage'
import ActivityPage from '@/pages/ActivityPage'
import CausePage from '@/pages/CausePage'
import DashboardPage from '@/pages/DashboardPage'
import DepositPage from '@/pages/DepositPage'
import HomePage from '@/pages/HomePage'
import ImpactPage from '@/pages/ImpactPage'
import NotFoundPage from '@/pages/NotFoundPage'
import OnboardingPage from '@/pages/OnboardingPage'
import WithdrawPage from '@/pages/WithdrawPage'
import AdminCausesPage from '@/pages/admin/AdminCausesPage'
import AdminLedgerPage from '@/pages/admin/AdminLedgerPage'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'

export default function App() {
  return (
    <Routes>
      <Route path="admin" element={<AdminShell />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="ledger" element={<AdminLedgerPage />} />
        <Route path="causes" element={<AdminCausesPage />} />
      </Route>
      <Route element={<Shell />}>
        <Route index element={<HomePage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="impact" element={<ImpactPage />} />
        <Route path="impact/:causeAddress" element={<CausePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="deposit" element={<DepositPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="withdraw" element={<WithdrawPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
