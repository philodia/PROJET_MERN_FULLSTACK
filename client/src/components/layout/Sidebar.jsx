// frontend/src/components/layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav, Collapse } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import Icon from '../common/Icon';
import './Sidebar.scss';

const MENU_ITEMS_CONFIG = [
  {
    key: 'dashboard',
    label: 'Tableau de Bord',
    to: '/dashboard',
    icon: 'BsGrid1X2',
    activeIcon: 'BsGrid1X2Fill',
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
    exact: true,
  },
  {
    key: 'commercial',
    label: 'Espace Commercial',
    icon: 'BsBriefcase',
    activeIcon: 'BsBriefcaseFill',
    roles: ['ADMIN', 'MANAGER'],
    submenu: [
      { key: 'clients', label: 'Clients', to: '/clients', icon: 'BsPeople', activeIcon: 'BsPeopleFill', roles: ['ADMIN', 'MANAGER'] },
      { key: 'suppliers', label: 'Fournisseurs', to: '/suppliers', icon: 'BsTruck', activeIcon: 'BsTruck', roles: ['ADMIN', 'MANAGER'] },
      { key: 'products', label: 'Produits & Stock', to: '/products', icon: 'BsBox', activeIcon: 'BsBoxSeamFill', roles: ['ADMIN', 'MANAGER'] },
      { key: 'quotes', label: 'Devis', to: '/quotes', icon: 'BsFileEarmarkRuled', activeIcon: 'BsFileEarmarkRuledFill', roles: ['ADMIN', 'MANAGER'] },
      { key: 'delivery-notes', label: 'Bons de Livraison', to: '/delivery-notes', icon: 'BsFileEarmarkZip', activeIcon: 'BsFileEarmarkZipFill', roles: ['ADMIN', 'MANAGER'] },
    ],
  },
  {
    key: 'invoices',
    label: 'Facturation',
    to: '/invoices',
    icon: 'BsFileEarmarkText',
    activeIcon: 'BsFileEarmarkTextFill',
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT'],
  },
  {
    key: 'accounting',
    label: 'Comptabilité',
    icon: 'BsCalculator',
    activeIcon: 'BsCalculatorFill',
    roles: ['ADMIN', 'ACCOUNTANT'],
    submenu: [
      { key: 'journal', label: 'Journal', to: '/accounting/journal', icon: 'BsJournalText', activeIcon: 'BsJournalText', roles: ['ADMIN', 'ACCOUNTANT'] },
      { key: 'ledger', label: 'Grand Livre', to: '/accounting/ledger', icon: 'BsBook', activeIcon: 'BsBookHalf', roles: ['ADMIN', 'ACCOUNTANT'] },
      { key: 'balance-sheet', label: 'Bilan', to: '/accounting/balance-sheet', icon: 'BsBarChartLine', activeIcon: 'BsBarChartLineFill', roles: ['ADMIN', 'ACCOUNTANT'] },
      { key: 'chart-of-accounts', label: 'Plan Comptable', to: '/accounting/chart-of-accounts', icon: 'BsDiagram3', activeIcon: 'BsDiagram3Fill', roles: ['ADMIN', 'ACCOUNTANT'] },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    icon: 'BsGear',
    activeIcon: 'BsGearFill',
    roles: ['ADMIN'],
    submenu: [
      { key: 'user-management', label: 'Utilisateurs', to: '/admin/users', icon: 'BsPerson', activeIcon: 'BsPersonLinesFill', roles: ['ADMIN'] },
      { key: 'security-logs', label: 'Journaux Sécurité', to: '/admin/security-logs', icon: 'BsShieldLock', activeIcon: 'BsShieldLockFill', roles: ['ADMIN'] },
    ],
  },
  {
    key: 'profile',
    label: 'Mon Profil',
    to: '/profile',
    icon: 'BsPerson',
    activeIcon: 'BsPersonCircle',
    roles: ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'USER'],
  }
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { isAuthenticated, hasRole, user } = useAuth();
  const location = useLocation();
  const [openSubmenuKey, setOpenSubmenuKey] = useState(null);

  useEffect(() => {
    const activeParent = MENU_ITEMS_CONFIG.find(item =>
      item.submenu?.some(subItem => location.pathname.startsWith(subItem.to))
    );
    if (activeParent) {
      setOpenSubmenuKey(activeParent.key);
    }
  }, [location.pathname]);

  const handleToggleSubmenu = (menuKey) => {
    setOpenSubmenuKey(prevOpenKey => (prevOpenKey === menuKey ? null : menuKey));
  };

  const renderMenuItem = (item, level = 0) => {
    if (item.roles && !hasRole(item.roles)) {
      return null;
    }

    const visibleSubmenuItems = item.submenu?.filter(sub => !sub.roles || hasRole(sub.roles));
    const hasVisibleSubmenu = !!(visibleSubmenuItems && visibleSubmenuItems.length > 0);
    const isSubmenuOpen = openSubmenuKey === item.key;
    
    // Nouveau calcul simplifié pour l'état actif du parent
    const isParentOfActiveSubmenu = hasVisibleSubmenu && 
      visibleSubmenuItems.some(subItem => 
        location.pathname.startsWith(subItem.to)
      );

    const handleLinkOrParentClick = (e, isSubmenuParent = false) => {
      if (isSubmenuParent) {
        e.preventDefault();
        handleToggleSubmenu(item.key);
      } else if (window.innerWidth < 992 && toggleSidebar) {
        toggleSidebar();
      }
    };

    const iconToDisplay = (isActive) => {
      return isActive && item.activeIcon ? item.activeIcon : item.icon;
    }

    if (hasVisibleSubmenu) {
      const parentIsActive = isParentOfActiveSubmenu || (isSubmenuOpen && !isParentOfActiveSubmenu);

      return (
        <div key={item.key} className={`sidebar-menu-group ${parentIsActive ? 'active-parent' : ''}`}>
          <Nav.Link
            onClick={(e) => handleLinkOrParentClick(e, true)}
            aria-expanded={isSubmenuOpen}
            aria-controls={`submenu-${item.key}`}
            className={`sidebar-link level-${level} ${parentIsActive ? 'parent-active' : ''} ${isSubmenuOpen ? 'submenu-open' : ''}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (['Enter', ' '].includes(e.key)) {
                e.preventDefault();
                handleLinkOrParentClick(e, true);
              }
            }}
          >
            {item.icon && (
              <Icon name={iconToDisplay(parentIsActive)} className="sidebar-icon" />
            )}
            <span className="sidebar-label">{item.label}</span>
            <Icon name={isSubmenuOpen ? 'BsChevronUp' : 'BsChevronDown'} className="sidebar-submenu-arrow" />
          </Nav.Link>
          <Collapse in={isSubmenuOpen} timeout={300}>
            <div id={`submenu-${item.key}`} className="sidebar-submenu">
              <Nav className="flex-column">
                {visibleSubmenuItems.map(subItem => renderMenuItem(subItem, level + 1))}
              </Nav>
            </div>
          </Collapse>
        </div>
      );
    }

    return (
      <Nav.Link
        as={NavLink}
        to={item.to || '#'}
        key={item.key}
        className={({ isActive }) => `sidebar-link level-${level} ${isActive ? 'active' : ''}`}
        onClick={(e) => handleLinkOrParentClick(e)}
        end={item.exact}
        title={item.label}
      >
        {item.icon && (
          <Icon 
            name={iconToDisplay(
              location.pathname === item.to || 
              (item.to !== "/" && location.pathname.startsWith(item.to) && !item.exact)
            )} 
            className="sidebar-icon" 
          />
        )}
        <span className="sidebar-label">{item.label}</span>
      </Nav.Link>
    );
  };

  const visibleBaseMenuItems = MENU_ITEMS_CONFIG.filter(item => {
    if (item.roles && !hasRole(item.roles)) return false;
    return !item.submenu || item.submenu.some(subItem => !subItem.roles || hasRole(subItem.roles));
  });

  if (!isAuthenticated) return null;

  return (
    <aside className={`app-sidebar shadow-sm ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="sidebar-header p-3 border-bottom">
        <NavLink
          to="/dashboard"
          className="sidebar-brand text-decoration-none d-flex align-items-center"
          onClick={() => { if (window.innerWidth < 992 && isOpen) toggleSidebar(); }}
        >
          <Icon name="BsJournalRichtext" size="1.8em" className="me-2 sidebar-brand-icon" />
          <span className="fw-bold fs-5 sidebar-brand-text">GestionApp</span>
        </NavLink>
        {isOpen && (
          <button
            className="d-lg-none btn-close-sidebar btn btn-sm p-0"
            onClick={toggleSidebar}
            aria-label="Fermer le menu"
          >
            <Icon name="BsXLg" size="1.5em" />
          </button>
        )}
      </div>

      <Nav className="flex-column sidebar-nav p-2">
        {visibleBaseMenuItems.length > 0 ? (
          visibleBaseMenuItems.map(item => renderMenuItem(item))
        ) : (
          <div className="p-3 text-center text-muted">
            <Icon name="BsExclamationCircleFill" className="me-2" />
            Aucun menu disponible.
          </div>
        )}
      </Nav>

      <div className="sidebar-footer p-3 mt-auto border-top text-center">
        {user && (
          <div className="user-info-footer">
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="avatar" 
                className="rounded-circle me-2" 
                width="24" 
                height="24" 
              />
            ) : (
              <Icon name={getRoleIcon(user.role)} className="me-2" />
            )}
            <div className="text-truncate" title={user.username}>
              <strong className="d-block">{user.firstName || user.username}</strong>
              <small className="text-muted">{getRoleDisplayName(user.role)}</small>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const getRoleDisplayName = (role) => {
  if (!role) return 'N/A';
  const lowerRole = role.toLowerCase();
  return lowerRole.charAt(0).toUpperCase() + lowerRole.slice(1);
};

const getRoleIcon = (role) => {
  switch (role) {
    case 'ADMIN': return 'BsPersonWorkspace';
    case 'MANAGER': return 'BsPersonBadgeFill';
    case 'ACCOUNTANT': return 'BsPersonVideo3';
    default: return 'BsPersonFill';
  }
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default Sidebar;