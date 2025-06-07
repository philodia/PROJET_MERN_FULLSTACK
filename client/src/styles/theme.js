// frontend/src/styles/theme.js

// --- COULEURS ---
// Basées sur Bootstrap pour la familiarité, mais vous pouvez les personnaliser.
const colors = {
  // Couleurs primaires et secondaires
  primary: '#0d6efd',      // Bleu Bootstrap
  secondary: '#6c757d',    // Gris Bootstrap
  success: '#198754',      // Vert Bootstrap
  danger: '#dc3545',       // Rouge Bootstrap
  warning: '#ffc107',      // Jaune Bootstrap
  info: '#0dcaf0',         // Cyan Bootstrap
  light: '#f8f9fa',        // Gris très clair Bootstrap
  dark: '#212529',         // Presque noir Bootstrap

  // Couleurs de texte
  text: '#212529',         // Couleur de texte principale (dark)
  textLight: '#495057',     // Texte un peu plus clair
  textMuted: '#6c757d',     // Texte "muet" (secondary)
  textOnPrimary: '#ffffff', // Texte sur fond primaire
  textOnDark: '#ffffff',    // Texte sur fond sombre

  // Couleurs de fond
  background: '#ffffff',   // Fond principal
  backgroundLight: '#f8f9fa',// Fond clair (light)
  backgroundDark: '#343a40', // Fond sombre (dark Bootstrap)

  // Bordures
  border: '#dee2e6',       // Couleur de bordure Bootstrap
  borderLight: '#f1f1f1',   // Bordure plus claire

  // Couleurs spécifiques à l'application (exemples)
  accent: '#1abc9c',       // Une couleur d'accentuation (turquoise)
  sidebarBg: '#2c3e50',    // Fond de la sidebar (thème sombre exemple)
  sidebarText: '#ecf0f1',  // Texte de la sidebar
  sidebarActiveBg: '#1abc9c',// Fond actif de la sidebar
  sidebarActiveText: '#ffffff',

  // Couleurs neutres (nuances de gris)
  gray100: '#f8f9fa',
  gray200: '#e9ecef',
  gray300: '#dee2e6',
  gray400: '#ced4da',
  gray500: '#adb5bd',
  gray600: '#6c757d',
  gray700: '#495057',
  gray800: '#343a40',
  gray900: '#212529',

  white: '#ffffff',
  black: '#000000',
};

// --- TYPOGRAPHIE ---
const typography = {
  fontFamilyBase: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
  fontFamilyHeadings: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", // Police pour les titres
  
  fontSizeBase: '1rem', // 16px par défaut
  fontSizeSm: '0.875rem', // 14px
  fontSizeLg: '1.25rem',  // 20px

  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500, // Ajout d'un poids médium
  fontWeightBold: 700,

  lineHeightBase: 1.5,
  lineHeightSm: 1.4,
  lineHeightLg: 1.6,

  h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 }, // 40px
  h2: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },    // 32px
  h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.2 }, // 28px
  h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.2 },  // 24px
  h5: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.2 }, // 20px
  h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.2 },    // 16px
};

// --- POINTS DE RUPTURE (BREAKPOINTS) ---
// Basés sur Bootstrap pour la cohérence
const breakpointsValues = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

const breakpoints = {
  keys: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
  values: breakpointsValues,
  up: (key) => `@media (min-width:${breakpointsValues[key]}px)`,
  down: (key) => {
    const endIndex = breakpoints.keys.indexOf(key);
    // Pour 'xs', il n'y a pas de max-width défini, car c'est le plus petit.
    // Si on veut un 'down(xs)', cela signifierait quelque chose de plus petit que 'sm'.
    // Ici, on va considérer que 'down(key)' signifie plus petit que le breakpoint *suivant*.
    // Ou pour le plus grand, il n'y a pas de limite supérieure.
    // Pour une logique de "plus petit que", on prend le breakpoint - 0.02px (technique Bootstrap)
    const upperLimit = breakpoints.keys[endIndex + 1] ? breakpointsValues[breakpoints.keys[endIndex + 1]] - 0.02 : null;
    return upperLimit ? `@media (max-width:${upperLimit}px)` : ''; // ou une très grande valeur pour down(xxl)
  },
  between: (start, end) =>
    `@media (min-width:${breakpointsValues[start]}px) and (max-width:${breakpointsValues[end] - 0.02}px)`,
};


// --- ESPACEMENTS (SPACING) ---
// Échelle d'espacement, ex: theme.spacing(1) = 8px
const spacingUnit = 8; // Unité de base pour l'espacement
const spacing = (factor) => `${factor * spacingUnit}px`;

// --- BORDURES ---
const borders = {
  borderRadius: '0.25rem', // 4px, commun dans Bootstrap
  borderRadiusSm: '0.2rem', // 3.2px
  borderRadiusLg: '0.3rem', // 4.8px
  borderRadiusPill: '50rem', // Pour les badges/boutons en forme de pilule

  borderWidth: '1px',
  borderColor: colors.border,
};

// --- OMBRES (SHADOWS) ---
const shadows = {
  sm: '0 .125rem .25rem rgba(0, 0, 0, .075)',
  md: '0 .5rem 1rem rgba(0, 0, 0, .15)', // Bootstrap shadow
  lg: '0 1rem 3rem rgba(0, 0, 0, .175)',
  none: 'none',
};

// --- TRANSITIONS ---
const transitions = {
  duration: '0.2s',
  easing: 'ease-in-out',
  create: (property = 'all', duration = '0.2s', easing = 'ease-in-out') =>
    `${property} ${duration} ${easing}`,
};

// --- Z-INDEX ---
// Pour gérer la superposition des éléments
const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  sidebar: 1030, // Doit être cohérent avec votre CSS de sidebar
  modalBackdrop: 1040, // Bootstrap utilise 1050 pour la modale, 1055 pour le backdrop
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1090, // Pour react-toastify ou similaire
};


// --- EXPORTATION DU THÈME COMPLET ---
const theme = {
  colors,
  typography,
  breakpoints,
  spacing,
  borders,
  shadows,
  transitions,
  zIndex,
  // Vous pouvez ajouter d'autres sections comme 'components' pour des styles par défaut de composants
  components: {
    button: {
      fontWeight: typography.fontWeightMedium,
      // ... autres styles par défaut pour les boutons
    },
    card: {
      boxShadow: shadows.sm,
      borderRadius: borders.borderRadius,
      // ...
    }
  }
};

export default theme;