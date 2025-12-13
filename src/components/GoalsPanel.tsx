import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { CATEGORIES, CategoryKey } from '@/types/budget';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface GoalsPanelProps {
  onEdit?: (percentages: Record<CategoryKey, number>) => void;
}

export const GoalsPanel = ({ onEdit }: GoalsPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const [percentages, setPercentages] = useState<Record<CategoryKey, number>>(
    Object.fromEntries(
      CATEGORIES.map((c) => [c.key, c.percentage])
    ) as Record<CategoryKey, number>
  );

  const total = Object.values(percentages).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    onEdit?.(percentages);
    setIsEditing(false);
  };

  return (
    <div>
      {/* Read-only view */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex justify-between items-center">
            <span className="text-foreground">{cat.name}</span>
            <span className="text-foreground font-medium">
              {cat.percentage}%
            </span>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-6 w-full border-border hover:bg-secondary"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </DialogTrigger>

        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Editar Metas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground">{cat.name}</span>
                  <span className="text-foreground font-medium">
                    {percentages[cat.key]}%
                  </span>
                </div>

                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[percentages[cat.key]]}
                  onValueChange={([value]) =>
                    setPercentages((prev) => ({
                      ...prev,
                      [cat.key]: value,
                    }))
                  }
                />
              </div>
            ))}

            <p
              className={`text-sm font-medium ${
                total === 100
                  ? 'text-success'
                  : total > 100
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              Total: {total}%
            </p>

            <Button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
