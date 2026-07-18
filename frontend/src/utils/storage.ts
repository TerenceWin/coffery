const DB_KEY      = 'hanaCoffeeDB';
const SESSION_KEY = 'hanaCoffeeSession';
const CALLS_KEY   = 'hanaCoffeeCalls';

// ── Auth ─────────────────────────────────────────────────────────────────────

export function initDB() {
  if (localStorage.getItem(DB_KEY)) return;
  localStorage.setItem(DB_KEY, JSON.stringify({
    nextId: 10,
    users: {
      boss:     [{ id: 1, username: 'boss',     password: 'boss123',  name: 'Admin Boss' }],
      staff:    [{ id: 2, username: 'staff001', password: 'staff123', name: 'Staff 1' }],
      customer: [{ id: 3, username: 'user001',  password: 'user123',  name: 'Customer 1' }],
    },
  }));
}

export interface Session {
  id: number;
  username: string;
  name: string;
  role: string;
}

export function login(role: string, username: string, password: string): Session | null {
  const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
  const user = (db.users?.[role] || []).find(
    (u: { username: string; password: string }) => u.username === username && u.password === password,
  );
  if (!user) return null;
  const session: Session = { id: user.id, username: user.username, name: user.name, role };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Orders ────────────────────────────────────────────────────────────────────
// Backed by the Go backend's /transactions endpoints (see backend/controller/transaction*.go).
// localStorage is no longer used for orders - ORDERS_KEY is kept only so any
// stale data from before this change doesn't linger.

import api from '../services/api';
import { getEmoji } from './helpers';

export interface OrderItem {
  emoji: string;
  name: string;
  code: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  tableNum: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'cancelled' | 'paid';
  createdAt: string;
}

// Raw shape returned by the Go backend (backend/model/transaction.go).
// `items` comes back as a JSON-encoded string since the DB column is JSONB
// and the Go struct field is typed as `string`.
interface RawTransaction {
  id: number;
  tableNum: string;
  items: string;
  total: number;
  status: 'pending' | 'cancelled' | 'paid';
  createdBy: number;
  createdAt: string;
}

function parseTransaction(tx: RawTransaction): Order {
  let rawItems: { name: string; code: string; price: number; qty: number }[] = [];
  try {
    rawItems = JSON.parse(tx.items);
  } catch {
    rawItems = [];
  }
  return {
    id: String(tx.id),
    tableNum: tx.tableNum,
    items: rawItems.map(i => ({ ...i, emoji: getEmoji(i.name) })),
    total: tx.total,
    status: tx.status,
    createdAt: tx.createdAt,
  };
}

export async function getOrders(): Promise<Order[]> {
  const res = await api.get<RawTransaction[]>('/transactions');
  return (res.data ?? []).map(parseTransaction);
}

export async function placeOrder(tableNum: string, items: OrderItem[]): Promise<Order> {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const payload = {
    tableNum,
    items: items.map(i => ({ name: i.name, code: i.code, price: i.price, qty: i.qty })),
    total,
    createdBy: 0, // no real auth yet - placeholder until login is wired up
  };
  const res = await api.post<{ id: number }>('/transactions', payload);
  return {
    id: String(res.data.id),
    tableNum,
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function setOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await api.patch(`/transactions/${orderId}/status`, { status });
}

// ── Calls ─────────────────────────────────────────────────────────────────────

export interface Call {
  id: string;
  tableNum: string;
  createdAt: string;
  handled: boolean;
}

export function getCalls(): Call[] {
  return JSON.parse(localStorage.getItem(CALLS_KEY) || '[]');
}

export function callStaff(tableNum: string): boolean {
  const calls = getCalls();
  if (calls.find(c => c.tableNum === tableNum && !c.handled)) return false;
  calls.unshift({ id: 'call_' + Date.now(), tableNum, createdAt: new Date().toISOString(), handled: false });
  localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
  return true;
}

export function dismissCall(callId: string) {
  const calls = getCalls();
  const c = calls.find(x => x.id === callId);
  if (c) { c.handled = true; localStorage.setItem(CALLS_KEY, JSON.stringify(calls)); }
}