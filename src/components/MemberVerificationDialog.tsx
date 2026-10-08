import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input, NativeSelect } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n';
import type { Member, Trip } from '@/lib/types';
import { sha256 } from '@/lib/utils';

interface Props {
  trip: Trip;
  open: boolean;
  onVerify: (memberId: string) => void;
  onRegister: (memberId: string, verification: NonNullable<Member['verification']>) => Promise<void>;
}

export function MemberVerificationDialog({ trip, open, onVerify, onRegister }: Props) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState(trip.members[0]?.id ?? '');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const member = trip.members.find((m) => m.id === selectedId) ?? trip.members[0];
  const isRegistered = !!member?.verification;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!member) return;
    const normalizedAnswer = answer.trim().normalize('NFKC').toLocaleLowerCase();
    if (!normalizedAnswer) return toast.error(t('securityAnswerRequired'));

    if (member.verification) {
      if ((await sha256(normalizedAnswer)) !== member.verification.answerHash) {
        return toast.error(t('wrongSecurityAnswer'));
      }
      onVerify(member.id);
      return;
    }

    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) return toast.error(t('securityAnswerRequired'));
    try {
      await onRegister(member.id, {
        question: normalizedQuestion,
        answerHash: await sha256(normalizedAnswer),
      });
      onVerify(member.id);
    } catch (error) {
      console.error('Không lưu được xác nhận thành viên:', error);
      toast.error(t('verificationSaveFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent onEscapeKeyDown={(event) => event.preventDefault()} onPointerDownOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('memberVerifyTitle')}</DialogTitle>
          <DialogDescription>{t('memberVerifyDescription')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="verify-member">{t('selectMember')}</Label>
            <NativeSelect
              id="verify-member"
              value={member?.id ?? ''}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setQuestion('');
                setAnswer('');
              }}
            >
              {trip.members.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {isRegistered ? (
            <div className="space-y-1.5">
              <Label>{t('securityQuestion')}</Label>
              <p className="rounded-md bg-muted px-3 py-2 text-sm">{member?.verification?.question}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="verify-question">{t('securityQuestion')}</Label>
              <Input
                id="verify-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                maxLength={120}
                required
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="verify-answer">{t('securityAnswer')}</Label>
            <Input
              id="verify-answer"
              type="password"
              autoComplete="off"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              maxLength={120}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">{t(isRegistered ? 'verify' : 'saveAndContinue')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
