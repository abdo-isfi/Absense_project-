import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import authService from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import Loader from '../../components/ui/Loader';
import { ROUTES } from '../../utils/constants';
import { handleApiError } from '../../utils/helpers';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated, userRole, user } = useAuthContext();

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated and no password change required
  useEffect(() => {
    if (isAuthenticated && userRole && !user?.must_change_password) {
      redirectByRole(userRole);
    }
  }, [isAuthenticated, userRole, user]);

  const redirectByRole = (role) => {
    if (role === 'teacher') navigate(ROUTES.TEACHER.DASHBOARD);
    else if (role === 'sg') navigate(ROUTES.SG.MENU);
    else if (role === 'admin') navigate(ROUTES.ADMIN.DASHBOARD);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Check if password change required
      if (data.user.must_change_password) {
        setShowPasswordModal(true);
        setLoading(false);
        return;
      }

      // Redirect based on role
      // redirectByRole(data.user.role); // Let useEffect handle it
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await authService.changePassword(password, newPassword, confirmPassword);
      setShowPasswordModal(false);
      redirectByRole(userRole);
    } catch (err) {
      setPasswordError(handleApiError(err));
    }
  };

  if (loading) {
    return <Loader fullScreen text="Connexion en cours..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">
              ISTA NTIC
            </h1>Email
            <p className="text-gray-600">
              Système de Gestion des Absences
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert type="error" dismissible onDismiss={() => setError('')}>
                {error}
              </Alert>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              required
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Se souvenir de moi
              </label>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="lg"
              loading={loading}
              className="w-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © 2025 OFPPT. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Changement de mot de passe requis"
        size="md"
        footer={
          <div className="flex gap-3 justify-end">
            <Button 
              variant="secondary" 
              onClick={() => setShowPasswordModal(false)}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              onClick={handlePasswordChange}
            >
              Changer le mot de passe
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Alert type="info">
            Pour des raisons de sécurité, vous devez changer votre mot de passe.
          </Alert>

          {passwordError && (
            <Alert type="error" dismissible onDismiss={() => setPasswordError('')}>
              {passwordError}
            </Alert>
          )}

          <Input
            label="Nouveau mot de passe"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            required
          />

          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirmer le mot de passe"
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default LoginPage;
