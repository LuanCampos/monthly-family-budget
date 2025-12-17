import { useState } from 'react';
import { Plus, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  onAddMonth: (year: number, month: number) => boolean | Promise<boolean>;
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
}: MonthSelectorProps) => {
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );

  const handleAddMonth = async () => {
    const success = await onAddMonth(
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

  const getShortMonthLabel = (month: Month) => {
    const monthKey = `month-${month.month - 1}` as TranslationKey;
    const monthName = t(monthKey);
    return `${monthName.slice(0, 3)}/${month.year.toString().slice(-2)}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="h-9 sm:h-10 px-2.5 sm:px-4 bg-secondary/50 border-border hover:bg-secondary text-foreground font-medium text-sm"
          >
            <Calendar className="h-4 w-4 mr-1.5 sm:mr-2 text-primary" />
            {currentMonth ? (
              <>
                <span className="hidden sm:inline">{getMonthLabel(currentMonth)}</span>
                <span className="sm:hidden">{getShortMonthLabel(currentMonth)}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t('selectMonth')}</span>
            )}
            <ChevronDown className="ml-1.5 sm:ml-2 h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card border-border min-w-[180px]" align="end">
          {months.map((month) => (
            <DropdownMenuItem
              key={month.id}
              onClick={() => onSelectMonth(month.id)}
              className={`cursor-pointer hover:bg-secondary ${
                currentMonth?.id === month.id ? 'bg-secondary/50' : ''
              }`}
            >
              {getMonthLabel(month)}
            </DropdownMenuItem>
          ))}
          {months.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            onClick={() => setIsDialogOpen(true)}
            className="cursor-pointer hover:bg-secondary text-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('addMonth')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('addMonth')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="flex-1 bg-secondary border-border">
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
            className="mt-4 w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {t('add')}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
