const SESSION_KEY = 'hanaCoffeeSession';
const TOKEN_KEY    = 'token'; // matches the key api.ts already reads for Authorization headers
const CALLS_KEY   = 'hanaCoffeeCalls';

// ── Auth ─────────────────────────────────────────────────────────────────────
// Backed by the Go backend's /auth/login and /auth/logout endpoints
// (see backend/controller/authRouter.go and backend/auth/*.go).

import api from '../services/api';

export interface Session {
  id: number;
  username: string;
  name: string;
  role: string;
}

// Returns the session on success, or null if the credentials were wrong.
// Throws only on a genuine network/server failure (backend unreachable, etc).
export async function login(role: string, username: string, password: string): Promise<Session | null> {
  try {
    const res = await api.post<{ token: string; user: Session }>('/auth/login', { role, username, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(res.data.user));
    return res.data.user;
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 401) return null; // wrong username/password/role
    throw err; // genuine network/server error - let the caller show a different message
  }
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Calls the backend to revoke the current token (so it can't be reused
// even if it leaked), then clears local state regardless of whether that
// call succeeds - you should always end up logged out client-side.
export async function clearSession(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Token may already be expired/invalid - that's fine, we're logging
    // out either way. Don't block the user on this.
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
}

// Changes the currently logged-in user's own password. Throws with the
// backend's error message (e.g. "Current password is incorrect") on failure.
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await api.patch('/auth/password', { oldPassword, newPassword });
}

// ── Accounts (boss-only) ──────────────────────────────────────────────────────
// Backed by /users - see backend/controller/authenticationController/userRouter.go

export interface Account {
  id: number;
  username: string;
  role: 'boss' | 'staff';
  name: string;
}

export async function getAccounts(): Promise<Account[]> {
  const res = await api.get<Account[]>('/users');
  return res.data ?? [];
}

export async function createAccount(username: string, password: string, role: 'boss' | 'staff', name: string): Promise<void> {
  await api.post('/users', { username, password, role, name });
}

export async function deleteAccount(id: number): Promise<void> {
  await api.delete(`/users/${id}`);
}

// ── Orders ────────────────────────────────────────────────────────────────────
// Backed by the Go backend's /transactions endpoints (see backend/controller/transaction*.go).

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