# TRADEORA EGX — CORPORATE ACTION ACCOUNTING SEMANTICS DESIGN
===================================================================
**Document ID:** DESIGN-CA-05.5.0  
**Status:** PROPOSED FOR APPROVAL (P0)  
**Scope:** Authoritative Accounting Rules, Portfolio Ledger Impact, Price Adjustment, and P&L Treatment for EGX Corporate Actions.

---

## 1. Executive Overview & Design Objectives
Tradeora EGX requires a mathematically rigorous, zero-phantom-P&L accounting engine for corporate actions. 
Historical splits, bonus shares, rights issues, and cash dividends must never trigger artificial gains or losses, nor distort performance metrics across `LEGACY_RESEARCH`, `CLEAN_OOS`, or `PRODUCTION` portfolio tiers.

---

## 2. Dimensional Impact Matrix (مصفوفة الأثر على الأبعاد الخمسة)

| نوع الحدث (Event Type) | أثر السعر (Price) | أثر الكمية (Quantity) | التدفق النقدي (Cash Flow) | متوسط التكلفة (Cost Basis) | معالجة الأرباح والخسائر (P&L Treatment) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Split / Reverse Split**<br>*(تجزئة / تجميع الأسهم)* | يتغير عكسياً بنسبة التجزئة<br>($P_{adj} = P / R$) | تتغير طردياً بنسبة التجزئة<br>($Q_{adj} = Q \times R$) | **لا يوجد**<br>(0 EGP) | ينخفض/يرتفع بنفس النسبة<br>($CB_{adj} = CB / R$) | **لا يوجد P&L وهمي**<br>(القيمة السوقية الإجمالية ثابتة 100%) |
| **Bonus Shares**<br>*(الأسهم المجانية)* | يتعدل السعر المرجعي يوم الاستحقاق<br>($P_{ex} = P / (1 + B)$) | تزيد بنسبة الأسهم المجانية<br>($Q_{adj} = Q \times (1 + B)$) | **لا يوجد**<br>(0 EGP) | ينخفض متوسط تكلفة السهم<br>($CB_{adj} = CB_{orig} / (1 + B)$) | **لا تحقق P&L رأس مالي**<br>إجمالي تكلفة المركز المحققة ثابتة |
| **Rights Issue**<br>*(اكتتاب زيادة رأس المال)* | يتعدل نظرياً يوم التجريد<br>($P_{ex} = \frac{P \cdot Q + Price_{sub} \cdot Q_{rights}}{Q + Q_{rights}}$) | تتغير حسب قرار المستثمر<br>(ممارسة / بيع / ترك) | **ممكن**<br>(خروج سيولة للممارسة أو دخول سيولة لبيع الحق) | يُعاد حسابه كمتوسط مرجح جديد عند الممارسة | **نموذج خيارات متقدم**<br>(انظر قسم حقوق الأولوية) |
| **Cash Dividend**<br>*(التوزيعات النقدية)* | لا يتعدل السعر التاريخي المخزن<br>(ينخفض السوق يوم الـ Ex-Div) | لا تتغير<br>(0 أسهم) | **زيادة نقديّات**<br>($Cash += Div \times Q - Tax$) | **لا يتغير**<br>يبقى متوسط السهم كما هو | **فصل تام في الأداء**<br>(Total Return = Price P&L + Dividend Cash) |

---

## 3. Detailed Accounting Semantics per Corporate Action

### 3.1 Split & Reverse Split (تجزئة وتجميع الأسهم)
- **القاعدة المحاسبية:** حدث محايد نقدياً ومالياً (Zero Value Impact Event).
- **التغير السعري:** إذا كانت نسبة التجزئة $R = 5$ (سهم واحد أصبح 5 أسهم)، ينخفض سعر السهم تاريخياً ولحظياً بقدر $1/5$.
- **قاعدة P&L:**
  $$\text{Position Value}_{\text{after}} = Q_{\text{adj}} \times P_{\text{adj}} = (Q \times 5) \times \left(\frac{P}{5}\right) = Q \times P = \text{Position Value}_{\text{before}}$$
- **السجل النقدي:** **لا يُنشأ أي سجل معاملة نقدية** (`cash_ledger_transactions`).
- **إعادة حساب التكلفة:** التكلفة الإجمالية المباشرة $Cost_{\text{total}} = Q \times CB$ تظل كما هي دون تغير، بينما $CB_{\text{per\_share}} = \frac{Cost_{\text{total}}}{Q_{\text{adj}}}$.

---

### 3.2 Bonus Shares (توزيع الأسهم المجانية)
- **القاعدة المحاسبية:** تمويل زيادة رأس المال من الاحتياطيات/الأرباح المبقاة وتوزيع أسهم بدون مقابل نقدي من المساهم.
- **التغير السعري والكمية:** إذا وُزع $0.20$ سهم مجاني لكل سهم ($B = 0.20$):
  $$Q_{\text{new}} = Q_{\text{old}} \times (1 + 0.20)$$
  $$CB_{\text{new}} = \frac{CB_{\text{old}}}{1 + 0.20}$$
