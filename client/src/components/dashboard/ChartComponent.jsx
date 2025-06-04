// frontend/src/components/dashboard/ChartComponent.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { Card, Spinner } from 'react-bootstrap';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler, // Pour les graphiques en aires sous les lignes
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Optionnel, pour afficher les labels sur les graphiques

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  ChartDataLabels // Enregistrer le plugin si utilisé
);

/**
 * Composant wrapper pour afficher des graphiques Chart.js.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {'line' | 'bar' | 'pie' | 'doughnut' | 'radar' | 'polarArea'} props.type - Type de graphique.
 * @param {object} props.data - Données pour le graphique (format Chart.js: { labels: [], datasets: [{ label, data, backgroundColor, ... }] }).
 * @param {object} [props.options] - Options de configuration pour le graphique (format Chart.js).
 * @param {string} [props.title] - Titre à afficher au-dessus du graphique (dans un Card.Header).
 * @param {string | number} [props.height='300px'] - Hauteur du conteneur du graphique.
 * @param {string | number} [props.width='100%'] - Largeur du conteneur du graphique.
 * @param {boolean} [props.isLoading=false] - Si vrai, affiche un spinner.
 * @param {string} [props.className] - Classes CSS supplémentaires pour le Card.
 * @param {object} [props.cardStyle] - Styles en ligne pour le Card.
 */
const ChartComponent = ({
  type,
  data,
  options: customOptions,
  title,
  height = '300px', // Chart.js n'utilise pas directement height/width sur le canvas, mais sur le wrapper
  width = '100%',
  isLoading = false,
  className = '',
  cardStyle = {},
}) => {
  // Options par défaut pour les graphiques, peuvent être surchargées par `customOptions`
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false, // Important pour contrôler la hauteur via le wrapper
    plugins: {
      legend: {
        position: 'top', // ou 'bottom', 'left', 'right'
      },
      title: { // Titre interne au graphique (différent du titre du Card)
        display: !!customOptions?.plugins?.title?.text, // Afficher seulement si un texte de titre de plugin est fourni
        text: customOptions?.plugins?.title?.text || '',
        font: {
          size: 16,
        },
      },
      datalabels: { // Options pour chartjs-plugin-datalabels (si utilisé)
        // display: true, // Mettre à false par défaut ou contrôler via customOptions
        // color: 'black',
        // anchor: 'end',
        // align: 'top',
        // formatter: (value, context) => value, // Personnaliser l'affichage des labels
        // ... autres options de datalabels
        display: false, // Désactiver par défaut, activer via customOptions
      },
      tooltip: {
        // Personnalisation des tooltips
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        // callbacks: { label: function(context) { return context.label + ': ' + context.formattedValue; } }
      }
    },
    scales: (type === 'bar' || type === 'line') ? { // Échelles pour les graphiques Bar et Line
      x: {
        grid: {
          display: false, // Cacher la grille de l'axe X
        },
        ticks: {
          // autoSkip: true,
          // maxTicksLimit: 10,
        }
      },
      y: {
        grid: {
          color: 'rgba(200, 200, 200, 0.2)', // Couleur plus claire pour la grille Y
        },
        ticks: {
          // beginAtZero: true, // Optionnel
          // callback: function(value) { if (Number.isInteger(value)) { return value; } }, // Afficher seulement les entiers
        },
      },
    } : undefined, // Pas d'échelles par défaut pour Pie, Doughnut, etc.
  };

  // Fusionner les options par défaut avec les options personnalisées
  // Fusion profonde simple pour plugins et scales
  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...(customOptions?.plugins || {}),
      title: {
        ...defaultOptions.plugins.title,
        ...(customOptions?.plugins?.title || {})
      },
      legend: {
        ...defaultOptions.plugins.legend,
        ...(customOptions?.plugins?.legend || {})
      },
      datalabels: {
        ...defaultOptions.plugins.datalabels,
        ...(customOptions?.plugins?.datalabels || {})
      },
      tooltip: {
        ...defaultOptions.plugins.tooltip,
        ...(customOptions?.plugins?.tooltip || {})
      }
    },
    scales: (type === 'bar' || type === 'line') ? {
      x: {
        ...(defaultOptions.scales?.x || {}),
        ...(customOptions?.scales?.x || {}),
      },
      y: {
        ...(defaultOptions.scales?.y || {}),
        ...(customOptions?.scales?.y || {}),
      },
    } : customOptions?.scales, // Pour les autres types, prendre directement les scales custom
  };


  let ChartToRender;
  switch (type.toLowerCase()) {
    case 'line': ChartToRender = Line; break;
    case 'bar': ChartToRender = Bar; break;
    case 'pie': ChartToRender = Pie; break;
    case 'doughnut': ChartToRender = Doughnut; break;
    case 'radar': ChartToRender = Radar; break;
    case 'polararea': ChartToRender = PolarArea; break;
    default:
      console.error(`ChartComponent: Type de graphique inconnu "${type}".`);
      return <Card className={className} style={cardStyle}><Card.Body>Type de graphique non supporté.</Card.Body></Card>;
  }

  const chartContainerStyle = {
    position: 'relative', // Nécessaire pour maintainAspectRatio: false
    height: height,
    width: width,
  };

  return (
    <Card className={`chart-component-card shadow-sm h-100 ${className}`} style={cardStyle}>
      {title && <Card.Header as="h6" className="py-3">{title}</Card.Header>}
      <Card.Body className="d-flex justify-content-center align-items-center">
        {isLoading ? (
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement du graphique...</span>
          </Spinner>
        ) : (
          data && data.datasets && data.datasets.length > 0 ? (
            <div style={chartContainerStyle}>
              <ChartToRender data={data} options={mergedOptions} />
            </div>
          ) : (
            <p className="text-muted">Aucune donnée disponible pour ce graphique.</p>
          )
        )}
      </Card.Body>
    </Card>
  );
};

ChartComponent.propTypes = {
  type: PropTypes.oneOf(['line', 'bar', 'pie', 'doughnut', 'radar', 'polarArea']).isRequired,
  data: PropTypes.shape({
    labels: PropTypes.array.isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string,
        data: PropTypes.array.isRequired,
        // ... autres props de dataset Chart.js (backgroundColor, borderColor, etc.)
      })
    ).isRequired,
  }).isRequired,
  options: PropTypes.object,
  title: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  cardStyle: PropTypes.object,
};

export default ChartComponent;