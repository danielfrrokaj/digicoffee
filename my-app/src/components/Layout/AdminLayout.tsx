import React, { ReactNode, useState, Fragment } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed
import { Dialog, Transition } from '@headlessui/react'; // For mobile sidebar
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'; // Icons

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // State for mobile sidebar

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Venues', href: '/admin/venues' },
    { name: 'Staff', href: '/admin/users' },
    { name: 'Analytics', href: '/admin/analytics' },
    // Add other admin links here
  ];

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
       <div className="flex h-16 shrink-0 items-center">
         {/* Optional Logo? */}
         <h2 className="text-xl font-bold text-white">DigiCoffee Admin</h2>
       </div>
       <nav className="flex flex-1 flex-col">
         <ul role="list" className="flex flex-1 flex-col gap-y-7">
           <li>
             <ul role="list" className="-mx-2 space-y-1">
               {navigation.map((item) => (
                 <li key={item.name}>
                   <Link
                     to={item.href}
                     onClick={() => setSidebarOpen(false)} // Close mobile sidebar on click
                     className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-400 hover:text-white hover:bg-gray-800"
                   >
                     {item.name}
                   </Link>
                 </li>
               ))}
             </ul>
           </li>
            {/* Optional extra sections can go here */}
           <li className="mt-auto">
              <button 
                onClick={signOut} 
                className="w-full group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-red-400 hover:bg-gray-800 hover:text-red-300"
              >
                 Logout
             </button>
           </li>
         </ul>
       </nav>
     </div>
  );

  return (
    <div>
      {/* Mobile sidebar using Headless UI Dialog */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                 {/* Sidebar Content for mobile */} 
                 <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-64 md:flex-col">
         {/* Sidebar Content for desktop */} 
         <SidebarContent />
      </div>

      {/* Header bar for mobile (includes hamburger button) */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-gray-900 px-4 py-4 shadow-sm md:hidden">
        <button type="button" className="-m-2.5 p-2.5 text-gray-400 md:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-white">DigiCoffee Admin</div>
         {/* Optional: Add user avatar or other header items here */}
      </div>

      {/* Main content area */}
      <main className="py-10 md:pl-64">
        <div className="px-4 sm:px-6 lg:px-8">
           {/* Outlet for nested routes */} 
           {children ?? <Outlet />} 
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 