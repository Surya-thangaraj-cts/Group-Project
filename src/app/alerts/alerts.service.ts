import { Injectable } from '@angular/core';

export type RuleType = 'HIGH_VALUE' | 'VELOCITY' | 'SUSPENDED_ACTIVITY';

export interface Transaction {
  id: string;
  amount: number;
  currency: 'INR' | string;
  timestamp: string; // ISO
  channel?: string;
  location?: string;
  senderAccountId: string;
  receiverAccountId?: string;
  merchantName?: string;
  paymentMethod?: string;
  notes?: string;
  // Optional friendly fields for UI
  customerName?: string;
  type?: 'Deposit' | 'Withdrawal' | 'Transfer';
}

export interface Alert {
  id: string;
  rule: RuleType;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  severity: 'medium' | 'high' | 'critical';
  transactions: Transaction[];
  primaryTransactionId?: string;
  flaggedAccountId?: string;
  riskScore: number; // 0-100
  labels: string[];
  reviewerId?: string;
  decision?: 'suspicion'|'identity_theft'|'structuring'|'safe'|'other'|null;
  decisionReason?: string | null;
  decisionComment?: string | null;
  suspendedUntil?: string | null;
  createdAt: string;
  lastUpdatedAt: string;
  audit?: string[];
}

export interface AlertsConfig {
  amountThresholdInr: number;
  velocity: { windowMinutes: number; minTxCount: number };
  highValueBurst?: { windowMinutes: number; minTxCount: number };
}

