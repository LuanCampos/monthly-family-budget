import { useState } from 'react';
import { Plus, Trash2, Pencil, Tags, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CategoryKey, Subcategory } from '@/types';
import { CATEGORIES } from '@/constants/categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/i18n/translations/pt';
import { ConfirmDialog } from '@/components/common';
import { SubcategoryFormDialog } from './SubcategoryFormDialog';

interface SubcategoryListDialogProps {
  subcategories: Subcategory[];
  onAdd: (name: string, categoryKey: CategoryKey) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onRemove: (id: string) => void | Promise<void>;
}

export const SubcategoryListDialog = ({
  subcategories,
  onAdd,
  onUpdate,
  onRemove,
}: SubcategoryListDialogProps) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(
    new Set(CATEGORIES.map((c) => c.key))
  );

  const toggleCategory = (key: CategoryKey) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAdd = async (name: string, categoryKey: CategoryKey) => {
    await onAdd(name, categoryKey);
  };

  const handleEdit = async (name: string) => {
    if (editingSubcategory) {
      await onUpdate(editingSubcategory.id, name);
      setEditingSubcategory(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await onRemove(id);
    } finally {
      setDeletingId(null);
      setDeleteSubId(null);
    }
  };

  const openAddForm = () => {
    setEditingSubcategory(null);
    setIsFormOpen(true);
  };

  const openEditForm = (sub: Subcategory) => {
    setEditingSubcategory(sub);
    setIsFormOpen(true);
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
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Tags className="h-5 w-5 text-primary" />
              {t('manageSubcategories')}
            </DialogTitle>
          </DialogHeader>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              {groupedSubcategories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.key);
                return (
                  <Collapsible
                    key={cat.key}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(cat.key)}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {cat.translatedName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({cat.subcategories.length})
                        </span>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {cat.subcategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground ml-9 py-2">
                          {t('noSubcategories')}
                        </p>
                      ) : (
                        <div className="space-y-1.5 ml-6 mt-1.5">
                          {cat.subcategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2.5 bg-secondary/50 rounded-lg group"
                            >
                              <span className="text-sm text-foreground">
                                {sub.name}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditForm(sub)}
                                  className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  aria-label={t('edit')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteSubId(sub.id)}
                                  disabled={deletingId === sub.id}
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  aria-label={t('delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-secondary/30">
            <Button
              onClick={openAddForm}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addSubcategory')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SubcategoryFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        subcategory={editingSubcategory}
        onSave={editingSubcategory ? handleEdit : handleAdd}
      />

      <ConfirmDialog
        open={!!deleteSubId}
        onOpenChange={(open) => !open && setDeleteSubId(null)}
        onConfirm={() => deleteSubId && handleRemove(deleteSubId)}
        title={t('deleteSubcategory') || 'Excluir subcategoria?'}
        description={t('deleteSubcategoryWarning') || 'Esta ação não pode ser desfeita.'}
        variant="destructive"
        loading={!!deletingId}
      />
    </>
  );
};