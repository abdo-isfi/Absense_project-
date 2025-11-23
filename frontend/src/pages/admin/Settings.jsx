import { useState } from 'react';
import { Cog6ToothIcon, BellIcon, ShieldCheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';

const Settings = () => {
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    siteName: 'ISTA NTIC',
    adminEmail: 'admin@ofppt.ma',
    notificationsEnabled: true,
    autoBackup: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Paramètres enregistrés avec succès');
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
        <p className="text-gray-600 mt-1">Gérer les paramètres de l'application</p>
      </div>

      {/* Success Message */}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* General Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Paramètres généraux</h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Nom du site"
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
          />
          
          <Input
            label="Email administrateur"
            type="email"
            value={settings.adminEmail}
            onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
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
              <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
            </div>
            <Badge variant={settings.notificationsEnabled ? 'success' : 'default'}>
              {settings.notificationsEnabled ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Sauvegarde automatique</p>
              <p className="text-sm text-gray-500">Sauvegarder automatiquement les données chaque jour</p>
            </div>
            <Badge variant={settings.autoBackup ? 'success' : 'default'}>
              {settings.autoBackup ? 'Activé' : 'Désactivé'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* System Info */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <EnvelopeIcon className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Informations système</h2>
        </div>

        <div className="grid grid-cols-1 desktop:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Version</p>
            <p className="font-medium text-gray-900">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dernière mise à jour</p>
            <p className="font-medium text-gray-900">23 Novembre 2025</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Base de données</p>
            <p className="font-medium text-gray-900">MongoDB</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Statut</p>
            <Badge variant="success">En ligne</Badge>
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

export default Settings;
