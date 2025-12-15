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
import { YearSelector } from '@/components/ui/year-selector';
import { Month } from '@/types/budget';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface MonthSelectorProps {
  months: Month[];
  currentMonth: Month | null;
  onSelectMonth: (monthId: string) => void;
  onAddMonth: (year: number, month: number) => boolean;
  onRemoveMonth: (monthId: string) => void;
}

const MONTH_KEYS = [
  'month-0', 'month-1', 'month-2', 'month-3', 'month-4', 'month-5',
  'month-6', 'month-7', 'month-8', 'month-9', 'month-10', 'month-11',
] as const;

export const MonthSelector = ({
  months,
  currentMonth,
  onSelectMonth,
  onAddMonth,
  onRemoveMonth,
}: MonthSelectorProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  const handleAddMonth = () => {
    const success = onAddMonth(
      parseInt(selectedYear),
      parseInt(selectedMonth)
    );
    if (success) {
      setIsDialogOpen(false);
    }
  };

  const getMonthLabel = (month: Month) => {
    const monthKey = `month-${month.month - 1}` as TranslationKey;
    return `${t(monthKey)} ${month.year}`;
  };

  return (
    <div className="flex items-center gap-2">
      {currentMonth ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 font-semibold">
                {getMonthLabel(currentMonth)}
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
                  {getMonthLabel(month)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

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
                  {t('deleteMonth')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  {t('deleteMonthConfirm')}{' '}
                  <strong>{getMonthLabel(currentMonth)}</strong>?{' '}
                  {t('deleteMonthWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => onRemoveMonth(currentMonth.id)}
                >
                  {t('delete')}
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <span className="text-muted-foreground">{t('noMonthSelected')}</span>
      )}

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
              {t('addMonth')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-4 mt-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {MONTH_KEYS.map((key, index) => (
                  <SelectItem
                    key={index}
                    value={(index + 1).toString()}
                  >
                    {t(key as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <YearSelector value={selectedYear} onValueChange={setSelectedYear} />
          </div>

          <Button
            onClick={handleAddMonth}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t('add')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
