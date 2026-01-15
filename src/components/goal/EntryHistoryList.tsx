import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GoalEntry } from '@/types';
import { Pencil, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EntryHistoryListProps {
  entries: GoalEntry[];
  onEdit?: (entry: GoalEntry) => void;
  onDelete?: (entry: GoalEntry) => void;
}

export const EntryHistoryList = ({ entries, onEdit, onDelete }: EntryHistoryListProps) => {
  const { t } = useLanguage();
  const { formatCurrency } = useCurrency();

  if (!entries.length) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg bg-secondary/20">
        <p className="text-sm text-muted-foreground">{t('noEntries') || 'Nenhum lançamento'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
        {entries.map((entry) => {
          const isAutomatic = Boolean(entry.expenseId);
          return (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg group transition-colors">
              {/* Lado esquerdo */}
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-foreground font-semibold tabular-nums flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-primary" />
                    {formatCurrency(entry.value)}
                  </span>
                  <Badge variant={isAutomatic ? 'secondary' : 'default'} className="text-xs">
                    {isAutomatic ? (t('automaticEntry') || 'Automático') : (t('manualEntry') || 'Manual')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  {entry.description || (t('noDescription') || 'Sem descrição')}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{String(entry.month).padStart(2, '0')}/{entry.year}</span>
                </div>
              </div>
              
              {/* Lado direito - Ações */}
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {!isAutomatic && onEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(entry)}
                      aria-label={t('edit') || 'Editar'}
                      className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(entry)}
                      aria-label={t('delete') || 'Excluir'}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};
