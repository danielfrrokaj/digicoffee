import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Venue, balkanStates, BalkanState, UpdateVenuePayload } from '../../hooks/useVenues'; // Adjust path
import { useCreateVenue, useUpdateVenue } from '../../hooks/useVenues'; // Adjust path

interface VenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueToEdit?: Venue | null; // Pass venue data if editing
}

const VenueModal: React.FC<VenueModalProps> = ({ isOpen, onClose, venueToEdit }) => {
  const isEditMode = Boolean(venueToEdit);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<BalkanState>(balkanStates[0]);
  const [logoUrl, setLogoUrl] = useState('');
  // manager_id is handled separately

  const { mutate: createVenue, isPending: isCreating, error: createError } = useCreateVenue();
  const { mutate: updateVenue, isPending: isUpdating, error: updateError } = useUpdateVenue();

  const isLoading = isCreating || isUpdating;
  const mutationError = createError || updateError;

  // Pre-fill form if editing
  useEffect(() => {
    if (isEditMode && venueToEdit) {
      setName(venueToEdit.name || '');
      setAddress(venueToEdit.address || '');
      setCity(venueToEdit.city || '');
      setState(venueToEdit.state || balkanStates[0]);
      setLogoUrl(venueToEdit.logo_url || '');
    } else {
      // Reset form if opening in create mode or closing
      setName('');
      setAddress('');
      setCity('');
      setState(balkanStates[0]);
      setLogoUrl('');
    }
  }, [isOpen, isEditMode, venueToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !state) {
      alert('Venue name, city, and state are required.');
      return;
    }

    // Ensure manager_id is string or null
    const currentManagerId = venueToEdit?.manager_id ?? null;

    const venueData = {
      name: name,
      address: address || null,
      city: city,
      state: state,
      logo_url: logoUrl || null,
      manager_id: currentManagerId // Use the null-coalesced value
    };

    if (isEditMode && venueToEdit) {
      // The update payload type allows partial data, so this is fine
      updateVenue({ ...venueData, id: venueToEdit.id } as UpdateVenuePayload, {
        onSuccess: () => {
          console.log('Venue updated!')
          onClose(); // Close modal on success
        },
        onError: (err) => console.error("Update failed:", err)
      });
    } else {
      // The create payload type (UpsertVenueData) requires all fields (except id/created_at)
      createVenue(venueData, { // venueData now correctly matches UpsertVenueData
        onSuccess: () => {
          console.log('Venue created!');
          onClose(); // Close modal on success
        },
        onError: (err) => console.error("Creation failed:", err)
      });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  {isEditMode ? 'Edit Venue' : 'Create New Venue'}
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* --- Form Fields (similar to previous implementation) --- */}
                  <div>
                     <label htmlFor="modalVenueName" className="block text-sm font-medium text-gray-700 mb-1">Venue Name <span className="text-red-500">*</span></label>
                     <input type="text" id="modalVenueName" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} className="modal-input" />
                   </div>
                   <div>
                     <label htmlFor="modalVenueAddress" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                     <input type="text" id="modalVenueAddress" value={address} onChange={(e) => setAddress(e.target.value)} disabled={isLoading} className="modal-input" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label htmlFor="modalVenueCity" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                       <input type="text" id="modalVenueCity" value={city} onChange={(e) => setCity(e.target.value)} required disabled={isLoading} className="modal-input" />
                     </div>
                     <div>
                       <label htmlFor="modalVenueState" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                       <select id="modalVenueState" value={state} onChange={(e) => setState(e.target.value as BalkanState)} required disabled={isLoading} className="modal-input bg-white">
                         {balkanStates.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                     </div>
                   </div>
                   <div>
                     <label htmlFor="modalVenueLogoUrl" className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                     <input type="url" id="modalVenueLogoUrl" placeholder="https://..." value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} disabled={isLoading} className="modal-input" />
                   </div>
                  {/* --- End Form Fields --- */}

                  {mutationError && <p className="text-sm text-red-600">Error: {mutationError.message}</p>}

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      onClick={onClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Venue')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Add some base styles for modal inputs if not already globally defined
// You might want to put this in your index.css or App.css
const modalInputStyle = `
  .modal-input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500;
  }
`;

// Inject styles (simple way, consider CSS modules or styled-components for larger apps)
const styleSheet = document.createElement("style")
styleSheet.innerText = modalInputStyle
document.head.appendChild(styleSheet)

export default VenueModal; 