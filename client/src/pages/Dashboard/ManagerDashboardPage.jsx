import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, ListGroup } from 'react-bootstrap';

import PageContainer from '../../components/layout/PageContainer';
import StatCard from '../../components/dashboard/StatCard';
import ChartComponent from '../../components/dashboard/ChartComponent';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AppButton from '../../components/common/AppButton';
import Icon from '../../components/common/Icon';
import StatusBadge from '../../components/common/StatusBadge';

import { getManagerDashboardData } from '../../api/manager.api';
import { useAuth } from '../../hooks/useAuth';
import { showErrorToast } from '../../components/common/NotificationToast';

const ManagerDashboardPage = () => {
  const { user } = useAuth();
  
  // État initial structuré
  const initialState = {
    summaryStats: {
      activeQuotes: { value: 0, isLoading: true },
      pendingInvoices: { value: 0, isLoading: true },
      monthlySales: { value: 0, unit: '€', isLoading: true },
      activeProjects: { value: 0, isLoading: true },
    },
    recentQuotes: [],
    recentInvoices: [],
    salesPerformanceChart: { labels: [], datasets: [] },
  };

  const [dashboardData, setDashboardData] = useState(initialState);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const fetchMyDashboardData = useCallback(async () => {
    setStatus('loading');
    setError(null);
    
    try {
      const data = await getManagerDashboardData();
      
      setDashboardData({
        summaryStats: {
          activeQuotes: { ...data.summaryStats?.activeQuotes, isLoading: false },
          pendingInvoices: { ...data.summaryStats?.pendingInvoices, isLoading: false },
          monthlySales: { 
            ...data.summaryStats?.monthlySales, 
            unit: data.summaryStats?.monthlySales?.unit || '€',
            isLoading: false 
          },
          activeProjects: { ...data.summaryStats?.activeProjects, isLoading: false },
        },
        recentQuotes: data.recentQuotes || [],
        recentInvoices: data.recentInvoices || [],
        salesPerformanceChart: data.salesPerformanceChart || { labels: [], datasets: [] },
      });
      setStatus('succeeded');
    } catch (err) {
      console.error("Erreur chargement dashboard manager:", err);
      setError(err.message || "Impossible de charger les données du tableau de bord.");
      setStatus('failed');
      showErrorToast("Erreur de chargement du tableau de bord");
    }
  }, []);

  useEffect(() => {
    fetchMyDashboardData();
  }, [fetchMyDashboardData]);

  // Options pour le graphique de performance des ventes
  const getSalesChartOptions = useCallback(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { 
        display: true, 
        text: 'Performance Commerciale (Ce Mois)', 
        font: { size: 16 } 
      },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { 
          callback: value => `${value.toLocaleString('fr-FR')} ${dashboardData.summaryStats.monthlySales.unit || '€'}` 
        }
      },
    },
  }), [dashboardData.summaryStats.monthlySales.unit]);

  // Fonction pour formater les valeurs monétaires
  const formatCurrency = (value, currency = '€') => {
    return typeof value === 'number' 
      ? value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
      : '0.00';
  };

  // Fonction pour rendre les éléments de liste récents
  const renderRecentList = (items, type) => {
    if (status === 'loading') {
      return (
        <Card.Body className="text-center">
          <LoadingSpinner message={`Chargement des ${type === 'quotes' ? 'devis' : 'factures'}...`} />
        </Card.Body>
      );
    }
    
    if (items.length === 0) {
      return (
        <Card.Body className="text-center text-muted">
          Aucun {type === 'quotes' ? 'devis' : 'facture'} récent à afficher.
        </Card.Body>
      );
    }
    
    return (
      <ListGroup variant="flush">
        {items.map(item => (
          <ListGroup.Item 
            key={item._id} 
            action 
            as={Link} 
            to={`/${type}/view/${item._id}`}
            className="d-flex justify-content-between align-items-start py-3"
          >
            <div className="me-3">
              <div className="fw-bold text-truncate">
                {type === 'quotes' ? item.quoteNumber : item.invoiceNumber} - 
                {(type === 'quotes' ? item.client?.companyName : item.clientSnapshot?.companyName) || 'Client non spécifié'}
              </div>
              <small className="text-muted">
                Total: {formatCurrency(type === 'quotes' ? item.totalTTC : item.totalTTC)} {item.currency || '€'}
                {type === 'invoices' && ` | Dû: ${formatCurrency(item.amountDue)} ${item.currency || '€'}`}
              </small>
            </div>
            <StatusBadge 
              variant={item.status.toLowerCase()} 
              pillSize="sm"
              className="align-self-center"
            >
              {item.status}
            </StatusBadge>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  if (status === 'loading') {
    return (
      <PageContainer title="Tableau de Bord Manager" fluid>
        <LoadingSpinner fullPage message="Chargement de votre tableau de bord..." />
      </PageContainer>
    );
  }

  if (status === 'failed') {
    return (
      <PageContainer title="Tableau de Bord Manager" fluid>
        <Row className="justify-content-center mt-5">
          <Col md={8} lg={6}>
            <Card className="border-danger">
              <Card.Body className="text-center">
                <Icon 
                  name="FaExclamationTriangle" 
                  size="3em" 
                  className="text-danger mb-3"
                />
                <h4 className="text-danger mb-3">Erreur de Chargement</h4>
                <p className="mb-4">{error}</p>
                <AppButton 
                  onClick={fetchMyDashboardData} 
                  variant="primary"
                  size="lg"
                >
                  <Icon name="FaSyncAlt" className="me-2" /> 
                  Réessayer
                </AppButton>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title={`Bienvenue, ${user?.firstName || user?.username || 'Manager'} !`} 
      subtitle="Votre tableau de bord Manager" 
      fluid
    >
      {/* Cartes de Statistiques */}
      <Row className="g-3 mb-4">
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Devis Actifs"
            value={dashboardData.summaryStats.activeQuotes.value}
            isLoading={dashboardData.summaryStats.activeQuotes.isLoading}
            icon={<Icon name="FaFileContract" size="1.5em" />}
            iconColorSet={{icon: "var(--bs-info)", bg: "rgba(var(--bs-info-rgb), 0.1)"}}
            linkTo="/quotes?status=DRAFT&status=SENT"
            footerText="Voir les devis"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Factures en Attente"
            value={dashboardData.summaryStats.pendingInvoices.value}
            isLoading={dashboardData.summaryStats.pendingInvoices.isLoading}
            icon={<Icon name="FaFileInvoice" size="1.5em" />}
            iconColorSet={{icon: "var(--bs-warning)", bg: "rgba(var(--bs-warning-rgb), 0.15)"}}
            linkTo="/invoices?status=SENT&status=PARTIALLY_PAID&status=OVERDUE"
            footerText="Suivre les paiements"
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Ventes (Mois)"
            value={
              typeof dashboardData.summaryStats.monthlySales.value === 'number' 
                ? formatCurrency(dashboardData.summaryStats.monthlySales.value) 
                : dashboardData.summaryStats.monthlySales.value
            }
            unit={dashboardData.summaryStats.monthlySales.unit}
            isLoading={dashboardData.summaryStats.monthlySales.isLoading}
            icon={<Icon name="FaCoins" size="1.5em" />}
            iconColorSet={{icon: "var(--bs-success)", bg: "rgba(var(--bs-success-rgb), 0.1)"}}
          />
        </Col>
        <Col xs={12} sm={6} lg={3}>
          <StatCard
            title="Projets Actifs"
            value={dashboardData.summaryStats.activeProjects.value}
            isLoading={dashboardData.summaryStats.activeProjects.isLoading}
            icon={<Icon name="FaTasks" size="1.5em" />}
            iconColorSet={{icon: "var(--bs-primary)", bg: "rgba(var(--bs-primary-rgb), 0.1)"}}
            linkTo="/projects?status=IN_PROGRESS"
            footerText="Gérer les projets"
          />
        </Col>
      </Row>

      {/* Graphiques et Listes */}
      <Row className="g-3 mb-4">
        {dashboardData.salesPerformanceChart?.datasets?.length > 0 && (
          <Col lg={7} md={12}>
            <Card className="h-100">
              <Card.Body>
                <ChartComponent
                  type="bar"
                  data={dashboardData.salesPerformanceChart}
                  options={getSalesChartOptions()}
                  height={350}
                />
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col lg={dashboardData.salesPerformanceChart?.datasets?.length > 0 ? 5 : 12} md={12}>
          <Card className="h-100">
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <Card.Title as="h5" className="mb-0">
                <Icon name="FaFileSignature" className="me-2" /> 
                Devis Récents
              </Card.Title>
              <Link to="/quotes">
                <AppButton variant="outline-primary" size="sm">
                  Voir tout
                </AppButton>
              </Link>
            </Card.Header>
            {renderRecentList(dashboardData.recentQuotes, 'quotes')}
          </Card>
        </Col>
      </Row>
      
      <Row className="g-3">
        <Col md={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center py-3">
              <Card.Title as="h5" className="mb-0">
                <Icon name="FaFileInvoiceDollar" className="me-2" /> 
                Factures Récentes
              </Card.Title>
              <Link to="/invoices">
                <AppButton variant="outline-primary" size="sm">
                  Voir tout
                </AppButton>
              </Link>
            </Card.Header>
            {renderRecentList(dashboardData.recentInvoices, 'invoices')}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default ManagerDashboardPage;