const STORAGE_KEY_ALERTS = 'app_alerts_v1';
const STORAGE_KEY_TX = 'app_tx_v1';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private alerts: Alert[] = [];
  private transactions: Transaction[] = [];
  config: AlertsConfig = {
    amountThresholdInr: 10000,
    velocity: { windowMinutes: 3, minTxCount: 5 },
    highValueBurst: { windowMinutes: 10, minTxCount: 2 }
  };

  constructor() {
    this.load();
  }

  // expose config for UI decisions
  getConfig(): AlertsConfig { return this.config; }

  private nowIso() { return new Date().toISOString(); }

  private save() {
    localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(this.alerts));
    localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(this.transactions));
  }

  private load() {
    const a = localStorage.getItem(STORAGE_KEY_ALERTS);
    const t = localStorage.getItem(STORAGE_KEY_TX);
    if (a) this.alerts = JSON.parse(a) as Alert[];
    if (t) this.transactions = JSON.parse(t) as Transaction[];
    // seed some tx if none
    if (!t || this.transactions.length < 8) {
      this.seedTransactions();
    }
    if (!a || this.alerts.length === 0) {
      // ensure alerts are generated from existing transactions for demo
      this.seedAlertsFromTransactions();
    }
    if (!a) this.alerts = this.alerts || [];
    this.save();
  }

  seedTransactions() {
    const now = Date.now();
    // create a mix of transactions including a burst for demo
    for (let i = 0; i < 8; i++) {
      const amt = (i % 3 === 0) ? 15000 + i * 100 : 2000 + i * 100; // some high
      const tx: Transaction = {
        id: `TX-${now}-${i}`,
        amount: amt,
        currency: 'INR',
        timestamp: new Date(now - i * 60000).toISOString(),
        channel: i % 2 === 0 ? 'UPI' : 'Card',
        location: 'City ' + (i % 3 + 1),
        senderAccountId: `ACCT${1000 + (i % 4)}`,
        receiverAccountId: `RECV${2000 + i}`,
        merchantName: `Merchant ${i}`,
        paymentMethod: i % 2 === 0 ? 'Mobile' : 'Card',
        notes: '',
        customerName: `Customer ${1000 + (i % 4)}`,
        type: (i % 3 === 0) ? 'Transfer' : 'Deposit'
      };
      this.transactions.push(tx);
    }

    // create a burst of high-value transactions from a single sender to trigger velocity
    const burstAccount = 'ACCT_BURST_1';
    for (let j = 0; j < 6; j++) {
      const tx: Transaction = {
        id: `TX-BURST-${now}-${j}`,
        amount: 12000 + j * 50,
        currency: 'INR',
        timestamp: new Date(now - j * 20000).toISOString(),
        channel: 'UPI',
        location: 'MetroCity',
        senderAccountId: burstAccount,
        receiverAccountId: `RECV-B-${j}`,
        merchantName: `Burst Merchant`,
        paymentMethod: 'Mobile',
        notes: 'Demo burst Tx',
        customerName: 'Burst Customer',
        type: 'Transfer'
      };
      this.transactions.unshift(tx);
    }
  }

  /** Create a suspension alert when an account is flagged/suspended */
  createSuspensionAlert(accountId: string, txs: Transaction[], reason: string, untilIso: string, by = 'manager-demo') {
    const alert = this.makeAlert('SUSPENDED_ACTIVITY' as RuleType, 'high', txs, accountId);
    alert.labels = ['suspension'];
    alert.decision = 'suspicion';
    alert.decisionComment = reason;
    alert.suspendedUntil = untilIso;
    alert.audit = [...(alert.audit||[]), `Suspended until ${untilIso} by ${by}: ${reason}`];
    this.appendOrCreateAlert(alert);
  }

  private seedAlertsFromTransactions() {
    // Build alerts from existing transactions (idempotent with appendOrCreate)
    for (const tx of this.transactions.slice().reverse()) {
      try {
        this.evaluateRulesForTx(tx);
      } catch (err) {
        // ignore
      }
    }
  }

  getTransactions(): Transaction[] { return [...this.transactions]; }

  /** Return all transactions above the configured high-value threshold */
  getHighValueTransactions(): Transaction[] {
    const thr = this.config.amountThresholdInr || 10000;
    return this.transactions.filter(t => t.amount > thr);
  }

  /** Return alerts filtered by rule */
  getAlertsByRule(rule: RuleType): Alert[] {
    return this.alerts.filter(a => a.rule === rule);
  }

  private recentHighValueTxsForSender(senderAccountId: string, windowMinutes?: number): Transaction[] {
    const windowMs = (windowMinutes || this.config.highValueBurst?.windowMinutes || 10) * 60000;
    const cutoff = Date.now() - windowMs;
    return this.transactions.filter(t => t.senderAccountId === senderAccountId && t.amount > (this.config.amountThresholdInr || 10000) && new Date(t.timestamp).getTime() >= cutoff);
  }

  addTransaction(tx: Transaction) {
    this.transactions.unshift(tx);
    this.save();
    // evaluate rules for this transaction
    this.evaluateRulesForTx(tx);
  }

  // Basic alert creation helpers
  private makeAlert(rule: RuleType, severity: Alert['severity'], txs: Transaction[], flaggedAccountId?: string): Alert {
    const id = `AL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*900)}`;
    const a: Alert = {
      id,
      rule,
      status: 'open',
      severity,
      transactions: [...txs],
      primaryTransactionId: txs[0]?.id,
      flaggedAccountId: flaggedAccountId || txs[0]?.senderAccountId,
      riskScore: this.estimateRiskScore(rule, txs),
      labels: [],
      createdAt: this.nowIso(),
      lastUpdatedAt: this.nowIso(),
      audit: []
    };
    return a;
  }

  private estimateRiskScore(rule: RuleType, txs: Transaction[]): number {
    // naive heuristic: base on amount and velocity
    const maxAmt = Math.max(...txs.map(t=>t.amount));
    const amtScore = Math.min(60, Math.floor((maxAmt / (this.config.amountThresholdInr || 10000)) * 60));
    const velocityScore = rule === 'VELOCITY' ? Math.min(40, txs.length * 8) : 0;
    const score = Math.min(100, amtScore + velocityScore);
    return score;
  }

  // deduplicate: if open alert exists for same account+rule within window, append
  private appendOrCreateAlert(alert: Alert) {
    const existing = this.alerts.find(a => a.rule === alert.rule && a.flaggedAccountId === alert.flaggedAccountId && a.status === 'open');
    if (existing) {
      existing.transactions = [...alert.transactions, ...existing.transactions];
      existing.lastUpdatedAt = this.nowIso();
      existing.riskScore = this.estimateRiskScore(alert.rule, existing.transactions);
      existing.audit = [...(existing.audit||[]), `Appended ${alert.transactions.length} tx at ${this.nowIso()}`];
    } else {
      this.alerts.unshift(alert);
    }
    this.save();
  }

  evaluateRulesForTx(tx: Transaction) {
    // High value
    if (tx.amount > (this.config.amountThresholdInr || 10000)) {
      const single = this.makeAlert('HIGH_VALUE','high',[tx], tx.senderAccountId);
      this.appendOrCreateAlert(single);

      // Also check for a burst of high-value txs from same sender within a short window
      const burst = this.recentHighValueTxsForSender(tx.senderAccountId, this.config.highValueBurst?.windowMinutes);
      if (burst.length >= (this.config.highValueBurst?.minTxCount || 2)) {
        // create/append a critical high-value grouped alert
        const grouped = this.makeAlert('HIGH_VALUE','critical', burst, tx.senderAccountId);
        this.appendOrCreateAlert(grouped);
      }
    }

    // Velocity: find recent txs from same sender within window
    const windowMs = (this.config.velocity.windowMinutes||3)*60000;
    const cutoff = Date.now() - windowMs;
    const recent = this.transactions.filter(t => t.senderAccountId === tx.senderAccountId && new Date(t.timestamp).getTime() >= cutoff);
    if (recent.length >= (this.config.velocity.minTxCount||5)) {
      const a = this.makeAlert('VELOCITY','critical', recent, tx.senderAccountId);
      this.appendOrCreateAlert(a);
    }
  }

  getAlerts(): Alert[] { return [...this.alerts]; }

  updateAlert(updated: Alert) {
    const idx = this.alerts.findIndex(a => a.id === updated.id);
    if (idx !== -1) {
      this.alerts[idx] = { ...updated, lastUpdatedAt: this.nowIso() };
      this.alerts[idx].audit = [...(this.alerts[idx].audit||[]), `Updated by manager at ${this.nowIso()}`];
      this.save();
    }
  }


  suspendAccount(accountId: string, untilIso: string, by: string, note?: string) {
    // mark all alerts for account
    this.alerts = this.alerts.map(a => a.flaggedAccountId === accountId ? { ...a, suspendedUntil: untilIso, audit: [...(a.audit||[]), `Suspended until ${untilIso} by ${by}: ${note||''}`] } : a);
    this.save();
  }

  liftSuspension(accountId: string, by: string, note?: string) {
    this.alerts = this.alerts.map(a => a.flaggedAccountId === accountId ? { ...a, suspendedUntil: null, audit: [...(a.audit||[]), `Suspension lifted by ${by}: ${note||''}`] } : a);
    this.save();
  }

  exportAlertsJSON(): string { return JSON.stringify(this.alerts, null, 2); }

  /** Mark account as banned (long-term action) and record audit */
  banAccount(accountId: string, by = 'manager', note?: string) {
    const until = 'BANNED';
    this.alerts = this.alerts.map(a => a.flaggedAccountId === accountId ? { ...a, suspendedUntil: until, labels: [...(a.labels||[]), 'banned'], audit: [...(a.audit||[]), `Banned by ${by}: ${note||''}`] } : a);
    this.save();
  }

  /** Count open/pending alerts */
  getPendingCount(): number {
    return this.alerts.filter(a => a.status === 'open').length;
  }
}
