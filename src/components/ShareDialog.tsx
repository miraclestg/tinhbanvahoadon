import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripName: string;
  editKey?: string;
}

export function ShareDialog({ open, onOpenChange, tripId, tripName, editKey }: Props) {
  const { t } = useI18n();
  const base = location.href.split('#')[0];
  const viewLink = `${base}#/t/${tripId}`;
  const editLink = editKey ? `${base}#/t/${tripId}/${editKey}` : '';

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success(t('copied'));
  }

  const LinkRow = ({ label, url }: { label: string; url: string }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <Button variant="outline" size="sm" onClick={() => copy(url)}>
        <Copy /> {t('copy')}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <LinkRow label={t('shareView')} url={viewLink} />
          {editLink && <LinkRow label={t('shareEdit')} url={editLink} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
