import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import TeacherAbsence from './pages/teacher/TeacherAbsence';
import SGDashboard from './pages/sg/SGDashboard';
import ManageTrainees from './pages/sg/ManageTrainees';
import ManageTeachers from './pages/sg/ManageTeachers';
import AbsenceTracking from './pages/sg/AbsenceTracking';
import ExportPage from './pages/sg/ExportPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AddUser from './pages/admin/AddUser';
import ManageUsers from './pages/admin/ManageUsers';
import EditUser from './pages/admin/EditUser';
import Settings from './pages/admin/Settings';
import { ROUTES, USER_ROLES } from './utils/constants';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
          
          {/* Teacher Routes */}
          <Route path={ROUTES.TEACHER.DASHBOARD} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
              <DashboardLayout>
                <TeacherDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path={ROUTES.TEACHER.SCHEDULE} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
              <DashboardLayout>
                <TeacherSchedule />
              </DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path={ROUTES.TEACHER.ABSENCE} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]}>
              <DashboardLayout>
                <TeacherAbsence />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* SG Routes */}
          <Route path={ROUTES.SG.MENU} element={<Navigate to={ROUTES.SG.DASHBOARD} replace />} />
          
          <Route path={ROUTES.SG.DASHBOARD} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SG]}>
              <DashboardLayout>
                <SGDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.SG.MANAGE_TRAINEES} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SG]}>
              <DashboardLayout>
                <ManageTrainees />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.SG.MANAGE_TEACHERS} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SG]}>
              <DashboardLayout>
                <ManageTeachers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.SG.ABSENCE} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SG]}>
              <DashboardLayout>
                <AbsenceTracking />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.SG.EXPORT} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.SG]}>
              <DashboardLayout>
                <ExportPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path={ROUTES.ADMIN.DASHBOARD} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.ADMIN.ADD_USER} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <AddUser />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.ADMIN.MANAGE_USERS} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <ManageUsers />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.ADMIN.EDIT_USER} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <EditUser />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path={ROUTES.ADMIN.SETTINGS} element={
            <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
