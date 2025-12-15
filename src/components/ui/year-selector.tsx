import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface YearSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export const YearSelector = ({ value, onValueChange, className }: YearSelectorProps) => {
  const currentYear = new Date().getFullYear();
  const [centerYear, setCenterYear] = useState(currentYear);

  // Generate 5 years centered around centerYear (2 before, current, 2 after)
  const years = Array.from({ length: 5 }, (_, i) => centerYear - 2 + i);

  const handleExpandEarlier = () => {
    setCenterYear(prev => prev - 5);
  };

  const handleExpandLater = () => {
    setCenterYear(prev => prev + 5);
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className || "bg-secondary border-border"}>
        <SelectValue placeholder="Selecione..." />
      </SelectTrigger>
      <SelectContent className="bg-card border-border">
        <div className="flex items-center justify-between px-2 py-1 border-b border-border mb-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExpandEarlier();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {years[0]} - {years[years.length - 1]}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleExpandLater();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {years.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
