import React, { useState, Fragment, useMemo } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { useFetchStaff, useCreateStaff, useDeleteStaff, Profile, CreateStaffPayload } from '../../hooks/useStaff'; // Adjust path
import { useFetchVenues, Venue } from '../../hooks/useVenues'; // Adjust path
import { Link } from 'react-router-dom';

const UserManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Optional initial full name
  const [phoneNumber, setPhoneNumber] = useState(''); // Optional initial phone
  // Note: Role and Venue are just informative for the admin during creation,
  // they need to be set manually in DB later.
  const [role, setRole] = useState<'manager' | 'bartender'>('bartender');
  const [venueId, setVenueId] = useState<string | ''>((''));
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  // Fetch Staff & Venues
  const { data: staff, isLoading: isLoadingStaff, error: fetchStaffError, refetch: refetchStaff } = useFetchStaff();
  const { data: venues, isLoading: isLoadingVenues } = useFetchVenues(); // For venue dropdown

  // Use the NEW mutation hook for the Edge Function
  const { mutate: createStaff, isPending: isCreatingStaff, error: createStaffError } = useCreateStaff();
  const { mutate: deleteStaff, isPending: isDeletingStaff, error: deleteStaffError } = useDeleteStaff(); // Add delete mutation

  // Filter staff based on search term (client-side)
  const filteredStaff = useMemo(() => {
    if (!staff) return [];
    if (!searchTerm.trim()) return staff;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return staff.filter(member => 
      (member.full_name && member.full_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (member.email && member.email.toLowerCase().includes(lowerCaseSearchTerm)) || // Search email
      member.role.toLowerCase().includes(lowerCaseSearchTerm) ||
      member.id.toLowerCase().includes(lowerCaseSearchTerm) // Search ID
    );
  }, [staff, searchTerm]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form fields
    setEmail('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
    setRole('bartender');
    setVenueId('');
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueId) {
        alert('Please select the venue for this staff member.');
        return;
    }
    
    const payload: CreateStaffPayload = {
      email,
      password,
      role,
      venueId,
      fullName: fullName || undefined,
      phone: phoneNumber || undefined,
    };

    createStaff(payload, {
      onSuccess: (data) => {
        if (data.success) {
            alert('Staff account created successfully!');
            closeModal();
        } else {
            // Error message is already in data.message from the hook
            alert(`Failed to create staff: ${data.message}`);
        }
      },
      onError: (err) => {
        // Network error or error thrown from hook's onSuccess
        alert(`An error occurred: ${err.message}`);
      }
    });
  };

  const handleDeleteStaff = (userId: string, userName: string | null) => {
    if (window.confirm(`Are you sure you want to delete the user: ${userName || userId}? This action cannot be undone.`)) {
        deleteStaff({ userId }, {
            onSuccess: (data) => {
                if (data.success) {
                    alert('Staff user deleted successfully!');
                    // refetchStaff(); // Or rely on invalidateQueries in the hook
                } else {
                    alert(`Failed to delete staff: ${data.message}`);
                }
            },
            onError: (err) => {
                alert(`An error occurred during deletion: ${err.message}`);
            }
        });
    }
  };

  // Add placeholder functions for the new actions
  const handleDisableProfile = (userId: string, userName: string | null) => {
    alert(`Disable profile functionality not implemented yet for: ${userName || userId}`);
    // TODO: Implement actual disable functionality
  };

  const handleResetPassword = (userId: string, userName: string | null) => {
    alert(`Reset password functionality not implemented yet for: ${userName || userId}`);
    // TODO: Implement actual password reset functionality
  };

  // Helper to check if any deletion is in progress for disabling buttons
  const isAnyActionPending = isCreatingStaff || isDeletingStaff;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        <button onClick={openModal} className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700" >
          + Create Staff Account
        </button>
      </div>

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Search staff by name, email, role, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        {isLoadingStaff && <p>Loading staff...</p>}
        {fetchStaffError && <p className="text-red-600">Error fetching staff: {fetchStaffError.message}</p>}
        {!isLoadingStaff && !fetchStaffError && filteredStaff.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            {searchTerm ? 'No staff match your search.' : 'No staff members found (excluding admins).'}
          </p>
        )}
        {!isLoadingStaff && !fetchStaffError && filteredStaff.length > 0 && (
          <ul className="space-y-3">
            {filteredStaff.map((member: Profile) => (
              <li key={member.id} className="p-4 border rounded shadow-sm bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="mb-2 sm:mb-0 flex-grow">
                    <p className="font-semibold">
                      {member.full_name || '(Name Not Set)'}
                      <Link 
                        to={`/admin/users/${member.id}`} 
                        className="ml-2 text-blue-600 hover:underline text-sm"
                      >
                        View Profile
                      </Link>
                    </p>
                    <p className="text-sm text-gray-500">{member.email || '(Email not available)'}</p>
                    <p className="text-sm text-gray-600">Role: {member.role}</p>
                    <p className="text-sm text-gray-600">Venue ID: {member.venue_id || '(Not Assigned)'}</p> 
                    <p className="text-sm text-gray-600">Phone: {member.phone_number || '(Not Set)'}</p>
                    <p className="text-xs text-gray-400 mt-1">User ID: {member.id}</p>
                </div>
                <div className="flex space-x-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end flex-shrink-0">
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
                                onClick={() => handleDisableProfile(member.id, member.full_name)}
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
                                onClick={() => handleResetPassword(member.id, member.full_name)}
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900 mb-4"
                    >
                      Create New Staff Account
                    </Dialog.Title>

                    <form onSubmit={handleCreateStaff} className="space-y-4">
                      <div>
                         <label htmlFor="staffEmail">Email <span className="text-red-500">*</span></label>
                         <input type="email" id="staffEmail" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isAnyActionPending} className="modal-input" />
                       </div>
                       <div>
                         <label htmlFor="staffPassword">Password <span className="text-red-500">*</span></label>
                         <input type="password" id="staffPassword" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isAnyActionPending} className="modal-input" minLength={6} />
                       </div>
                        <div>
                           <label htmlFor="staffFullName">Full Name (Optional - Set in DB Later)</label>
                           <input type="text" id="staffFullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isAnyActionPending} className="modal-input" />
                         </div>
                         <div>
                           <label htmlFor="staffPhone">Phone Number (Optional - Set in DB Later)</label>
                           <input type="tel" id="staffPhone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} disabled={isAnyActionPending} className="modal-input" />
                         </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                           <label htmlFor="staffRole">Role <span className="text-red-500">*</span></label>
                           <select id="staffRole" value={role} onChange={(e) => setRole(e.target.value as 'manager' | 'bartender')} required disabled={isAnyActionPending} className="modal-input bg-white">
                             <option value="bartender">Bartender</option>
                             <option value="manager">Manager</option>
                           </select>
                         </div>
                         <div>
                           <label htmlFor="staffVenue">Venue <span className="text-red-500">*</span></label>
                           <select id="staffVenue" value={venueId} onChange={(e) => setVenueId(e.target.value)} required disabled={isAnyActionPending || isLoadingVenues} className="modal-input bg-white">
                             <option value="" disabled>Select Venue...</option>
                             {venues && venues.map(v => (
                                <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                             ))}
                             {!venues && !isLoadingVenues && <option disabled>Error loading venues</option>} 
                           </select>
                         </div>
                       </div>
                      
                      {createStaffError && <p className="text-sm text-red-600">Error: {createStaffError.message}</p>}

                      <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" className="modal-button-cancel" onClick={closeModal} disabled={isAnyActionPending}>Cancel</button>
                        <button type="submit" className="modal-button-primary" disabled={isAnyActionPending}>
                          {isCreatingStaff ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>
                    </form>
                  </Dialog.Panel>
                 </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      
       <style>{`
        .modal-button-cancel {
          @apply inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50;
        }
        .modal-button-primary {
           @apply inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50;
        }
       `}</style>
    </div>
  );
};

export default UserManagement;
