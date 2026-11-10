import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Approvals from './pages/Approvals.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Deployments from './pages/Deployments.jsx'
import ReleaseDetails from './pages/ReleaseDetails.jsx'
import Releases from './pages/Releases.jsx'
import TestEvidence from './pages/TestEvidence.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="releases" element={<Releases />} />
        <Route path="releases/:id" element={<ReleaseDetails />} />
        <Route path="deployments" element={<Deployments />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="test-evidence" element={<TestEvidence />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
