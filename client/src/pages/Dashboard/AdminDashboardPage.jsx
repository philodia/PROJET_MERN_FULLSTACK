import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'react-bootstrap';

import PageContainer from '../../components/layout/PageContainer';
import StatCard from '../../components/dashboard/StatCard';
import ChartComponent from '../../components/dashboard/ChartComponent';
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed';
import QuickAccessPanel from '../../components/dashboard/QuickAccessPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import AppButton from '../../components/common/AppButton'; // ✅ Import manquant

import { getAdminDashboardData } from '../../api/admin.api.js';

const AdminDashboardPage = () => {
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: { value: 0, isLoading: true },
    pendingInvoices: { value: 0, isLoading: true },
    monthlyRevenue: { value: 0, unit: '€', isLoading: true },
    criticalStockItems: { value: 0, isLoading: true },
  });

  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] });
  const [userRolesChartData, setUserRolesChartData] = useState({ labels: [], datasets: [] });
  const [recentActivities, setRecentActivities] = useState([]);

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorPage, setErrorPage] = useState(null);

  const quickAccessItems = [
    { id: 'manage-users', label: 'Gérer les Utilisateurs', iconName: 'BsPeopleFill', linkTo: '/admin/user-management', variant: 'primary' },
    { id: 'view-security-logs', label: 'Journaux de Sécurité', iconName: 'BsShieldLockFill', linkTo: '/admin/security-logs', variant: 'danger' },
    { id: 'app-settings', label: 'Paramètres Application', iconName: 'BsGearWideConnected', linkTo: '/admin/settings', variant: 'info' },
    { id: 'create-invoice', label: 'Nouvelle Facture', iconName: 'BsFileEarmarkPlusFill', linkTo: '/invoices/new', variant: 'success' },
  ];

  const salesChartOptions = {
    plugins: {
      title: { display: true, text: 'Performance Financière' },
    },
    scales: {
      y: {
        ticks: {
          callback: value => `${(value / 1000).toFixed(1)}k ${summaryStats.monthlyRevenue.unit || '€'}`,
        },
      },
    },
  };

  const userRolesChartOptions = {
    plugins: {
      title: { display: true, text: 'Utilisateurs par Rôle' },
      legend: { position: 'bottom' },
    },
  };

  const fetchDashboardData = useCallback(async () => {
    setIsLoadingPage(true);
    setErrorPage(null);

    try {
      const dashboardData = await getAdminDashboardData();

      setSummaryStats({
        totalUsers: { ...dashboardData?.summaryCards?.totalUsers, isLoading: false },
        pendingInvoices: { ...dashboardData?.summaryCards?.pendingInvoices, isLoading: false },
        monthlyRevenue: {
          ...dashboardData?.summaryCards?.monthlyRevenue,
          unit: '€',
          isLoading: false,
        },
        criticalStockItems: { ...dashboardData?.summaryCards?.criticalStockItems, isLoading: false },
      });

      setSalesChartData(dashboardData?.salesChartData || { labels: [], datasets: [] });
      setUserRolesChartData(dashboardData?.userRolesChartData || { labels: [], datasets: [] });
      setRecentActivities(dashboardData?.recentActivities || []);
    } catch (error) {
      console.error("Erreur lors du chargement du dashboard admin :", error);
      setErrorPage(error.message || "Erreur lors du chargement des données.");
      setSummaryStats(prev =>
        Object.fromEntries(Object.entries(prev).map(([key, stat]) => [
          key,
          { ...stat, isLoading: false, value: 'Erreur' },
        ]))
      );
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoadingPage && !errorPage) {
    return (
      <PageContainer title="Tableau de Bord Administrateur">
        <LoadingSpinner message="Chargement du tableau de bord..." />
      </PageContainer>
    );
  }

  if (errorPage) {
    return (
      <PageContainer title="Tableau de Bord Administrateur">
        <AlertMessage variant="danger">{errorPage}</AlertMessage>
        <AppButton onClick={fetchDashboardData} className="mt-3">
          Réessayer
        </AppButton>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tableau de Bord Administrateur" fluid>
      {/* Cartes de Statistiques */}
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Utilisateurs Totaux"
            value={summaryStats.totalUsers.value}
            isLoading={summaryStats.totalUsers.isLoading}
            iconName="BsPeopleFill"
            iconColor="var(--bs-primary)"
            iconBgColor="rgba(var(--bs-primary-rgb), 0.1)"
            trend={summaryStats.totalUsers.trend}
            trendDirection={summaryStats.totalUsers.trendDirection}
            linkTo="/admin/user-management"
            footerText="Gérer les utilisateurs"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Factures en Attente"
            value={summaryStats.pendingInvoices.value}
            isLoading={summaryStats.pendingInvoices.isLoading}
            iconName="BsFileEarmarkMedicalFill"
            iconColor="var(--bs-warning)"
            iconBgColor="rgba(var(--bs-warning-rgb), 0.15)"
            trend={summaryStats.pendingInvoices.trend}
            trendDirection={summaryStats.pendingInvoices.trendDirection}
            linkTo="/invoices?status=UNPAID&status=OVERDUE"
            footerText="Voir les factures"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Revenu Mensuel"
            value={summaryStats.monthlyRevenue.value?.toLocaleString('fr-FR') || 'N/A'}
            unit={summaryStats.monthlyRevenue.unit}
            isLoading={summaryStats.monthlyRevenue.isLoading}
            iconName="BsGraphUpArrow"
            iconColor="var(--bs-success)"
            iconBgColor="rgba(var(--bs-success-rgb), 0.1)"
            trend={summaryStats.monthlyRevenue.trend}
            trendDirection={summaryStats.monthlyRevenue.trendDirection}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Stock Critique"
            value={summaryStats.criticalStockItems.value}
            isLoading={summaryStats.criticalStockItems.isLoading}
            iconName="BsArchiveFill"
            iconColor="var(--bs-danger)"
            iconBgColor="rgba(var(--bs-danger-rgb), 0.1)"
            trend={summaryStats.criticalStockItems.trend}
            trendDirection={summaryStats.criticalStockItems.trendDirection}
            linkTo="/stock?filter=critical"
            footerText="Gérer le stock"
          />
        </Col>
      </Row>

      {/* Graphiques */}
      <Row className="g-4 mb-4">
        <Col lg={8} md={12}>
          <ChartComponent
            type="line"
            data={salesChartData}
            options={salesChartOptions}
            title="Vue d’Ensemble des Finances"
            isLoading={summaryStats.monthlyRevenue.isLoading}
          />
        </Col>
        <Col lg={4} md={12}>
          <ChartComponent
            type="doughnut"
            data={userRolesChartData}
            options={userRolesChartOptions}
            title="Utilisateurs par Rôle"
            isLoading={summaryStats.totalUsers.isLoading}
          />
        </Col>
      </Row>

      {/* Activité & Accès Rapide */}
      <Row className="g-4">
        <Col lg={7} md={12}>
          <RecentActivityFeed
            items={recentActivities}
            isLoading={isLoadingPage}
          />
        </Col>
        <Col lg={5} md={12}>
          <QuickAccessPanel items={quickAccessItems} />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AdminDashboardPage;