- **السجل النقدي:** **لا يُنشأ سجل معاملة نقدية** لأن المساهم لم يدفع سيولة جديدة ولم يستلم سيولة.
- **معالجة P&L:** لا يُعتبر توزيع الأسهم المجانية دَخلاً نقدياً، بل إعادة توزيع للقيم الدفترية؛ وبالتالي يظل الربح غير المحقق (Unrealized P&L) مبنياً على القيمة السوقية الإجمالية للمركز المعدل مقابل التكلفة التاريخية الإجمالية المكتتبة.

---

### 3.3 Cash Dividends (التوزيعات النقدية)
- **القاعدة المحاسبية:** توزيع أرباح نقدية صريحة تُضاف لرصيد الحفظ النقدي للمحفظة.
- **التغير السعري:** لا يتم تعديل أسعار الشمعات التاريخية السابقة لليوم، بل يخصم السوق تلقائياً قيمة التوزيع في جلسة الـ Ex-Dividend Date.
- **السجل النقدي:** **يُنشأ سجل معاملة نقدية صريح** في `cash_ledger_transactions`:
  - `transaction_type`: `'DIVIDEND_INCOME'`
  - `amount_egp`: $Q \times \text{Dividend\_Per\_Share} \times (1 - \text{Tax\_Rate})$
  - `reference`: `company_id`, `ex_date`
- **معالجة P&L وتفكيك العائد (Total Return Architecture):**
  - **Capital P&L (أرباح رأس المال):** $\text{Market Price} - \text{Cost Basis}$.
  - **Dividend P&L (عائد التوزيعات):** إجمالي السيولة المودعة من التوزيعات النقدية.
  - **Total Return (العائد الإجمالي):** $\text{Capital P&L} + \text{Dividend P&L}$.

---

### 3.4 Rights Issue (اكتتاب زيادة رأس المال وحقوق الأولوية)

> [!WARNING]
> **قيد معمارى معروف (KNOWN ARCHITECTURAL LIMITATION):**
> تداول حقوق الأولوية (Rights Trading) في البورصة المصرية يتضمن قراراً استثمارياً اختيارياً للمستثمر بين 3 خيارات منفصلة:
> 1. **ممارسة الحق (Exercise):** ضخ سيولة جديدة بسعر الاكتتاب واستلام الأسهم.
> 2. **بيع الحق (Sell Rights):** بيع حق الاكتتاب في التداول وحصد سيولة نقدية.
> 3. **ترك الحق (Lapse):** انقضاء مهلة الاكتتاب وخسارة قيمة الحق.

#### نموذج التعامل في Tradeora EGX:
- **الموقف الافتراضي:** يتم تسجيل الحق كـ Asset مستقل موقتاً برمز تداول الحق (مثل `COMI_r1`).
- **شجرة القرار الاختياري:**
  - عند **الممارسة**: يُسجل استهلاك سيولة (`CASH_OUTFLOW`) بسعر الاكتتاب، وتضاف الأسهم الجديدة ليدخل المركز في متوسط حسابي مرجح جديد (Weighted Average Cost Basis):
    $$CB_{\text{combined}} = \frac{(Q_{\text{orig}} \times CB_{\text{orig}}) + (Q_{\text{rights}} \times Price_{\text{sub}})}{Q_{\text{orig}} + Q_{\text{rights}}}$$
  - عند **بيع الحق**: يُسجل كمكسب محقق منفصل لورقة الحق المالية دون المساس بمتوسط تكلفة السهم الأصلي.
  - عند **ترك الحق**: تُسجل خسارة كاملة لقيمة الحق المخصص دون المساس بأصل السهم.
- **التوثيق كقيد نظام:** التداولات التلقائية المدارة بالـ AI تفترض افتراضياً **تحديد سياسة مسبقة** (مثل التسييل الآلي للحقوق `Auto-Sell Rights` أو الممارسة التلقائية `Auto-Exercise` إذا توفرت السيولة)، وممنوع منعاً باتاً افتراض سلوك عشوائي دون تسجيل القرار في الـ Audit Log.

---

## 4. Authoritative Confirmation Source (مصدر التأكيد الرسمي)
- المصدر المعتمد والوحيد لتأكيد نسب الانقسامات، الأسهم المجانية، وتوزيعات الأرباح هو:
  **إفصاحات البورصة المصرية الرسمية (`EGX Official Disclosures & Bulletins`)** مضافاً إليها بيانات الـ Corporate Actions الصادرة من الشاكر والمقاصة المركزية MCDR.
- يمنع منعاً باتاً اعتماد أي تعديل سعري بناءً على قفزات أسعار شمعات Scrapers غير رسمية دون وجود سجل إفصاح مؤكد.

---

## 5. Summary Checklist & Approval Requirements

- [x] مصفوفة الأثر خماسية الأبعاد موثقة بالكامل لجميع الأحداث.
- [x] تحديد قواعد السجل النقدي (`cash_ledger_transactions`) والتكلفة الإجمالية بشكل صريح.
- [x] توثيق قيد التعامل مع اكتتابات الأسهم وحقوق الأولوية كقرار اختياري.
- [x] منع أي P&L وهمي أو تعديل عشوائي.

---
**اعتماد المستند:** بانتظار موافقة المستخدم للانتقال لتنفيذ `MICRO-STEP 05.5A`.
