import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GoalForm, GoalList, EntryForm, EntryHistory, ImportExpenseDialog } from '@/components/goal';
import { useGoals } from '@/hooks/useGoals';
import { useBudget } from '@/hooks/useBudget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Goal, GoalEntry, GoalStatus } from '@/types';
import { SettingsPanel } from '@/components/settings';
import { FamilySetup } from '@/components/family';
import { Loader2, Target, Settings as SettingsIcon, Wallet, Plus, History, Import, AlertTriangle, Pencil } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Inner component that uses useGoals - will be remounted when family changes via key
const GoalsContent = () => {
  const { t } = useLanguage();
    const { currentFamilyId: _currentFamilyId, myPendingInvitations } = useFamily();
  const { user } = useAuth();
  const { subcategories } = useBudget();
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

  const handleSaveGoal = async (data: { name: string; targetValue: number; currentValue?: number; targetDate?: string; account?: string; linkedSubcategoryId?: string; status?: GoalStatus }) => {
    setSavingGoal(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
      } else {
        await addGoal(data);
      }
    } finally {
      setSavingGoal(false);
      // Close modal only after all async operations complete
      setOpenGoalDialog(false);
      setEditingGoal(null);
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
      // Close modal only after all async operations complete
      setEntryGoal(null);
      setEditingEntry(null);
    }
  };

  const handleDeleteEntry = async (entry: GoalEntry) => {
    if (!historyGoal) return;
    setDeletingEntry(true);
    try {
      await deleteEntry(entry.id, historyGoal.id);
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

      <Dialog open={openGoalDialog} onOpenChange={(open) => { setOpenGoalDialog(open); if (!open) setEditingGoal(null); }}>
        <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-primary" />
              {editingGoal ? (t('editGoal') || 'Editar Meta') : (t('addGoal') || 'Nova Meta')}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 overflow-y-auto">
            <GoalForm 
              initial={editingGoal || undefined} 
              subcategories={subcategories}
              onSubmit={handleSaveGoal} 
              onCancel={() => setOpenGoalDialog(false)} 
              submitting={savingGoal}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(entryGoal)} onOpenChange={(open) => { if (!open) { setEntryGoal(null); setEditingEntry(null); } }}>
        <DialogContent className="bg-card border-border sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              {editingEntry ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {editingEntry ? (t('editEntry') || 'Editar lançamento') : (t('addEntry') || 'Adicionar Lançamento')}
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 overflow-y-auto">
            {entryGoal && (
              <EntryForm
                onSubmit={handleSaveEntry}
                onCancel={() => { setEntryGoal(null); setEditingEntry(null); }}
                submitting={savingEntry}
                initial={editingEntry ? {
                  value: editingEntry.value,
                  description: editingEntry.description || '',
                  month: editingEntry.month,
                  year: editingEntry.year,
                } : null}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyGoal)} onOpenChange={(open) => { if (!open) { setHistoryGoal(null); setHistoryEntries([]); } }}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5 text-primary" />
              {t('entryHistory') || 'Histórico de Lançamentos'}
              {historyGoal && (
                <span className="text-muted-foreground font-normal">- {historyGoal.name}</span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <EntryHistory 
              entries={historyEntries} 
              onDelete={(entry) => setEntryToDelete(entry)}
              onEdit={handleEditEntry}
            />
          </div>

          {historyGoal && (
            <div className="px-6 py-4 border-t border-border bg-secondary/30 flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button size="sm" className="w-full sm:w-auto gap-1.5" onClick={() => handleAddEntry(historyGoal)}>
                <Plus className="h-4 w-4" />
                <span>{t('addEntry') || 'Lançamento'}</span>
              </Button>

              {historyGoal.linkedSubcategoryId && (
                <ImportExpenseDialog
                  trigger={
                    <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2">
                      <Import className="h-4 w-4" />
                      {t('importExpenses') || 'Importar gastos anteriores'}
                    </Button>
                  }
                  subcategoryId={historyGoal.linkedSubcategoryId}
                  fetchExpenses={getHistoricalExpenses}
                  onImport={async (expenseId) => {
                    await importExpense(historyGoal.id, expenseId);
                    await refreshEntries(historyGoal.id);
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Goal Confirmation */}
      <AlertDialog open={Boolean(goalToDelete)} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('deleteGoalConfirm') || 'Excluir meta?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('deleteGoalWarning') || 'Os lançamentos vinculados serão removidos. Os gastos continuarão existindo.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGoal}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingGoal}
              onClick={async () => {
                if (!goalToDelete) return;
                setDeletingGoal(true);
                try {
                  await deleteGoal(goalToDelete.id);
                } finally {
                  setDeletingGoal(false);
                  setGoalToDelete(null);
                }
              }}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Entry Confirmation */}
      <AlertDialog open={Boolean(entryToDelete)} onOpenChange={(open) => { if (!open) setEntryToDelete(null); }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {t('deleteEntryConfirm') || 'Excluir lançamento?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('deleteEntryWarning') || 'O valor será descontado da meta.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingEntry}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingEntry}
              onClick={() => entryToDelete && handleDeleteEntry(entryToDelete)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
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

export default GoalsPage;
