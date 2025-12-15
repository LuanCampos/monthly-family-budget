import { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { CategoryKey } from '@/types/budget';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GoalsPanelProps {
  percentages: Record<CategoryKey, number>;
  onEdit: (percentages: Record<CategoryKey, number>) => void;
}

export const GoalsPanel = ({ percentages, onEdit }: GoalsPanelProps) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [localPercentages, setLocalPercentages] =
    useState<Record<CategoryKey, number>>(percentages);

  useEffect(() => {
    setLocalPercentages(percentages);
  }, [percentages]);

  const total = Object.values(localPercentages).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    onEdit(localPercentages);
    setIsEditing(false);
  };

  const handleInputChange = (key: CategoryKey, value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(100, Math.max(0, numValue));
    setLocalPercentages((prev) => ({
      ...prev,
      [key]: clampedValue,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-foreground text-sm">{t(cat.key as TranslationKey)}</span>
            </div>
            <span className="text-foreground font-semibold text-sm tabular-nums bg-secondary/50 px-2.5 py-1 rounded-md">
              {percentages[cat.key]}%
            </span>
          </div>
        ))}
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full h-9 border-border hover:bg-secondary"
          >
            <Edit2 className="h-3.5 w-3.5 mr-2" />
            {t('edit')}
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-foreground">
              {t('editGoals')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-foreground text-sm">{t(cat.key as TranslationKey)}</span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={localPercentages[cat.key]}
                    onChange={(e) => handleInputChange(cat.key, e.target.value)}
                    className="w-16 h-8 text-right text-sm tabular-nums bg-secondary/50 border-border"
                  />
                </div>

                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[localPercentages[cat.key]]}
                  onValueChange={([value]) =>
                    setLocalPercentages((prev) => ({
                      ...prev,
                      [cat.key]: value,
                    }))
                  }
                />
              </div>
            ))}

            <div className="pt-3 border-t border-border">
              <p
                className={`text-sm font-medium ${
                  total === 100
                    ? 'text-success'
                    : total > 100
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {t('total')}: {total}%
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            <Button
              onClick={handleSave}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
