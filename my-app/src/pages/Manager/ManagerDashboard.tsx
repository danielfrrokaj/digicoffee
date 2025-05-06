import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useVenueById } from '../../hooks/useVenueById';

const ManagerDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const venueId = userProfile?.venue_id || undefined;
  const { data: venue, isLoading } = useVenueById(venueId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manager Dashboard</h1>
      
      {isLoading ? (
        <p>Loading venue information...</p>
      ) : venue ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold mb-2">Venue Information</h2>
            <div className="space-y-2">
              <p><strong>Name:</strong> {venue.name}</p>
              <p><strong>Location:</strong> {venue.city}, {venue.state}</p>
              {venue.address && <p><strong>Address:</strong> {venue.address}</p>}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold mb-2">Today's Overview</h2>
            <div className="space-y-2">
              <p><strong>Active Tables:</strong> 0</p>
              <p><strong>Open Orders:</strong> 0</p>
              <p><strong>Today's Revenue:</strong> €0.00</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
            <div className="space-y-2">
              <a href="/manager/menu" className="block p-2 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700">Manage Menu</a>
              <a href="/manager/staff" className="block p-2 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700">Manage Staff</a>
              <a href="/manager/analytics" className="block p-2 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700">View Analytics</a>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">No Venue Assigned</h2>
          <p>You are not currently assigned to a venue. Please contact an administrator to get assigned to a venue.</p>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard; 