import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  GoalList, 
  GoalFormDialog, 
  EntryFormDialog, 
  EntryHistoryDialog 
} from '@/components/goal';
import { ConfirmDialog } from '@/components/common';
import { useGoals } from '@/hooks/useGoals';
import { useBudget } from '@/hooks/useBudget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Goal, GoalEntry, GoalStatus } from '@/types';
import { SettingsDialog } from '@/components/settings';
import { FamilySetup } from '@/components/family';
import { Loader2, Target, Settings as SettingsIcon, Wallet, Plus } from 'lucide-react';

// Inner component that uses useGoals - will be remounted when family changes via key
const GoalsContent = () => {
  const { t } = useLanguage();
  const { myPendingInvitations } = useFamily();
  const { user } = useAuth();
  const { subcategories, currentMonth } = useBudget();
  const {
    goals,
    entriesByGoal,
    loadGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    getEntries,
    refreshEntries,
    addManualEntry,
    updateEntry,
    deleteEntry,
    getHistoricalExpenses,
    importExpense,
    getMonthlySuggestion,
    loading,
  } = useGoals();

  const [openGoalDialog, setOpenGoalDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [historyGoal, setHistoryGoal] = useState<Goal | null>(null);
  const [historyEntries, setHistoryEntries] = useState<GoalEntry[]>([]);
  const [entryGoal, setEntryGoal] = useState<Goal | null>(null);
  const [editingEntry, setEditingEntry] = useState<GoalEntry | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<GoalEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    const email = user.email || '';
    const name = user.user_metadata?.display_name || user.user_metadata?.full_name;
    if (name) {
      return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Keep historyEntries synchronized with entriesByGoal
  useEffect(() => {
    if (!historyGoal) return;
    const cachedEntries = entriesByGoal[historyGoal.id];
    if (cachedEntries) {
      setHistoryEntries(cachedEntries);
    } else {
      getEntries(historyGoal.id).then(setHistoryEntries);
    }
  }, [historyGoal, entriesByGoal, getEntries]);

  const pageTitle = useMemo(() => t('goals') || 'Metas', [t]);

  // Update page title based on language
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const handleSaveGoal = async (data: { name: string; targetValue: number; currentValue?: number; targetDate?: string; account?: string; linkedSubcategoryId?: string; linkedCategoryKey?: string; status?: GoalStatus }) => {
    setSavingGoal(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
      } else {
        await addGoal(data);
      }
    } finally {
      setSavingGoal(false);
      // Note: Modal closes itself via GoalFormDialog's resetAndClose()
      // We do NOT reset openGoalDialog/editingGoal here to avoid race condition flash
    }
  };

  const handleCompleteGoal = async (goal: Goal) => {
    await updateGoal(goal.id, { status: 'archived' });
    await loadGoals();
  };

  const handleAddEntry = (goal: Goal) => {
    setEntryGoal(goal);
    setEditingEntry(null);
  };

  const handleViewHistory = (goal: Goal) => {
    setHistoryGoal(goal);
  };

  const handleSaveEntry = async (payload: { value: number; description: string; month: number; year: number }) => {
    if (!entryGoal) return;
    setSavingEntry(true);
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, entryGoal.id, payload);
      } else {
        await addManualEntry({ goalId: entryGoal.id, ...payload });
      }

      const refreshedEntries = await refreshEntries(entryGoal.id);
      if (historyGoal && historyGoal.id === entryGoal.id) {
        setHistoryEntries(refreshedEntries);
      }

      // also refresh goals so cards show updated currentValue/suggestions
      await loadGoals();
    } finally {
      setSavingEntry(false);
      // Note: Modal closes itself via EntryFormDialog's resetAndClose()
      // We do NOT reset entryGoal/editingEntry here to avoid race condition flash
    }
  };

  const handleDeleteEntry = async () => {
    if (!historyGoal || !entryToDelete) return;
    setDeletingEntry(true);
    try {
      await deleteEntry(entryToDelete.id, historyGoal.id);
      await loadGoals();
    } finally {
      setDeletingEntry(false);
      setEntryToDelete(null);
    }
  };

  const handleEditEntry = (entry: GoalEntry) => {
    if (!historyGoal) return;
    setEntryGoal(historyGoal);
    setEditingEntry(entry);
  };

  const handleDeleteGoal = async () => {
    if (!goalToDelete) return;
    setDeletingGoal(true);
    try {
      await deleteGoal(goalToDelete.id);
    } finally {
      setDeletingGoal(false);
      setGoalToDelete(null);
    }
  };

  const handleImportExpense = async (expenseId: string) => {
    if (!historyGoal) return;
    await importExpense(historyGoal.id, expenseId);
    await refreshEntries(historyGoal.id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-2 gap-2">
            {/* Logo + Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 md:gap-3.5 min-w-0 flex-shrink pl-0.5 sm:pl-1">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 self-center" />
              <h1 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {pageTitle}
              </h1>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings Dropdown Menu */}
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 relative"
                    aria-label="Settings menu"
                  >
                    {user ? (
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                        {getUserInitials()}
                      </div>
                    ) : (
                      <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    {myPendingInvitations && myPendingInvitations.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        {myPendingInvitations.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      {t('budget') ?? 'Orçamento'}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <SettingsIcon className="h-4 w-4 text-primary" />
                    {t('settings') ?? 'Configurações'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {loading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="sr-only">{t('goals') || 'Metas'}</h2>
              <Button
                size="sm"
                onClick={() => { setOpenGoalDialog(true); setEditingGoal(null); }}
                className="gap-2 w-auto"
              >
                <Plus className="h-4 w-4" />
                {t('addGoal') || 'Nova Meta'}
              </Button>
            </div>
            
            <GoalList
              goals={goals}
              entriesByGoal={entriesByGoal}
              onViewHistory={handleViewHistory}
              onEdit={(goal) => { setEditingGoal(goal); setOpenGoalDialog(true); }}
              onDelete={(goal) => setGoalToDelete(goal)}
              onFetchEntries={getEntries}
              onCompleteGoal={handleCompleteGoal}
              calculateSuggestion={getMonthlySuggestion}
            />
          </>
        )}
      </main>

      {/* Dialogs - conditionally render to avoid flash on close */}
      {openGoalDialog && (
        <GoalFormDialog
          open={openGoalDialog}
          onOpenChange={(open) => { setOpenGoalDialog(open); if (!open) setEditingGoal(null); }}
          goal={editingGoal}
          subcategories={subcategories}
          onSave={handleSaveGoal}
          saving={savingGoal}
        />
      )}

      {entryGoal && (
        <EntryFormDialog
          open={Boolean(entryGoal)}
          onOpenChange={(open) => { if (!open) { setEntryGoal(null); setEditingEntry(null); } }}
          goal={entryGoal}
          entry={editingEntry}
          onSave={handleSaveEntry}
          saving={savingEntry}
          defaultMonth={currentMonth?.month}
          defaultYear={currentMonth?.year}
        />
      )}

      {historyGoal && (
        <EntryHistoryDialog
          open={Boolean(historyGoal)}
          onOpenChange={(open) => { if (!open) { setHistoryGoal(null); setHistoryEntries([]); } }}
          goal={historyGoal}
          entries={historyEntries}
          onAddEntry={() => historyGoal && handleAddEntry(historyGoal)}
          onEditEntry={handleEditEntry}
          onDeleteEntry={(entry) => setEntryToDelete(entry)}
          onImportExpense={handleImportExpense}
          fetchHistoricalExpenses={getHistoricalExpenses}
        />
      )}

      {goalToDelete && (
        <ConfirmDialog
          open={Boolean(goalToDelete)}
          onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}
          onConfirm={handleDeleteGoal}
          title={t('deleteGoalConfirm') || 'Excluir meta?'}
          description={t('deleteGoalWarning') || 'Os lançamentos vinculados serão removidos. Os gastos continuarão existindo.'}
          variant="destructive"
          loading={deletingGoal}
        />
      )}

      {entryToDelete && (
        <ConfirmDialog
          open={Boolean(entryToDelete)}
          onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}
          onConfirm={handleDeleteEntry}
          title={t('deleteEntryConfirm') || 'Excluir lançamento?'}
          description={t('deleteEntryWarning') || 'O valor será descontado da meta.'}
          variant="destructive"
          loading={deletingEntry}
        />
      )}

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

// Main GoalsPage component - handles auth/family loading and provides key for remounting
const GoalsPage = () => {
  const { loading: authLoading } = useAuth();
  const { currentFamilyId, loading: familyLoading } = useFamily();

  // Show loading while checking auth/family
  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show family setup if no family selected
  if (!currentFamilyId) {
    return <FamilySetup />;
  }

  // Render GoalsContent with key - forces remount when family changes
  // This cleanly resets all state without a full page reload
  return <GoalsContent key={currentFamilyId} />;
};

export { GoalsPage as Goals };
