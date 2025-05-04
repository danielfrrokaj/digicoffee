import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import AdminLayout from './components/Layout/AdminLayout';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/Admin/AdminDashboard';
import VenueManagement from './pages/Admin/VenueManagement';
import UserManagement from './pages/Admin/UserManagement';
import Analytics from './pages/Admin/Analytics';
// import CustomerMenu from './pages/Customer/CustomerMenu'; // Customer page placeholder

// Protected Route Component for Admins
const AdminProtectedRoute = () => {
  const { session, userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Checking authentication...</div>;
  }

  // Check for session AND admin role
  if (!session || userProfile?.role !== 'admin') {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" replace />;
  }

  // If logged in and is admin, render the AdminLayout which contains the Outlet for nested routes
  return <AdminLayout><Outlet /></AdminLayout>; 
};

function App() {
  const { session, userProfile, loading } = useAuth();

  // Show a global loading indicator while figuring out auth state
  if (loading && !session) {
    return <div className="flex justify-center items-center h-screen">Loading Application...</div>;
  }

  return (
    <Routes>
      {/* === PUBLIC ROUTES === */}
      {/* Login route - redirect to admin if already logged in as admin */}
      <Route 
        path="/login"
        element={!session ? <LoginPage /> : (userProfile?.role === 'admin' ? <Navigate to="/admin" replace /> : <div>Logged in but not admin?</div> /* Decide where non-admins go */)}
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
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        {/* Add other nested admin routes here */}
      </Route>

      {/* === DEFAULT/FALLBACK ROUTE === */}
      {/* Redirect root path based on auth status */}
      <Route 
        path="/"
        element={session ? (userProfile?.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/menu-placeholder" replace /> /* Or staff dashboard */) : <Navigate to="/login" replace />}
      />

      {/* Fallback for any other unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;
