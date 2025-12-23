import { useState } from 'react';
import { Plus, Trash2, Pencil, Tags, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryKey, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';

interface SubcategoryManagerProps {
  subcategories: Subcategory[];
  onAdd: (name: string, categoryKey: CategoryKey) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
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

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await onAdd(newName.trim(), newCategory);
    setNewName('');
  };

  const startEdit = (sub: Subcategory) => {
    setEditingId(sub.id);
    setEditingName(sub.name);
  };

  const saveEdit = async () => {
    if (editingId && editingName.trim()) {
      await onUpdate(editingId, editingName.trim());
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
        size="sm"
        className="border-border hover:bg-secondary text-xs h-8 px-2 xs:px-2.5 sm:h-9 sm:px-3 sm:text-sm"
        onClick={() => setIsOpen(true)}
      >
        <Tags className="h-3.5 w-3.5 xs:mr-1.5" />
        <span className="hidden xs:inline">{t('subcategories')}</span>
        <span className="hidden xs:inline ml-1 text-muted-foreground">({subcategories.length})</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle>{t('manageSubcategories')}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t('addSubcategory')}
            </DialogDescription>
          </DialogHeader>

          {/* Add new form */}
          <div className="px-6 py-4 border-b border-border bg-secondary/30">
            <div className="flex gap-2">
              <Input
                placeholder={t('subcategoryName')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10 bg-background border-border flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as CategoryKey)}
              >
                <SelectTrigger className="w-36 h-10 bg-background border-border">
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
                className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 flex-shrink-0"
                aria-label={t('addSubcategory')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {groupedSubcategories.map((cat) => (
                <div key={cat.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
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
                    <p className="text-xs text-muted-foreground ml-5">
                      {t('noSubcategories')}
                    </p>
                  ) : (
                    <div className="space-y-1.5 ml-5">
                      {cat.subcategories.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg group"
                        >
                          {editingId === sub.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-8 bg-background border-border text-sm"
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
                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                aria-label={t('save')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={cancelEdit}
                                className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                aria-label={t('cancel')}
                              >
                                <X className="h-4 w-4" />
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
                                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  aria-label={t('edit')}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => onRemove(sub.id)}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  aria-label={t('delete')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};