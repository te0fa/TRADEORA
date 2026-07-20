'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { Briefcase, ArrowUpRight, ArrowDownRight, FileText, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
        const tp1ExitPrice = Number(selectedTrade.tp1_exit_price || selectedTrade.tp1);
        const tp1PnlPct = isSell ? ((entry - tp1ExitPrice) / entry * 100) : ((tp1ExitPrice - entry) / entry * 100);
        const exitPnlPct = isSell ? ((entry - exitPrice) / entry * 100) : ((exitPrice - entry) / entry * 100);

        finalPnlPercent = 0.5 * tp1PnlPct + 0.5 * exitPnlPct;
        finalPnlAmount = 0.5 * shares * (isSell ? (entry - tp1ExitPrice) : (tp1ExitPrice - entry)) +
                         0.5 * shares * (isSell ? (entry - exitPrice) : (exitPrice - entry));
      } else {
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
      if (user) fetchUserTrades(user.id);
    } catch (err: any) {
      console.error('Error closing trade:', err);
      alert(isAr ? `❌ فشل تعديل الصفقة: ${err.message}` : `❌ Failed to modify trade: ${err.message}`);
    } finally {
      setClosing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full font-sans text-text-primary pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title block */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3 mb-2">
            <Briefcase className="w-7 h-7 text-accent-blue" />
            <span>{isAr ? 'صفقاتي ومحفظتي' : 'My Trades & Portfolio'}</span>
          </h1>
          <p className="text-sm text-zinc-400">
            {isAr ? 'إدارة وتتبع تصفية صفقاتك الحقيقية التي قمت بتفعيلها يدوياً.' : 'Track and manage the lifecycle of your active trades.'}
          </p>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => exportToPDF(trades, locale as string)}
        >
          <FileText className="w-4 h-4" />
          {isAr ? 'تصدير للطباعة (PDF)' : 'Export PDF'}
        </Button>
      </motion.div>

      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-accent-blue rounded-full animate-spin"></div>
          <span className="text-sm text-zinc-400">{isAr ? 'جاري تحميل صفقاتك...' : 'Loading your trades...'}</span>
        </div>
      ) : trades.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card hoverEffect={false} className="text-center py-20 p-8 max-w-lg mx-auto flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 text-accent-blue">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{isAr ? 'لا توجد صفقات مفعلة بعد' : 'No active trades yet'}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-8 max-w-sm">
              {isAr 
                ? 'افتح صفحة أي سهم وقم بتبني التحليلات المقترحة بالضغط على "تفعيل الصفقة في محفظتي" لتظهر هنا للمتابعة.'
                : 'Go to any stock detail page and activate a trade suggestion to monitor its progress here.'}
            </p>
            <Button onClick={() => router.push(`/${locale}`)}>
              {isAr ? 'تصفح قائمة الأسهم' : 'Browse Stocks'}
            </Button>
          </Card>
        </motion.div>
      ) : (
        <Card hoverEffect={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-sm select-none">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-zinc-400">
                  <th className="py-5 px-5 font-semibold text-start">{isAr ? 'السهم' : 'Stock'}</th>
                  <th className="py-5 px-4 font-semibold text-center">{isAr ? 'الاتجاه' : 'Dir'}</th>
                  <th className="py-5 px-4 font-semibold text-end">{isAr ? 'الكمية' : 'Shares'}</th>
                  <th className="py-5 px-4 font-semibold text-end">{isAr ? 'سعر الدخول' : 'Entry'}</th>
                  <th className="py-5 px-4 font-semibold text-end text-up-green">TP1</th>
                  <th className="py-5 px-4 font-semibold text-end text-up-green">TP2</th>
                  <th className="py-5 px-4 font-semibold text-end text-down-red">SL</th>
                  <th className="py-5 px-4 font-semibold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-5 px-4 font-semibold text-end">{isAr ? 'العائد (PnL)' : 'PnL'}</th>
                  <th className="py-5 px-5 font-semibold text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <motion.tbody 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-white/5"
              >
                <AnimatePresence>
                  {trades.map((trade) => {
                    const entry = Number(trade.entry_price);
                    const shares = Number(trade.shares_count);
                    const direction = trade.direction;
                    const isBuy = direction === 'buy';

                    let statusVariant: 'success' | 'danger' | 'warning' | 'primary' = 'warning';
                    let statusText = '';
                    
                    if (trade.status === 'active') {
                      statusText = isAr ? 'نشطة' : 'Active';
                      statusVariant = 'warning';
                    } else if (trade.status === 'tp1_hit') {
                      statusText = isAr ? 'هدف 1' : 'TP1 Hit';
                      statusVariant = 'primary';
                    } else if (trade.status === 'closed') {
                      const isWin = Number(trade.pnl_percent || 0) >= 0;
                      statusText = isWin 
                        ? (isAr ? 'ربح' : 'Profit') 
                        : (isAr ? 'خسارة' : 'Loss');
                      statusVariant = isWin ? 'success' : 'danger';
                    }

                    const pnlPct = Number(trade.pnl_percent ?? 0);
                    const pnlAmt = Number(trade.pnl_amount ?? 0);
                    const hasPnl = trade.status === 'closed';

                    return (
                      <motion.tr 
                        variants={rowVariants}
                        layout
                        key={trade.id} 
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 px-5 font-bold text-white text-start">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base">{trade.symbol}</span>
                            <span className="text-[9px] text-zinc-500 font-sans hidden md:inline-block">
                              {new Date(trade.activated_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <Badge variant={isBuy ? 'success' : 'danger'} pulsing={trade.status === 'active'}>
                            {isBuy ? (isAr ? 'شراء' : 'Buy') : (isAr ? 'بيع' : 'Sell')}
                          </Badge>
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-zinc-300 text-end">
                          {shares.toLocaleString()}
                        </td>

                        <td className="py-4 px-4 font-mono font-bold text-white text-end">
                          {entry.toFixed(2)}
                        </td>

                        <td className="py-4 px-4 font-mono text-up-green/90 text-end">
                          {Number(trade.tp1).toFixed(2)}
                        </td>

                        <td className="py-4 px-4 font-mono text-up-green/90 text-end">
                          {Number(trade.tp2).toFixed(2)}
                        </td>

                        <td className="py-4 px-4 font-mono text-down-red/90 text-end">
                          {Number(trade.sl).toFixed(2)}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <Badge variant={statusVariant}>
                            {statusText}
                          </Badge>
                        </td>

                        <td className="py-4 px-4 text-end">
                          {hasPnl ? (
                            <div className={`font-mono font-bold ${pnlPct >= 0 ? 'text-up-green' : 'text-down-red'}`}>
                              <div className="flex items-center justify-end gap-1 text-sm">
                                {pnlPct >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                <span>{pnlPct.toFixed(2)}%</span>
                              </div>
                              <div className="text-[10px] text-zinc-500 font-sans mt-0.5">
                                {pnlPct >= 0 ? '+' : ''}{pnlAmt.toLocaleString(undefined, { maximumFractionDigits: 1 })} EGP
                              </div>
                            </div>
                          ) : (
                            <span className="text-zinc-600 font-mono">-</span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-center">
                          {trade.status !== 'closed' ? (
                            <Button 
                              variant="danger" 
                              size="sm"
                              className="px-3"
                              onClick={() => handleOpenCloseModal(trade)}
                            >
                              <X className="w-3.5 h-3.5" />
                              {isAr ? 'إغلاق' : 'Close'}
                            </Button>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-500 border border-white/5 bg-white/5 px-2 py-1 rounded-md">
                              {trade.exit_reason === 'sl' && '🛑 SL'}
                              {trade.exit_reason === 'tp2' && '🎯 TP2'}
                              {trade.exit_reason === 'trailing_sl' && '🛡️ T-SL'}
                              {trade.exit_reason === 'manual' && '👤 Manual'}
                              {trade.exit_reason === 'time_exit' && '⏱️ Time'}
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Manual Close Modal */}
      <AnimatePresence>
        {showCloseModal && selectedTrade && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
          >
            <motion.form 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCloseTradeSubmit} 
              className="bg-surface-elevated rounded-2xl p-6 border border-white/10 w-full max-w-sm shadow-2xl font-sans relative text-right"
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <h3 className="text-lg font-black text-white mb-4 text-start flex items-center gap-2">
                <span className="text-accent-gold">⚠️</span>
                <span>{isAr ? 'تأكيد إغلاق الصفقة' : 'Confirm Exit'}</span>
              </h3>

              <div className="space-y-5 my-6">
                <p className="text-xs leading-relaxed text-zinc-400 text-start bg-white/5 p-3 rounded-xl border border-white/5">
                  {selectedTrade.status === 'tp1_hit' 
                    ? (isAr 
                      ? 'لقد تم تصفية 50% من الصفقة عند الهدف الأول سابقاً. إغلاق الصفقة الآن سيصفي النصف الثاني المتبقي بسعر السوق الذي تدخله أدناه.'
                      : '50% of the trade was already closed at TP1. Closing now will exit the remaining 50% at the exit price entered below.')
                    : (isAr
                      ? 'سيتم تصفية وإغلاق كامل الكمية المفتوحة بسعر السوق الذي تدخله أدناه.'
                      : 'The entire open position will be exited at the price specified below.')}
                </p>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-2 text-start">
                    {isAr ? 'سعر الخروج الفعلي (EGP)' : 'Actual Exit Price (EGP)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    disabled={trailingEnabled}
                    className="w-full glass-input rounded-xl px-4 py-3 text-white text-sm focus:border-accent-blue outline-none text-left font-mono disabled:opacity-40 transition-colors"
                  />
                </div>

                {/* Trailing SL switch */}
                <Card hoverEffect={false} className="p-3 border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-bold flex items-center gap-2">
                      <span className="text-accent-blue">🛡️</span> 
                      {isAr ? 'وقف خسارة متحرك' : 'Trailing Stop Loss'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={trailingEnabled}
                        onChange={e => setTrailingEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-white/10 peer-checked:bg-accent-blue rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full shadow-inner" />
                    </label>
                  </div>

                  <AnimatePresence>
                    {trailingEnabled && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 text-start overflow-hidden"
                      >
                        <label className="text-xs text-zinc-400 block mb-2">
                          {isAr ? 'نسبة الوقف المتحرك (%)' : 'Trailing %'}
                        </label>
                        <input
                          type="number"
                          value={trailingPct}
                          onChange={e => setTrailingPct(Number(e.target.value))}
                          min={0.5} max={10} step={0.5}
                          className="w-full glass-input rounded-xl px-4 py-2.5 text-white focus:border-accent-blue outline-none text-left font-mono text-sm"
                        />
                        <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed bg-black/20 p-2 rounded-lg">
                          {isAr
                            ? `لو السعر ارتفع → يتحرك الوقف تلقائياً ليحافظ على فارق ${trailingPct}% لحماية أرباحك.`
                            : `SL automatically moves up to maintain a ${trailingPct}% gap below peak price.`}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="glass"
                  className="flex-1"
                  onClick={() => {
                    setShowCloseModal(false);
                    setSelectedTrade(null);
                  }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  variant={trailingEnabled ? 'primary' : 'danger'}
                  className="flex-1"
                  onClick={handleCloseTradeSubmit as any}
                  disabled={closing}
                >
                  {closing ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <span>{trailingEnabled ? (isAr ? 'حفظ' : 'Activate') : (isAr ? 'تأكيد الخروج' : 'Confirm Exit')}</span>
                  )}
                </Button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
