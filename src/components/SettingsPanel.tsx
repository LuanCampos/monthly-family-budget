import { Settings, Globe, Palette, Download, Upload, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
}

export const SettingsPanel = ({ onExport, onImport }: SettingsPanelProps) => {
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
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">{t('settings')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings')}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language')}
            </Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {t('theme')}
            </Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as ThemeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              <Separator />
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {t('backup')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('backupDescription')}
                </p>
                <div className="flex gap-2">
                  {onImport && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleImportClick}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('importBackup')}
                    </Button>
                  )}
                  {onExport && (
                    <Button
                      variant="outline"
                      className="flex-1"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
