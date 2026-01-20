import { useState, useEffect } from 'react';
import { Tags } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { CategoryKey, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface SubcategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subcategory?: Subcategory | null;
  defaultCategory?: CategoryKey;
  onSave: (name: string, categoryKey: CategoryKey) => void | Promise<void>;
}

export const SubcategoryFormDialog = ({
  open,
  onOpenChange,
  subcategory,
  defaultCategory = 'essenciais',
  onSave,
}: SubcategoryFormDialogProps) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [categoryKey, setCategoryKey] = useState<CategoryKey>(defaultCategory);
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!subcategory;

  useEffect(() => {
    if (open) {
      if (subcategory) {
        setName(subcategory.name);
        setCategoryKey(subcategory.categoryKey);
      } else {
        setName('');
        setCategoryKey(defaultCategory);
      }
    }
  }, [open, subcategory, defaultCategory]);

  const handleSave = async () => {
    if (!name.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(name.trim(), categoryKey);
      onOpenChange(false);
    } catch {
      // Error handling is done by the parent component via onSave
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Tags className="h-5 w-5 text-primary" />
            {isEditing ? t('editSubcategory') : t('addSubcategory')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="space-y-1.5">
              <Label htmlFor="subcategory-name" className="text-sm font-medium">{t('name')}</Label>
              <Input
                id="subcategory-name"
                placeholder={t('subcategoryName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 bg-secondary/50 border-border"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>

            {!isEditing && (
              <div className="space-y-1.5">
                <Label htmlFor="subcategory-category" className="text-sm font-medium">{t('category')}</Label>
                <Select
                  value={categoryKey}
                  onValueChange={(v) => setCategoryKey(v as CategoryKey)}
                >
                  <SelectTrigger
                    id="subcategory-category"
                    className="h-10 bg-secondary/50 border-border"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {t(cat.name as TranslationKey)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
