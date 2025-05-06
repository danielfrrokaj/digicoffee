import React, { useState, Fragment, useMemo } from 'react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';
import { 
  useFetchVenueStaff, 
  useCreateBartender, 
  useDisableStaff, 
  useResetStaffPassword,
  StaffProfile 
} from '../../hooks/useVenueStaff';

const StaffManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const venueId = userProfile?.venue_id || undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Use our hooks for data fetching and mutations
  const { 
    data: staff = [], 
    isLoading, 
    error 
  } = useFetchVenueStaff(venueId);
  const createBartender = useCreateBartender();
  const disableStaff = useDisableStaff();
  const resetStaffPassword = useResetStaffPassword();

  // Filter staff based on search term
  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staff;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return staff.filter(member => 
      (member.full_name && member.full_name.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (member.email && member.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
      (member.phone_number && member.phone_number.toLowerCase().includes(lowerCaseSearchTerm))
    );
  }, [staff, searchTerm]);

  // Action handlers
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venueId) {
      alert('No venue selected');
      return;
    }
    
    createBartender.mutate({
      email,
      password,
      full_name: fullName || undefined,
      phone_number: phoneNumber || undefined,
      venue_id: venueId
    }, {
      onSuccess: () => {
        closeModal();
      }
    });
  };

  const handleDisableStaff = (userId: string, userName: string | null) => {
    if (!venueId) return;
    
    if (window.confirm(`Are you sure you want to disable ${userName || userId}'s account?`)) {
      disableStaff.mutate({ userId, venueId });
    }
  };

  const openResetPasswordModal = (userId: string, userName: string | null) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !venueId) return;
    
    resetStaffPassword.mutate({ 
      userId: selectedUserId, 
      venueId, 
      newPassword
    }, {
      onSuccess: () => {
        closeResetPasswordModal();
        alert('Password has been reset successfully');
      }
    });
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form fields
    setEmail('');
    setPassword('');
    setFullName('');
    setPhoneNumber('');
  };

  const closeResetPasswordModal = () => {
    setResetModalOpen(false);
    setSelectedUserId(null);
    setSelectedUserName(null);
    setNewPassword('');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Staff Management</h1>
        {venueId ? (
          <button
            onClick={openModal}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            disabled={createBartender.isPending}
          >
            {createBartender.isPending ? 'Adding...' : '+ Add Bartender'}
          </button>
        ) : (
          <button disabled className="w-full sm:w-auto px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed">
            + Add Bartender
          </button>
        )}
      </div>

      {!venueId && (
        <div className="bg-amber-50 border border-amber-300 text-amber-800 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">No Venue Assigned</h2>
          <p>You need to be assigned to a venue to manage its staff. Please contact an administrator.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Error Loading Staff</h2>
          <p>{error.message}</p>
        </div>
      )}

      {venueId && !error && (
        <>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search staff by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-6">
              <p className="text-gray-500">Loading staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              {searchTerm ? 'No staff match your search.' : 'No bartenders found. Add some!'}
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredStaff.map((member) => (
                <li key={member.id} className="p-4 border rounded shadow-sm bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="mb-2 sm:mb-0 flex-grow">
                    <p className="font-semibold">{member.full_name || '(Name Not Set)'}</p>
                    <p className="text-sm text-gray-500">{member.email || '(Email not available)'}</p>
                    <p className="text-sm text-gray-600">Role: {member.role}</p>
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
                                  onClick={() => handleDisableStaff(member.id, member.full_name)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } group flex w-full items-center px-4 py-2 text-sm`}
                                  disabled={disableStaff.isPending}
                                >
                                  Disable Profile
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => openResetPasswordModal(member.id, member.full_name)}
                                  className={`${
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  } group flex w-full items-center px-4 py-2 text-sm`}
                                  disabled={resetStaffPassword.isPending}
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
        </>
      )}

      {/* Create Staff Modal */}
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
                    Add New Bartender
                  </Dialog.Title>
                  
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div>
                      <label htmlFor="staffEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="staffEmail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="staffPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="staffPassword"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="staffFullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="staffFullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="staffPhone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="staffPhone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createBartender.isPending}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                      >
                        {createBartender.isPending ? 'Creating...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Reset Password Modal */}
      <Transition appear show={resetModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeResetPasswordModal}>
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
                    Reset Password for {selectedUserName || 'User'}
                  </Dialog.Title>
                  
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        onClick={closeResetPasswordModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetStaffPassword.isPending}
                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                      >
                        {resetStaffPassword.isPending ? 'Resetting...' : 'Reset Password'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default StaffManagement; 