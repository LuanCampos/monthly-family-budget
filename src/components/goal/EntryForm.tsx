import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface EntryFormProps {
  onSubmit: (data: { value: number; description: string; month: number; year: number }) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}

export const EntryForm = ({ onSubmit, onCancel, submitting }: EntryFormProps) => {
  const { t } = useLanguage();
  const now = new Date();
  const [value, setValue] = useState(0);
  const [description, setDescription] = useState('');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value) return;
    await onSubmit({ value, description, month, year });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <label className="text-sm font-medium">{t('entryValue')}</label>
        <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} required step="0.01" />
        <p className="text-xs text-muted-foreground">{t('entryValueHelp')}</p>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">{t('entryDescription')}</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('entryDescriptionPlaceholder')} required />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('entryMonth')}</label>
          <Input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} min={1} max={12} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('entryYear')}</label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={2000} max={2100} required />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} disabled={submitting}>
            {t('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
};
