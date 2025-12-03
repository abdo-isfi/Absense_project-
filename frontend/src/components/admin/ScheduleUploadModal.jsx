import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon, CheckCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import api from '../../services/api';
import teacherService from '../../services/teacherService';
import scheduleService from '../../services/scheduleService';
import { API_URL } from '../../utils/constants';
import { useNavigate } from 'react-router-dom';

const ScheduleUploadModal = ({ isOpen, onClose, teacher, onSave, readOnly = false }) => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [hasSchedule, setHasSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState(null);
  const [checkingSchedule, setCheckingSchedule] = useState(false);

  useEffect(() => {
    const checkDatabaseSchedule = async () => {
      if (!teacher) return;
      
      try {
        setCheckingSchedule(true);
        const teacherId = teacher._id || teacher.id;
        const response = await scheduleService.getScheduleByTeacher(teacherId);
        
        if (response.success && response.data) {
          setHasSchedule(true);
          setScheduleData(response.data);
        }
      } catch (err) {
        // 404 is expected if no schedule exists
        if (err.response?.status !== 404) {
          console.error('Error checking schedule:', err);
        }
      } finally {
        setCheckingSchedule(false);
      }
    };

    if (isOpen && teacher) {
      // Reset state for file upload
      setFile(null);
      setError('');
      setHasSchedule(false);
      setScheduleData(null);

      // Check for database schedule
      checkDatabaseSchedule();

      // Check for uploaded file schedule
      if (teacher.schedulePath) {
        // Use backend URL
        const baseUrl = API_URL.replace('/api', '');
        // Ensure path doesn't start with / if we append it, or handle it safely
        // teacher.schedulePath usually is "uploads/..."
        setPreview(`${baseUrl}/${teacher.schedulePath}`);
        
        const ext = teacher.schedulePath.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
          setFileType('image/' + ext);
        } else if (ext === 'pdf') {
          setFileType('application/pdf');
        } else {
          setFileType('application/octet-stream');
        }
      } else {
        setPreview(null);
        setFileType(null);
      }
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
      const teacherId = teacher._id || teacher.id;
      
      // Use teacherService to upload
      await teacherService.uploadSchedule(teacherId, file);

      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
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
            {/* Database Schedule Status */}
            {checkingSchedule ? (
              <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                <div className="animate-spin h-5 w-5 border-2 border-primary-600 border-t-transparent rounded-full" />
                <span className="text-sm text-gray-600">Vérification de l'emploi du temps...</span>
              </div>
            ) : hasSchedule ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Emploi du temps existant</p>
                      <p className="text-sm text-green-700 mt-1">
                        Ce formateur a déjà un emploi du temps dans le système
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Année: {scheduleData?.academicYear} | Dernière mise à jour: {new Date(scheduleData?.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onClose();
                      navigate('/admin/emploi-du-temps');
                    }}
                    icon={PencilSquareIcon}
                  >
                    Modifier
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <DocumentIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900">Aucun emploi du temps</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Créez un emploi du temps pour ce formateur
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        onClose();
                        navigate('/admin/emploi-du-temps');
                      }}
                      className="mt-2"
                    >
                      Créer un emploi du temps
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!readOnly && (
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
            )}

            {preview ? (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <div className="p-2 bg-gray-100 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                  Aperçu
                </div>
                <div className="p-4 flex justify-center">
                  {fileType?.startsWith('image/') ? (
                    <img src={preview} alt="Schedule Preview" className="max-h-[60vh] object-contain" />
                  ) : (
                    <div className="text-center py-8">
                      <DocumentIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-900 font-medium">Document PDF</p>
                      <a href={preview} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm block mt-2">
                        Ouvrir le PDF
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <DocumentIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Aucun emploi du temps disponible</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            {!readOnly && (
              <Button variant="primary" onClick={handleSave} loading={uploading} disabled={!file && !preview}>
                Enregistrer
              </Button>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ScheduleUploadModal;
