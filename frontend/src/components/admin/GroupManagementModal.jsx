import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import groupService from '../../services/groupService';
import api from '../../services/api';

const GroupManagementModal = ({ isOpen, onClose, teacher, onSave }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && teacher) {
      fetchGroups();
      // Initialize selected groups from teacher object if available
      // Assuming teacher.groups contains array of group objects (populated) or strings
      if (teacher.groups) {
        // Map to names, handling both populated objects and raw strings/IDs if any
        setSelectedGroups(teacher.groups.map(g => typeof g === 'object' ? g.name : g));
      } else {
        setSelectedGroups([]);
      }
    }
  }, [isOpen, teacher]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await groupService.getAllGroups();
      setGroups(response || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (groupName) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupName)) {
        return prev.filter(name => name !== groupName);
      } else {
        return [...prev, groupName];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update teacher with selected groups
      // We'll use a specific endpoint or the general update endpoint
      await api.put(`/teachers/${teacher.id}`, { groups: selectedGroups });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving groups:', error);
    } finally {
      setSaving(false);
    }
  };



  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-primary-600" />
              Gérer les groupes - {teacher?.name}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div id="printable-groups" className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Chargement des groupes...</div>
              ) : (
                <>
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">Aucun groupe disponible</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {groups
                        .map(group => {
                          const isSelected = selectedGroups.includes(group.name);
                          return (
                            <div 
                              key={group._id} 
                              onClick={() => handleCheckboxChange(group.name)}
                              className={`
                                cursor-pointer p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group
                                ${isSelected 
                                  ? 'bg-primary-50 border-primary-500 shadow-sm' 
                                  : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'}
                              `}
                            >
                              <span className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                                {group.name}
                              </span>
                              <div className={`
                                w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300 group-hover:border-primary-400'}
                              `}>
                                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Enregistrer
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default GroupManagementModal;
