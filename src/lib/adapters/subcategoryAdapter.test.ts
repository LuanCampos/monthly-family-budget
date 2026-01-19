import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getSubcategories,
  insertSubcategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
  removeSubcategory,
} from './subcategoryAdapter';
import * as budgetService from '../services/budgetService';
import { offlineAdapter } from './offlineAdapter';

import type { SubcategoryRow } from '@/types/database';

// Mock dependencies
vi.mock('../services/budgetService');
vi.mock('./offlineAdapter');
vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('subcategoryAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  const mockFamilyId = 'family-123';
  const mockOfflineFamilyId = 'offline-family-123';
  const mockSubcategoryId = 'sub-123';

  const mockSubcategoryRow: SubcategoryRow = {
    id: mockSubcategoryId,
    family_id: mockFamilyId,
    name: 'Groceries',
    category_key: 'essenciais',
    created_at: '2024-01-01T00:00:00Z',
  };

  describe('getSubcategories', () => {
    it('should return empty array when familyId is null', async () => {
      const result = await getSubcategories(null);
      expect(result).toEqual([]);
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch subcategories from budgetService when online', async () => {
        (budgetService.getSubcategories as Mock).mockResolvedValue({ 
          data: [mockSubcategoryRow], 
          error: null 
        });

        const result = await getSubcategories(mockFamilyId);

        expect(budgetService.getSubcategories).toHaveBeenCalledWith(mockFamilyId);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          id: mockSubcategoryId,
          name: 'Groceries',
          categoryKey: 'essenciais',
        });
      });

      it('should return empty array when budgetService returns error', async () => {
        (budgetService.getSubcategories as Mock).mockResolvedValue({ 
          data: null, 
          error: new Error('Network error') 
        });

        const result = await getSubcategories(mockFamilyId);

        expect(result).toEqual([]);
      });

      it('should sort subcategories by name', async () => {
        const subcategories: SubcategoryRow[] = [
          { ...mockSubcategoryRow, id: 's1', name: 'Zelda' },
          { ...mockSubcategoryRow, id: 's2', name: 'Apple' },
          { ...mockSubcategoryRow, id: 's3', name: 'Banana' },
        ];
        (budgetService.getSubcategories as Mock).mockResolvedValue({ 
          data: subcategories, 
          error: null 
        });

        const result = await getSubcategories(mockFamilyId);

        expect(result[0].name).toBe('Apple');
        expect(result[1].name).toBe('Banana');
        expect(result[2].name).toBe('Zelda');
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should fetch subcategories from IndexedDB when offline', async () => {
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockSubcategoryRow]);

        const result = await getSubcategories(mockFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalledWith('subcategories', 'family_id', mockFamilyId);
        expect(result).toHaveLength(1);
      });

      it('should handle offline family ID', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue([mockSubcategoryRow]);

        const result = await getSubcategories(mockOfflineFamilyId);

        expect(offlineAdapter.getAllByIndex).toHaveBeenCalled();
        expect(budgetService.getSubcategories).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
      });

      it('should return empty array when no offline data', async () => {
        (offlineAdapter.getAllByIndex as Mock).mockResolvedValue(null);

        const result = await getSubcategories(mockFamilyId);

        expect(result).toEqual([]);
      });
    });
  });

  describe('insertSubcategory', () => {
    it('should do nothing when familyId is null', async () => {
      const result = await insertSubcategory(null, 'Test', 'essenciais');
      expect(result).toBeUndefined();
      expect(budgetService.insertSubcategory).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-sub-1');
      });

      it('should insert subcategory via budgetService when online', async () => {
        (budgetService.insertSubcategory as Mock).mockResolvedValue({ error: null });

        const result = await insertSubcategory(mockFamilyId, 'New Sub', 'conforto');

        expect(budgetService.insertSubcategory).toHaveBeenCalledWith(
          mockFamilyId,
          'New Sub',
          'conforto'
        );
        expect(result).toMatchObject({ success: true });
      });

      it('should fallback to offline when service fails', async () => {
        (budgetService.insertSubcategory as Mock).mockResolvedValue({ 
          error: new Error('Network error') 
        });

        const result = await insertSubcategory(mockFamilyId, 'New Sub', 'metas');

        expect(offlineAdapter.put).toHaveBeenCalledWith('subcategories', expect.objectContaining({
          id: 'offline-sub-1',
          name: 'New Sub',
          category_key: 'metas',
        }));
        expect(offlineAdapter.sync.add).toHaveBeenCalledWith(expect.objectContaining({
          type: 'subcategory',
          action: 'insert',
          familyId: mockFamilyId,
        }));
        expect(result).toMatchObject({
          id: 'offline-sub-1',
        });
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
        (offlineAdapter.generateOfflineId as Mock).mockReturnValue('offline-sub-2');
      });

      it('should insert subcategory in IndexedDB when offline', async () => {
        const result = await insertSubcategory(mockFamilyId, 'Offline Sub', 'prazeres');

        expect(offlineAdapter.put).toHaveBeenCalledWith('subcategories', expect.objectContaining({
          id: 'offline-sub-2',
          family_id: mockFamilyId,
          name: 'Offline Sub',
          category_key: 'prazeres',
        }));
        expect(result).toMatchObject({
          id: 'offline-sub-2',
          name: 'Offline Sub',
        });
      });

      it('should handle offline family ID', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

        await insertSubcategory(mockOfflineFamilyId, 'Sub', 'essenciais');

        expect(offlineAdapter.put).toHaveBeenCalled();
        expect(budgetService.insertSubcategory).not.toHaveBeenCalled();
      });
    });
  });

  describe('addSubcategory', () => {
    it('should delegate to insertSubcategory', async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      (budgetService.insertSubcategory as Mock).mockResolvedValue({ error: null });

      const result = await addSubcategory(mockFamilyId, 'Test', 'liberdade');

      expect(budgetService.insertSubcategory).toHaveBeenCalledWith(
        mockFamilyId,
        'Test',
        'liberdade'
      );
      expect(result).toMatchObject({ success: true });
    });
  });

  describe('updateSubcategory', () => {
    it('should do nothing when familyId is null', async () => {
      const result = await updateSubcategory(null, mockSubcategoryId, 'Updated');
      expect(result).toBeUndefined();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update subcategory via budgetService when online', async () => {
        (budgetService.updateSubcategoryById as Mock).mockResolvedValue({ error: null });

        const result = await updateSubcategory(mockFamilyId, mockSubcategoryId, 'Updated Name');

        expect(budgetService.updateSubcategoryById).toHaveBeenCalledWith(
          mockSubcategoryId,
          'Updated Name'
        );
        expect(result).toMatchObject({ error: null });
      });

      it('should return error when update fails', async () => {
        const mockError = new Error('Update failed');
        (budgetService.updateSubcategoryById as Mock).mockResolvedValue({ error: mockError });

        const result = await updateSubcategory(mockFamilyId, mockSubcategoryId, 'Updated Name');

        expect(result).toMatchObject({ error: mockError });
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should update subcategory in IndexedDB when offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(mockSubcategoryRow);

        await updateSubcategory(mockFamilyId, mockSubcategoryId, 'Offline Update');

        expect(offlineAdapter.get).toHaveBeenCalledWith('subcategories', mockSubcategoryId);
        expect(offlineAdapter.put).toHaveBeenCalledWith('subcategories', expect.objectContaining({
          id: mockSubcategoryId,
          name: 'Offline Update',
        }));
      });

      it('should do nothing if subcategory not found offline', async () => {
        (offlineAdapter.get as Mock).mockResolvedValue(null);

        await updateSubcategory(mockFamilyId, mockSubcategoryId, 'Not Found');

        expect(offlineAdapter.put).not.toHaveBeenCalled();
      });
    });
  });

  describe('deleteSubcategory', () => {
    it('should do nothing when familyId is null', async () => {
      await deleteSubcategory(null, mockSubcategoryId);
      expect(budgetService.deleteSubcategoryById).not.toHaveBeenCalled();
    });

    describe('online mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete subcategory via budgetService when online', async () => {
        (budgetService.clearSubcategoryReferences as Mock).mockResolvedValue(undefined);
        (budgetService.clearRecurringSubcategoryReferences as Mock).mockResolvedValue(undefined);
        (budgetService.deleteSubcategoryById as Mock).mockResolvedValue(undefined);

        await deleteSubcategory(mockFamilyId, mockSubcategoryId);

        expect(budgetService.clearSubcategoryReferences).toHaveBeenCalledWith(mockSubcategoryId);
        expect(budgetService.clearRecurringSubcategoryReferences).toHaveBeenCalledWith(mockSubcategoryId);
        expect(budgetService.deleteSubcategoryById).toHaveBeenCalledWith(mockSubcategoryId);
      });

      it('should log error when delete fails', async () => {
        (budgetService.clearSubcategoryReferences as Mock).mockRejectedValue(new Error('Failed'));

        await deleteSubcategory(mockFamilyId, mockSubcategoryId);

        // Should not throw, just log error
      });
    });

    describe('offline mode', () => {
      beforeEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);
      });

      it('should delete subcategory from IndexedDB when offline', async () => {
        await deleteSubcategory(mockFamilyId, mockSubcategoryId);

        expect(offlineAdapter.delete).toHaveBeenCalledWith('subcategories', mockSubcategoryId);
      });

      it('should handle offline family ID', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
        (offlineAdapter.isOfflineId as Mock).mockReturnValue(true);

        await deleteSubcategory(mockOfflineFamilyId, mockSubcategoryId);

        expect(offlineAdapter.delete).toHaveBeenCalled();
        expect(budgetService.deleteSubcategoryById).not.toHaveBeenCalled();
      });
    });
  });

  describe('removeSubcategory', () => {
    it('should delegate to deleteSubcategory', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      (offlineAdapter.isOfflineId as Mock).mockReturnValue(false);

      await removeSubcategory(mockFamilyId, mockSubcategoryId);

      expect(offlineAdapter.delete).toHaveBeenCalledWith('subcategories', mockSubcategoryId);
    });
  });
});
