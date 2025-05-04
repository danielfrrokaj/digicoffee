import React, { useState } from 'react';
import { useFetchVenues, Venue } from '../../hooks/useVenues'; // Adjust path
import VenueModal from '../../components/Admin/VenueModal'; // Adjust path

const VenueManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  // Fetching venues
  const { data: venues, isLoading: isLoadingVenues, error: fetchError } = useFetchVenues();

  const openCreateModal = () => {
    setSelectedVenue(null); // Ensure no venue data is passed for create mode
    setIsModalOpen(true);
  };

  const openEditModal = (venue: Venue) => {
    setSelectedVenue(venue); // Pass the venue data for edit mode
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedVenue(null); // Clear selected venue on close
  };
  
  // --- Placeholder for Assign Manager --- 
  const [managerUserIdInput, setManagerUserIdInput] = useState<Record<string, string>>({}); // Store input per venue ID
  // TODO: Implement useAssignManager mutation hook
  // const { mutate: assignManager, isPending: isAssigning } = useAssignManager(); 

  const handleAssignManager = (venueId: string) => {
    const userIdToAssign = managerUserIdInput[venueId];
    if (!userIdToAssign) {
        alert("Please enter the Manager's User ID.");
        return;
    }
    alert(`Simulating assignment: Would assign User ID ${userIdToAssign} to Venue ID ${venueId}. Need to implement mutation.`);
    // TODO: Call the actual mutation
    // assignManager({ venueId, managerId: userIdToAssign }, {
    //   onSuccess: () => { 
    //     console.log('Manager assigned!');
    //     setManagerUserIdInput(prev => ({...prev, [venueId]: ''})); // Clear input
    //   },
    //   onError: (err) => console.error('Assign manager failed:', err)
    // });
  };
  // --- End Placeholder --- 


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Venue Management</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          + Create New Venue
        </button>
      </div>

      {/* Venue List */}
      <div>
        {/* <h2 className="text-xl font-semibold mb-4">Existing Venues</h2> */} { /* Removed redundant heading */}
        {isLoadingVenues && <p>Loading venues...</p>}
        {fetchError && <p className="text-red-600">Error fetching venues: {fetchError.message}</p>}
        {!isLoadingVenues && !fetchError && venues && venues.length === 0 && (
          <p className="text-center text-gray-500 py-4">No venues found. Create one!</p>
        )}
        {!isLoadingVenues && !fetchError && venues && venues.length > 0 && (
          <ul className="space-y-4">
            {venues.map((venue: Venue) => (
              <li key={venue.id} className="p-4 border rounded shadow-sm bg-white">
                <div className="flex justify-between items-start mb-3">
                  {/* Left side: Details */}
                  <div className="flex-grow pr-4">
                    <p className="font-semibold text-lg">{venue.name}</p>
                    <p className="text-sm text-gray-600">
                      {venue.address ? `${venue.address}, ` : ''}{venue.city}, {venue.state}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">ID: {venue.id}</p>
                     <p className="text-xs text-gray-500 mt-1">
                       Manager ID: {venue.manager_id ? venue.manager_id : 'Not Assigned'}
                       {/* TODO: Fetch manager name based on ID */} 
                     </p>
                    {venue.logo_url && (
                       <p className="text-sm text-blue-500 hover:underline mt-1">
                          <a href={venue.logo_url} target="_blank" rel="noopener noreferrer">Logo Link</a>
                       </p>
                    )}
                  </div>
                  {/* Right side: Logo */}
                  {venue.logo_url && (
                    <img src={venue.logo_url} alt={`${venue.name} Logo`} className="w-16 h-16 object-contain rounded flex-shrink-0" />
                  )}
                </div>
                
                {/* Bottom Section: Actions & Manager Assignment */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-3 mt-3 space-y-2 sm:space-y-0 sm:space-x-3">
                    {/* Assign Manager Input */}
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                         <input 
                            type="text" 
                            placeholder="Manager User ID to Assign" 
                            value={managerUserIdInput[venue.id] || ''}
                            onChange={(e) => setManagerUserIdInput(prev => ({...prev, [venue.id]: e.target.value}))}
                            className="flex-grow sm:w-64 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button 
                            onClick={() => handleAssignManager(venue.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                            // disabled={isAssigning || !managerUserIdInput[venue.id]}
                            >Assign</button>
                    </div>
                    {/* Edit Button */}
                    <button
                        onClick={() => openEditModal(venue)}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 w-full sm:w-auto"
                    >
                        Edit Venue
                    </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal for Create/Edit */}
      <VenueModal
        isOpen={isModalOpen}
        onClose={closeModal}
        venueToEdit={selectedVenue}
      />
    </div>
  );
};

export default VenueManagement; 