import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const FamilySelector = () => {
  const { t } = useLanguage();
  const { families, currentFamily, selectFamily, createFamily, myPendingInvitations } = useFamily();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return;
    
    setIsCreating(true);
    const { error } = await createFamily(newFamilyName.trim());
    setIsCreating(false);

    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: t('success'),
        description: t('familyCreated')
      });
      setShowCreateDialog(false);
      setNewFamilyName('');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="max-w-[100px] truncate">{currentFamily?.name || t('selectFamily')}</span>
            <ChevronDown className="h-3 w-3" />
            {myPendingInvitations.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                {myPendingInvitations.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {families.map((family) => (
            <DropdownMenuItem
              key={family.id}
              onClick={() => selectFamily(family.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{family.name}</span>
              {family.id === currentFamily?.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          {families.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createNewFamily')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createNewFamily')}</DialogTitle>
            <DialogDescription>{t('createFamilyDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('familyName')}</label>
              <Input
                placeholder={t('familyNamePlaceholder')}
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                {t('cancel')}
              </Button>
              <Button onClick={handleCreateFamily} disabled={!newFamilyName.trim() || isCreating}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
