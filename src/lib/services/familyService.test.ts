import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as familyService from './familyService';
import { supabase } from '../supabase';

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Helper to create chainable mock
const createChainMock = (result: unknown) => {
  const chainMock = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  // For terminal methods that return result directly
  chainMock.select.mockReturnValue(chainMock);
  chainMock.insert.mockReturnValue(chainMock);
  chainMock.update.mockReturnValue(chainMock);
  chainMock.delete.mockReturnValue(chainMock);
  chainMock.eq.mockReturnValue(chainMock);
  chainMock.in.mockReturnValue(chainMock);
  
  // Make the chain itself thenable (for await on final eq/delete)
  Object.assign(chainMock, {
    then: (resolve: (value: unknown) => void) => resolve(result),
  });
  
  return chainMock;
};

describe('familyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Family Operations', () => {
    describe('getFamiliesByUser', () => {
      it('should query family_member table with user_id', async () => {
        const mockResult = { data: [{ family_id: 'f1', family: { id: 'f1', name: 'Test' } }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getFamiliesByUser('user-123');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('user_id', 'user-123');
      });
    });

    describe('insertFamily', () => {
      it('should insert a new family', async () => {
        const mockResult = { data: { id: 'f1', name: 'Test Family' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.insertFamily('Test Family', 'user-123');

        expect(supabase.from).toHaveBeenCalledWith('family');
        expect(chainMock.insert).toHaveBeenCalledWith({ name: 'Test Family', created_by: 'user-123' });
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('updateFamilyName', () => {
      it('should update family name', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.updateFamilyName('family-123', 'New Name');

        expect(supabase.from).toHaveBeenCalledWith('family');
        expect(chainMock.update).toHaveBeenCalledWith({ name: 'New Name' });
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'family-123');
      });
    });

    describe('deleteFamily', () => {
      it('should delete a family', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteFamily('family-123');

        expect(supabase.from).toHaveBeenCalledWith('family');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'family-123');
      });
    });
  });

  describe('Family Member Operations', () => {
    describe('getMembersByFamily', () => {
      it('should get members by family id', async () => {
        const mockResult = { data: [{ id: 'm1', user_id: 'u1' }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getMembersByFamily('family-123');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.select).toHaveBeenCalledWith('*');
        expect(chainMock.eq).toHaveBeenCalledWith('family_id', 'family-123');
      });
    });

    describe('insertFamilyMember', () => {
      it('should insert a new family member', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const payload = {
          family_id: 'f1',
          user_id: 'u1',
          role: 'member' as const,
          user_email: 'test@example.com',
        };

        await familyService.insertFamilyMember(payload);

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.insert).toHaveBeenCalledWith(payload);
      });
    });

    describe('updateMemberRole', () => {
      it('should update member role', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.updateMemberRole('member-123', 'admin');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.update).toHaveBeenCalledWith({ role: 'admin' });
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'member-123');
      });
    });

    describe('deleteMember', () => {
      it('should delete a member by id', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteMember('member-123');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'member-123');
      });
    });

    describe('deleteMemberByFamilyAndUser', () => {
      it('should delete member by family and user id', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteMemberByFamilyAndUser('family-123', 'user-456');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('family_id', 'family-123');
        expect(chainMock.eq).toHaveBeenCalledWith('user_id', 'user-456');
      });
    });

    describe('deleteMembersByFamily', () => {
      it('should delete all members of a family', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteMembersByFamily('family-123');

        expect(supabase.from).toHaveBeenCalledWith('family_member');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('family_id', 'family-123');
      });
    });
  });

  describe('Family Invitation Operations', () => {
    describe('getInvitationsByEmail', () => {
      it('should get pending invitations by email with family details', async () => {
        const mockResult = { data: [{ id: 'inv1', email: 'test@example.com' }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getInvitationsByEmail('test@example.com');

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('email', 'test@example.com');
        expect(chainMock.eq).toHaveBeenCalledWith('status', 'pending');
      });
    });

    describe('getInvitationsByEmailSimple', () => {
      it('should get pending invitations by email without family details', async () => {
        const mockResult = { data: [{ id: 'inv1' }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getInvitationsByEmailSimple('test@example.com');

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.select).toHaveBeenCalledWith('*');
        expect(chainMock.eq).toHaveBeenCalledWith('email', 'test@example.com');
        expect(chainMock.eq).toHaveBeenCalledWith('status', 'pending');
      });
    });

    describe('getInvitationsByFamily', () => {
      it('should get pending invitations by family', async () => {
        const mockResult = { data: [{ id: 'inv1' }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getInvitationsByFamily('family-123');

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.select).toHaveBeenCalledWith('*');
        expect(chainMock.eq).toHaveBeenCalledWith('family_id', 'family-123');
        expect(chainMock.eq).toHaveBeenCalledWith('status', 'pending');
      });
    });

    describe('getFamilyNamesByIds', () => {
      it('should get family names by ids', async () => {
        const mockResult = { data: [{ id: 'f1', name: 'Family 1' }], error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.getFamilyNamesByIds(['f1', 'f2']);

        expect(supabase.from).toHaveBeenCalledWith('family');
        expect(chainMock.select).toHaveBeenCalledWith('id, name');
        expect(chainMock.in).toHaveBeenCalledWith('id', ['f1', 'f2']);
      });
    });

    describe('insertInvitation', () => {
      it('should insert a new invitation', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const payload = {
          family_id: 'f1',
          email: 'test@example.com',
          invited_by: 'user-123',
          family_name: 'Test Family',
        };

        await familyService.insertInvitation(payload);

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.insert).toHaveBeenCalledWith(payload);
      });
    });

    describe('updateInvitationStatus', () => {
      it('should update invitation status', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.updateInvitationStatus('inv-123', 'accepted');

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.update).toHaveBeenCalledWith({ status: 'accepted' });
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'inv-123');
      });
    });

    describe('deleteInvitation', () => {
      it('should delete an invitation', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteInvitation('inv-123');

        expect(supabase.from).toHaveBeenCalledWith('family_invitation');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'inv-123');
      });
    });
  });

  describe('Sync Operations', () => {
    describe('deleteByIdFromTable', () => {
      it('should delete by id from any table', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        await familyService.deleteByIdFromTable('expense', 'exp-123');

        expect(supabase.from).toHaveBeenCalledWith('expense');
        expect(chainMock.delete).toHaveBeenCalled();
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'exp-123');
      });
    });

    describe('insertToTable', () => {
      it('should insert data to any table', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { title: 'Test', value: 100 };
        await familyService.insertToTable('expense', data);

        expect(supabase.from).toHaveBeenCalledWith('expense');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
      });
    });

    describe('updateInTable', () => {
      it('should update data in any table', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { title: 'Updated' };
        await familyService.updateInTable('expense', 'exp-123', data);

        expect(supabase.from).toHaveBeenCalledWith('expense');
        expect(chainMock.update).toHaveBeenCalledWith(data);
        expect(chainMock.eq).toHaveBeenCalledWith('id', 'exp-123');
      });
    });

    describe('insertWithSelect', () => {
      it('should insert and return the created record', async () => {
        const mockResult = { data: { id: 'new-1', title: 'Test' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { title: 'Test' };
        await familyService.insertWithSelect('expense', data);

        expect(supabase.from).toHaveBeenCalledWith('expense');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('insertMonthWithId', () => {
      it('should insert month with specific id', async () => {
        const mockResult = { data: null, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { id: 'month-1', family_id: 'f1', year: 2026, month: 1, income: 5000 };
        await familyService.insertMonthWithId(data);

        expect(supabase.from).toHaveBeenCalledWith('month');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
      });
    });

    describe('insertExpenseForSync', () => {
      it('should insert expense and return the created record', async () => {
        const mockResult = { data: { id: 'exp-1', title: 'Test' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { title: 'Test', value: 100 };
        await familyService.insertExpenseForSync(data);

        expect(supabase.from).toHaveBeenCalledWith('expense');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('insertSubcategoryForSync', () => {
      it('should insert subcategory and return the created record', async () => {
        const mockResult = { data: { id: 'sub-1', name: 'Electricity' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { family_id: 'f1', name: 'Electricity', category_key: 'essenciais' };
        await familyService.insertSubcategoryForSync(data);

        expect(supabase.from).toHaveBeenCalledWith('subcategory');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('insertRecurringForSync', () => {
      it('should insert recurring expense and return the created record', async () => {
        const mockResult = { data: { id: 'rec-1', title: 'Rent' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { title: 'Rent', value: 1000, category_key: 'essenciais' };
        await familyService.insertRecurringForSync(data);

        expect(supabase.from).toHaveBeenCalledWith('recurring_expense');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('insertIncomeSourceForSync', () => {
      it('should insert income source and return the created record', async () => {
        const mockResult = { data: { id: 'inc-1', name: 'Salary' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { month_id: 'm1', name: 'Salary', value: 5000 };
        await familyService.insertIncomeSourceForSync(data);

        expect(supabase.from).toHaveBeenCalledWith('income_source');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });

    describe('insertCategoryLimitForSync', () => {
      it('should insert category limit and return the created record', async () => {
        const mockResult = { data: { id: 'lim-1', category_key: 'essenciais' }, error: null };
        const chainMock = createChainMock(mockResult);
        (supabase.from as Mock).mockReturnValue(chainMock);

        const data = { month_id: 'm1', category_key: 'essenciais', percentage: 55 };
        await familyService.insertCategoryLimitForSync(data);

        expect(supabase.from).toHaveBeenCalledWith('category_limit');
        expect(chainMock.insert).toHaveBeenCalledWith(data);
        expect(chainMock.select).toHaveBeenCalled();
        expect(chainMock.single).toHaveBeenCalled();
      });
    });
  });
});
