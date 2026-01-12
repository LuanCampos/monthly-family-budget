import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GoalForm, GoalList, EntryForm, EntryHistory, ImportExpenseDialog } from '@/components/goal';
import { useGoals } from '@/hooks/useGoals';
import { useBudget } from '@/hooks/useBudget';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import type { Goal, GoalEntry } from '@/types';
import { SettingsPanel } from '@/components/settings';
import { Loader2, Target, Settings as SettingsIcon, Wallet, Plus, History, Import } from 'lucide-react';
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

const GoalsPage = () => {
  const { t } = useLanguage();
  const { currentFamilyId, myPendingInvitations } = useFamily();
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

  useEffect(() => {
    if (currentFamilyId) {
      loadGoals();
    }
  }, [currentFamilyId, loadGoals]);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!historyGoal) return;
      const entries = await getEntries(historyGoal.id);
      setHistoryEntries(entries);
    };
    fetchEntries();
  }, [historyGoal, getEntries]);

  const pageTitle = useMemo(() => t('goals') || 'Metas', [t]);

  const handleSaveGoal = async (data: { name: string; targetValue: number; currentValue?: number; targetDate?: string; account?: string; linkedSubcategoryId?: string }) => {
    setSavingGoal(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
      } else {
        await addGoal(data);
      }
      setOpenGoalDialog(false);
      setEditingGoal(null);
    } finally {
      setSavingGoal(false);
    }
  };

  const handleAddEntry = (goal: Goal) => {
    setEntryGoal(goal);
  };

  const handleViewHistory = async (goal: Goal) => {
    setHistoryGoal(goal);
    const entries = await getEntries(goal.id);
    setHistoryEntries(entries);
  };

  const handleSaveEntry = async (payload: { value: number; description: string; month: number; year: number }) => {
    if (!entryGoal) return;
    setSavingEntry(true);
    try {
      await addManualEntry({ goalId: entryGoal.id, ...payload });
      const entries = await getEntries(entryGoal.id);
      setHistoryEntries(entries);
      setEntryGoal(null);
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteEntry = async (entry: GoalEntry) => {
    if (!historyGoal) return;
    setDeletingEntry(true);
    try {
      await deleteEntry(entry.id, historyGoal.id);
      const entries = await getEntries(historyGoal.id);
      setHistoryEntries(entries);
    } finally {
      setDeletingEntry(false);
      setEntryToDelete(null);
    }
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

      <main className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('loading') || 'Carregando...'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">{t('goals') || 'Metas'}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('goalsSubtitle') || 'Gerencie suas metas financeiras conectadas a subcategorias.'}
                </p>
              </div>
              <Button 
                onClick={() => { setOpenGoalDialog(true); setEditingGoal(null); }}
                className="gap-2 w-full sm:w-auto"
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
              calculateSuggestion={getMonthlySuggestion}
            />
          </>
        )}
      </main>

      <Dialog open={openGoalDialog} onOpenChange={(open) => { setOpenGoalDialog(open); if (!open) setEditingGoal(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {editingGoal ? (t('editGoal') || 'Editar Meta') : (t('addGoal') || 'Nova Meta')}
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? (t('editGoalDescription') || 'Atualize as informações da sua meta')
                : (t('addGoalDescription') || 'Defina uma meta financeira e acompanhe seu progresso')
              }
            </DialogDescription>
          </DialogHeader>
          <GoalForm 
            initial={editingGoal || undefined} 
            subcategories={subcategories}
            onSubmit={handleSaveGoal} 
            onCancel={() => setOpenGoalDialog(false)} 
            submitting={savingGoal}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(entryGoal)} onOpenChange={(open) => { if (!open) setEntryGoal(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              {t('addEntry') || 'Adicionar Lançamento'}
            </DialogTitle>
            <DialogDescription>
              {entryGoal && ((t('addEntryForGoal') && t('addEntryForGoal').replace('{{goal}}', entryGoal.name)) || `Adicionando lançamento para ${entryGoal.name}`)}
            </DialogDescription>
          </DialogHeader>
          {entryGoal && (
            <EntryForm
              onSubmit={handleSaveEntry}
              onCancel={() => setEntryGoal(null)}
              submitting={savingEntry}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyGoal)} onOpenChange={(open) => { if (!open) { setHistoryGoal(null); setHistoryEntries([]); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              {t('entryHistory') || 'Histórico de Lançamentos'}
            </DialogTitle>
            <DialogDescription>
              {historyGoal && ((t('entriesForGoal') && t('entriesForGoal').replace('{{goal}}', historyGoal.name)) || `Lançamentos de ${historyGoal.name}`)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            <EntryHistory entries={historyEntries} onDelete={(entry) => setEntryToDelete(entry)} />
          </div>

          {historyGoal && (
            <div className="pt-4 border-t mt-4 space-y-2 flex flex-col items-stretch sm:items-center">
              <Button size="sm" className="w-full sm:w-auto gap-1.5" onClick={() => handleAddEntry(historyGoal)}>
                <Plus className="h-4 w-4" />
                <span>{t('addEntry') || 'Lançamento'}</span>
              </Button>

              {historyGoal.linkedSubcategoryId && (
                <ImportExpenseDialog
                  trigger={
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Import className="h-4 w-4" />
                      {t('importExpenses') || 'Importar gastos anteriores'}
                    </Button>
                  }
                  subcategoryId={historyGoal.linkedSubcategoryId}
                  fetchExpenses={getHistoricalExpenses}
                  onImport={async (expenseId) => {
                    await importExpense(historyGoal.id, expenseId);
                    const entries = await refreshEntries(historyGoal.id);
                    setHistoryEntries(entries);
                  }}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Goal Confirmation */}
      <AlertDialog open={Boolean(goalToDelete)} onOpenChange={(open) => { if (!open) setGoalToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteGoalConfirm') || 'Excluir meta?'}</AlertDialogTitle>
            <AlertDialogDescription>
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEntryConfirm') || 'Excluir lançamento?'}</AlertDialogTitle>
            <AlertDialogDescription>
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

export default GoalsPage;
