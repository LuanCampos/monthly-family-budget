import { Wifi, WifiOff, Cloud, Loader2 } from 'lucide-react';
import { useOnline } from '@/contexts/OnlineContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const OnlineStatusBar = () => {
  const { isOnline, isSyncing, pendingSyncCount, syncNow } = useOnline();
  const { t } = useLanguage();

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${
      isOnline ? 'bg-primary/90' : 'bg-amber-500/90'
    } text-white`}>
      {isOnline ? (
        <Wifi className="h-4 w-4" />
      ) : (
        <WifiOff className="h-4 w-4" />
      )}
      
      <span className="text-sm font-medium">
        {isOnline ? t('online') : t('offline')}
      </span>

      {pendingSyncCount > 0 && (
        <>
          <Badge variant="secondary" className="bg-white/20 text-white text-xs">
            {pendingSyncCount} {t('pendingChanges')}
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-white hover:bg-white/20"
              onClick={syncNow}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
