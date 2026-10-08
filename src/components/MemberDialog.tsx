import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { useTrips } from '@/lib/trips';
import type { Member, Trip } from '@/lib/types';
import { uid } from '@/lib/utils';

interface Props {
  trip: Trip;
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberDialog({ trip, member, open, onOpenChange }: Props) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(member ? 'editMember' : 'addMember')}</DialogTitle>
        </DialogHeader>
        <MemberForm trip={trip} member={member} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MemberForm({ trip, member, onClose }: { trip: Trip; member: Member | null; onClose: () => void }) {
  const { t } = useI18n();
  const { saveTrip } = useTrips();
  const [name, setName] = useState(member?.name ?? '');
  const [people, setPeople] = useState(String(member?.people ?? 1));
  const [note, setNote] = useState(member?.note ?? '');

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const n = name.trim();
    if (!n) return toast.error(t('errName'));
    const next: Member = {
      id: member?.id ?? uid(),
      name: n,
      people: Math.max(1, Math.round(Number(people)) || 1),
      note: note.trim(),
      ...(member?.identityClaimed ? { identityClaimed: true } : {}),
      ...(member?.verification ? { verification: member.verification } : {}),
    };
    const members = member ? trip.members.map((m) => (m.id === next.id ? next : m)) : [...trip.members, next];
    await saveTrip({ ...trip, members }, t(member ? 'logMemEdit' : 'logMemAdd', n));
    onClose();
  }

  async function remove() {
    if (!member) return;
    const used =
      trip.expenses.some((e) => e.participants.includes(member.id) || e.payers.some((p) => p.memberId === member.id)) ||
      trip.payments.some((p) => p.from === member.id || p.to === member.id);
    if (used) return toast.error(t('memberInUse'));
    if (!confirm(t('confirmDel'))) return;
    await saveTrip({ ...trip, members: trip.members.filter((m) => m.id !== member.id) }, t('logMemDel', member.name));
    onClose();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t('name')}</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="space-y-1.5">
        <Label>{t('people')}</Label>
        <Input type="number" inputMode="numeric" min={1} value={people} onChange={(e) => setPeople(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t('peopleNote')}</Label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <DialogFooter className="justify-between">
        {member ? (
          <Button variant="destructive" onClick={remove}>
            <Trash2 /> {t('del')}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit">{t('save')}</Button>
      </DialogFooter>
    </form>
  );
}
