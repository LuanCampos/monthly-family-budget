import { useState } from 'react';
import { Plus, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Month } from '@/types/budget';

interface MonthSelectorProps {
  months: Month[];
  currentMonth: Month | null;
  onSelectMonth: (monthId: string) => void;
  onAddMonth: (year: number, month: number) => boolean;
  onRemoveMonth: (monthId: string) => void; // 👈 NOVO
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const MonthSelector = ({
  months,
  currentMonth,
  onSelectMonth,
  onAddMonth,
  onRemoveMonth,
}: MonthSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleAddMonth = () => {
    const success = onAddMonth(
      parseInt(selectedYear),
      parseInt(selectedMonth)
    );
    if (success) {
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentMonth ? (
        <>
          {/* Month selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 font-semibold">
                {currentMonth.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {months.map((month) => (
                <DropdownMenuItem
                  key={month.id}
                  onClick={() => onSelectMonth(month.id)}
                  className="cursor-pointer hover:bg-secondary"
                >
                  {month.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete month */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-card border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Excluir mês
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Tem certeza que deseja excluir o mês{' '}
                  <strong>{currentMonth.label}</strong>?  
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onRemoveMonth(currentMonth.id)}
                >
                  Excluir
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <span className="text-muted-foreground">Nenhum mês selecionado</span>
      )}

      {/* Add month */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="border-border hover:bg-secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Adicionar Mês
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mt-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MONTH_NAMES.map((name, index) => (
                  <SelectItem
                    key={index}
                    value={(index + 1).toString()}
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAddMonth}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Adicionar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
