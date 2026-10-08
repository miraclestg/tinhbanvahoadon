import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, NativeSelect } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import { useTrips } from '@/lib/trips';
import type { Member } from '@/lib/types';
import { uid } from '@/lib/utils';

/** Mỗi dòng 1 người/hộ. "Gia đình An x3" = hộ 3 người */
export function parseMembers(text: string): Member[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const m = l.match(/^(.*?)\s*[x×*]\s*(\d+)$/i);
      return { id: uid(), name: (m ? m[1] : l).trim(), people: m ? Math.max(1, Number(m[2])) : 1, note: '' };
    });
}

export function CreateTripDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('newTrip')}</DialogTitle>
        </DialogHeader>
        <CreateForm onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CreateForm({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { createTrip } = useTrips();
  const [name, setName] = useState('');
  const [members, setMembers] = useState(['']);
  const [creatorMemberIndex, setCreatorMemberIndex] = useState('');
  const creatorOptions = members
    .map((member, index) => ({ index, name: member.trim() }))
    .filter((member) => member.name);
  const selectedCreatorIndex = creatorOptions.some((member) => String(member.index) === creatorMemberIndex)
    ? creatorMemberIndex
    : String(creatorOptions[0]?.index ?? '');

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const n = name.trim();
    if (!n) return toast.error(t('errName'));
    const tripMembers = parseMembers(members.join('\n'));
    const creatorOptionIndex = creatorOptions.findIndex((member) => String(member.index) === selectedCreatorIndex);
    const creator = creatorOptionIndex >= 0 ? tripMembers[creatorOptionIndex] : undefined;
    const id = await createTrip(n, tripMembers, t('logTripNew', n));
    if (creator) {
      try {
        localStorage.setItem(`verified-member:${id}`, creator.id);
      } catch (error) {
        console.error('Không lưu được thành viên người tạo trên thiết bị:', error);
        toast.error(t('identitySaveFailed'));
      }
    }
    onClose();
    location.hash = `#/t/${id}`;
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t('tripName')}</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t('membersLines')}</Label>
        <div className="space-y-2">
          {members.map((member, index) => (
            <Input
              key={index}
              aria-label={`${t('name')} ${index + 1}`}
              placeholder={`${t('name')} ${index + 1}`}
              value={member}
              onChange={(e) =>
                setMembers((current) => current.map((value, i) => (i === index ? e.target.value : value)))
              }
            />
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setMembers((current) => [...current, ''])}>
          <Plus /> {t('addMember')}
        </Button>
        {creatorOptions.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="creator-member">{t('creatorMember')}</Label>
            <NativeSelect
              id="creator-member"
              value={selectedCreatorIndex}
              onChange={(event) => setCreatorMemberIndex(event.target.value)}
            >
              {creatorOptions.map((member) => (
                <option key={member.index} value={member.index}>
                  {member.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="submit">{t('create')}</Button>
      </DialogFooter>
    </form>
  );
}
