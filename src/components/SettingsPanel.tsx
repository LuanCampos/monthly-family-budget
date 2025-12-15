import { Settings, Globe, Palette, Download, Upload, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme, themes, ThemeKey } from '@/contexts/ThemeContext';
import { languages, Language } from '@/i18n';
import { TranslationKey } from '@/i18n/translations/pt';

interface SettingsPanelProps {
  onExport?: () => void;
  onImport?: (file: File) => void;
  currentMonthLabel?: string;
  onDeleteMonth?: () => void;
}

export const SettingsPanel = ({ onExport, onImport, currentMonthLabel, onDeleteMonth }: SettingsPanelProps) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onImport) {
        onImport(file);
      }
    };
    input.click();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {t('language')}
            </Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="h-10 bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Palette className="h-4 w-4 text-muted-foreground" />
              {t('theme')}
            </Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeKey)}>
              <SelectTrigger className="h-10 bg-secondary/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {themes.map((themeOption) => (
                  <SelectItem key={themeOption.key} value={themeOption.key}>
                    {t(themeOption.labelKey as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Backup Section */}
          {(onExport || onImport) && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  {t('backup')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('backupDescription')}
                </p>
                <div className="flex gap-2">
                  {onImport && (
                    <Button
                      variant="outline"
                      className="flex-1 h-10 border-border hover:bg-secondary"
                      onClick={handleImportClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('importBackup')}
                    </Button>
                  )}
                  {onExport && (
                    <Button
                      variant="outline"
                      className="flex-1 h-10 border-border hover:bg-secondary"
                      onClick={onExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t('exportBackup')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Delete Current Month */}
          {onDeleteMonth && currentMonthLabel && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                  {t('deleteCurrentMonth')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t('deleteCurrentMonthDescription')}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-10 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('delete')} "{currentMonthLabel}"
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('deleteMonth')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('deleteMonthConfirm')} <strong>{currentMonthLabel}</strong>? {t('deleteMonthWarning')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-10">{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={onDeleteMonth}
                      >
                        {t('delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
