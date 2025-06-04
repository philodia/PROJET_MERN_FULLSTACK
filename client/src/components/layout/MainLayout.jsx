// frontend/src/components/layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Outlet, useLocation } from 'react-router-dom';

import AppNavbar from './Navbar';
import Sidebar from './Sidebar';
import AppFooter from './Footer';

import './MainLayout.scss';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Ferme la sidebar au changement de route si écran mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 992) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isSidebarOpen]);

  // Gère la classe pour désactiver le scroll quand sidebar ouverte sur mobile
  useEffect(() => {
    const body = document.body;

    if (isSidebarOpen && window.innerWidth < 992) {
      body.classList.add('sidebar-open-no-scroll');
    } else {
      body.classList.remove('sidebar-open-no-scroll');
    }

    return () => {
      body.classList.remove('sidebar-open-no-scroll');
    };
  }, [isSidebarOpen]);

  return (
    <div className={`main-layout-wrapper d-flex flex-column min-vh-100 ${isSidebarOpen ? 'sidebar-is-active' : ''}`}>
      <AppNavbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="app-body-content-wrapper flex-grow-1 d-flex">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {isSidebarOpen && (
          <div className="sidebar-overlay d-lg-none" onClick={toggleSidebar} />
        )}

        <main className="content-area flex-grow-1">
          {children || <Outlet />}
        </main>
      </div>

      <AppFooter />
    </div>
  );
};

MainLayout.propTypes = {
  children: PropTypes.node,
};

export default MainLayout;
