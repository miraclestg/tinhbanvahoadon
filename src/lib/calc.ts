import type { Expense, Member, Trip } from './types';

export const fmt = (n: number): string =>
  new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + ' ₫';

/** Số tiền mỗi thành viên/hộ phải chịu cho 1 khoản chi */
export function owedOf(exp: Expense, members: Member[]): Record<string, number> {
  const out: Record<string, number> = {};
  const ids = exp.participants || [];
  if (exp.mode === 'custom') {
    ids.forEach((id) => (out[id] = Number(exp.custom?.[id]) || 0));
    return out;
  }
  const weight = (id: string) =>
    exp.mode === 'perHead' ? members.find((m) => m.id === id)?.people || 1 : 1;
  const total = ids.reduce((s, id) => s + weight(id), 0) || 1;
  ids.forEach((id) => (out[id] = (Number(exp.amount) * weight(id)) / total));
  return out;
}

/** Số dư ròng: dương = được nhận lại, âm = đang nợ */
export function computeNet(trip: Trip): Record<string, number> {
  const net: Record<string, number> = {};
  trip.members.forEach((m) => (net[m.id] = 0));
  for (const e of trip.expenses) {
    for (const p of e.payers || []) if (p.memberId in net) net[p.memberId] += Number(p.amount) || 0;
    for (const [id, v] of Object.entries(owedOf(e, trip.members))) if (id in net) net[id] -= v;
  }
  for (const p of trip.payments || []) {
    if (p.from in net) net[p.from] += Number(p.amount) || 0;
    if (p.to in net) net[p.to] -= Number(p.amount) || 0;
  }
  return net;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/** Rút gọn thành ít lần chuyển khoản nhất */
export function settle(net: Record<string, number>): Transfer[] {
  const cr: [string, number][] = [];
  const de: [string, number][] = [];
  for (const [id, v] of Object.entries(net)) {
    if (v > 1) cr.push([id, v]);
    else if (v < -1) de.push([id, -v]);
  }
  cr.sort((a, b) => b[1] - a[1]);
  de.sort((a, b) => b[1] - a[1]);
  const out: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < de.length && j < cr.length) {
    const a = Math.min(de[i][1], cr[j][1]);
    out.push({ from: de[i][0], to: cr[j][0], amount: a });
    de[i][1] -= a;
    cr[j][1] -= a;
    if (de[i][1] < 1) i++;
    if (cr[j][1] < 1) j++;
  }
  return out;
}

/** Giữ các khoản nợ ngược chiều riêng biệt thay vì bù trừ trên số dư toàn chuyến. */
export function computeTransfers(trip: Trip): Transfer[] {
  const debts = new Map<string, Map<string, number>>();
  const addDebt = (from: string, to: string, amount: number) => {
    const toMap = debts.get(from) ?? new Map<string, number>();
    toMap.set(to, (toMap.get(to) ?? 0) + amount);
    debts.set(from, toMap);
  };

  for (const expense of trip.expenses) {
    const net: Record<string, number> = {};
    trip.members.forEach((member) => (net[member.id] = 0));
    for (const payer of expense.payers || []) {
      if (payer.memberId in net) net[payer.memberId] += Number(payer.amount) || 0;
    }
    for (const [id, amount] of Object.entries(owedOf(expense, trip.members))) {
      if (id in net) net[id] -= amount;
    }
    for (const transfer of settle(net)) addDebt(transfer.from, transfer.to, transfer.amount);
  }

  for (const payment of trip.payments || []) {
    let remaining = Number(payment.amount) || 0;
    const directDebt = debts.get(payment.from)?.get(payment.to) ?? 0;
    const paid = Math.min(directDebt, remaining);
    if (paid > 0) {
      debts.get(payment.from)?.set(payment.to, directDebt - paid);
      remaining -= paid;
    }
    if (remaining > 0) addDebt(payment.to, payment.from, remaining);
  }

  return Array.from(debts, ([from, toMap]) =>
    Array.from(toMap, ([to, amount]) => ({ from, to, amount }))
  )
    .flat()
    .filter((transfer) => transfer.amount > 1);
}

export interface Stats {
  total: number;
  byCat: Record<string, number>;
  paid: Record<string, number>;
  owed: Record<string, number>;
}

export function stats(trip: Trip): Stats {
  const total = trip.expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const byCat: Record<string, number> = {};
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};
  trip.members.forEach((m) => {
    paid[m.id] = 0;
    owed[m.id] = 0;
  });
  for (const e of trip.expenses) {
    byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0);
    for (const p of e.payers || []) if (p.memberId in paid) paid[p.memberId] += Number(p.amount) || 0;
    for (const [id, v] of Object.entries(owedOf(e, trip.members))) if (id in owed) owed[id] += v;
  }
  return { total, byCat, paid, owed };
}
