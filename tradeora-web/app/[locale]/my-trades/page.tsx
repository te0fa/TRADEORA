'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Briefcase, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MyTradesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

function exportToPDF(trades: any[], locale: string) {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(14, 165, 233); // blue
  doc.text('TRADEORA - Trade Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('ar-EG')}`,
    14, 28
  );

  // KPIs
  const closed = trades.filter(t => t.status==='closed');
  const wins   = closed.filter(t => (t.pnl_percent??0)>0);
  const totalPnl = closed.reduce(
    (s,t) => s+(t.pnl_amount??0), 0
  );

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total Trades: ${trades.length}`, 14, 38);
  doc.text(`Win Rate: ${closed.length>0 ?
    Math.round(wins.length/closed.length*100) : 0}%`, 80, 38);
  doc.text(`Total P&L: ${totalPnl.toFixed(2)} EGP`, 150, 38);

  // Table
  autoTable(doc, {
    startY: 48,
    head: [[
      'Symbol', 'Direction', 'Entry', 'TP1', 'TP2',
      'SL', 'Status', 'P&L%', 'P&L EGP', 'Date'
    ]],
    body: trades.map(t => [
      t.symbol,
      t.direction === 'buy' ? '▲ Buy' : '▼ Sell',
      t.entry_price?.toFixed(2),
      t.tp1?.toFixed(2),
      t.tp2?.toFixed(2),
      t.sl?.toFixed(2),
      t.status === 'active' ? 'Active'
        : t.status === 'tp1_hit' ? 'TP1 Hit'
        : (t.pnl_percent??0)>0 ? 'Win' : 'Loss',
      t.pnl_percent !== null
        ? `${t.pnl_percent>0?'+':''}${t.pnl_percent?.toFixed(2)}%`
        : '—',
      t.pnl_amount !== null
        ? `${t.pnl_amount?.toFixed(0)} EGP`
        : '—',
      new Date(t.activated_at).toLocaleDateString('ar-EG')
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 249, 255]
    },
    columnStyles: {
      7: { textColor: [34, 197, 94] }, // P&L%
    },
  });

  doc.save(`TRADEORA_Trades_${
    new Date().toISOString().split('T')[0]
  }.pdf`);
}

export default function MyTradesPage({ params }: MyTradesPageProps) {
  const { locale } = React.use(params);
  const router = useRouter();
  const t = useTranslations();
  const isAr = locale === 'ar';

  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Close modal states
  const [selectedTrade, setSelectedTrade] = useState<any>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [exitPrice, setExitPrice] = useState<number>(0);
  const [closing, setClosing] = useState(false);

  // Trailing Stop Loss states
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingPct, setTrailingPct] = useState(2);

  // Load user session and trades
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace(`/${locale}/auth`);
        return;
      }
      setUser(user);
      fetchUserTrades(user.id);
    });
  }, [router, locale]);

  const fetchUserTrades = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_trades')
        .select('*')
        .eq('user_id', userId)
        .order('activated_at', { ascending: false });

      if (error) throw error;
      setTrades(data || []);
    } catch (err) {
      console.error('Error fetching user trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCloseModal = (trade: any) => {
    setSelectedTrade(trade);
    setExitPrice(trade.entry_price);
    setTrailingEnabled(!!trade.trailing_sl);
    setTrailingPct(Number(trade.trailing_pct ?? 2));
    setShowCloseModal(true);
  };

  const handleCloseTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrade) return;
    setClosing(true);

    try {
      // IF Trailing Stop is enabled in the form, update the parameters rather than closing immediately
      if (trailingEnabled) {
        const { error } = await supabase
          .from('user_trades')
          .update({
            trailing_sl: true,
            trailing_pct: trailingPct,
            current_sl: selectedTrade.current_sl || selectedTrade.sl
          })
          .eq('id', selectedTrade.id);

        if (error) throw error;

        alert(isAr ? '🛡️ تم تفعيل وتعديل الوقف المتحرك للصفقة!' : '🛡️ Trailing Stop Loss updated successfully!');
        setShowCloseModal(false);
        setSelectedTrade(null);
        if (user) fetchUserTrades(user.id);
        return;
      }

      const entry = Number(selectedTrade.entry_price);
      const shares = Number(selectedTrade.shares_count);
      const direction = selectedTrade.direction;
      const isSell = direction === 'sell';

      let finalPnlPercent = 0;
      let finalPnlAmount = 0;

      if (selectedTrade.status === 'tp1_hit') {
        // TP1 already hit. TP1 represents 50% of the trade at tp1_exit_price.
        // The remaining 50% is exited now at the entered exitPrice.
        const tp1ExitPrice = Number(selectedTrade.tp1_exit_price || selectedTrade.tp1);
        const tp1PnlPct = isSell ? ((entry - tp1ExitPrice) / entry * 100) : ((tp1ExitPrice - entry) / entry * 100);
        const exitPnlPct = isSell ? ((entry - exitPrice) / entry * 100) : ((exitPrice - entry) / entry * 100);

        finalPnlPercent = 0.5 * tp1PnlPct + 0.5 * exitPnlPct;
        finalPnlAmount = 0.5 * shares * (isSell ? (entry - tp1ExitPrice) : (tp1ExitPrice - entry)) +
                         0.5 * shares * (isSell ? (entry - exitPrice) : (exitPrice - entry));
      } else {
        // Full position exited at exitPrice
        finalPnlPercent = isSell ? ((entry - exitPrice) / entry * 100) : ((exitPrice - entry) / entry * 100);
        finalPnlAmount = shares * (isSell ? (entry - exitPrice) : (exitPrice - entry));
      }

      const { error } = await supabase
        .from('user_trades')
        .update({
          status: 'closed',
          exit_price: exitPrice,
          exit_reason: 'manual',
          pnl_percent: finalPnlPercent,
          pnl_amount: finalPnlAmount,
          closed_at: new Date().toISOString()
        })
        .eq('id', selectedTrade.id);

      if (error) throw error;

      setShowCloseModal(false);
      setSelectedTrade(null);
      // Reload trades
      if (user) fetchUserTrades(user.id);
    } catch (err: any) {
      console.error('Error closing trade:', err);
      alert(isAr ? `❌ فشل تعديل الصفقة: ${err.message}` : `❌ Failed to modify trade: ${err.message}`);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="w-full font-sans text-text-primary">
      {/* Title block */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent-blue" />
            <span>{isAr ? '💼 صفقاتي ومحفظتي الشخصية' : 'My Trades & Portfolio'}</span>
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {isAr ? 'إدارة وتتبع تصفية صفقاتك الحقيقية التي قمت بتفعيلها يدوياً.' : 'Track and manage the lifecycle of your active trades.'}
          </p>
        </div>
        <button
          onClick={() => exportToPDF(trades, locale as string)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <span>📄</span>
          <span>{isAr ? 'تصدير PDF' : 'Export PDF'}</span>
        </button>
      </div>

      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
          <span className="text-xs text-text-secondary">{isAr ? 'جاري تحميل صفقاتك...' : 'Loading your trades...'}</span>
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-2xl p-8 max-w-lg mx-auto">
          <span className="text-4xl mb-3 block">💼</span>
          <h3 className="text-sm font-bold text-white mb-1">{isAr ? 'لا توجد صفقات مفعلة بعد' : 'No active trades yet'}</h3>
          <p className="text-[11px] text-text-secondary leading-relaxed mb-4">
            {isAr 
              ? 'افتح صفحة أي سهم وقم بتبني التحليلات المقترحة بالضغط على "تفعيل الصفقة في محفظتي" لتظهر هنا للمتابعة.'
              : 'Go to any stock detail page and activate a trade suggestion to monitor its progress here.'}
          </p>
          <button 
            onClick={() => router.push(`/${locale}`)}
            className="px-5 py-2 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {isAr ? 'تصفح قائمة الأسهم' : 'Browse Stocks'}
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs select-none">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-text-secondary/70">
                  <th className="py-4 px-4 font-semibold text-start">{isAr ? 'السهم' : 'Stock'}</th>
                  <th className="py-4 px-3 font-semibold text-center">{isAr ? 'الاتجاه' : 'Dir'}</th>
                  <th className="py-4 px-3 font-semibold">{isAr ? 'الكمية' : 'Shares'}</th>
                  <th className="py-4 px-3 font-semibold">{isAr ? 'سعر الدخول' : 'Entry'}</th>
                  <th className="py-4 px-3 font-semibold text-green-400">TP1</th>
                  <th className="py-4 px-3 font-semibold text-green-400">TP2</th>
                  <th className="py-4 px-3 font-semibold text-red-400">SL</th>
                  <th className="py-4 px-3 font-semibold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-4 px-3 font-semibold">{isAr ? 'العائد (PnL)' : 'PnL'}</th>
                  <th className="py-4 px-4 font-semibold text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trades.map((trade) => {
                  const entry = Number(trade.entry_price);
                  const shares = Number(trade.shares_count);
                  const direction = trade.direction;
                  const isBuy = direction === 'buy';

                  let statusText = '';
                  let statusClass = '';
                  let pnlNode = null;

                  if (trade.status === 'active') {
                    statusText = isAr ? '🟡 نشطة' : '🟡 Active';
                    statusClass = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
                  } else if (trade.status === 'tp1_hit') {
                    statusText = isAr ? '🔵 هدف 1 ✓' : '🔵 TP1 Hit';
                    statusClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                  } else if (trade.status === 'closed') {
                    const isWin = Number(trade.pnl_percent || 0) >= 0;
                    statusText = isWin 
                      ? (isAr ? '🟢 مغلقة بربح' : '🟢 Closed Profit') 
                      : (isAr ? '🔴 مغلقة بخسارة' : '🔴 Closed Loss');
                    statusClass = isWin 
                      ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                      : 'bg-red-500/10 text-red-400 border-red-500/20';
                  }

                  // Render realized/unrealized PnL
                  const pnlPct = Number(trade.pnl_percent ?? 0);
                  const pnlAmt = Number(trade.pnl_amount ?? 0);
                  const hasPnl = trade.status === 'closed';

                  if (hasPnl) {
                    const isWin = pnlPct >= 0;
                    pnlNode = (
                      <div className={`font-mono font-semibold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="flex items-center justify-end gap-0.5">
                          {isWin ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{pnlPct.toFixed(2)}%</span>
                        </div>
                        <div className="text-[10px] text-text-secondary/60">
                          {isWin ? '+' : ''}{pnlAmt.toLocaleString(undefined, { maximumFractionDigits: 1 })} EGP
                        </div>
                      </div>
                    );
                  } else {
                    pnlNode = <span className="text-text-secondary/40 font-mono">-</span>;
                  }

                  return (
                    <tr key={trade.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Stock Symbol */}
                      <td className="py-3.5 px-4 font-bold text-white text-start">
                        {trade.symbol}
                      </td>

                      {/* Direction */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBuy ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {isBuy ? (isAr ? 'شراء' : 'Buy') : (isAr ? 'بيع' : 'Sell')}
                        </span>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 font-mono font-semibold">
                        {shares.toLocaleString()}
                      </td>

                      {/* Entry Price */}
                      <td className="py-3.5 px-3 font-mono font-semibold text-text-primary">
                        {entry.toFixed(2)}
                      </td>

                      {/* TP1 */}
                      <td className="py-3.5 px-3 font-mono text-green-400/80">
                        {Number(trade.tp1).toFixed(2)}
                      </td>

                      {/* TP2 */}
                      <td className="py-3.5 px-3 font-mono text-green-400/80">
                        {Number(trade.tp2).toFixed(2)}
                      </td>

                      {/* SL */}
                      <td className="py-3.5 px-3 font-mono text-red-400/80">
                        {Number(trade.sl).toFixed(2)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${statusClass}`}>
                          {statusText}
                        </span>
                      </td>

                      {/* PnL */}
                      <td className="py-3.5 px-3">
                        {pnlNode}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        {trade.status !== 'closed' ? (
                          <button
                            onClick={() => handleOpenCloseModal(trade)}
                            className="px-3 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg transition cursor-pointer"
                          >
                            ❌ {isAr ? 'إغلاق يدوي' : 'Close Position'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-text-secondary/40">
                            {trade.exit_reason === 'sl' && '🛑 Stop Loss'}
                            {trade.exit_reason === 'tp2' && '🎯 Take Profit 2'}
                            {trade.exit_reason === 'trailing_sl' && '🛡️ Trailing Stop'}
                            {trade.exit_reason === 'manual' && '👤 Manual Exit'}
                            {trade.exit_reason === 'time_exit' && '⏱️ Time Exit'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Close Modal */}
      {showCloseModal && selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <form onSubmit={handleCloseTradeSubmit} className="bg-[#1E293B] rounded-2xl p-6 border border-white/10 w-80 shadow-2xl font-sans relative text-right">
            <h3 className="text-sm font-bold text-white mb-3 text-start flex items-center gap-2">
              <span>⚠️</span>
              <span>{isAr ? 'تأكيد إغلاق الصفقة يدوياً' : 'Confirm Manual Position Exit'}</span>
            </h3>

            <div className="space-y-4 my-4">
              <p className="text-[10px] leading-relaxed text-text-secondary text-start">
                {selectedTrade.status === 'tp1_hit' 
                  ? (isAr 
                    ? 'لقد تم تصفية 50% من الصفقة عند الهدف الأول سابقاً. إغلاق الصفقة الآن سيصفي النصف الثاني المتبقي بسعر السوق الذي تدخله أدناه.'
                    : '50% of the trade was already closed at TP1. Closing now will exit the remaining 50% at the exit price entered below.')
                  : (isAr
                    ? 'سيتم تصفية وإغلاق كامل الكمية المفتوحة بسعر السوق الذي تدخله أدناه.'
                    : 'The entire open position will be exited at the price specified below.')}
              </p>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1 text-start">
                  {isAr ? 'سعر الخروج الفعلي (EGP)' : 'Actual Exit Price (EGP)'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={exitPrice}
                  onChange={(e) => setExitPrice(Number(e.target.value))}
                  disabled={trailingEnabled}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:border-accent-blue outline-none text-left disabled:opacity-50"
                />
              </div>

              {/* Trailing SL switch */}
              <div className="flex items-center justify-between mt-3">
                <span className="text-slate-400 text-xs">
                  🛡️ {isAr ? 'وقف خسارة متحرك' : 'Trailing Stop Loss'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trailingEnabled}
                    onChange={e => setTrailingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-white/10 peer-checked:bg-blue-500 rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>

              {trailingEnabled && (
                <div className="mt-2 text-start">
                  <label className="text-[10px] text-slate-400">
                    {isAr ? 'نسبة الوقف المتحرك (%)' : 'Trailing %'}
                  </label>
                  <input
                    type="number"
                    value={trailingPct}
                    onChange={e => setTrailingPct(Number(e.target.value))}
                    min={0.5} max={10} step={0.5}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white mt-1 focus:border-blue-500 outline-none text-left font-mono text-xs"
                  />
                  <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                    {isAr
                      ? `لو السعر ارتفع → يتحرك الوقف تلقائياً بفارق ${trailingPct}%`
                      : `SL moves up ${trailingPct}% below peak price`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowCloseModal(false);
                  setSelectedTrade(null);
                }}
                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-400 text-xs hover:bg-white/10 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={closing}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {closing ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <span>{trailingEnabled ? (isAr ? 'حفظ التفعيل' : 'Activate Trailing') : (isAr ? 'تأكيد الخروج' : 'Confirm Exit')}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
