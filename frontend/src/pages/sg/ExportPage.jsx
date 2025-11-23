import { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import groupService from '../../services/groupService';
import absenceService from '../../services/absenceService';
import { handleApiError } from '../../utils/helpers';

const ExportPage = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedGroup, setSelectedGroup] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const data = await groupService.getAllGroups();
      setGroups(data.map(g => ({ value: g.code, label: g.name })));
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleExport = async () => {
    if (!selectedGroup) {
      setError('Veuillez sélectionner un groupe');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch absences for the group
      // Note: currently getGroupAbsences takes a single date. 
      // We might need to update backend to support range, or just fetch for specific date.
      // For this MVP, let's assume we fetch all or filter client side if backend supports it.
      // Since backend getGroupAbsences filters by date if provided, if we don't provide date it returns all?
      // Let's check backend... yes, if date is missing it returns all for group.
      
      const data = await absenceService.getGroupAbsences(selectedGroup);
      
      // Filter by date range client-side if needed
      let filteredData = data;
      if (startDate && endDate) {
        filteredData = data.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
      }

      if (filteredData.length === 0) {
        setError('Aucune donnée trouvée pour cette période');
        setLoading(false);
        return;
      }

      // Format for Excel
      const exportData = filteredData.map(record => ({
        Date: new Date(record.date).toLocaleDateString(),
        Heure_Debut: record.startTime,
        Heure_Fin: record.endTime,
        Matiere: record.subject,
        Formateur: record.teacherId ? `${record.teacherId.firstName} ${record.teacherId.lastName}` : 'N/A',
        // We would need to fetch trainee details for each absence to list names, 
        // but absenceRecord only has metadata. TraineeAbsence has details.
        // The backend getGroupAbsences returns AbsenceRecords.
        // We probably need a better endpoint for "Report" that joins everything.
        // For now, we export the sessions list.
      }));

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Absences");

      // Download
      XLSX.writeFile(wb, `Absences_${selectedGroup}_${startDate || 'All'}.xlsx`);

    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Exportation des Données</h1>
      </div>

      {error && <Alert type="error" dismissible onDismiss={() => setError('')}>{error}</Alert>}

      <Card>
        <div className="max-w-xl mx-auto space-y-6 py-6">
          <div className="text-center mb-8">
            <DocumentTextIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Générer un rapport d'absences</h2>
            <p className="text-gray-500 mt-2">
              Sélectionnez un groupe et une période pour exporter les données au format Excel.
            </p>
          </div>

          <div className="space-y-4">
            <Select
              label="Groupe"
              options={groups}
              value={groups.find(g => g.value === selectedGroup)}
              onChange={(opt) => setSelectedGroup(opt ? opt.value : '')}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Date début"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="Date fin"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleExport}
              variant="primary" 
              className="w-full flex justify-center items-center gap-2"
              loading={loading}
              disabled={!selectedGroup}
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Exporter vers Excel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExportPage;
