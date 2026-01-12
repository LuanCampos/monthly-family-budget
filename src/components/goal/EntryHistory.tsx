import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GoalEntry } from '@/types';

interface EntryHistoryProps {
  entries: GoalEntry[];
  onEdit?: (entry: GoalEntry) => void;
  onDelete?: (entry: GoalEntry) => void;
}

export const EntryHistory = ({ entries, onEdit, onDelete }: EntryHistoryProps) => {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">Nenhum lançamento</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {entries.map((entry) => {
        const isAutomatic = Boolean(entry.expenseId);
        return (
          <div key={entry.id} className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{entry.value.toLocaleString(undefined, { style: 'currency', currency: 'BRL' })}</span>
                  <Badge variant={isAutomatic ? 'secondary' : 'default'}>
                    {isAutomatic ? 'Automático' : 'Manual'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{entry.description || 'Sem descrição'}</p>
                <p className="text-xs text-muted-foreground">{String(entry.month).padStart(2, '0')}/{entry.year}</p>
              </div>
              {!isAutomatic && (
                <div className="flex gap-2">
                  {onEdit && <Button variant="outline" size="sm" onClick={() => onEdit(entry)}>Editar</Button>}
                  {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(entry)}>Excluir</Button>}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
