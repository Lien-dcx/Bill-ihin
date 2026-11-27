import { useMemo, useState } from 'react';
import { CalendarDays, Droplets, House, Tags, Wifi, Zap } from 'lucide-react';
import { formatDateShort, formatPHP } from '../../utils/finance';

function categoryIcon(name) {
  const value = name.toLowerCase();
  if (value.includes('electric') || value.includes('power')) return Zap;
  if (value.includes('water')) return Droplets;
  if (value.includes('internet') || value.includes('wifi')) return Wifi;
  if (value.includes('home') || value.includes('house')) return House;
  return Tags;
}

export default function CategoryBillsPanel({
  categories = [],
  bills = [],
  payments = [],
  onContribute,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId)
    || categories[0];

  const categoryBills = useMemo(
    () => bills
      .filter((bill) => bill.categoryId === selectedCategory?.id)
      .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || ''))),
    [bills, selectedCategory?.id]
  );
  const today = new Date().toISOString().slice(0, 10);
  const unpaidBills = categoryBills.filter((bill) => {
    const paidAmount = payments
      .filter((payment) => payment.billId === bill.id)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return paidAmount < Number(bill.amount || 0);
  });
  const nextBill = unpaidBills.find((bill) => bill.dueDate >= today)
    || unpaidBills[unpaidBills.length - 1]
    || categoryBills[categoryBills.length - 1];
  const billHeading = nextBill && unpaidBills.includes(nextBill)
    ? nextBill.dueDate < today ? 'Past due bill' : 'Next bill'
    : 'Most recent bill';
  const history = useMemo(() => {
    const totalsByMonth = categoryBills.reduce((totals, bill) => {
      const month = typeof bill.dueDate === 'string' ? bill.dueDate.slice(0, 7) : '';
      if (!/^\d{4}-\d{2}$/.test(month)) return totals;
      totals[month] = (totals[month] || 0) + Number(bill.amount || 0);
      return totals;
    }, {});

    return Object.entries(totalsByMonth)
      .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
      .slice(-6)
      .map(([month, amount]) => ({
        month,
        label: new Intl.DateTimeFormat('en-PH', {
          month: 'short',
          year: '2-digit',
          timeZone: 'UTC',
        }).format(new Date(`${month}-01T00:00:00.000Z`)),
        amount,
      }));
  }, [categoryBills]);
  const highestAmount = Math.max(1, ...history.map((item) => item.amount));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#24352F]">Choose a household category</h2>
        <p className="mt-1 text-base text-[#68776D]">
          Select one to see its next bill and past amounts.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-[#DDE5DE] bg-white p-6 text-base leading-relaxed text-[#526258]">
          No categories have been added to this household yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = categoryIcon(category.name);
              const active = category.id === selectedCategory?.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  aria-pressed={active}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl border-2 bg-white px-4 py-3 text-left text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${
                    active
                      ? 'border-[#14B8A6] bg-[#EFF9F5] text-[#24352F] shadow-sm'
                      : 'border-[#E3E9E2] text-[#526258] hover:border-[#9BCFC0] hover:bg-[#FAFCFA]'
                  }`}
                >
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      color: category.color || '#0F766E',
                      backgroundColor: `${category.color || '#0F766E'}18`,
                    }}
                    aria-hidden="true"
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="line-clamp-2">{category.name}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 rounded-2xl border border-[#DDE5DE] bg-white p-5 sm:p-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-[#718078]">
                  {billHeading}
                </p>
                <h3 className="mt-1 text-xl font-bold text-[#24352F]">
                  {selectedCategory?.name}
                </h3>
              </div>

              {nextBill ? (
                <div className="rounded-xl bg-[#F5F8F5] p-4">
                  <p className="text-lg font-bold text-[#24352F]">{nextBill.title}</p>
                  {nextBill.provider && (
                    <p className="mt-1 text-base text-[#68776D]">{nextBill.provider}</p>
                  )}
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                    <p className="flex items-center gap-2 text-base font-semibold text-[#526258]">
                      <CalendarDays className="h-5 w-5 text-[#0F766E]" aria-hidden="true" />
                      Due {formatDateShort(nextBill.dueDate)}
                    </p>
                    <p className="text-xl font-extrabold tabular-nums text-[#24352F]">
                      {formatPHP(nextBill.amount)}
                    </p>
                  </div>
                  {onContribute && (
                    <button
                      type="button"
                      onClick={() => onContribute(nextBill)}
                      className="mt-4 min-h-12 w-full rounded-xl bg-[#137C69] px-4 py-3 text-base font-bold text-white transition-colors hover:bg-[#0F6658] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] focus-visible:ring-offset-2"
                    >
                      Contribute to this bill
                    </button>
                  )}
                </div>
              ) : (
                <p className="rounded-xl bg-[#F5F8F5] p-4 text-base leading-relaxed text-[#68776D]">
                  No bills have been added for this category yet.
                </p>
              )}
            </div>

            <div>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#24352F]">Bill history</h3>
                <p className="mt-1 text-sm text-[#68776D]">Amounts by bill due month</p>
              </div>
              {history.length === 0 ? (
                <p className="rounded-xl bg-[#F5F8F5] p-4 text-base leading-relaxed text-[#68776D]">
                  Bill history will appear here as bills are recorded.
                </p>
              ) : (
                <div
                  className="grid min-h-[190px] grid-cols-3 items-end gap-3 border-b border-[#DDE5DE] px-1 pb-2 sm:grid-cols-6"
                  role="img"
                  aria-label={`Bill history for ${selectedCategory?.name}: ${history.map((item) => `${item.label} ${formatPHP(item.amount)}`).join(', ')}`}
                >
                  {history.map((item) => (
                    <div key={item.month} className="flex h-full min-w-0 flex-col items-center justify-end gap-2">
                      <span className="max-w-full truncate text-center text-xs font-semibold tabular-nums text-[#526258]">
                        {formatPHP(item.amount)}
                      </span>
                      <div
                        className="w-full max-w-10 rounded-t-lg bg-[#54B69B] transition-[height] duration-300"
                        style={{ height: `${Math.max(12, (item.amount / highestAmount) * 112)}px` }}
                        title={`${item.label}: ${formatPHP(item.amount)}`}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-[#68776D]">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
