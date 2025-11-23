import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import api from '../../services/api';

const ScheduleUploadModal = ({ isOpen, onClose, teacher, onSave }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && teacher) {
      // Check local storage for existing schedule
      const schedules = JSON.parse(localStorage.getItem('teacherSchedules') || '{}');
      if (schedules[teacher.id]) {
        setPreview(schedules[teacher.id].preview);
        setFileType(schedules[teacher.id].type);
      } else {
        setFile(null);
        setPreview(null);
        setFileType(null);
      }
      setError('');
    }
  }, [isOpen, teacher]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
      setError('Veuillez sélectionner une image ou un fichier PDF.');
      return;
    }

    setFile(selectedFile);
    setFileType(selectedFile.type);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSave = async () => {
    if (!file && !preview) return;

    setUploading(true);
    try {
      // Try to upload to backend first
      const formData = new FormData();
      formData.append('schedule', file);
      
      try {
        await api.post(`/teachers/${teacher.id}/schedule`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (apiError) {
        console.warn('Backend upload failed, falling back to local storage', apiError);
        // Fallback to local storage
        const schedules = JSON.parse(localStorage.getItem('teacherSchedules') || '{}');
        schedules[teacher.id] = {
          preview: preview,
          type: fileType,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('teacherSchedules', JSON.stringify(schedules));
      }

      onSave();
      onClose();
    } catch (err) {
      setError('Erreur lors de l\'enregistrement de l\'emploi du temps');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DocumentIcon className="h-5 w-5 text-primary-600" />
              Emploi du temps - {teacher?.name}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium">
                Cliquez ou glissez un fichier ici
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Images (PNG, JPG) ou PDF
              </p>
            </div>

            {preview && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-2 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                  Aperçu
                </div>
                <div className="p-4 flex justify-center">
                  {fileType?.startsWith('image/') ? (
                    <img src={preview} alt="Schedule Preview" className="max-h-64 object-contain" />
                  ) : (
                    <div className="text-center py-8">
                      <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-900 font-medium">Document PDF</p>
                      <a href={preview} download="schedule.pdf" className="text-primary-600 hover:underline text-sm">
                        Télécharger pour voir
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave} loading={uploading} disabled={!file && !preview}>
              Enregistrer
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ScheduleUploadModal;
