import React, { useState, useMemo } from 'react';
import { useFetchVenues, useAssignManager, Venue } from '../../hooks/useVenues'; // Adjust path
import VenueModal from '../../components/Admin/VenueModal'; // Adjust path
import { Link } from 'react-router-dom';

const VenueManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // Fetching venues
  const { data: venues, isLoading: isLoadingVenues, error: fetchError } = useFetchVenues();
  // Assign Manager Mutation
  const { mutate: assignManager, isPending: isAssigningManager, error: assignManagerError } = useAssignManager();

  // Filter venues based on search term (client-side)
  const filteredVenues = useMemo(() => {
    if (!venues) return [];
    if (!searchTerm.trim()) return venues; // No search term, return all

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return venues.filter(venue => 
      venue.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      venue.city.toLowerCase().includes(lowerCaseSearchTerm) ||
      venue.state.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [venues, searchTerm]);

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
    const managerUserId = managerUserIdInput[venueId]?.trim();
    if (!managerUserId) {
        alert("Please enter a valid Manager User ID to assign.");
        return;
    }
    
    // Optional: Add confirmation
    if (!window.confirm(`Assign user ID ${managerUserId} as manager to this venue? This will also update the user's profile.`)) {
      return;
    }

    assignManager({ venueId, managerUserId }, {
      onSuccess: () => { 
        console.log('Manager assigned!');
         alert('Manager assigned successfully!');
        // Clear the input field for this specific venue
        setManagerUserIdInput(prev => ({...prev, [venueId]: ''})); 
      },
      onError: (err) => { 
        console.error('Assign manager failed:', err);
        alert(`Failed to assign manager: ${err.message}`);
      }
    });
  };
  // --- End Placeholder --- 


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Venue Management</h1>
        <button onClick={openCreateModal} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" >
          + Create New Venue
        </button>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search venues by name, city, or state..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <div>
        {isLoadingVenues && <p>Loading venues...</p>}
        {fetchError && <p className="text-red-600">Error fetching venues: {fetchError.message}</p>}
        {!isLoadingVenues && !fetchError && filteredVenues.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            {searchTerm ? 'No venues match your search.' : 'No venues found. Create one!'}
          </p>
        )}
        {!isLoadingVenues && !fetchError && filteredVenues.length > 0 && (
          <ul className="space-y-4">
            {filteredVenues.map((venue: Venue) => (
              <li key={venue.id} className="p-4 border rounded shadow-sm bg-white">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-3">
                  <div className="flex-grow pr-0 sm:pr-4 order-2 sm:order-1">
                    <p className="font-semibold text-lg">
                      {venue.name}
                      <Link 
                        to={`/admin/venues/${venue.id}`} 
                        className="ml-2 text-blue-600 hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600">
                      {venue.address ? `${venue.address}, ` : ''}{venue.city}, {venue.state}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">ID: {venue.id}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Manager ID: {venue.manager_id ? venue.manager_id : 'Not Assigned'}
                    </p>
                    {venue.logo_url && (
                      <p className="text-sm text-blue-500 hover:underline mt-1">
                        <a href={venue.logo_url} target="_blank" rel="noopener noreferrer">Logo Link</a>
                      </p>
                    )}
                  </div>
                  {venue.logo_url && (
                    <img src={venue.logo_url} alt={`${venue.name} Logo`} className="w-16 h-16 object-contain rounded flex-shrink-0 order-1 sm:order-2" />
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center border-t pt-3 mt-3 space-y-3 sm:space-y-0 sm:space-x-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                         <input 
                            type="text" 
                            placeholder="Manager User ID to Assign" 
                            value={managerUserIdInput[venue.id] || ''}
                            onChange={(e) => setManagerUserIdInput(prev => ({...prev, [venue.id]: e.target.value}))}
                            className="flex-grow sm:w-64 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isAssigningManager} // Disable input while assigning
                        />
                        <button 
                            onClick={() => handleAssignManager(venue.id)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
                            disabled={isAssigningManager || !managerUserIdInput[venue.id]} // Disable while assigning or if input is empty
                         >
                            {isAssigningManager ? 'Assigning...' : 'Assign'} {/* Show loading state */}
                         </button>
                    </div>
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