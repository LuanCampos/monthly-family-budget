import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CATEGORIES, CategoryKey } from '@/types/budget';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface GoalsPanelProps {
  onEdit?: (percentages: Record<CategoryKey, number>) => void;
}

export const GoalsPanel = ({ onEdit }: GoalsPanelProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [percentages, setPercentages] = useState<Record<CategoryKey, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c.key, c.percentage])) as Record<CategoryKey, number>
  );

  const handleSave = () => {
    if (onEdit) {
      onEdit(percentages);
    }
    setIsEditing(false);
  };

  return (
    <div>
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex justify-between items-center">
            <span className="text-foreground">{cat.name}</span>
            <span className="text-foreground font-medium">{cat.percentage}%</span>
          </div>
        ))}
      </div>

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
            <DialogTitle className="text-foreground">Editar Metas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex items-center gap-4">
                <span className="text-foreground flex-1">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={percentages[cat.key]}
                    onChange={(e) => setPercentages(prev => ({
                      ...prev,
                      [cat.key]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-20 bg-secondary border-border text-foreground"
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Total: {Object.values(percentages).reduce((a, b) => a + b, 0)}%
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
