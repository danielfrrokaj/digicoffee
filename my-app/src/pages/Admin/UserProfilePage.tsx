import React, { Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProfileById } from '../../hooks/useProfileById';
import { useVenueById } from '../../hooks/useVenueById';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  
  // Fetch the user profile
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile, 
    error: profileError 
  } = useProfileById(userId);
  
  // Only fetch venue if venue_id exists and is not null
  const venueId = userProfile?.venue_id || undefined;
  
  // Fetch the venue if user has a venue_id
  const {
    data: venue,
    isLoading: isLoadingVenue
  } = useVenueById(venueId);

  // Determine if we're still loading data
  const isLoading = isLoadingProfile || (venueId && isLoadingVenue);

  // Action handlers
  const handleDisableProfile = () => {
    if (userProfile) {
      alert(`Disable profile functionality not implemented yet for: ${userProfile.full_name || userProfile.id}`);
    }
  };

  const handleResetPassword = () => {
    if (userProfile) {
      alert(`Reset password functionality not implemented yet for: ${userProfile.full_name || userProfile.id}`);
    }
  };

  return (
    <div>
      <nav className="mb-4 text-sm">
        <Link to="/admin/users" className="text-blue-600 hover:underline">&larr; Back to Staff List</Link>
      </nav>
      
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Staff Profile</h1>
        
        {userProfile && (
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="p-1 rounded-md hover:bg-gray-100 focus:outline-none">
                <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleDisableProfile}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        Disable Profile
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleResetPassword}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center px-4 py-2 text-sm`}
                      >
                        Reset Password
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>
      
      {isLoading && <p>Loading profile...</p>}
      {profileError && <p className="text-red-600">Error loading profile: {profileError.message}</p>}
      {!isLoading && !userProfile && <p>User profile not found.</p>}

      {userProfile && (
        <div className="bg-white p-6 rounded shadow-md space-y-3">
            <p><strong>Name:</strong> {userProfile.full_name || '(Not Set)'}</p>
            <p><strong>Email:</strong> {userProfile.email || '(Not Available)'}</p>
            <p><strong>Role:</strong> {userProfile.role}</p>
            <p><strong>Phone:</strong> {userProfile.phone_number || '(Not Set)'}</p>
            <p><strong>User ID:</strong> {userProfile.id}</p>
            
            <div className="border-t pt-3 mt-3">
              <h2 className="text-lg font-semibold mb-2">Venue Assignment</h2>
              {userProfile.venue_id ? (
                <div>
                  <p>
                    <strong>Assigned Venue:</strong> {venue?.name || 'Loading venue details...'}
                    {venue && <span className="ml-2 text-sm text-gray-500">({venue.city}, {venue.state})</span>}
                  </p>
                  {venue && (
                    <Link 
                      to={`/admin/venues/${venue.id}`}
                      className="text-blue-600 hover:underline text-sm block mt-1"
                    >
                      View Venue Details
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-amber-600">Not assigned to any venue</p>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage; 