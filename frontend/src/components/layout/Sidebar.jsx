import { Fragment } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  UsersIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';
import { ROUTES, USER_ROLES } from '../../utils/constants';

const Sidebar = ({ userRole, isCollapsed = false }) => {
  const getMenuItems = () => {
    switch (userRole) {
      case USER_ROLES.TEACHER:
        return [
          { name: 'Dashboard', icon: HomeIcon, path: ROUTES.TEACHER.DASHBOARD },
          { name: 'Emploi du Temps', icon: CalendarIcon, path: ROUTES.TEACHER.SCHEDULE },
          { name: 'Gérer Absences', icon: ClipboardDocumentCheckIcon, path: ROUTES.TEACHER.ABSENCE },
        ];
      
      case USER_ROLES.SG:
        return [
          { name: 'Dashboard', icon: HomeIcon, path: ROUTES.SG.DASHBOARD },
          { name: 'Gérer Stagiaires', icon: UserGroupIcon, path: ROUTES.SG.MANAGE_TRAINEES },
          { name: 'Liste Stagiaires', icon: UsersIcon, path: ROUTES.SG.TRAINEES_LIST },
          { name: 'Gérer Formateurs', icon: UsersIcon, path: ROUTES.SG.MANAGE_TEACHERS },
          { name: 'Suivi Absences', icon: DocumentChartBarIcon, path: ROUTES.SG.ABSENCE },
          { name: 'Export', icon: ArrowDownTrayIcon, path: ROUTES.SG.EXPORT },
        ];
      
      case USER_ROLES.ADMIN:
        return [
          { name: 'Dashboard', icon: HomeIcon, path: ROUTES.ADMIN.DASHBOARD },
          { name: 'Emploi du Temps', icon: CalendarIcon, path: ROUTES.ADMIN.TIMETABLE_BUILDER },
          { name: 'Ajouter Utilisateur', icon: UserPlusIcon, path: ROUTES.ADMIN.ADD_USER },
          { name: 'Gérer Utilisateurs', icon: UsersIcon, path: ROUTES.ADMIN.MANAGE_USERS },
        ];
      
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={cn(
      'bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className={cn(
          'flex items-center gap-2 font-bold text-primary-600 transition-all',
          isCollapsed ? 'flex-col text-xs' : 'text-2xl'
        )}>
          <AcademicCapIcon className={cn(
            "transition-all",
            isCollapsed ? "h-8 w-8" : "h-8 w-8"
          )} />
          <span>{isCollapsed ? '' : 'OFPPT'}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'hover:bg-primary-50 hover:text-primary-700',
              isActive 
                ? 'bg-primary-100 text-primary-700 font-medium' 
                : 'text-gray-700',
              isCollapsed && 'justify-center'
            )}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

Sidebar.propTypes = {
  userRole: PropTypes.string.isRequired,
  isCollapsed: PropTypes.bool,
};

export default Sidebar;
