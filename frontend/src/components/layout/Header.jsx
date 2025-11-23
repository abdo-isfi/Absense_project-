import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuthContext } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import { cn } from '../../utils/cn';

const Header = ({ onToggleSidebar }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <UserCircleIcon className="h-8 w-8 text-gray-600" />
              <div className="text-left hidden desktop:block">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div className="p-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                          active ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                        )}
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        Paramètres
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
                          active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                        )}
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        Déconnexion
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  onToggleSidebar: PropTypes.func,
};

export default Header;
