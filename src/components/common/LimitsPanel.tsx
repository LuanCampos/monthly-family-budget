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

interface LimitsPanelProps {
  percentages: Record<CategoryKey, number>;
  onEdit: (percentages: Record<CategoryKey, number>) => void | Promise<void>;
}

export const LimitsPanel = ({ percentages, onEdit }: LimitsPanelProps) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [localPercentages, setLocalPercentages] =
    useState<Record<CategoryKey, number>>(percentages);

  useEffect(() => {
    setLocalPercentages(percentages);
  }, [percentages]);

  const total = Object.values(localPercentages).reduce((a, b) => a + b, 0);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onEdit(localPercentages);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
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
            className="w-full h-9 gap-2 border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            {t('edit')}
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                <Edit2 className="h-5 w-5 text-primary" />
                {t('editLimits')}
              </DialogTitle>
              <span
                className={`text-sm font-semibold tabular-nums px-2 py-0.5 rounded-md mr-6 ${
                  total === 100
                    ? 'bg-success/20 text-success'
                    : total > 100
                    ? 'bg-destructive/20 text-destructive'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {total}%
              </span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-1.5">
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
                    className="w-16 h-8 text-right text-sm tabular-nums bg-secondary/50 border-border px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
          </div>

          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            <Button
              onClick={handleSave}
              disabled={isSaving || total !== 100}
              className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
