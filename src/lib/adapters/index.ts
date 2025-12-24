/**
 * Adapters Index
 * 
 * Central export point for all adapter modules
 * 
 * Note: storageAdapter re-exports functions from other adapters with wrappers,
 * so we explicitly export from storageAdapter to avoid conflicts.
 */

// Re-export everything from storageAdapter (which handles conflicts internally)
export * from './storageAdapter';

// Export offlineAdapter separately as it's not re-exported by storageAdapter
export { offlineAdapter, type OfflineAdapter } from './offlineAdapter';
