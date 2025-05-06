import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/Layout/AdminLayout';
import ManagerLayout from './components/Layout/ManagerLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import VenueManagement from './pages/Admin/VenueManagement';
import UserManagement from './pages/Admin/UserManagement';
import Analytics from './pages/Admin/Analytics';
// Import new placeholder pages
import UserProfilePage from './pages/Admin/UserProfilePage'; 
import VenueProfilePage from './pages/Admin/VenueProfilePage';
// import CustomerMenu from './pages/Customer/CustomerMenu'; // Customer page placeholder

// Manager Pages
import ManagerDashboard from './pages/Manager/ManagerDashboard';
import CategoryMenuManagement from './pages/Manager/CategoryMenuManagement';
import StaffManagement from './pages/Manager/StaffManagement';
import ManagerAnalytics from './pages/Manager/ManagerAnalytics';

// Protected Route Component for Admins
const AdminProtectedRoute = () => {
  const { session, userProfile, loading } = useAuth();

  // Only show loading indicator if loading AND we don't have a session yet.
  // This prevents flicker on window focus if already authenticated.
  if (loading && !session) { 
    return <div className="flex justify-center items-center h-screen">Checking authentication...</div>;
  }

  // If not loading, or if loading but we already have a session,
  // proceed to check if the session is valid and user is admin.
  if (!session || userProfile?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // If session exists and user is admin, render the layout.
  return <AdminLayout><Outlet /></AdminLayout>; 
};

// Protected Route Component for Managers
const ManagerProtectedRoute = () => {
  const { session, userProfile, loading } = useAuth();

  // Only show loading indicator if loading AND we don't have a session yet.
  if (loading && !session) { 
    return <div className="flex justify-center items-center h-screen">Checking authentication...</div>;
  }

  // If not loading, or if loading but we already have a session,
  // proceed to check if the session is valid and user is manager.
  if (!session || userProfile?.role !== 'manager') {
    return <Navigate to="/login" replace />;
  }

  // If session exists and user is manager, render the layout.
  return <ManagerLayout><Outlet /></ManagerLayout>; 
};

function App() {
  // Remove the loading state check here - AuthProvider handles initial load
  const { session, userProfile } = useAuth(); 

  return (
    <Routes>
      {/* === PUBLIC ROUTES === */}
      {/* Login route - redirect based on role */}
      <Route 
        path="/login"
        element={
          !session ? (
            <LoginPage />
          ) : userProfile?.role === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : userProfile?.role === 'manager' ? (
            <Navigate to="/manager" replace />
          ) : (
            <div>Logged in but no appropriate role.</div>
          )
        }
      />

      {/* Customer Menu Route (Example - Needs Implementation) */}
      {/* <Route path="/menu/:tableId" element={<CustomerMenu />} /> */}
      <Route path="/menu-placeholder" element={<div>Customer Menu Placeholder</div>} />
      
      {/* === ADMIN PROTECTED ROUTES === */}
      <Route element={<AdminProtectedRoute />}>
        {/* Default admin route redirects to dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} /> 
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/venues" element={<VenueManagement />} />
        <Route path="/admin/venues/:venueId" element={<VenueProfilePage />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/users/:userId" element={<UserProfilePage />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        {/* Add other nested admin routes here */}
      </Route>

      {/* === MANAGER PROTECTED ROUTES === */}
      <Route element={<ManagerProtectedRoute />}>
        {/* Default manager route redirects to dashboard */}
        <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} /> 
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/manager/menu" element={<CategoryMenuManagement />} />
        <Route path="/manager/staff" element={<StaffManagement />} />
        <Route path="/manager/analytics" element={<ManagerAnalytics />} />
      </Route>

      {/* === DEFAULT/FALLBACK ROUTE === */}
      {/* Redirect root path based on auth status and role */}
      <Route 
        path="/"
        element={
          session ? (
            userProfile?.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : userProfile?.role === 'manager' ? (
              <Navigate to="/manager" replace />
            ) : (
              <Navigate to="/menu-placeholder" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Fallback for any other unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;
