/**
 * @file src/hooks/useUserRole.ts
 * @description Ré-exportation du hook useUserRole lié au UserRoleContext centralisé.
 */

import { useUserRole, type UserRoleContextType } from '../contexts/UserRoleContext';

export type UseUserRoleReturn = UserRoleContextType;
export { useUserRole };
export default useUserRole;
