import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBillFinancials,
  computeHouseholdSummary,
  computeMemberSummary,
  formatPHP,
  buildMonthlyComparison,
} from './finance.js';

test('formatPHP formats Philippine peso values cleanly', () => {
  const formatted = formatPHP(11450);
  assert.match(formatted, /11,450\.00/);
  assert.ok(formatted.includes('₱') || formatted.includes('PHP'));
});

test('computeBillFinancials strictly separates contributions from actual provider payments', () => {
  const bill = {
    id: 'b-1',
    amount: 10000,
    dueDate: '2026-11-20',
  };
  const contributions = [
    { id: 'c-1', billId: 'b-1', amount: 4000, status: 'Confirmed' },
    { id: 'c-2', billId: 'b-1', amount: 2500, status: 'Pending' },
    { id: 'c-3', billId: 'b-1', amount: 1000, status: 'Rejected' },
  ];
  const payments = [
    { id: 'p-1', billId: 'b-1', amount: 3000 },
  ];

  const res = computeBillFinancials(bill, contributions, payments, '2026-11-13');

  // Rejected contributions excluded from submitted pool
  assert.equal(res.submittedContributions, 6500);
  assert.equal(res.confirmedContributions, 4000);
  assert.equal(res.pendingContributions, 2500);
  assert.equal(res.rejectedContributions, 1000);

  // Actual provider payment is independent of confirmed contributions
  assert.equal(res.actualPaid, 3000);
  assert.equal(res.remainingBillBalance, 7000);
  assert.equal(res.remainingFundingRequired, 6000);
  assert.equal(res.paymentStatus, 'Partial Payment');
  assert.equal(res.fundingStatus, 'Partially Funded');
});

test('computeBillFinancials detects overdue unpaid bills accurately', () => {
  const bill = { id: 'b-2', amount: 1890, dueDate: '2026-11-11' };
  const contributions = [{ id: 'c-1', billId: 'b-2', amount: 1890, status: 'Confirmed' }];
  const payments = []; // Confirmed by members, but NOT yet paid to Maynilad!

  const res = computeBillFinancials(bill, contributions, payments, '2026-11-13');
  assert.equal(res.fundingStatus, 'Fully Funded');
  assert.equal(res.paymentStatus, 'Overdue');
  assert.equal(res.remainingBillBalance, 1890);
});

test('computeHouseholdSummary aggregates budget, expenses, contributions, and outstanding totals', () => {
  const bills = [
    { id: 'b-1', amount: 10000, dueDate: '2026-11-20' },
    { id: 'b-2', amount: 5000, dueDate: '2026-11-10' },
  ];
  const budgets = [
    { id: 'bg-1', allocatedAmount: 20000 },
  ];
  const contributions = [
    { id: 'c-1', billId: 'b-1', amount: 6000, status: 'Confirmed' },
    { id: 'c-2', billId: 'b-2', amount: 5000, status: 'Pending' },
  ];
  const payments = [
    { id: 'p-1', billId: 'b-1', amount: 10000 },
  ];

  const summary = computeHouseholdSummary({
    bills,
    budgets,
    contributions,
    payments,
    referenceDate: '2026-11-13',
  });

  assert.equal(summary.totalBudget, 20000);
  assert.equal(summary.totalExpenses, 15000);
  assert.equal(summary.remainingBudget, 5000);
  assert.equal(summary.budgetUtilizationPct, 75);
  assert.equal(summary.totalConfirmedContributions, 6000);
  assert.equal(summary.totalPendingContributions, 5000);
  assert.equal(summary.totalActualPaid, 10000);
  assert.equal(summary.outstandingCount, 1);
  assert.equal(summary.totalOutstandingAmount, 5000);
  assert.equal(summary.overdueCount, 1);
});

test('computeMemberSummary calculates member confirmed, pending, and assignment progress', () => {
  const bills = [{ id: 'b-1', amount: 10000, dueDate: '2026-11-20' }];
  const contributions = [
    { id: 'c-1', billId: 'b-1', memberId: 'm-1', amount: 3000, status: 'Confirmed' },
    { id: 'c-2', billId: 'b-1', memberId: 'm-1', amount: 1500, status: 'Pending' },
    { id: 'c-3', billId: 'b-1', memberId: 'm-2', amount: 5000, status: 'Confirmed' },
  ];
  const assignments = [
    { id: 'a-1', billId: 'b-1', memberId: 'm-1', targetAmount: 5000 },
  ];

  const res = computeMemberSummary({
    memberId: 'm-1',
    bills,
    contributions,
    assignments,
    payments: [],
    referenceDate: '2026-11-13',
  });

  assert.equal(res.confirmedTotal, 3000);
  assert.equal(res.pendingTotal, 1500);
  assert.equal(res.myAssignments.length, 1);
  assert.equal(res.myAssignments[0].contributedTowardTarget, 3000);
  assert.equal(res.myAssignments[0].remainingTarget, 2000);
});

test('buildMonthlyComparison groups database-backed records and includes only confirmed contributions', () => {
  const data = buildMonthlyComparison({
    bills: [
      { id: 1, amount: 1000, dueDate: '2026-11-12' },
      { id: 2, amount: 500, dueDate: '2026-10-12' },
    ],
    budgets: [
      { month: '2026-11', allocatedAmount: 1200 },
      { month: '2026-10', allocatedAmount: 900 },
    ],
    contributions: [
      { billId: 1, amount: 600, contributionDate: '2026-11-13', status: 'Confirmed' },
      { billId: 1, amount: 300, contributionDate: '2026-11-13', status: 'Pending' },
    ],
    monthsBack: 1,
    referenceDate: '2026-11-14',
  });

  assert.equal(data[0].expenses, 500);
  assert.equal(data[0].budget, 900);
  assert.equal(data[1].expenses, 1000);
  assert.equal(data[1].budget, 1200);
  assert.equal(data[1].contributions, 600);
});
