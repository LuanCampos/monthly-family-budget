import { useState, useEffect, KeyboardEvent } from 'react';
import { IncomeSource } from '@/types/budget';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Plus, Edit2, Check, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { parseCurrencyInput, formatCurrencyInput, sanitizeCurrencyInput } from '@/utils/formatters';
import { toast } from 'sonner';

interface IncomeSourcesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeSources: IncomeSource[];
  onAdd: (name: string, value: number) => Promise<void>;
  onUpdate: (id: string, name: string, value: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  totalIncome: number;
}

interface EditingSource {
  id: string;
  name: string;
  value: string;
  isNew: boolean;
}

export const IncomeSourcesManager = ({
  open,
  onOpenChange,
  incomeSources,
  onAdd,
  onUpdate,
  onDelete,
  totalIncome,
}: IncomeSourcesManagerProps) => {
  const { t } = useLanguage();
  const { currencySymbol } = useCurrency();
  const [editingSources, setEditingSources] = useState<EditingSource[]>([]);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize editing sources when dialog opens or sources change
  useEffect(() => {
    if (open) {
      setEditingSources(
        incomeSources.map((source) => ({
          id: source.id,
          name: source.name,
          value: formatCurrencyInput(source.value),
          isNew: false,
        }))
      );
      setActiveRowId(null);
    }
  }, [open, incomeSources]);

  const addNewLine = () => {
    const tempId = `temp-${Date.now()}`;
    setEditingSources((prev) => ([
      ...prev,
      {
        id: tempId,
        name: '',
        value: '',
        isNew: true,
      },
    ]));
    setActiveRowId(tempId);
  };

  const updateSource = (index: number, field: 'name' | 'value', val: string) => {
    setEditingSources((prev) => {
      const updated = [...prev];
      const nextValue = (() => {
        if (field === 'value') {
          const sanitized = sanitizeCurrencyInput(val.replace(/\./g, ','));
          const [integerPart, decimalPart] = sanitized.split(',');
          if (decimalPart === undefined) {
            return integerPart;
          }
          return `${integerPart},${decimalPart.slice(0, 2)}`;
        }
        return val;
      })();
      updated[index] = { ...updated[index], [field]: nextValue };
      return updated;
    });
  };

  const saveSource = async (index: number) => {
    const source = editingSources[index];
    if (!source) return;

    // Don't save if empty
    if (!source.name.trim() && !source.value.trim()) {
      return;
    }

    if (!source.name.trim()) {
      toast.error(t('nameRequired') || 'Nome é obrigatório');
      return;
    }

    const value = parseCurrencyInput(source.value);
    if (value <= 0) {
      toast.error(t('valueRequired') || 'Valor deve ser maior que 0');
      return;
    }

    setLoading(true);
    let succeeded = false;
    try {
      if (source.isNew) {
        await onAdd(source.name.trim(), value);
        toast.success(t('incomeSourceAdded') || 'Fonte de renda adicionada');
      } else {
        await onUpdate(source.id, source.name.trim(), value);
        toast.success(t('incomeSourceUpdated') || 'Fonte de renda atualizada');
      }
      succeeded = true;
    } catch (error) {
      toast.error(t('errorSaving') || 'Erro ao salvar');
      console.error(error);
    } finally {
      setLoading(false);
      if (succeeded) {
        setActiveRowId(null);
      }
    }
  };

  const deleteLine = async (index: number, sourceId: string, isNew: boolean) => {
    // For existing items, ask for confirmation
    if (!isNew) {
      if (!window.confirm(t('confirmDelete') || 'Tem certeza?')) {
        return;
      }

      setLoading(true);
      try {
        await onDelete(sourceId);
        toast.success(t('incomeSourceDeleted') || 'Fonte de renda removida');
      } catch (error) {
        toast.error(t('errorDeleting') || 'Erro ao deletar');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    // Remove from editing sources
    setEditingSources((prev) => prev.filter((_, i) => i !== index));
    setActiveRowId((prev) => (prev === sourceId ? null : prev));
  };

  const cancelEdit = (index: number) => {
    setEditingSources((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;

      if (current.isNew) {
        updated.splice(index, 1);
        return updated;
      }

      const original = incomeSources.find((item) => item.id === current.id);
      if (original) {
        updated[index] = {
          id: original.id,
          name: original.name,
          value: formatCurrencyInput(original.value),
          isNew: false,
        };
      }
      return updated;
    });
    setActiveRowId(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveSource(index);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit(index);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-2xl flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle>
              {t('manageIncomeSources') || 'Fontes de Renda'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {t('incomeSourcesDescription') || 'Atualize os valores para manter o planejamento familiar preciso.'}
            </p>
          </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          {/* Total Income Display */}
          <div className="rounded-lg border border-border/80 bg-muted/10 p-4 shadow-sm">
            <div className="text-xs text-muted-foreground mb-1">{t('totalIncome') || 'Renda Total'}</div>
            <div className="text-xl font-semibold text-primary tracking-tight">
              {currencySymbol}
              {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('autoUpdatedHint') || 'Este valor é recalculado automaticamente conforme você salva as fontes.'}
            </p>
          </div>

          {/* Editable Income Sources List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{t('incomeSourcesList') || 'Fontes cadastradas'}</p>
                <p className="text-xs text-muted-foreground">
                  {t('incomeSourcesListHelper') || 'Toque em editar para alterar nome ou valor.'}
                </p>
              </div>
              <Badge variant="secondary" className="w-fit uppercase text-[10px]">
                {editingSources.length} {editingSources.length === 1 ? (t('source') || 'fonte') : (t('sources') || 'fontes')}
              </Badge>
            </div>

            <ScrollArea className="max-h-[55vh] pr-4">
              <div className="space-y-3 pb-2">
                {editingSources.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-4 text-center">
                    <p className="font-medium text-foreground">
                      {t('noIncomeSources') || 'Nenhuma fonte de renda adicionada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('addIncomeSourceHint') || 'Crie sua primeira fonte para distribuir a renda do mês.'}
                    </p>
                  </div>
                ) : (
                  editingSources.map((source, index) => {
                    const isEditing = activeRowId === source.id;
                    return (
                      <div
                        key={source.id}
                        className={`group flex items-center justify-between p-3 ${isEditing ? 'ring-1 ring-primary/40 bg-background' : 'bg-secondary/30 hover:bg-secondary/50'} rounded-lg transition-colors`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-3 w-full">
                            <Input
                              placeholder={t('name') || 'Nome'}
                              value={source.name}
                              onChange={(e) => updateSource(index, 'name', e.target.value)}
                              disabled={loading}
                              autoFocus
                              onKeyDown={(event) => handleKeyDown(event, index)}
                              className="flex-1 h-9 text-sm"
                            />
                            <div className="relative w-36">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {currencySymbol}
                              </span>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0,00"
                                value={source.value}
                                onChange={(e) => updateSource(index, 'value', e.target.value)}
                                disabled={loading}
                                className="pl-8 h-9 text-sm"
                                onKeyDown={(event) => handleKeyDown(event, index)}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => saveSource(index)}
                                disabled={loading}
                                className="gap-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cancelEdit(index)}
                                disabled={loading}
                                className="gap-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-sm text-foreground font-medium truncate">
                                {source.name || t('unnamedIncomeSource') || 'Sem nome'}
                              </span>
                              {source.isNew && (
                                <Badge variant="outline" className="bg-primary/5 text-primary text-xs">
                                  {t('draft') || 'Rascunho'}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                              <span className="text-sm text-foreground font-semibold tabular-nums">
                                {currencySymbol}
                                {source.value || '0,00'}
                              </span>

                              <div className="flex items-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setActiveRowId(source.id)}
                                  disabled={loading}
                                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title={t('edit') || 'Editar'}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLine(index, source.id, source.isNew)}
                                  disabled={loading}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  title={t('delete') || 'Excluir'}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Add New Line Button */}
            <div className="pt-2 flex justify-center">
              <Button
                onClick={addNewLine}
                disabled={loading}
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs h-8 px-2.5 sm:h-9 sm:px-3 sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t('addIncomeSource') || 'Adicionar Fonte'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
