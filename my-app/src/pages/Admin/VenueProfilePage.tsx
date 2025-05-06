import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useVenueById } from '../../hooks/useVenueById';
import { useProfileById } from '../../hooks/useProfileById';

const VenueProfilePage: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  
  // Fetch the venue details
  const { 
    data: venue, 
    isLoading: isLoadingVenue, 
    error: venueError 
  } = useVenueById(venueId);
  
  // Fetch manager details if venue has a manager_id
  const managerId = venue?.manager_id || undefined;
  
  // Fetch the manager profile if there's an assigned manager
  const {
    data: managerProfile,
    isLoading: isLoadingManager
  } = useProfileById(managerId);

  // Determine loading state
  const isLoading = isLoadingVenue || (managerId && isLoadingManager);

  return (
    <div>
      <nav className="mb-4 text-sm">
        <Link to="/admin/venues" className="text-blue-600 hover:underline">&larr; Back to Venues</Link>
      </nav>
      <h1 className="text-2xl font-bold mb-4">Venue Details</h1>
      
      {isLoading && <p>Loading venue information...</p>}
      {venueError && <p className="text-red-600">Error loading venue: {venueError.message}</p>}
      {!isLoading && !venue && <p>Venue not found.</p>}

      {venue && (
        <div className="bg-white p-6 rounded shadow-md space-y-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="flex-grow">
              <h2 className="text-xl font-semibold mb-2">{venue.name}</h2>
              <p className="text-gray-600">
                {venue.address ? `${venue.address}, ` : ''}{venue.city}, {venue.state}
              </p>
              <p className="text-sm text-gray-500 mt-1">ID: {venue.id}</p>
            </div>
            
            {venue.logo_url && (
              <div className="mt-4 md:mt-0">
                <img 
                  src={venue.logo_url} 
                  alt={`${venue.name} Logo`} 
                  className="max-w-xs max-h-24 object-contain rounded"
                />
              </div>
            )}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-2">Venue Manager</h3>
            {venue.manager_id ? (
              isLoadingManager ? (
                <p>Loading manager information...</p>
              ) : managerProfile ? (
                <div className="bg-gray-50 p-4 rounded">
                  <p><strong>Name:</strong> {managerProfile.full_name || '(Not Set)'}</p>
                  <p><strong>Email:</strong> {managerProfile.email || '(Not Available)'}</p>
                  <p><strong>Phone:</strong> {managerProfile.phone_number || '(Not Set)'}</p>
                  <Link 
                    to={`/admin/users/${managerProfile.id}`}
                    className="text-blue-600 hover:underline text-sm block mt-2"
                  >
                    View Manager Profile
                  </Link>
                </div>
              ) : (
                <p className="text-amber-600">Manager (ID: {venue.manager_id}) could not be found.</p>
              )
            ) : (
              <p className="text-amber-600">No manager assigned to this venue.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueProfilePage; 