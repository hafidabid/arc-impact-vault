import { Route, Routes } from 'react-router-dom'
import { Shell } from '@/components/layout/Shell'
import { VaultProvider } from '@/state/VaultProvider'
import AccountPage from '@/pages/AccountPage'
import ActivityPage from '@/pages/ActivityPage'
import DashboardPage from '@/pages/DashboardPage'
import DepositPage from '@/pages/DepositPage'
import HomePage from '@/pages/HomePage'
import ImpactPage from '@/pages/ImpactPage'
import NotFoundPage from '@/pages/NotFoundPage'
import OnboardingPage from '@/pages/OnboardingPage'
import PoolPage from '@/pages/PoolPage'
import WithdrawPage from '@/pages/WithdrawPage'

export default function App() {
  return (
    <VaultProvider>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="impact" element={<ImpactPage />} />
          <Route path="impact/:poolId" element={<PoolPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="deposit" element={<DepositPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="withdraw" element={<WithdrawPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </VaultProvider>
  )
}
