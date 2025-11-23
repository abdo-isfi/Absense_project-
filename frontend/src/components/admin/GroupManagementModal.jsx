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
      // Assuming teacher.groups contains array of group IDs or objects
      if (teacher.groups) {
        setSelectedGroups(teacher.groups.map(g => typeof g === 'object' ? g._id : g));
      } else {
        setSelectedGroups([]);
      }
    }
  }, [isOpen, teacher]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await groupService.getAllGroups();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (groupId) => {
    setSelectedGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
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

  const handlePrint = () => {
    const printContent = document.getElementById('printable-groups');
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    printWindow.document.write(`
      <html>
        <head>
          <title>Groupes - ${teacher.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 10px; }
            ul { list-style-type: none; padding: 0; }
            li { padding: 5px 0; border-bottom: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Formateur: ${teacher.name}</h1>
          <h2>Groupes assignés:</h2>
          <ul>
            ${groups
              .filter(g => selectedGroups.includes(g._id))
              .map(g => `<li>${g.name}</li>`)
              .join('')}
          </ul>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    const assignedGroups = groups.filter(g => selectedGroups.includes(g._id));
    const content = `Formateur: ${teacher.name}\n\nGroupes assignés:\n${assignedGroups.map(g => `- ${g.name}`).join('\n')}`;
    
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `groupes_${teacher.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>

            <div id="printable-groups" className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {loading ? (
                <div className="text-center py-4">Chargement...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {groups.map(group => (
                    <label key={group._id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroups.includes(group._id)}
                        onChange={() => handleCheckboxChange(group._id)}
                        className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <span className="text-gray-700">{group.name}</span>
                    </label>
                  ))}
                </div>
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
