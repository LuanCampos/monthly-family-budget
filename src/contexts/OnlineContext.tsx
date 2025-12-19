import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { offlineAdapter } from '@/lib/offlineAdapter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SyncProgress {
  step: string;
  current: number;
  total: number;
  details?: string;
}

interface OnlineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
  syncFamily: (familyId: string) => Promise<{ newFamilyId?: string; error?: Error }>;
}

const OnlineContext = createContext<OnlineContextType | undefined>(undefined);

export const useOnline = () => {
  const context = useContext(OnlineContext);
  if (!context) {
    throw new Error('useOnline must be used within an OnlineProvider');
  }
  return context;
};

export const OnlineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline. Alterações serão salvas localmente.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Count pending sync items
  const updatePendingCount = useCallback(async () => {
    const items = await offlineAdapter.sync.getAll();
    setPendingSyncCount(items.length);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Sync a specific offline family to cloud with progress tracking and rollback
  const syncFamily = async (familyId: string): Promise<{ newFamilyId?: string; error?: Error }> => {
    if (!session?.user) {
      return { error: new Error('Você precisa estar logado para sincronizar') };
    }

    if (!isOnline) {
      return { error: new Error('Você está offline') };
    }

    setIsSyncing(true);
    setSyncProgress({ step: 'Preparando...', current: 0, total: 100 });

    let newFamilyId: string | null = null;
    const createdCloudIds: { table: string; id: string }[] = [];

    // Rollback function to clean up partially synced data
    const rollback = async () => {
      setSyncProgress({ step: 'Revertendo alterações...', current: 0, total: createdCloudIds.length });
      
      for (let i = createdCloudIds.length - 1; i >= 0; i--) {
        const { table, id } = createdCloudIds[i];
        try {
          await supabase.from(table).delete().eq('id', id);
          setSyncProgress({ step: 'Revertendo alterações...', current: createdCloudIds.length - i, total: createdCloudIds.length });
        } catch (e) {
          console.error(`Failed to rollback ${table}:${id}`, e);
        }
      }

      // Delete family member and family if they were created
      if (newFamilyId) {
        try {
          await supabase.from('family_member').delete().eq('family_id', newFamilyId);
          await supabase.from('family').delete().eq('id', newFamilyId);
        } catch (e) {
          console.error('Failed to rollback family', e);
        }
      }
    };

    try {
      // Get offline family
      const offlineFamily = await offlineAdapter.get<any>('families', familyId);
      if (!offlineFamily) {
        return { error: new Error('Família não encontrada') };
      }

      // Count total items for progress
      const subcategories = await offlineAdapter.getAllByIndex<any>('subcategories', 'family_id', familyId);
      const recurringExpenses = await offlineAdapter.getAllByIndex<any>('recurring_expenses', 'family_id', familyId);
      const months = await offlineAdapter.getAllByIndex<any>('months', 'family_id', familyId);
      const goals = await offlineAdapter.getAllByIndex<any>('category_goals', 'family_id', familyId);
      
      let totalExpenses = 0;
      for (const month of months) {
        const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', month.id);
        totalExpenses += expenses.length;
      }

      const totalItems = 1 + subcategories.length + recurringExpenses.length + months.length + totalExpenses + goals.length;
      let syncedItems = 0;

      const updateProgress = (step: string, details?: string) => {
        syncedItems++;
        setSyncProgress({ step, current: syncedItems, total: totalItems, details });
      };

      // Step 1: Create family in cloud
      setSyncProgress({ step: 'Criando família na nuvem...', current: 0, total: totalItems });
      
      const { data: cloudFamily, error: familyError } = await supabase
        .from('family')
        .insert({
          name: offlineFamily.name,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (familyError) {
        throw new Error(`Erro ao criar família: ${familyError.message}`);
      }

      newFamilyId = cloudFamily.id;
      updateProgress('Família criada', offlineFamily.name);

      // Create owner membership
      const { error: memberError } = await supabase.from('family_member').insert({
        family_id: newFamilyId,
        user_id: session.user.id,
        role: 'owner',
      });

      if (memberError) {
        throw new Error(`Erro ao criar membro: ${memberError.message}`);
      }

      // ID mapping for related records
      const idMap: Record<string, string> = { [familyId]: newFamilyId };

      // Step 2: Sync subcategories
      for (const sub of subcategories) {
        const { data, error } = await supabase
          .from('subcategory')
          .insert({
            family_id: newFamilyId,
            name: sub.name,
            category_key: sub.category_key,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Erro ao sincronizar subcategoria "${sub.name}": ${error.message}`);
        }
        
        if (data) {
          idMap[sub.id] = data.id;
          createdCloudIds.push({ table: 'subcategory', id: data.id });
        }
        updateProgress('Sincronizando subcategorias', sub.name);
      }

      // Step 3: Sync recurring expenses
      for (const rec of recurringExpenses) {
        const { data, error } = await supabase
          .from('recurring_expense')
          .insert({
            family_id: newFamilyId,
            title: rec.title,
            category_key: rec.category_key,
            subcategory_id: rec.subcategory_id ? idMap[rec.subcategory_id] : null,
            value: rec.value,
            due_day: rec.due_day,
            has_installments: rec.has_installments,
            total_installments: rec.total_installments,
            start_year: rec.start_year,
            start_month: rec.start_month,
          })
          .select()
          .single();
        
        if (error) {
          throw new Error(`Erro ao sincronizar gasto recorrente "${rec.title}": ${error.message}`);
        }
        
        if (data) {
          idMap[rec.id] = data.id;
          createdCloudIds.push({ table: 'recurring_expense', id: data.id });
        }
        updateProgress('Sincronizando gastos recorrentes', rec.title);
      }

      // Step 4: Sync months
      for (const month of months) {
        const newMonthId = month.id.replace(familyId, newFamilyId);
        const { error } = await supabase.from('month').insert({
          id: newMonthId,
          family_id: newFamilyId,
          year: month.year,
          month: month.month,
          income: month.income,
        });
        
        if (error) {
          throw new Error(`Erro ao sincronizar mês ${month.month}/${month.year}: ${error.message}`);
        }
        
        idMap[month.id] = newMonthId;
        createdCloudIds.push({ table: 'month', id: newMonthId });
        updateProgress('Sincronizando meses', `${month.month}/${month.year}`);
      }

      // Step 5: Sync expenses
      for (const month of months) {
        const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', month.id);
        for (const exp of expenses) {
          const { data, error } = await supabase
            .from('expense')
            .insert({
              month_id: idMap[month.id],
              title: exp.title,
              category_key: exp.category_key,
              subcategory_id: exp.subcategory_id ? idMap[exp.subcategory_id] : null,
              value: exp.value,
              is_recurring: exp.is_recurring,
              is_pending: exp.is_pending,
              due_day: exp.due_day,
              recurring_expense_id: exp.recurring_expense_id ? idMap[exp.recurring_expense_id] : null,
              installment_current: exp.installment_current,
              installment_total: exp.installment_total,
            })
            .select()
            .single();
          
          if (error) {
            throw new Error(`Erro ao sincronizar gasto "${exp.title}": ${error.message}`);
          }
          
          if (data) {
            createdCloudIds.push({ table: 'expense', id: data.id });
          }
          updateProgress('Sincronizando gastos', exp.title);
        }
      }

      // Step 6: Sync category goals
      for (const goal of goals) {
        const { error } = await supabase.from('category_goal').upsert({
          family_id: newFamilyId,
          category_key: goal.category_key,
          percentage: goal.percentage,
        });
        
        if (error) {
          throw new Error(`Erro ao sincronizar meta: ${error.message}`);
        }
        updateProgress('Sincronizando metas', goal.category_key);
      }

      // Step 7: Clean up local offline data
      setSyncProgress({ step: 'Limpando dados locais...', current: totalItems, total: totalItems });
      
      for (const sub of subcategories) await offlineAdapter.delete('subcategories', sub.id);
      for (const rec of recurringExpenses) await offlineAdapter.delete('recurring_expenses', rec.id);
      for (const month of months) {
        const expenses = await offlineAdapter.getAllByIndex<any>('expenses', 'month_id', month.id);
        for (const exp of expenses) await offlineAdapter.delete('expenses', exp.id);
        await offlineAdapter.delete('months', month.id);
      }
      for (const goal of goals) await offlineAdapter.delete('category_goals', goal.id);
      await offlineAdapter.delete('families', familyId);

      // Clear sync queue for this family
      const queueItems = await offlineAdapter.sync.getByFamily(familyId);
      for (const item of queueItems) await offlineAdapter.sync.remove(item.id);

      await updatePendingCount();
      
      setSyncProgress({ step: 'Concluído!', current: totalItems, total: totalItems });
      toast.success('Família sincronizada com sucesso!');

      return { newFamilyId };
    } catch (error) {
      console.error('Sync error:', error);
      
      // Attempt rollback
      if (createdCloudIds.length > 0 || newFamilyId) {
        toast.error('Erro na sincronização. Revertendo alterações...');
        await rollback();
        toast.info('Alterações revertidas. Seus dados locais foram preservados.');
      }
      
      return { error: error as Error };
    } finally {
      setIsSyncing(false);
      // Clear progress after a short delay to show completion
      setTimeout(() => setSyncProgress(null), 2000);
    }
  };

  // Sync all pending changes
  const syncNow = async () => {
    if (!session?.user || !isOnline) return;

    setIsSyncing(true);
    try {
      const items = await offlineAdapter.sync.getAll();
      
      for (const item of items) {
        try {
          if (offlineAdapter.isOfflineId(item.familyId)) {
            // Skip items for offline families - they need full family sync
            continue;
          }

          if (item.action === 'insert') {
            await supabase.from(item.type).insert(item.data);
          } else if (item.action === 'update') {
            await supabase.from(item.type).update(item.data).eq('id', item.data.id);
          } else if (item.action === 'delete') {
            await supabase.from(item.type).delete().eq('id', item.data.id);
          }

          await offlineAdapter.sync.remove(item.id);
        } catch (error) {
          console.error('Error syncing item:', item, error);
        }
      }

      await updatePendingCount();
      if (items.length > 0) {
        toast.success('Dados sincronizados!');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && session?.user) {
      syncNow();
    }
  }, [isOnline, session]);

  return (
    <OnlineContext.Provider
      value={{
        isOnline,
        isSyncing,
        syncProgress,
        pendingSyncCount,
        syncNow,
        syncFamily,
      }}
    >
      {children}
    </OnlineContext.Provider>
  );
};