import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import TeacherSelection from '../../components/schedule/TeacherSelection';
import TimetableGrid from '../../components/schedule/TimetableGrid';
import SessionModal from '../../components/schedule/SessionModal';
import ScheduleSummary from '../../components/schedule/ScheduleSummary';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';
import scheduleService from '../../services/scheduleService';
import { handleApiError } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const STEPS = [
  { id: 1, name: 'Sélection formateur', description: 'Choisir le formateur' },
  { id: 2, name: 'Emploi du temps', description: 'Créer les séances' },
  { id: 3, name: 'Aperçu', description: 'Vérifier et enregistrer' },
];

const TimetableBuilder = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [scheduleId, setScheduleId] = useState(null);
  
  // Modal state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);

  // Smart Merge state
  const [activeBlock, setActiveBlock] = useState(null); // Last created/edited session

  // UI state
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Step 1: Teacher Selection
  const handleSelectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    
    // Check if teacher already has a schedule
    try {
      setLoadingSchedule(true);
      const response = await scheduleService.getScheduleByTeacher(teacher._id);
      
      if (response.success && response.data) {
        // Teacher has an existing schedule
        const existingSchedule = response.data;
        setScheduleId(existingSchedule._id);
        setSessions(existingSchedule.sessions || []);
        setSuccess(`Emploi du temps existant chargé pour ${teacher.firstName} ${teacher.lastName}. Vous pouvez le modifier.`);
      } else {
        // No existing schedule
        setSessions([]);
        setScheduleId(null);
      }
    } catch (err) {
      // 404 means no schedule exists, which is fine
      if (err.response?.status === 404) {
        setSessions([]);
        setScheduleId(null);
      } else {
        console.error('Error checking for existing schedule:', err);
      }
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleNextFromStep1 = () => {
    if (selectedTeacher) {
      setCurrentStep(2);
    }
  };

  // Step 2: Timetable Grid
  const handleEditSession = (day, timeSlot, session) => {
    setEditingDay(day);
    setEditingTimeSlot(timeSlot);
    setEditingSession(session || null);
    setShowSessionModal(true);
  };

  const handleSaveSession = async (sessionData) => {
    // Update sessions array
    const existingIndex = sessions.findIndex(
      s => s.day === sessionData.day && s.timeSlot === sessionData.timeSlot
    );

    let updatedSessions;
    if (existingIndex >= 0) {
      // Update existing session - preserve merged properties
      const existingSession = sessions[existingIndex];
      updatedSessions = [...sessions];
      updatedSessions[existingIndex] = {
        ...sessionData,
        // Preserve merged session properties if it was merged
        isMerged: existingSession.isMerged,
        originalSlots: existingSession.originalSlots,
      };
    } else {
      // Add new session
      updatedSessions = [...sessions, sessionData];
    }

    setSessions(updatedSessions);
    setActiveBlock(sessionData); // Set as active block for merge suggestions
    setShowSessionModal(false);
    setSuccess('Séance ajoutée avec succès');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteSession = async (day, timeSlot) => {
    // Find the session to delete (could be merged)
    const sessionToDelete = sessions.find(s => {
      if (s.day === day) {
        // Check if it's a direct match
        if (s.timeSlot === timeSlot) return true;
        // Check if it's a merged session and this timeSlot is one of the original slots
        if (s.isMerged && s.originalSlots) {
          return s.originalSlots.includes(timeSlot);
        }
      }
      return false;
    });

    if (!sessionToDelete) return;

    const updatedSessions = sessions.filter(s => s !== sessionToDelete);
    setSessions(updatedSessions);
    setActiveBlock(null); // Clear active block
    setShowSessionModal(false);
    setSuccess('Séance supprimée avec succès');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Smart Merge: Merge active block with next time slot
  const handleMergeSession = (nextDay, nextTimeSlot) => {
    if (!activeBlock) {
      return;
    }

    // Create merged session data
    const mergedTimeSlot = `${activeBlock.timeSlot.split('-')[0]}-${nextTimeSlot.split('-')[1]}`;
    
    const mergedSession = {
      ...activeBlock,
      timeSlot: mergedTimeSlot,
      isMerged: true,
      originalSlots: activeBlock.originalSlots 
        ? [...activeBlock.originalSlots, nextTimeSlot]
        : [activeBlock.timeSlot, nextTimeSlot],
    };

    // Update sessions: replace the active block with merged version
    const updatedSessions = sessions.map(s => 
      s.day === activeBlock.day && s.timeSlot === activeBlock.timeSlot
        ? mergedSession
        : s
    );

    setSessions(updatedSessions);
    setActiveBlock(mergedSession); // Update active block to merged version
    setSuccess('Séances fusionnées avec succès');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleNextFromStep2 = () => {
    if (sessions.length === 0) {
      setError('Veuillez ajouter au moins une séance');
      return;
    }
    setCurrentStep(3);
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  // Step 3: Summary
  const handleEditFromSummary = () => {
    setCurrentStep(2);
  };

  const handleStartOver = () => {
    if (window.confirm('Êtes-vous sûr de vouloir recommencer ? Toutes les données seront perdues.')) {
      setCurrentStep(1);
      setSelectedTeacher(null);
      setSessions([]);
      setScheduleId(null);
      setSuccess('');
      setError('');
    }
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError('');

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;

      const scheduleData = {
        teacher: selectedTeacher._id,
        sessions,
        weekNumber: 1,
        academicYear,
      };

      if (scheduleId) {
        // Update existing schedule
        await scheduleService.updateSchedule(scheduleId, scheduleData);
        setSuccess('Emploi du temps mis à jour avec succès !');
      } else {
        // Create new schedule
        const response = await scheduleService.createSchedule(scheduleData);
        setScheduleId(response.data._id);
        setSuccess('Emploi du temps créé avec succès !');
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(ROUTES.ADMIN.DASHBOARD);
      }, 2000);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Créer un emploi du temps</h1>
        <p className="text-gray-600 mt-1">
          Créez et gérez les emplois du temps des formateurs
        </p>
      </div>

      {/* Progress Steps */}
      <Card>
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {STEPS.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`relative ${stepIdx !== STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                        currentStep > step.id
                          ? 'border-primary-600 bg-primary-600'
                          : currentStep === step.id
                          ? 'border-primary-600 bg-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircleIcon className="h-6 w-6 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            currentStep === step.id ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>
                    <div className="ml-4 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.name}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {stepIdx !== STEPS.length - 1 && (
                    <div
                      className={`ml-4 flex-1 border-t-2 transition-all ${
                        currentStep > step.id ? 'border-primary-600' : 'border-gray-300'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      </Card>

      {/* Alerts */}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        {currentStep === 1 && (
          <TeacherSelection
            selectedTeacher={selectedTeacher}
            onSelectTeacher={handleSelectTeacher}
            onNext={handleNextFromStep1}
          />
        )}

        {currentStep === 2 && (
          <TimetableGrid
            sessions={sessions}
            onEditSession={handleEditSession}
            onNext={handleNextFromStep2}
            onBack={handleBackToStep1}
            activeBlock={activeBlock}
            onMergeSession={handleMergeSession}
            teacherId={selectedTeacher?._id}
          />
        )}

        {currentStep === 3 && (
          <ScheduleSummary
            teacher={selectedTeacher}
            sessions={sessions}
            onSave={handleSaveSchedule}
            onEdit={handleEditFromSummary}
            onStartOver={handleStartOver}
            saving={saving}
          />
        )}
      </Card>

      {/* Session Edit Modal */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        day={editingDay}
        timeSlot={editingTimeSlot}
        session={editingSession}
        teacherId={selectedTeacher?._id}
        scheduleId={scheduleId}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
      />
    </div>
  );
};

export default TimetableBuilder;
