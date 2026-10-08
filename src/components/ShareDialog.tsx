import { Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import * as S from '@/lib/store';

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

  async function share(url: string) {
    if (navigator.share) {
      try {
        await navigator.share({ title: tripName, url });
        return;
      } catch {
        /* người dùng hủy */
      }
    }
    await copy(url);
  }

  const LinkRow = ({ label, url }: { label: string; url: string }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => copy(url)}>
          <Copy /> {t('copy')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => share(url)}>
          <Share2 /> {t('share')}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('share')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {!S.cloudOn() && <p className="text-sm font-medium text-destructive">{t('noCloud')}</p>}
          <LinkRow label={t('shareView')} url={viewLink} />
          {editLink && <LinkRow label={t('shareEdit')} url={editLink} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
