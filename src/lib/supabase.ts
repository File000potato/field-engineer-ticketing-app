/**
 * @fileoverview Supabase stub - this application has migrated to Firebase
 * This file provides empty exports to prevent import errors during migration
 */

// Empty exports to prevent import errors
export const supabase = null;
export const authClient = null;
export const dbHelpers = {
  getTicketsWithRelations: () => Promise.resolve([]),
  getUsers: () => Promise.resolve([]),
  getUserProfile: () => Promise.resolve(null),
  updateUserProfile: () => Promise.resolve(null),
  getUserStats: () => Promise.resolve(null),
  getDashboardStats: () => Promise.resolve(null)
};
export const getCurrentUserProfile = () => Promise.resolve(null);
export const uploadFile = () => Promise.resolve({ path: '' });
export const getFileUrl = () => '';
export const subscribeToTickets = () => ({ unsubscribe: () => {} });
export const subscribeToNotifications = () => ({ unsubscribe: () => {} });

export default null;
