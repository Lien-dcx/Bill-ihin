/**
 * Pure financial & reconciliation helpers for Bill-ihin.
 * Kept strictly independent from React UI so calculations can be unit tested
 * and reused across dashboards, detail pages, and reports.
 */

export function formatPHP(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Computes separate Contribution Funding Metrics and Service Provider Payment Metrics
 * for a single bill. Never conflates submitted/confirmed contributions with actual payments.
 */
export function computeBillFinancials(bill, contributions = [], payments = [], referenceDate = new Date().toISOString().slice(0, 10)) {
  const billContribs = contributions.filter((c) => c.billId === bill.id);
  const billPayments = payments.filter((p) => p.billId === bill.id);

  const submittedContributions = billContribs
    .filter((c) => c.status !== 'Rejected')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const pendingContributions = billContribs
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const confirmedContributions = billContribs
    .filter((c) => c.status === 'Confirmed')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const rejectedContributions = billContribs
    .filter((c) => c.status === 'Rejected')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const actualPaid = billPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const billTotal = Number(bill.amount || 0);
  const remainingBillBalance = Math.max(0, billTotal - actualPaid);
  const remainingFundingRequired = Math.max(0, billTotal - confirmedContributions);
  const fundingProgressPct = billTotal > 0 ? Math.min(100, Math.round((confirmedContributions / billTotal) * 100)) : 0;
  const paymentProgressPct = billTotal > 0 ? Math.min(100, Math.round((actualPaid / billTotal) * 100)) : 0;

  // Derive actual provider payment status independently from member contribution status
  let paymentStatus = 'Unpaid';
  if (actualPaid >= billTotal && billTotal > 0) {
    paymentStatus = 'Paid';
  } else if (bill.dueDate && bill.dueDate < referenceDate && actualPaid < billTotal) {
    paymentStatus = 'Overdue';
  } else if (actualPaid > 0 && actualPaid < billTotal) {
    paymentStatus = 'Partial Payment';
  }

  // Derive contribution funding status
  let fundingStatus = 'Unfunded';
  if (confirmedContributions >= billTotal && billTotal > 0) {
    fundingStatus = 'Fully Funded';
  } else if (confirmedContributions > 0) {
    fundingStatus = 'Partially Funded';
  } else if (pendingContributions > 0) {
    fundingStatus = 'Pending Verification';
  }

  return {
    billTotal,
    submittedContributions,
    pendingContributions,
    confirmedContributions,
    rejectedContributions,
    actualPaid,
    remainingBillBalance,
    remainingFundingRequired,
    fundingProgressPct,
    paymentProgressPct,
    paymentStatus,
    fundingStatus,
    contributionCount: billContribs.length,
    paymentCount: billPayments.length,
  };
}

/**
 * Computes household-wide summary KPIs for Administrator Dashboard & Overview.
 */
export function computeHouseholdSummary({
  bills = [],
  budgets = [],
  contributions = [],
  payments = [],
  referenceDate = new Date().toISOString().slice(0, 10),
}) {
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount || 0), 0);
  const totalExpenses = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const remainingBudget = totalBudget - totalExpenses;
  const budgetUtilizationPct = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0;

  const totalConfirmedContributions = contributions
    .filter((c) => c.status === 'Confirmed')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalPendingContributions = contributions
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalActualPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const enrichedBills = bills.map((bill) => ({
    ...bill,
    financials: computeBillFinancials(bill, contributions, payments, referenceDate),
  }));

  const outstandingBills = enrichedBills.filter((b) => b.financials.remainingBillBalance > 0);
  const totalOutstandingAmount = outstandingBills.reduce(
    (sum, b) => sum + b.financials.remainingBillBalance,
    0
  );

  const overdueBills = outstandingBills.filter((b) => b.financials.paymentStatus === 'Overdue');
  const upcomingBills = outstandingBills.filter(
    (b) => b.dueDate >= referenceDate && b.financials.remainingBillBalance > 0
  );

  return {
    totalBudget,
    totalExpenses,
    remainingBudget,
    budgetUtilizationPct,
    totalConfirmedContributions,
    totalPendingContributions,
    totalActualPaid,
    outstandingCount: outstandingBills.length,
    totalOutstandingAmount,
    overdueCount: overdueBills.length,
    upcomingCount: upcomingBills.length,
    enrichedBills,
  };
}

/**
 * Computes member-specific dashboard stats.
 */
export function computeMemberSummary({
  memberId,
  bills = [],
  contributions = [],
  assignments = [],
  payments = [],
  referenceDate = new Date().toISOString().slice(0, 10),
}) {
  const myContribs = contributions.filter((c) => c.memberId === memberId);
  const confirmedTotal = myContribs
    .filter((c) => c.status === 'Confirmed')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const pendingTotal = myContribs
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const rejectedCount = myContribs.filter((c) => c.status === 'Rejected').length;

  const myAssignments = assignments
    .filter((a) => a.memberId === memberId)
    .map((asg) => {
      const bill = bills.find((b) => b.id === asg.billId);
      const myBillContribs = myContribs.filter((c) => c.billId === asg.billId && c.status === 'Confirmed');
      const contributedTowardTarget = myBillContribs.reduce((s, c) => s + Number(c.amount || 0), 0);
      const billFinancials = bill
        ? computeBillFinancials(bill, contributions, payments, referenceDate)
        : null;
      return {
        ...asg,
        bill,
        contributedTowardTarget,
        remainingTarget: Math.max(0, Number(asg.targetAmount || 0) - contributedTowardTarget),
        billFinancials,
      };
    });

  return {
    confirmedTotal,
    pendingTotal,
    rejectedCount,
    totalSubmissions: myContribs.length,
    myAssignments,
    myContribs,
  };
}

export function buildMonthlyComparison({
  bills = [],
  budgets = [],
  contributions = [],
  monthsBack = 5,
  referenceDate = new Date(),
}) {
  const reference = referenceDate instanceof Date ? referenceDate : new Date(`${referenceDate}T00:00:00.000Z`);
  const result = [];
  for (let offset = monthsBack; offset >= 0; offset -= 1) {
    const monthDate = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - offset, 1));
    const monthKey = monthDate.toISOString().slice(0, 7);
    const label = new Intl.DateTimeFormat('en-PH', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(monthDate);
    const isMonth = (value) => typeof value === 'string' && value.slice(0, 7) === monthKey;
    result.push({
      month: label,
      budget: budgets.filter((budget) => isMonth(budget.month)).reduce((sum, budget) => sum + Number(budget.allocatedAmount || 0), 0),
      expenses: bills.filter((bill) => isMonth(bill.dueDate)).reduce((sum, bill) => sum + Number(bill.amount || 0), 0),
      contributions: contributions
        .filter((contribution) => isMonth(contribution.contributionDate) && contribution.status === 'Confirmed')
        .reduce((sum, contribution) => sum + Number(contribution.amount || 0), 0),
    });
  }
  return result;
}

/**
 * Generates and downloads a clean CSV file from tabular rows (no external dependency).
 */
export function downloadCSV(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
