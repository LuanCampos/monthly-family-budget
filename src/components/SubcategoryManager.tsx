import { useState } from 'react';
import { Plus, Trash2, Pencil, Tags, X, Check } from 'lucide-react';
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
import { CategoryKey, Subcategory } from '@/types/budget';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface SubcategoryManagerProps {
  subcategories: Subcategory[];
  onAdd: (name: string, categoryKey: CategoryKey) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export const SubcategoryManager = ({
  subcategories,
  onAdd,
  onUpdate,
  onRemove,
}: SubcategoryManagerProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<CategoryKey>('essenciais');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName.trim(), newCategory);
    setNewName('');
  };

  const startEdit = (sub: Subcategory) => {
    setEditingId(sub.id);
    setEditingName(sub.name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      onUpdate(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const groupedSubcategories = CATEGORIES.map((cat) => ({
    ...cat,
    translatedName: t(cat.name as TranslationKey),
    subcategories: subcategories.filter((sub) => sub.categoryKey === cat.key),
  }));

  return (
    <>
      <Button
        variant="outline"
        className="border-border hover:bg-secondary"
        onClick={() => setIsOpen(true)}
      >
        <Tags className="h-4 w-4 mr-2" />
        {t('subcategories')} ({subcategories.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {t('manageSubcategories')}
            </DialogTitle>
          </DialogHeader>

          {/* Add new */}
          <div className="flex gap-2 mt-4">
            <Input
              placeholder={t('subcategoryName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-secondary border-border"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Select
              value={newCategory}
              onValueChange={(v) => setNewCategory(v as CategoryKey)}
            >
              <SelectTrigger className="w-40 bg-secondary border-border">
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
            <Button
              onClick={handleAdd}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-4">
            {groupedSubcategories.map((cat) => (
              <div key={cat.key}>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {cat.translatedName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({cat.subcategories.length})
                  </span>
                </div>

                {cat.subcategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground ml-5 mb-2">
                    {t('noSubcategories')}
                  </p>
                ) : (
                  <div className="space-y-1 ml-5">
                    {cat.subcategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg group"
                      >
                        {editingId === sub.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 bg-background border-border text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveEdit}
                              className="h-6 w-6 text-primary hover:bg-primary/10"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelEdit}
                              className="h-6 w-6 text-muted-foreground hover:bg-muted/10"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-foreground">
                              {sub.name}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEdit(sub)}
                                className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemove(sub.id)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
