import { useState } from 'react';
import PropTypes from 'prop-types';
import { UserCircleIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuthContext } from '../../context/AuthContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onClose();
      setPasswords({ current: '', new: '', confirm: '' });
    }, 1000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserCircleIcon className="h-6 w-6 text-primary-600" />
          <span>User Management</span>
        </div>
      }
      size="md"
    >
      <div className="space-y-6">
        <p className="text-gray-500 text-sm -mt-2">
          Manage your account settings and security
        </p>

        {/* Account Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <UserCircleIcon className="h-5 w-5" />
            <h3>Account Information</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                {user?.email || 'user@example.com'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                {/* Display a simple number as requested, fallback to 36 if no numeric ID exists */}
                {user?.numericId || '36'}
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Change Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-2 text-gray-900 font-medium">
            <LockClosedIcon className="h-5 w-5" />
            <h3>Change Password</h3>
          </div>

          <Input
            label="Current Password"
            name="current"
            type="password"
            placeholder="Enter current password"
            value={passwords.current}
            onChange={handleChange}
          />

          <Input
            label="New Password"
            name="new"
            type="password"
            placeholder="Enter new password"
            value={passwords.new}
            onChange={handleChange}
          />

          <Input
            label="Confirm New Password"
            name="confirm"
            type="password"
            placeholder="Confirm new password"
            value={passwords.confirm}
            onChange={handleChange}
          />

          <Button
            type="submit"
            variant="secondary"
            className="w-full bg-gray-500 hover:bg-gray-600 text-white"
            loading={loading}
          >
            Change Password
          </Button>
        </form>
      </div>
    </Modal>
  );
};

SettingsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SettingsModal;
