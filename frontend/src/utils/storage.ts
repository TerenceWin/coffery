const DB_KEY      = 'hanaCoffeeDB';
const SESSION_KEY = 'hanaCoffeeSession';
const ORDERS_KEY  = 'hanaCoffeeOrders';
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

export function getOrders(): Order[] {
  return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
}

export function placeOrder(tableNum: string, items: OrderItem[]): Order {
  const orders = getOrders();
  const total  = items.reduce((s, i) => s + i.price * i.qty, 0);
  const order: Order = {
    id: 'ord_' + Date.now(),
    tableNum,
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  return order;
}

export function setOrderStatus(orderId: string, status: Order['status']) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (o) { o.status = status; localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
  return o;
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
