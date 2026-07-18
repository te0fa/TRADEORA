'use client';

import React, { useState, useEffect } from 'react';

export function DisclaimerModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('disclaimer_accepted');
      if (!accepted) {
        setShow(true);
      }
    } catch (e) {
      console.error('Error reading localStorage for disclaimer:', e);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('disclaimer_accepted', 'true');
      setShow(false);
    } catch (e) {
      console.error('Error writing localStorage for disclaimer:', e);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm px-4 font-sans">
      <div className="bg-[#1E293B] rounded-3xl p-6 border border-white/10 max-w-sm w-full shadow-2xl text-right">
        <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2 justify-end">
          <span>تنبيه مهم وإخلاء مسؤولية</span>
          <span>⚠️</span>
        </h3>
        
        <div className="text-[11px] text-slate-300 space-y-3 leading-relaxed mb-6">
          <p>
            منصة <strong>TRADEORA</strong> هي أداة مساعدة للتحليل الفني الإحصائي ودراسة حركة الأسعار.
          </p>
          <p>
            جميع الإشارات والأهداف المحسوبة بواسطة المؤشرات أو نماذج تعلم الآلة هي <strong>احتمالات رقمية وليست توصيات استثمارية مباشرة</strong> للبيع أو الشراء.
          </p>
          <p>
            التداول في أسواق المال ينطوي على مخاطر عالية، وأنت وحدك المسؤول مسؤولية كاملة عن قراراتك الاستثمارية وتحديد حجم صفقاتك.
          </p>
          <p className="text-amber-300 font-semibold">
            ⏱️ يرجى متابعة صفقاتك المفتوحة باستمرار وإدارتها بحرص وتفعيل شروط تصفية الأرباح والوقف.
          </p>
        </div>

        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span>أفهم وأوافق ✅</span>
        </button>
      </div>
    </div>
  );
}
