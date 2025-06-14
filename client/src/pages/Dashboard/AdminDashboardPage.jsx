import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap'; // Ajout de l'import Card
//import { Link } from 'react-router-dom';

import PageContainer from '../../components/layout/PageContainer';
import StatCard from '../../components/dashboard/StatCard';
import ChartComponent from '../../components/dashboard/ChartComponent';
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed';
import QuickAccessPanel from '../../components/dashboard/QuickAccessPanel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import AppButton from '../../components/common/AppButton';
import Icon from '../../components/common/Icon';

import { getAdminDashboardData } from '../../api/admin.api.js';

const AdminDashboardPage = () => {
  const currency = 'XOF';
  const currencyFormatter = useMemo(() => new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }), [currency]);

  const initialStatsState = {
    totalUsers: { value: 0, isLoading: true, trend: null, trendDirection: null },
    pendingInvoices: { value: 0, isLoading: true, trend: null, trendDirection: null },
    monthlyRevenue: { value: 0, unit: currency, isLoading: true, trend: null, trendDirection: null },
    criticalStockItems: { value: 0, isLoading: true, trend: null, trendDirection: null },
  };

  const [summaryStats, setSummaryStats] = useState(initialStatsState);
  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] });
  const [userRolesChartData, setUserRolesChartData] = useState({ labels: [], datasets: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pageStatus, setPageStatus] = useState('loading');
  const [pageError, setPageError] = useState(null);

  const quickAccessItems = [
    { id: 'manage-users', label: 'Utilisateurs', iconName: 'BsPeopleFill', linkTo: '/admin/users', variant: 'primary' },
    { id: 'view-logs', label: 'Journaux Sécurité', iconName: 'BsShieldLockFill', linkTo: '/admin/security-logs', variant: 'info' },
    { id: 'new-invoice', label: 'Nouvelle Facture', iconName: 'BsFileEarmarkPlusFill', linkTo: '/invoices/new', variant: 'success' },
    { id: 'products', label: 'Produits', iconName: 'BsBoxSeam', linkTo: '/products', variant: 'warning'},
  ];

  const salesChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Performance Financière (6 derniers mois)', font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += currencyFormatter.format(context.parsed.y);
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (value) => currencyFormatter.format(value) },
      },
    },
  }), [currencyFormatter]);

  const userRolesChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: 'Utilisateurs par Rôle', font: {size: 16} },
      legend: { position: 'right' },
    },
  }), []);

  const fetchDashboardData = useCallback(async () => {
    setPageStatus('loading');
    setPageError(null);
    setSummaryStats(prev => Object.fromEntries(
      Object.entries(prev).map(([key, stat]) => [key, { ...stat, isLoading: true }])
    ));

    try {
      const responseData = await getAdminDashboardData();

      setSummaryStats({
        totalUsers: { ...(responseData?.summaryCards?.totalUsers || { value: 0 }), isLoading: false },
        pendingInvoices: { ...(responseData?.summaryCards?.pendingInvoices || { value: 0 }), isLoading: false },
        monthlyRevenue: {
          ...(responseData?.summaryCards?.monthlyRevenue || { value: 0 }),
          unit: responseData?.summaryCards?.monthlyRevenue?.unit || currency,
          isLoading: false,
        },
        criticalStockItems: { ...(responseData?.summaryCards?.criticalStockItems || { value: 0 }), isLoading: false },
      });

      setSalesChartData(responseData?.salesChartData || { labels: [], datasets: [] });
      setUserRolesChartData(responseData?.userRolesChartData || { labels: [], datasets: [] });
      setRecentActivities(responseData?.recentActivities || []);
      setPageStatus('succeeded');
    } catch (err) {
      console.error("Erreur chargement dashboard admin :", err);
      const errorMessage = err?.message || err?.data?.message || "Erreur inconnue lors du chargement des données.";
      setPageError(errorMessage);
      setPageStatus('failed');
      setSummaryStats(prev =>
        Object.fromEntries(
          Object.entries(prev).map(([key, stat]) => [
            key,
            { ...stat, isLoading: false, value: (key === 'monthlyRevenue' ? 'N/A' : 0) },
          ])
        )
      );
    }
  }, [currency]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (pageStatus === 'loading') {
    return (
      <PageContainer title="Tableau de Bord Administrateur" fluid>
        <LoadingSpinner fullPage message="Chargement du tableau de bord..." />
      </PageContainer>
    );
  }

  if (pageStatus === 'failed') {
    return (
      <PageContainer title="Tableau de Bord Administrateur" fluid>
        <AlertMessage variant="danger" className="text-center py-4">
            <h4><Icon name="BsExclamationTriangleFill" className="me-2"/> Impossible de charger le tableau de bord</h4>
            <p className="mb-2">{pageError}</p>
            <AppButton onClick={fetchDashboardData} variant="primary" size="sm">
                <Icon name="BsArrowClockwise" className="me-1"/> Réessayer
            </AppButton>
        </AlertMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Tableau de Bord Administrateur" fluid>
      {/* Cartes de Statistiques */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Utilisateurs Totaux"
            value={summaryStats.totalUsers.value?.toLocaleString('fr-FR') || '0'}
            isLoading={summaryStats.totalUsers.isLoading}
            icon={<Icon name="BsPeopleFill" size="2.2em" />}
            iconColorSet={{icon: "var(--bs-primary)", bg: "rgba(var(--bs-primary-rgb), 0.1)" }}
            trend={summaryStats.totalUsers.trend}
            trendDirection={summaryStats.totalUsers.trendDirection}
            linkTo="/admin/users"
            footerText="Gérer les utilisateurs"
          />
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Factures en Attente"
            value={summaryStats.pendingInvoices.value?.toLocaleString('fr-FR') || '0'}
            isLoading={summaryStats.pendingInvoices.isLoading}
            icon={<Icon name="BsFileEarmarkMedicalFill" size="2.2em" />}
            iconColorSet={{icon: "var(--bs-warning)", bg: "rgba(var(--bs-warning-rgb), 0.15)"}}
            linkTo="/invoices?status=UNPAID&status=OVERDUE"
            footerText="Voir les factures"
          />
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Revenu Mensuel"
            value={
              summaryStats.monthlyRevenue.isLoading ? 'Chargement...' :
              (typeof summaryStats.monthlyRevenue.value === 'number'
                ? currencyFormatter.format(summaryStats.monthlyRevenue.value)
                : (summaryStats.monthlyRevenue.value || 'N/A'))
            }
            isLoading={summaryStats.monthlyRevenue.isLoading}
            icon={<Icon name="BsGraphUpArrow" size="2.2em" />}
            iconColorSet={{icon: "var(--bs-success)", bg: "rgba(var(--bs-success-rgb), 0.1)"}}
          />
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <StatCard
            title="Stock Critique"
            value={summaryStats.criticalStockItems.value?.toLocaleString('fr-FR') || '0'}
            isLoading={summaryStats.criticalStockItems.isLoading}
            icon={<Icon name="BsArchiveFill" size="2.2em" />}
            iconColorSet={{icon: "var(--bs-danger)", bg: "rgba(var(--bs-danger-rgb), 0.1)"}}
            linkTo="/products?filter=critical"
            footerText="Gérer le stock"
          />
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={7} md={12}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {summaryStats.monthlyRevenue.isLoading && salesChartData.datasets.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <LoadingSpinner />
                </div>
              ) : salesChartData.datasets?.[0]?.data?.length > 0 ? (
                <ChartComponent 
                  type="line" 
                  data={salesChartData} 
                  options={salesChartOptions} 
                  height={320} 
                />
              ) : (
                <div className="text-center p-5 text-muted">
                  Aucune donnée de vente à afficher pour cette période.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} md={12}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              {summaryStats.totalUsers.isLoading && userRolesChartData.datasets.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <LoadingSpinner />
                </div>
              ) : userRolesChartData.datasets?.[0]?.data?.length > 0 ? (
                <ChartComponent 
                  type="doughnut" 
                  data={userRolesChartData} 
                  options={userRolesChartOptions} 
                  height={320} 
                />
              ) : (
                <div className="text-center p-5 text-muted">
                  Aucune donnée de rôle utilisateur à afficher.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={7} md={12}>
          <RecentActivityFeed
            title="Activité Récente du Système"
            items={recentActivities}
            isLoading={pageStatus === 'loading'}
            viewAllLink="/admin/security-logs"
          />
        </Col>
        <Col lg={5} md={12}>
          <QuickAccessPanel 
            title="Accès Rapide" 
            items={quickAccessItems} 
          />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default AdminDashboardPage;