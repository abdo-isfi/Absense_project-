import { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  ArrowUpTrayIcon, 
  PencilSquareIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import Badge from '../../components/ui/Badge';
import traineeService from '../../services/traineeService';
import groupService from '../../services/groupService';
import absenceService from '../../services/absenceService';
import { handleApiError } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

// --- Helper Functions ---

const calculateAbsenceHours = (absences) => {
  let totalHours = 0;
  let lateCount = 0;

  absences.forEach(abs => {
    // Check if validated (backend field might vary, checking common ones)
    const isValidated = abs.isValidated || abs.is_validated || abs.validated;
    if (!isValidated) return;

    const status = (abs.status || '').toLowerCase();
    
    if (status === 'absent' && !abs.isJustified) {
      // Use absenceHours if available, else default to 5 (as per spec)
      const hours = Number(abs.absenceHours || abs.hours || 5);
      totalHours += hours;
    } else if (status === 'late' || status === 'retard') {
      lateCount++;
    }
  });

  // Every 4 lates = 1 hour
  totalHours += Math.floor(lateCount / 4);
  
  return Math.round(totalHours * 10) / 10;
};

const getTraineeStatus = (hours) => {
  if (hours >= 40) return { text: 'EXCL DEF (CD)', color: 'bg-red-600 text-white' };
  if (hours >= 35) return { text: 'EXCL TEMP (CD)', color: 'bg-orange-600 text-white' };
  if (hours >= 30) return { text: 'SUSP 2J (CD)', color: 'bg-orange-500 text-white' };
  if (hours >= 25) return { text: 'BLÂME (CD)', color: 'bg-yellow-600 text-white' };
  if (hours >= 20) return { text: '2ème MISE (CD)', color: 'bg-yellow-500 text-white' };
  if (hours >= 15) return { text: '1er MISE (CD)', color: 'bg-yellow-400 text-black' };
  if (hours >= 10) return { text: '2ème AVERT (SC)', color: 'bg-blue-500 text-white' };
  if (hours >= 5) return { text: '1er AVERT (SC)', color: 'bg-blue-300 text-black' };
  return { text: 'NORMAL', color: 'bg-green-100 text-green-800' };
};

// --- Components ---

const TraineeAbsenceDetailModal = ({ isOpen, onClose, trainee, absences }) => {
  if (!isOpen || !trainee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Détails: ${trainee.name} ${trainee.firstName}`} size="lg">
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Total Heures (Validées)</p>
            <p className="text-2xl font-bold">{trainee.totalAbsenceHours} h</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <span className={`px-2 py-1 rounded text-sm font-medium ${trainee.disciplinaryStatus?.color}`}>
              {trainee.disciplinaryStatus?.text}
            </span>
          </div>
        </div>

        <h4 className="font-medium text-gray-900">Historique des absences</h4>
        <div className="max-h-60 overflow-y-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Heure</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statut</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Justifié</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {absences.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-4 text-center text-gray-500">Aucune absence enregistrée</td>
                </tr>
              ) : (
                absences.map((abs, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 text-sm">
                      {abs.absenceRecordId?.date ? new Date(abs.absenceRecordId.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {abs.absenceRecordId?.startTime || '-'} - {abs.absenceRecordId?.endTime || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm capitalize">{abs.status}</td>
                    <td className="px-4 py-2 text-sm">
                      {abs.isJustified ? <CheckCircleIcon className="h-5 w-5 text-green-500" /> : <XCircleIcon className="h-5 w-5 text-red-500" />}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
};

const ManageTrainees = () => {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState([]);
  const [filteredTrainees, setFilteredTrainees] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupValidationStatus, setGroupValidationStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Data
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [traineeAbsences, setTraineeAbsences] = useState([]);
  const [formData, setFormData] = useState({ cef: '', name: '', firstName: '', groupe: '', phone: '' });

  // Import
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchTrainees();
    fetchGroups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trainees, search, selectedGroup, selectedStatus]);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getAllGroups();
      setGroups(data.map(g => ({ value: g.name, label: g.name })));
    } catch (err) { console.error(err); }
  };

  const fetchTrainees = async () => {
    setLoading(true);
    try {
      // Use the new endpoint with stats
      // If it fails (404), fallback to getAllTrainees and compute locally?
      // For now assume endpoint exists as I added it.
      let data;
      try {
        const response = await traineeService.getTraineesWithStats(); // Need to add this to service
        data = response;
      } catch (e) {
        // Fallback if service method not yet updated or endpoint fails
        const response = await traineeService.getAllTrainees({ limit: 1000 }); // Get all
        data = response.data;
      }

      // Normalize and compute stats if not already present
      const normalized = data.map(t => {
        const absences = t.absences || [];
        // If backend computed stats, use them. Else compute.
        const totalHours = t.totalAbsenceHours !== undefined ? t.totalAbsenceHours : calculateAbsenceHours(absences);
        const status = getTraineeStatus(totalHours);
        
        return {
          ...t,
          totalAbsenceHours: totalHours,
          disciplinaryStatus: status,
          absences: absences // Keep raw absences
        };
      });

      setTrainees(normalized);
      checkGroupValidationStatus(normalized);
    } catch (err) {
      setError('Erreur lors du chargement des stagiaires');
    } finally {
      setLoading(false);
    }
  };

  const checkGroupValidationStatus = async (traineeList) => {
    // This logic mimics the user spec: check if groups have unvalidated absences
    // We need to fetch all absences or use the ones attached to trainees
    // The spec says "GET /absences" is used.
    // Let's try to infer from trainee list first to save a call, or call API.
    // Since we have absences in trainee list (from with-stats), we can use that.
    
    const statusMap = {};
    const uniqueGroups = [...new Set(traineeList.map(t => t.groupe))];

    uniqueGroups.forEach(group => {
      // Find trainees in this group
      const groupTrainees = traineeList.filter(t => t.groupe === group);
      let hasUnvalidated = false;
      let latestDate = null;

      groupTrainees.forEach(t => {
        t.absences.forEach(abs => {
          if (!abs.isValidated && !abs.is_validated) hasUnvalidated = true;
          if (abs.absenceRecordId?.date) {
             if (!latestDate || new Date(abs.absenceRecordId.date) > new Date(latestDate)) {
               latestDate = abs.absenceRecordId.date;
             }
          }
        });
      });

      statusMap[group] = {
        status: hasUnvalidated ? 'mixed' : 'all_validated',
        latestDate: latestDate
      };
    });
    setGroupValidationStatus(statusMap);
  };

  const applyFilters = () => {
    let filtered = [...trainees];

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) || 
        t.firstName.toLowerCase().includes(term) ||
        t.cef.toLowerCase().includes(term)
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(t => t.groupe === selectedGroup);
    }

    if (selectedStatus) {
      filtered = filtered.filter(t => t.disciplinaryStatus.text === selectedStatus);
    }

    setFilteredTrainees(filtered);
  };

  // ... (CRUD Handlers: handleInputChange, handleSubmit, handleDelete same as before) ...
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTrainee) {
        await traineeService.updateTrainee(selectedTrainee._id, formData);
      } else {
        await traineeService.createTrainee(formData);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      fetchTrainees();
      resetForm();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async () => {
    try {
      await traineeService.deleteTrainee(selectedTrainee._id);
      setShowDeleteModal(false);
      fetchTrainees();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDeleteAll = async () => {
    try {
      await traineeService.deleteAllTrainees(); // Need to add to service
      setShowDeleteAllModal(false);
      fetchTrainees();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const resetForm = () => {
    setFormData({ cef: '', name: '', firstName: '', groupe: '', phone: '' });
    setSelectedTrainee(null);
  };

  // ... (Import Logic same as before) ...
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          let headerRowIndex = -1;
          for (let i = 0; i < rawData.length; i++) {
            const row = rawData[i];
            if (row.some(cell => cell && typeof cell === 'string' && cell.toLowerCase().trim() === 'cef')) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            setError('Impossible de trouver la ligne d\'en-tête (doit contenir "CEF")');
            return;
          }

          const headers = rawData[headerRowIndex].map(h => h ? h.toString().toLowerCase().trim() : '');
          const mappedData = [];
          
          for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;
            const rowData = {};
            headers.forEach((header, index) => { if (header) rowData[header] = row[index]; });
            
            const trainee = {
              cef: rowData['cef'],
              name: rowData['nom'],
              firstName: rowData['prenom'] || row['prénom'],
              groupe: rowData['groupe'],
              phone: rowData['telephone'] || row['téléphone'],
            };
            if (trainee.cef && trainee.name) mappedData.push(trainee);
          }
          setImportPreview(mappedData);
          setError('');
        } catch (err) {
          setError('Erreur lors de la lecture du fichier Excel');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    try {
      const result = await traineeService.importTrainees(importPreview);
      alert(`Import terminé !\nSuccès: ${result.results.success}\nÉchecs: ${result.results.failed}`);
      setShowImportModal(false);
      fetchTrainees();
      fetchGroups();
      setImportFile(null);
      setImportPreview([]);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setImporting(false);
    }
  };

  const openDetailsModal = (trainee) => {
    setSelectedTrainee(trainee);
    setTraineeAbsences(trainee.absences || []);
    setShowDetailsModal(true);
  };

  // Columns
  const columns = [
    { header: 'CEF', accessor: 'cef' },
    { header: 'Nom', accessor: 'name' },
    { header: 'Prénom', accessor: 'firstName' },
    { header: 'Groupe', accessor: 'groupe' },
    { 
      header: 'Heures', 
      accessor: 'totalAbsenceHours',
      render: (t) => <span className="font-bold">{t.totalAbsenceHours} h</span>
    },
    { 
      header: 'Statut', 
      accessor: 'disciplinaryStatus',
      render: (t) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${t.disciplinaryStatus?.color}`}>
          {t.disciplinaryStatus?.text}
        </span>
      )
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      render: (trainee) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openDetailsModal(trainee)} title="Détails">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedTrainee(trainee); setFormData(trainee); setShowEditModal(true); }} title="Modifier">
            <PencilSquareIcon className="h-5 w-5 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedTrainee(trainee); setShowDeleteModal(true); }} title="Supprimer">
            <TrashIcon className="h-5 w-5 text-red-600" />
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Stagiaires</h1>
          <p className="text-gray-500 text-sm">Total: {trainees.length} stagiaires</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="ghost" onClick={fetchTrainees} title="Actualiser">
            <ArrowPathIcon className="h-5 w-5" />
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteAllModal(true)} className="flex items-center gap-2">
            <TrashIcon className="h-5 w-5" />
            Tout Supprimer
          </Button>
          <Button variant="secondary" onClick={() => setShowImportModal(true)} className="flex items-center gap-2">
            <ArrowUpTrayIcon className="h-5 w-5" />
            Importer Excel
          </Button>
          <Button variant="primary" onClick={() => { resetForm(); setShowAddModal(true); }} className="flex items-center gap-2">
            <PlusIcon className="h-5 w-5" />
            Ajouter
          </Button>
        </div>
      </div>

      {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}

      {/* Group Validation Warnings */}
      {Object.entries(groupValidationStatus).some(([_, status]) => status.status === 'mixed') && (
        <Alert type="warning" title="Validation Requise">
          <div className="mt-2 text-sm">
            Certains groupes ont des absences non validées :
            <ul className="list-disc list-inside mt-1">
              {Object.entries(groupValidationStatus)
                .filter(([_, status]) => status.status === 'mixed')
                .map(([group, status]) => (
                  <li key={group} className="flex items-center gap-2">
                    <span className="font-medium">{group}</span>
                    <button 
                      onClick={() => navigate(`${ROUTES.SG.ABSENCE}?group=${group}&date=${status.latestDate ? new Date(status.latestDate).toISOString().split('T')[0] : ''}`)}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      (Valider maintenant)
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        </Alert>
      )}

      <Card>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Input
            label="Rechercher"  
            placeholder="Rechercher (Nom, CEF)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={MagnifyingGlassIcon}
          />
          <Select
            label="Groupe"
            placeholder="Toutes"
            options={[{ value: '', label: 'Toutes' }, ...groups]}
            value={selectedGroup}
            onChange={(val) => setSelectedGroup(val)}
          />
          <Select
            label="Statut"
            placeholder="Tous les statuts"
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'NORMAL', label: 'NORMAL' },
              { value: '1er AVERT (SC)', label: '1er AVERT (SC)' },
              { value: '2ème AVERT (SC)', label: '2ème AVERT (SC)' },
              { value: '1er MISE (CD)', label: '1er MISE (CD)' },
              { value: '2ème MISE (CD)', label: '2ème MISE (CD)' },
              { value: 'BLÂME (CD)', label: 'BLÂME (CD)' },
              { value: 'SUSP 2J (CD)', label: 'SUSP 2J (CD)' },
              { value: 'EXCL TEMP (CD)', label: 'EXCL TEMP (CD)' },
              { value: 'EXCL DEF (CD)', label: 'EXCL DEF (CD)' },
            ]}
            value={selectedStatus}
            onChange={(val) => setSelectedStatus(val)}
          />
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Table 
            columns={columns} 
            data={filteredTrainees} 
            emptyMessage="Aucun stagiaire trouvé"
          />
        )}
      </Card>

      {/* Modals */}
      <Modal isOpen={showAddModal || showEditModal} onClose={() => { setShowAddModal(false); setShowEditModal(false); }} title={showEditModal ? 'Modifier Stagiaire' : 'Ajouter Stagiaire'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="CEF" name="cef" value={formData.cef} onChange={handleInputChange} required disabled={showEditModal} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" name="name" value={formData.name} onChange={handleInputChange} required />
            <Input label="Prénom" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
          </div>
          <Input label="Groupe" name="groupe" value={formData.groupe} onChange={handleInputChange} required />
          <Input label="Téléphone" name="phone" value={formData.phone} onChange={handleInputChange} />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => { setShowAddModal(false); setShowEditModal(false); }}>Annuler</Button>
            <Button type="submit" variant="primary">Enregistrer</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importer des Stagiaires (Excel)" size="lg">
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Cliquez pour sélectionner un fichier Excel</p>
            </label>
          </div>
          {importPreview.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Aperçu ({importPreview.length} stagiaires)</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">CEF</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nom</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Groupe</th></tr></thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {importPreview.slice(0, 5).map((row, i) => (<tr key={i}><td className="px-4 py-2 text-sm">{row.cef}</td><td className="px-4 py-2 text-sm">{row.name} {row.firstName}</td><td className="px-4 py-2 text-sm">{row.groupe}</td></tr>))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>Annuler</Button>
            <Button variant="primary" onClick={handleImport} disabled={importPreview.length === 0 || importing} loading={importing}>Importer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirmer la suppression">
        <div className="space-y-4">
          <p className="text-gray-600">Êtes-vous sûr de vouloir supprimer ce stagiaire ?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteAllModal} onClose={() => setShowDeleteAllModal(false)} title="Supprimer TOUS les stagiaires">
        <div className="space-y-4">
          <Alert type="error" title="Attention !">
            Cette action supprimera <strong>tous les stagiaires</strong> et <strong>toutes leurs absences</strong> de la base de données. 
            Cette action est irréversible.
          </Alert>
          <p className="text-gray-600">Êtes-vous vraiment sûr de vouloir continuer ?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteAllModal(false)}>Annuler</Button>
            <Button variant="danger" onClick={handleDeleteAll}>TOUT SUPPRIMER</Button>
          </div>
        </div>
      </Modal>

      <TraineeAbsenceDetailModal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)} 
        trainee={selectedTrainee} 
        absences={traineeAbsences} 
      />
    </div>
  );
};

export default ManageTrainees;
