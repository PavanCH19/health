import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Shell from './components/Shell';
import { RequireAuth, RequireRole } from './components/Guards';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotFound from './pages/NotFound';
import DonorHome from './pages/donor/DonorHome';
import NearbyRequests from './pages/donor/NearbyRequests';
import Donations from './pages/donor/Donations';
import HospitalHome from './pages/hospital/HospitalHome';
import NewRequest from './pages/hospital/NewRequest';
import Requests from './pages/hospital/Requests';
import FindDonors from './pages/hospital/FindDonors';
import AdminHome from './pages/admin/AdminHome';

function RoleHome() {
  const role = useSelector((s) => s.auth.role);
  if (role === 'HOSPITAL') return <HospitalHome />;
  if (role === 'ADMIN') return <AdminHome />;
  return <DonorHome />;
}

export default function App() {
  const theme = useSelector((s) => s.ui.theme);
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/register" element={<Auth mode="register" />} />
      <Route path="/onboarding" element={<Onboarding />} />

      <Route path="/app" element={<RequireAuth><Shell /></RequireAuth>}>
        <Route index element={<RoleHome />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />

        <Route path="requests" element={
          <RequireRole roles={['DONOR', 'HOSPITAL']}>
            <ByRoleRequests />
          </RequireRole>
        } />
        <Route path="donations" element={<RequireRole roles={['DONOR']}><Donations /></RequireRole>} />
        <Route path="new-request" element={<RequireRole roles={['HOSPITAL']}><NewRequest /></RequireRole>} />
        <Route path="find" element={<RequireRole roles={['HOSPITAL']}><FindDonors /></RequireRole>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/** "/app/requests" means two different pages depending on role. */
function ByRoleRequests() {
  const role = useSelector((s) => s.auth.role);
  return role === 'HOSPITAL' ? <Requests /> : <NearbyRequests />;
}
