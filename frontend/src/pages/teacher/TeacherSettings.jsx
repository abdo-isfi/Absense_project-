import { useState } from 'react';
import { Cog6ToothIcon, BellIcon, CalendarIcon, KeyIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';

const TeacherSettings = () => {
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    fullName: 'Formateur',
    email: 'formateur@ofppt.ma',
    notificationsEnabled: true,
    emailNotifications: true,
    scheduleReminders: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Paramètres enregistrés avec succès');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Gérer vos préférences et paramètres</p>
      </div>

      {/* Success Message */}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Profile Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Nom complet"
            value={settings.fullName}
            onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
          />
          
          <Input
            label="Email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </div>
      </Card>

      {/* Notification Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <BellIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notifications activées</p>
              <p className="text-sm text-gray-500">Recevoir des notifications dans l'application</p>
            </div>
            <Badge variant={settings.notificationsEnabled ? 'success' : 'default'}>
              {settings.notificationsEnabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Notifications par email</p>
              <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
            </div>
            <Badge variant={settings.emailNotifications ? 'success' : 'default'}>
              {settings.emailNotifications ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Schedule Preferences */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <CalendarIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Emploi du temps</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Rappels de séances</p>
              <p className="text-sm text-gray-500">Recevoir des rappels avant chaque séance</p>
            </div>
            <Badge variant={settings.scheduleReminders ? 'success' : 'default'}>
              {settings.scheduleReminders ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <KeyIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
        </div>

        <div className="space-y-4">
          <div>
            <p className="font-medium text-gray-900 mb-2">Mot de passe</p>
            <Button variant="outline" size="sm">
              Changer le mot de passe
            </Button>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <InformationCircleIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Informations système</h2>
        </div>

        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rôle</p>
            <p className="font-medium text-gray-900">Formateur</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dernière connexion</p>
            <p className="font-medium text-gray-900">Aujourd'hui</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <Badge variant="success">Actif</Badge>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={loading}
        >
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
};

export default TeacherSettings;
