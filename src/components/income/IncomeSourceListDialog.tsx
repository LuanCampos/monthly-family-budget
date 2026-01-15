import { useState } from 'react';
import { IncomeSource } from '@/types/budget';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { ConfirmDialog } from '@/components/common';
import { IncomeSourceFormDialog } from './IncomeSourceFormDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface IncomeSourceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSources: IncomeSource[];
  onAdd: (name: string, value: number) => Promise<void>;
  onUpdate: (id: string, name: string, value: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  totalIncome: number;
}

export const IncomeSourceListDialog = ({
  open,
  onOpenChange,
  incomeSources,
  onAdd,
  onUpdate,
  onDelete,
  totalIncome,
}: IncomeSourceListDialogProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteSourceId, setDeleteSourceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (name: string, value: number) => {
    try {
      await onAdd(name, value);
      toast.success(t('incomeSourceAdded'));
    } catch (error) {
      toast.error(t('errorSaving'));
      logger.error('incomeSource.add.failed', { error });
      throw error;
    }
  };

  const handleUpdate = async (name: string, value: number) => {
    if (!editingSource) return;
    try {
      await onUpdate(editingSource.id, name, value);
      toast.success(t('incomeSourceUpdated'));
      setEditingSource(null);
    } catch (error) {
      toast.error(t('errorSaving'));
      logger.error('incomeSource.update.failed', { error });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deleteSourceId) return;
    setLoading(true);
    try {
      await onDelete(deleteSourceId);
      toast.success(t('incomeSourceDeleted'));
    } catch (error) {
      toast.error(t('errorDeleting'));
      logger.error('incomeSource.delete.failed', { sourceId: deleteSourceId, error });
    } finally {
      setLoading(false);
      setDeleteSourceId(null);
    }
  };

  const openAddForm = () => {
    setEditingSource(null);
    setIsFormOpen(true);
  };

  const openEditForm = (source: IncomeSource) => {
    setEditingSource(source);
    setIsFormOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5 text-primary" />
              {t('manageIncomeSources')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Total Income Display */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4 mb-4">
              <div className="text-sm text-muted-foreground mb-1">{t('totalIncome')}</div>
              <div className="text-xl font-semibold text-primary tracking-tight">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            {/* Income Sources List */}
            {incomeSources.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg bg-secondary/20">
                <p className="text-base font-semibold text-foreground">
                  {t('noIncomeSources')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('addIncomeSourceHint')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {incomeSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-medium truncate">
                        {source.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-foreground text-sm font-semibold tabular-nums mr-1">
                        {formatCurrency(source.value)}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(source)}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        aria-label={t('edit')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteSourceId(source.id)}
                        disabled={loading}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label={t('delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            <Button
              onClick={openAddForm}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t('addIncomeSource')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IncomeSourceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        incomeSource={editingSource}
        onSave={editingSource ? handleUpdate : handleAdd}
      />

      <ConfirmDialog
        open={!!deleteSourceId}
        onOpenChange={(open) => !open && setDeleteSourceId(null)}
        onConfirm={handleDelete}
        title={t('deleteIncomeSource')}
        description={t('deleteIncomeSourceMessage')}
        variant="destructive"
        loading={loading}
      />
    </>
  );
};
