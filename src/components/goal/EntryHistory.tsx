import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GoalEntry } from '@/types';
import { Pencil, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

interface EntryHistoryProps {
  entries: GoalEntry[];
  onEdit?: (entry: GoalEntry) => void;
  onDelete?: (entry: GoalEntry) => void;
}

export const EntryHistory = ({ entries, onEdit, onDelete }: EntryHistoryProps) => {
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
    <div className="space-y-3 pr-2">
        {entries.map((entry) => {
          const isAutomatic = Boolean(entry.expenseId);
          return (
            <div key={entry.id} className="border rounded-lg p-3 sm:p-4 space-y-2 bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-base flex items-center gap-1.5">
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
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{String(entry.month).padStart(2, '0')}/{entry.year}</span>
                  </div>
                </div>
                
                {!isAutomatic && (onEdit || onDelete) && (
                  <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                    {onEdit && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(entry)}
                        className="gap-1.5 h-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t('edit') || 'Editar'}</span>
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => onDelete(entry)}
                        className="gap-1.5 h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">{t('delete') || 'Excluir'}</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};
