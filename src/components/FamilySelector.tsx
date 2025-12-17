import { useState } from 'react';
import { useFamily } from '@/contexts/FamilyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOnline } from '@/contexts/OnlineContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, ChevronDown, Plus, Check, Loader2, Cloud, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isOfflineId } from '@/lib/offlineStorage';

export const FamilySelector = () => {
  const { t } = useLanguage();
  const { families, currentFamily, selectFamily, createFamily } = useFamily();
  const { syncFamily, isSyncing, isOnline } = useOnline();
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const isCurrentOffline = currentFamily?.isOffline || isOfflineId(currentFamily?.id || '');

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) return;
    
    setIsCreating(true);
    const { error } = await createFamily(newFamilyName.trim());
    setIsCreating(false);

    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('success'), description: t('familyCreated') });
      setShowCreateDialog(false);
      setNewFamilyName('');
    }
  };

  const handleSyncFamily = async () => {
    if (!currentFamily) return;
    const { error } = await syncFamily(currentFamily.id);
    if (error) {
      toast({ title: t('error'), description: error.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline max-w-[120px] truncate">
              {currentFamily?.name || t('selectFamily')}
            </span>
            {isCurrentOffline && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-amber-500/20 text-amber-500">
                <WifiOff className="h-3 w-3" />
              </Badge>
            )}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {families.map((family) => (
            <DropdownMenuItem
              key={family.id}
              onClick={() => selectFamily(family.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{family.name}</span>
              <div className="flex items-center gap-1">
                {(family.isOffline || isOfflineId(family.id)) && (
                  <WifiOff className="h-3 w-3 text-amber-500" />
                )}
                {currentFamily?.id === family.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {isCurrentOffline && isOnline && (
            <DropdownMenuItem onClick={handleSyncFamily} disabled={isSyncing}>
              {isSyncing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4 mr-2" />
              )}
              {t('syncToCloud')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('createFamily')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>


      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('createFamily')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t('familyNamePlaceholder')}
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
            />
            <Button onClick={handleCreateFamily} disabled={isCreating || !newFamilyName.trim()} className="w-full">
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              {t('createFamily')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
