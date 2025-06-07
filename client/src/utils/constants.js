// frontend/src/utils/constants.js ou frontend/src/features/auth/authSlice.js
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  USER: 'USER', // Si vous avez un rôle USER
};

// Puis dans useAuth.js:
// import { ROLES } from '../../utils/constants'; // ou depuis authSlice
// const isAdmin = useMemo(() => !!user && user.role === ROLES.ADMIN, [user]);
// etc.
// Et dans hasRole :
// if (Array.isArray(roleOrRoles)) {
//   return roleOrRoles.some(role => user.role === ROLES[role.toUpperCase()] || user.role === role); // Plus robuste
// }
// return user.role === ROLES[roleOrRoles.toUpperCase()] || user.role === roleOrRoles;