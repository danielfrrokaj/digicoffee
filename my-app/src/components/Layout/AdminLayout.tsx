import React, { ReactNode } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { signOut } = useAuth();

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6">DigiCoffee Admin</h2>
        <nav className="flex-grow">
          <ul>
            <li className="mb-2"><Link to="/admin/dashboard" className="hover:bg-gray-700 p-2 block rounded">Dashboard</Link></li>
            <li className="mb-2"><Link to="/admin/venues" className="hover:bg-gray-700 p-2 block rounded">Venues</Link></li>
            <li className="mb-2"><Link to="/admin/users" className="hover:bg-gray-700 p-2 block rounded">Staff</Link></li>
            <li className="mb-2"><Link to="/admin/analytics" className="hover:bg-gray-700 p-2 block rounded">Analytics</Link></li>
            {/* Add other admin links here */}
          </ul>
        </nav>
        <button 
          onClick={signOut} 
          className="mt-auto bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {children ?? <Outlet />} {/* Render nested routes or direct children */}
      </div>
    </div>
  );
};

export default AdminLayout; 