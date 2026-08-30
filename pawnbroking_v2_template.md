# PawnBook Pro — Advanced Jewelry Pawn Broking ERP
> Professional Pawn Broking Management System · Version 2.0 · Build: Flutter SPA
> Industry Standards: Malabar Gold & Diamonds 

---

## 1. System Overview

**PawnBook Pro v2.0** is an enterprise-grade pawn broking system designed specifically for jewelry pawn brokers. It follows industry-leading practices from India's largest pawn brokers (Malabar Gold & Diamonds, etc.) with complete digital workflow for:

✓ **Customer Management** - KYC, identity verification, credit history  
✓ **Quick Pawn Entry** - Fast loan processing in < 3 minutes  
✓ **Valuation Engine** - Multi-metal support (Gold 22K/24K, Silver, Platinum)  
✓ **Vault Management** - Secure storage tracking with compartments  
✓ **Payment Processing** - Interest collection, partial payments, renewal, overdues  
✓ **Redemption** - Fast checkout with digital receipts  
✓ **Auction System** - Automated auction for unclaimed loans (legal compliance)  
✓ **Advanced Analytics** - ROI, default rates, portfolio health  

**Credential:** `mobile : 9345578103` / `pass : 123456`  
**Tech Stack:** 

- Frontend: Flutter → Dart
- Backend: Node.js + Express
- Database: MongoDB

---

## 2. What's New vs Standard Pawn Broking

### Features Added (Malabar/Oyalukas Inspired)

| Feature | Purpose | Industry Use |
|---------|---------|--------------|
| **Quick Pawn** | 90-second loan entry for repeat customers | Speed up counter operations |
| **KYC Verification** | Full Know-Your-Customer checks (Aadhaar, PAN, Photos) | Legal compliance & risk management |
| **Vault Management** | Track ornaments in secure vaults with shelf/box refs | Prevent loss, insurance claims |
| **Auto-Valuation** | Real-time ornament evaluation by metal/purity/weight | Fair pricing, customer confidence |
| **Smart Interest Calculator** | Compound, reducing, or flat interest options | Flexible business models |
| **Payment Plans** | Multi-part payments (weekly/monthly) | Improve collections |
| **Loan Renewal** | Extend maturity + reset interest on demand | Increase customer retention |
| **Partial Redemption** | Release partial ornaments while loan active | Improve customer satisfaction |
| **Overdue Management** | Progressive penalties + grace periods + auction prep | Minimize defaults |
| **Auction System** | Automated auction listing after 6 months default | Legal compliance (RBI rules) |
| **Digital Receipts** | WhatsApp/Email receipt delivery | Reduce paper, improve service |
| **Audit Trail** | Every transaction logged for compliance | Regulatory reporting (GST, RBI) |
| **Branch Management** | Multi-branch support with inventory sync | Expansion ready |

---

## 3. Application Architecture

```
App (root)
├── Login Screen
│   └── Multi-branch selection (if admin)
│
└── Authenticated Shell (per branch)
    ├── <Sidebar>           ← Quick access menu
    ├── <Topbar>            ← Rates + alerts + branch switcher
    └── <Page>              ← Dynamic content area
        ├── Dashboard        ← KPIs, daily collection, due reminders
        ├── Quick Pawn       ← 3-step fast entry (NEW)
        ├── New Pawn         ← Full form with valuation
        ├── Pawn List        ← All loans + filters + bulk actions
        ├── Vault Manager    ← Storage location tracking (NEW)
        ├── Payment Screen   ← Interest/partial/renewal/redemption
        ├── Redemption Hub   ← Fast checkout + digital receipt (NEW)
        ├── Overdue Manager  ← Collections + auction prep (NEW)
        ├── Rates            ← Daily rate updates
        ├── Reports          ← Advanced analytics
        ├── Audit Trail      ← Transaction history (NEW)
        └── Settings         ← Config + branch + users
```

---

## 4. Data Models

### Customer (Enhanced KYC)
```
{
  id              : "C001"
  name            : "Ramesh Kumar"
  mobile          : "9876543210"
  altMobile       : "9876540001"
  email           : "ramesh@example.com"
  
  // KYC Fields
  aadhaarNo       : "XXXX XXXX 4521"
  aadhaarVerified : true
  panNo           : "ABCPK1234D"
  panVerified     : true
  drivingLicense  : "DL01-AB1234-1234"
  voterId         : "VT12345678"
  
  // Personal
  dob             : "1985-03-15"
  gender          : "M" | "F" | "Other"
  occupation      : "Shopkeeper"
  monthlyIncome   : 45000
  address         : "12, Gandhi Nagar..."
  city            : "Chennai"
  state           : "Tamil Nadu"
  zipcode         : "600017"
  
  // Family
  nominee         : "Suresh Kumar"
  nomineeMob      : "9876501234"
  relation        : "Brother"
  
  // Business
  status          : "Active" | "Inactive" | "Blacklisted"
  kycStatus       : "Verified" | "Pending" | "Rejected"
  loyaltyPoints   : 150
  totalLoansCount : 12
  totalDefault    : 0
  creditScore     : 4.8         // out of 5 (calculated)
  riskLevel       : "Low" | "Medium" | "High"
  photo           : "base64-image"
  notes           : "Good payer, 5 years customer"
}
```

### Loan/Pawn (Advanced)
```
{
  id              : "L001"
  ticket          : "PWN-2025-0423"    // PWN-YYYY-NNNN
  customerId      : "C001"
  branchId        : "B001"             // for multi-branch
  
  // Dates & Terms
  loanDate        : "2025-03-15"
  maturityDate    : "2025-06-15"
  duration        : 3                  // months
  daysOverdue     : 0
  renewalCount    : 2
  
  // Amount & Rates
  principal       : 45000              // ₹
  interestType    : "Flat" | "Compound" | "Reducing"
  interestPct     : 2.5                // % per month
  gstPercent      : 18                 // GST applicable
  
  // Valuation
  totalGrossWt    : 25.5               // grams
  totalNetWt      : 24.8
  totalStoneWt    : 0.7
  eligiblePct     : 0.75               // 75% of market value
  marketValue     : 60000              // calculated
  collateralValue : 45000              // 75% of market
  ornaments       : [ OrnamentDetail ]
  
  // Status & Tracking
  status          : "Active" | "Overdue" | "Renewal" | "Redeemed" | "Auctioned"
  vaultRef        : "VAULT-A-12-3"     // vault location
  lockedBox       : "BOX-045"
  insured         : true
  insuranceRefNo  : "INS-2025-0045"
  
  // Payments & History
  amountPaid      : 12000              // total payments so far
  interestDue     : 3375
  penalty         : 0
  balancePayable  : 48375
  payments        : [ Payment ]
  
  // Notes
  condition       : "Good" | "Fair" | "Poor"
  notes           : "Chain has slight damage"
  observations    : "Customer promised renewal by 15th"
}
```

### OrnamentDetail (Enhanced)
```
{
  id              : "ORN-001"
  type            : "Gold Chain" | "Bangles" | "Ring" | "Pendant" | "Necklace"
  category        : "Jewelry" | "Antique" | "Heirloom" | "Broken"
  metal           : "Gold 22K" | "Gold 24K" | "Gold 18K" | "Silver" | "Platinum"
  purity          : "22K" | "24K" | "999" | "950"
  
  // Weight
  grossWt         : 12.5               // grams
  stone           : 0.7                // deducted
  net             : 11.8
  
  // Valuation
  rate            : 6250               // ₹ per gram (snapshot)
  rateDate        : "2025-05-21"
  value           : 73750              // net × rate
  comment         : "Good quality, old design"
  
  // Verification
  tested          : true
  testDate        : "2025-03-15"
  verifiedBy      : "Ravi Sharma"
  certNo          : "CERT-2025-0045"
  photos          : ["url1", "url2"]   // high-res photos
}
```

### Payment (Enhanced)
```
{
  id              : "PMT-001"
  loanId          : "L001"
  customerId      : "C001"
  date            : "2025-05-15"
  
  // Type
  type            : "Interest" | "Partial" | "Full Settlement" | "Renewal" | "Redemption"
  
  // Amount
  principal       : 5000
  interest        : 2500
  gst             : 450
  penalty         : 0
  totalAmount     : 7950
  amountReceived  : 8000
  change          : 50
  
  // Mode
  mode            : "Cash" | "Card" | "UPI" | "Cheque" | "Bank Transfer"
  refNo           : "GPay-TXN-12345"
  
  // Status
  status          : "Success" | "Pending" | "Reconciled" | "Reversed"
  receiptNo       : "RCP-2025-0523"
  receiptSent     : true
  receiptChannel  : "WhatsApp" | "Email" | "Print"
  
  // Staff & Notes
  collectedBy     : "Ravi Sharma"
  notes           : "Customer renewed early"
}
```

### VaultCompartment (NEW - Storage Tracking)
```
{
  id              : "VAULT-A-12-3"
  branchId        : "B001"
  vaultName       : "Main Vault - Safe A"
  compartmentNo   : 12
  boxNo           : 3
  capacity        : 100                // items
  currentItems    : 45
  temperature     : 18.5               // °C for monitoring
  lastAudited     : "2025-05-20"
  location        : { lat, lng }
  loanIds         : ["L001", "L002"]   // ornaments stored here
  accessLog       : [ AccessEntry ]
}
```

### AuctionLot (NEW - Legal Compliance)
```
{
  id              : "AUC-001"
  date            : "2025-09-15"       // 6 months after loan default
  loans           : [ { loanId, ticketNo, estimatedValue } ]
  estimatedTotal  : 750000
  status          : "Scheduled" | "Live" | "Completed"
  venue           : "Head Office Auction Hall"
  biddingStartTime: "10:00 AM"
  auctioneer      : "Legal Officer"
  terms           : "As per RBI guidelines"
  results         : { soldItems: [], unsold: [] }
}
```

### Branch (NEW - Multi-branch Support)
```
{
  id              : "B001"
  name            : "Chennai Main"
  code            : "CHN001"
  manager         : "Suresh Kumar"
  phone           : "044-28340987"
  mobile          : "9876543210"
  email           : "chn@srilakshmipawn.com"
  address         : "123 Gandhi Nagar..."
  city            : "Chennai"
  
  // Operations
  openTime        : "10:00 AM"
  closeTime       : "7:00 PM"
  holidays        : ["2025-08-15", "2025-10-02"]  // national holidays
  vaults          : ["VAULT-A", "VAULT-B"]
  staff           : ["Ravi", "Kumar", "Priya"]
}
```

---

## 5. Screen-by-Screen UI & Logic

### 5.1 Login
(Same as v1.0 with branch selection for admins)

---

### 5.2 App Shell (Sidebar + Topbar)

#### Enhanced Sidebar
```
┌──────────────────────────────┐
│ [PB]  PawnBook Pro           │
│       Jewelry Broking v2.0   │
├──────────────────────────────┤
│ 📊 Dashboard                 │
│ ⚡ Quick Pawn          (NEW) │  ← Fast 90-second entry
│ 📝 New Pawn                  │
│ 📋 All Pawns           [12]  │
│ 🏦 Vault Manager       (NEW) │
│ 💳 Payments            [5]   │
│ 🎯 Redemption          (NEW) │
│ ⚠️  Overdue Manager     (NEW) │
│ 📈 Auctions            (NEW) │
│ 💰 Rates                     │
│ 📊 Reports                   │
│ 🔔 Reminders           [3]   │
│ ⏳ Audit Trail          (NEW) │
│ ⚙️  Settings                  │
│                              │
│ [👤 Ravi Sharma] [🚪 Logout] │
└──────────────────────────────┘
```

#### Enhanced Topbar
```
┌─────────────────────────────────────────────────────┐
│  📍 Chennai Main (Branch) | ⚠️  3 Overdue | 🎯 3 Due Today  │
│                                                     │
│  📊 Gold 22K: ₹6,250/gm | Gold 24K: ₹6,820/gm | Silver: ₹82  │
│                                                     │
│  🔔 [2 New Reminders] | 📞 Customer Call Required │
└─────────────────────────────────────────────────────┘
```

---

### 5.3 Dashboard (Enhanced)

```
┌──────────────────────────────────────────────────────────────┐
│  Dashboard                          [📊 Today] [📅 This Week] │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Today      │  │  This Month │  │  Overall    │            │
│  │ Collection  │  │  Interest   │  │  Portfolio  │            │
│  │  ₹1,25,000  │  │  ₹45,23,000 │  │  ₹89,50,000 │            │
│  │  [15 txn]   │  │  Collected  │  │  In Active  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                │
│  📍 Quick Actions                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ ⚡ Quick     │  │ 📝 New       │  │ 🎯 Collect   │        │
│  │    Pawn      │  │    Pawn      │  │   Payment    │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                │
│  ⚠️  TODAY'S ALERTS                                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 3 loans DUE TODAY - Click to collect                   │  │
│  │ 1 loan OVERDUE (2 days) - Priority follow-up needed    │  │
│  │ Vault Audit Due - Schedule for end of week            │  │
│  │ 2 loans expiring in 5 days - Customer reminders sent   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  📊 COLLECTION SUMMARY                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Today Collected    : ₹1,25,000 (15 txn)               │  │
│  │ This Week Expected : ₹3,45,000                        │  │
│  │ This Month Expected: ₹12,34,000                       │  │
│  │ Overdue Amount     : ₹45,000                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  📈 RECENT TRANSACTIONS                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ticket  │ Customer    │ Type      │ Amount │ Time    │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │PWN-0421 │ Ramesh      │ Interest  │ ₹2,500 │ 11:45   │  │
│  │PWN-0420 │ Priya       │ Partial   │ ₹5,000 │ 11:23   │  │
│  │PWN-0419 │ Suresh      │ Settlement│ ₹8,950 │ 10:56   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.4 Quick Pawn (Fast Entry - NEW)

**Purpose:** 90-second pawn entry for regular customers. Skip full KYC, auto-fill known details.

```
┌──────────────────────────────────────────────────────────────┐
│  ⚡ Quick Pawn - Fast Entry (90 seconds)                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  STEP 1: SELECT CUSTOMER                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Search or Select: [_____________________] 🔍            │ │
│  │                                                          │ │
│  │ [X] Ramesh (C001) - Last loan: 35 days ago            │ │
│  │ [X] Priya (C002)   - Active loan: ₹25,000             │ │
│  │ [X] Suresh (C003)  - Last: 45 days ago                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                │
│  STEP 2: QUICK ORNAMENT ENTRY                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Type:    [Gold Chain      ▼]                           │ │
│  │ Metal:   [Gold 22K        ▼]  Rate: ₹6,250/gm        │ │
│  │ Weight:  [______] gm    Stone: [____] gm             │ │
│  │                           Net: 11.8 gm              │ │
│  │ Value:   ₹73,750 (auto-calculated)                  │ │
│  │                                                      │ │
│  │ [+ Add More Ornament]                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                                │
│  STEP 3: LOAN AMOUNT (Auto-suggested)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Collateral Value    : ₹73,750 (100%)                 │ │
│  │ Eligible (75%)      : ₹55,312                        │ │
│  │                                                      │ │
│  │ Your Loan Amount    : [55312      ] ₹                │ │
│  │                      (Can adjust ±10%)              │ │
│  │                                                      │ │
│  │ Duration  : [3 months ▼]                            │ │
│  │ Interest  : 2.5% × 3 = ₹4,148.4  (auto)             │ │
│  │                                                      │ │
│  │ Maturity  : 2025-08-15  (auto-calc)                 │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                                │
│  [CANCEL]  [VAULT LOCATION ▼]  [✓ CONFIRM & PRINT TICKET]  │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.5 Customer List & KYC Management

```
┌──────────────────────────────────────────────────────────────┐
│  Customers (342)                    [+ Add New] [📊 Export]   │
├──────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] [Risk: All ▼] [Status: Active ▼]           │
│  Search: [_____________________]                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Name     │ Phone      │ Risk  │ KYC Status │ Score │ Loan││
│  ├──────────────────────────────────────────────────────────┤│
│  │ Ramesh   │ 9876543210 │ 🟢Low │ ✅ Verified│ 4.8/5 │ 2 ││
│  │ Priya    │ 9876540001 │ 🟡Med │ ⏳ Pending │ 3.9/5 │ 1 ││
│  │ Suresh   │ 9876501234 │ 🔴High│ ❌ Rejected│ 1.2/5 │ 0 ││
│  │ Anjali   │ 9876502345 │ 🟢Low │ ✅ Verified│ 4.5/5 │ 5 ││
│  │                                                           ││
│  │ [Previous]  [Page 1 of 23]  [Next]                       ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Quick Actions: [View Profile] [Edit KYC] [View Loans]       │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.6 Customer Profile (Enhanced)

```
┌──────────────────────────────────────────────────────────────┐
│  Ramesh Kumar (C001)  🟢 Active   ⭐⭐⭐⭐⭐                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─────────────────┐  PERSONAL DETAILS                       │
│  │                 │  ─────────────────────────             │
│  │   [📷 Photo]    │  Phone: 9876543210 / 9876540001        │
│  │                 │  Email: ramesh@example.com             │
│  │                 │  DOB: 15-Mar-1985 (40 yrs old)         │
│  └─────────────────┘  Occupation: Shopkeeper                │
│                       City: Chennai | State: Tamil Nadu     │
│                                                                │
│  KYC VERIFICATION                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✅ Aadhaar: XXXX XXXX 4521 (Verified 12-Mar-2025)    │ │
│  │ ✅ PAN: ABCPK1234D (Verified 01-Jan-2024)            │ │
│  │ ✅ Driving License: DL01-AB1234-1234 (On file)       │ │
│  │ ⏳ Voter ID: Pending verification                    │ │
│  │ KYC Score: 95/100 (Verified)                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  LOAN HISTORY & STATISTICS                                  │
│  ┌─────────┬─────────┬──────────┬──────────┬──────────┐    │
│  │ Total   │ Active  │ Defaulted│ Avg Loan │ Credit   │    │
│  │ Loans   │ Loans   │ Loans    │ Amount   │ Score    │    │
│  ├─────────┼─────────┼──────────┼──────────┼──────────┤    │
│  │ 12      │ 2       │ 0        │ ₹42,500  │ 4.8/5 🟢 │    │
│  └─────────┴─────────┴──────────┴──────────┴──────────┘    │
│                                                                │
│  ACTIVE LOANS                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Ticket  │ Amount  │ Status    │ Due Date │ Action   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │PWN-0401 │ ₹45,000 │ Active    │ 15-Jun   │ [Collect]│ │
│  │PWN-0402 │ ₹32,000 │ Overdue   │ 05-May   │ [⚠️ Due] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  NOMINEE INFO                                                │
│  Suresh Kumar | Relation: Brother | Phone: 9876501234       │
│                                                                │
│  [Edit] [+ New Loan] [View All Loans] [View Transactions]  │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.7 Loan/Pawn Management (Enhanced List)

```
┌──────────────────────────────────────────────────────────────┐
│  All Pawns (87)                    [⚡ Quick] [📝 New] [📊 Export]
├──────────────────────────────────────────────────────────────┤
│  Status: [All ▼] | Due: [All ▼] | Days Overdue: [All ▼]     │
│  Metal: [All ▼]  | Branch: [All Branches ▼]                 │
│  Search: [_____________________]                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐│
│  │ Ticket    │ Customer    │ Amount  │ Due Date │ Status   ││
│  ├──────────────────────────────────────────────────────────┤│
│  │ PWN-0421  │ Ramesh      │ ₹45,000 │ 15-Jun  │ 🟢 Active ││
│  │ PWN-0420  │ Priya       │ ₹32,000 │ 05-May  │ 🔴 3 Days ││
│  │ PWN-0419  │ Suresh      │ ₹28,500 │ 20-Jun  │ 🟢 Active ││
│  │ PWN-0418  │ Anjali      │ ₹15,000 │ 10-May  │ 🔴 5 Days ││
│  │ PWN-0417  │ Vikram      │ ₹67,000 │ 01-Jun  │ 🟡 Alert  ││
│  │                                                           ││
│  │ [Page 1 of 9]                                            ││
│  └──────────────────────────────────────────────────────────┘│
│                                                                │
│  Bulk Actions: [Collect Interest] [Send Reminders] [Renew]  │
│                [Mark as Auctioned] [Generate Reports]       │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.8 Valuation & Ornament Details (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  Loan: PWN-0421 (Ramesh) | Ornament Details & Valuation     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ORNAMENT 1: GOLD CHAIN                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ [📸 Photo 1] [📸 Photo 2] [📸 Photo 3]               │ │
│  │                                                        │ │
│  │ Type          : Gold Chain (22K)                      │ │
│  │ Category      : Jewelry (Regular use)                │ │
│  │ Metal/Purity  : 22K Gold                            │ │
│  │                                                        │ │
│  │ Weight Details:                                       │ │
│  │   Gross Weight: 12.5 gm                             │ │
│  │   Stone Deduct: 0.7 gm (deducted)                  │ │
│  │   Net Weight  : 11.8 gm                            │ │
│  │                                                        │ │
│  │ Valuation:                                            │ │
│  │   Rate Date   : 15-Mar-2025                         │ │
│  │   Rate        : ₹6,250/gm (22K Gold)               │ │
│  │   Market Value: 11.8 × 6,250 = ₹73,750            │ │
│  │   Condition   : Good (slight wear at clasp)         │ │
│  │   Eligible (75%): ₹55,312                          │ │
│  │                                                        │ │
│  │ Verification:                                         │ │
│  │   ✅ Tested       : Yes (15-Mar-2025)              │ │
│  │   Tested By   : Ravi Sharma                        │ │
│  │   Certificate : CERT-2025-0045                    │ │
│  │   Comment     : "Good quality, old design"         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                                │
│  TOTAL LOAN COLLATERAL                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Total Ornaments  : 3 items                           │ │
│  │ Total Gross Wt   : 32.5 gm                          │ │
│  │ Total Net Wt     : 31.2 gm                          │ │
│  │ Total Market Val : ₹95,000                          │ │
│  │ Total Eligible   : ₹71,250 (75%)                    │ │
│  │ LOAN AMOUNT      : ₹45,000 (62.2% utilization)    │ │
│  │ Remaining Buffer : ₹26,250 (37.8%)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Edit Ornament] [Update Valuation] [Print Certificate]    │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.9 Vault/Storage Management (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  🏦 Vault Manager - Secure Storage Tracking                  │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  SELECT VAULT: [Main Vault - Safe A ▼] | Audit: ✅ 20-May   │
│                                                                │
│  PHYSICAL LAYOUT                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Compartments (12)                                     │ │
│  │                                                        │ │
│  │  [ 1: 12% ][ 2: 25% ][ 3:100%][ 4: 35% ]            │ │
│  │  [ 5: 08% ][ 6: 18% ][ 7: 45% ][ 8: 62% ]            │ │
│  │  [ 9: 92% ][10: 15% ][11: 55% ][12: 40% ]            │ │
│  │                                                        │ │
│  │ Click on a compartment to view contents               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  COMPARTMENT 3 DETAILS (Currently 100% Full)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Capacity: 100 items | Items Inside: 100              │ │
│  │ Temperature: 18.5°C | Last Audit: 20-May-2025        │ │
│  │ Insurance: ₹25,50,000                                │ │
│  │                                                        │ │
│  │ Loans Stored Here:                                   │ │
│  │ ┌──────────────┬──────────┬──────────┐                │ │
│  │ │ Ticket       │ Customer │ Value    │                │ │
│  │ ├──────────────┼──────────┼──────────┤                │ │
│  │ │ PWN-0421     │ Ramesh   │ ₹73,750  │                │ │
│  │ │ PWN-0420     │ Priya    │ ₹42,000  │                │ │
│  │ │ ... 98 more  │          │          │                │ │
│  │ └──────────────┴──────────┴──────────┘                │ │
│  │ [Move Loan to Another Compartment]  [Export Audit]   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  VAULT MONITORING                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Temperature Graph (24-hour): [Graph Chart]            │ │
│  │ Access Log (Last 5):                                 │ │
│  │   15:45 | Ravi Sharma | Retrieved PWN-0420          │ │
│  │   14:23 | Kumar     | Stored PWN-0421              │ │
│  │   12:00 | Priya     | Audit Check                  │ │
│  │   ...                                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Schedule Audit] [Download Report] [Insurance Claim Form]   │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.10 Payment Collection (Advanced)

```
┌──────────────────────────────────────────────────────────────┐
│  💳 Payment Collection - Loan: PWN-0421 (Ramesh)             │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  LOAN SUMMARY                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Principal      : ₹45,000                              │ │
│  │ Duration       : 3 months (15-Mar to 15-Jun-2025)    │ │
│  │ Interest Rate  : 2.5% per month                      │ │
│  │ Monthly Int    : ₹1,125                              │ │
│  │ Status         : 🟢 Active (0 days overdue)          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  PAYMENT BREAKDOWN                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Interest Due       : ₹3,375 (3 months @ 2.5%)        │ │
│  │ Penalty Due        : ₹0 (No penalty - not overdue)   │ │
│  │ GST on Interest    : ₹607.50 (18%)                   │ │
│  │ ────────────────────────────────────                 │ │
│  │ INTEREST PAYMENT   : ₹3,982.50                       │ │
│  │                                                        │ │
│  │ Principal Outstanding: ₹45,000                        │ │
│  │ FULL SETTLEMENT    : ₹48,982.50                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  PAYMENT TYPE                                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ (●) Interest Only          (○) Partial Payment        │ │
│  │ (○) Full Settlement        (○) Loan Renewal          │ │
│  │                                                        │ │
│  │ Selected: Interest Only                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  AMOUNT & MODE                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Amount Due        : ₹3,982.50                         │ │
│  │ Customer Offers   : [____________] ₹                 │ │
│  │ Change to Return  : ₹0 (auto-calculated)             │ │
│  │                                                        │ │
│  │ Payment Mode:                                         │ │
│  │ (●) Cash    (○) Card    (○) UPI    (○) Cheque       │ │
│  │ (○) Bank Transfer                                    │ │
│  │                                                        │ │
│  │ Notes: [________________________________]            │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  [CANCEL] [GENERATE RECEIPT] [CONFIRM & SAVE] [PRINT]      │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.11 Loan Renewal & Extension (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  🔄 Loan Renewal - Extend Your Loan Period                   │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  CURRENT LOAN STATUS                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Ticket            : PWN-0401                          │ │
│  │ Original Due Date : 15-Jun-2025 (Matures in 5 days)  │ │
│  │ Principal         : ₹45,000                          │ │
│  │ Interest Paid     : ₹2,250 (2 months)                │ │
│  │ Interest Due      : ₹1,125 (1 month remaining)       │ │
│  │ Renewal Count     : 2 (Previously renewed 2 times)   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  RENEWAL OPTIONS                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Renew Current Principal (₹45,000)                    │ │
│  │ ┌──────────────────────────────────────────────────┐ │ │
│  │ │ Additional Duration: [3 months ▼]               │ │ │
│  │ │ New Maturity Date  : 15-Sep-2025              │ │ │
│  │ │ New Interest Rate  : 2.5% per month (same)     │ │ │
│  │ │ Additional Interest: ₹3,375 (3 months)         │ │ │
│  │ │ GST                : ₹607.50                    │ │ │
│  │ │ Total Renewal Cost : ₹3,982.50                 │ │ │
│  │ │                                                  │ │ │
│  │ │ [✓ Select This Option]                          │ │ │
│  │ └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │ Increase Loan Amount (If collateral allows)         │ │
│  │ ┌──────────────────────────────────────────────────┐ │ │
│  │ │ Eligible Amount    : ₹71,250 (75% of value)     │ │ │
│  │ │ Current Loan       : ₹45,000                    │ │ │
│  │ │ Can Increase By    : ₹26,250                    │ │ │
│  │ │ Additional Borrowing: [_______________] ₹      │ │ │
│  │ │ New Total Loan     : ₹45,000 (auto-updated)    │ │ │
│  │ │ New Interest       : ₹3,375 (calculated)       │ │ │
│  │ │                                                  │ │ │
│  │ │ [✓ Select This Option]                          │ │ │
│  │ └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  PAYMENT REQUIRED TODAY                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Current Interest Due : ₹1,125                         │ │
│  │ Renewal Interest     : ₹3,375                         │ │
│  │ GST (18%)            : ₹607.50                        │ │
│  │ ────────────────────────────────────                 │ │
│  │ TOTAL DUE            : ₹5,107.50                      │ │
│  │                                                        │ │
│  │ OR (Auto-deducted from principal):                   │ │
│  │ Net Principal After Deduction: ₹39,892.50          │ │
│  │                                                        │ │
│  │ Payment Mode: (●) Cash   (○) Card   (○) UPI        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  [CANCEL] [CONFIRM RENEWAL] [PRINT DOCUMENT]               │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.12 Redemption Process (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  🎯 Redemption - Get Your Ornaments Back                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  REDEMPTION TYPE                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ (●) Full Redemption (Get all ornaments)              │ │
│  │ (○) Partial Redemption (Get some ornaments)          │ │
│  │ (○) Graduated Redemption (Phased pickup)             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  LOAN SETTLEMENT (Full Redemption)                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Loan Ticket       : PWN-0421                          │ │
│  │ Customer          : Ramesh Kumar                      │ │
│  │ Loan Amount       : ₹45,000                           │ │
│  │ Duration          : 3 months (15-Mar to 15-Jun)      │ │
│  │ Interest Rate     : 2.5% per month                   │ │
│  │                                                        │ │
│  │ Settlement Breakdown:                                 │ │
│  │ ├─ Principal           : ₹45,000                      │ │
│  │ ├─ Interest (3 months) : ₹3,375                      │ │
│  │ ├─ GST (18%)           : ₹607.50                      │ │
│  │ ├─ Penalty             : ₹0 (No overdue)             │ │
│  │ ├─ Insurance Fee       : ₹50 (vault storage)         │ │
│  │ └─ TOTAL PAYABLE       : ₹49,032.50                  │ │
│  │                                                        │ │
│  │ Amount Received       : [____________] ₹             │ │
│  │ Change to Return      : ₹0 (auto-calculated)        │ │
│  │                                                        │ │
│  │ Payment Mode: (●) Cash  (○) Card  (○) UPI  (○) Bank │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  ORNAMENTS TO RELEASE                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ☑ Gold Chain (22K) - 11.8 gm - ₹73,750             │ │
│  │ ☑ Gold Bangles (24K) - 15.2 gm - ₹103,664          │ │
│  │ ☑ Diamond Ring (22K) - 4.2 gm - ₹26,250            │ │
│  │                                                        │ │
│  │ Total Ornaments: 3 items | Total Wt: 31.2 gm       │ │
│  │ Vault Location: VAULT-A-12-3                        │ │
│  │ Release Authority: Ravi Sharma                      │ │
│  │                                                        │ │
│  │ Condition Check Before Release: (●) Verified       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  DIGITAL RECEIPT & HANDOVER                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Receipt Mode: (●) Print  (○) Email  (○) WhatsApp     │ │
│  │ Email        : [ramesh@example.com         ]         │ │
│  │ WhatsApp No  : [9876543210                  ]         │ │
│  │                                                        │ │
│  │ ☑ Generate Digital Certificate of Redemption        │ │
│  │ ☑ Send via WhatsApp + Email                         │ │
│  │ ☑ Print Handover Slip                               │ │
│  │ ☑ Update Insurance Closure                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  [CANCEL] [CONFIRM & COMPLETE REDEMPTION] [PRINT RECEIPT]   │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.13 Auction for Defaulted Loans (NEW)

```
┌──────────────────────────────────────────────────────────────┐
│  📈 Auction Manager - Legal Compliance & Sale                │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  AUCTION SCHEDULE                                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Upcoming Auction: 15-Sep-2025 | Venue: Head Office   │ │
│  │ Bidding Starts: 10:00 AM | Auctioneer: Legal Team   │ │
│  │ Estimated Lots: 24 | Estimated Value: ₹8,50,000     │ │
│  │ Status: 📋 SCHEDULED (Auction form filed with RBI)   │ │
│  │                                                        │ │
│  │ [View Legal Documents] [Print Auction Notice]        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  DEFAULTED LOANS IN AUCTION (6+ Months Overdue)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ #  │ Ticket   │ Customer  │ Value   │ Overdue  │ Status ││
│  ├────┼──────────┼───────────┼─────────┼──────────┼────────┤│
│  │ 1  │ PWN-2401 │ Suresh    │ ₹62,000 │ 240 days │ 📋 Lot │ │
│  │ 2  │ PWN-2402 │ Vikram    │ ₹45,300 │ 198 days │ 📋 Lot │ │
│  │ 3  │ PWN-2403 │ Deepak    │ ₹38,500 │ 185 days │ 📋 Lot │ │
│  │ 4  │ PWN-2404 │ Arjun     │ ₹71,200 │ 172 days │ 📋 Lot │ │
│  │ ... (20 more)                                            │ │
│  │                                                           │ │
│  │ [View Details] [Print Auction Lot Info]                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  AUCTION RULES (RBI Compliance)                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ • Loans must be 6+ months overdue before auction      │ │
│  │ • Minimum bid = 80% of collateral value               │ │
│  │ • Registered auctioneers only (licensed)              │ │
│  │ • Public notification 30 days before auction          │ │
│  │ • Sale proceeds after deducting all charges           │ │
│  │ • Surplus returned to customer; Deficit remains debt │ │
│  │ • Unsold items returned to customer (if claimed)      │ │
│  │ • Detailed auction proceedings filed with RBI         │ │
│  │                                                        │ │
│  │ [Download RBI-Compliant Auction Form]                 │ │
│  │ [Print Public Notice for Notification]                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  AUCTION RESULTS (Previous Auction: 15-Aug-2025)             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Total Lots: 22 | Sold: 18 (81%) | Unsold: 4 (19%)   │ │
│  │ Total Realized: ₹7,45,320 | Avg Price: ₹41,406 per   │ │
│  │ Default Recovery Rate: 87.5%                          │ │
│  │                                                        │ │
│  │ [View Detailed Report] [Download Certificate]         │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.14 Gold & Silver Rates Management

```
┌──────────────────────────────────────────────────────────────┐
│  💰 Precious Metal Rates - Today's Market                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  UPDATE TODAY'S RATES                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Date: 21-May-2025  [📅 Other Date]                    │ │
│  │                                                        │ │
│  │ Gold 22K    : [6250]   ₹/gram  (↑ 10 from yesterday) │ │
│  │ Gold 24K    : [6820]   ₹/gram  (→ no change)         │ │
│  │ Silver      : [82  ]   ₹/gram  (↓ 1 from yesterday)  │ │
│  │ Platinum    : [3500]   ₹/gram  (↑ 25 from yesterday) │ │
│  │                                                        │ │
│  │ [SAVE RATES] [LOAD FROM API] [IMPORT CSV]             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  RATE TRENDS (30 days)                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Gold 22K Trend Chart:                                 │ │
│  │ [Line Chart showing 30-day price movement]            │ │
│  │                                                        │ │
│  │ High: ₹6,320 | Low: ₹6,180 | Avg: ₹6,245            │ │
│  │ Today: ₹6,250 (Trending ↑ stable)                     │ │
│  │                                                        │ │
│  │ [Export Chart] [Print for Record]                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  HISTORICAL RATES (Last 10 entries)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Date      │ Gold 22K │ Gold 24K │ Silver │ Platinum  ││
│  ├────────────────────────────────────────────────────────┤│
│  │ 21-May    │ 6,250    │ 6,820    │ 82     │ 3,500     ││
│  │ 20-May    │ 6,240    │ 6,810    │ 83     │ 3,475     ││
│  │ 19-May    │ 6,235    │ 6,800    │ 83     │ 3,450     ││
│  │ ... (7 more)                                          ││
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.15 Reports & Analytics (Advanced)

```
┌──────────────────────────────────────────────────────────────┐
│  📊 Advanced Reports & Business Analytics                    │
├──────────────────────────────────────────────────────────────┤
│  Report Type: [Daily Summary ▼] | Period: [May 2025 ▼]      │
│                                                                │
│  KEY METRICS                                                 │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐│
│  │ Collections │ Avg Loan    │ Default %   │ Interest %   ││
│  │ ₹12,34,000  │ ₹42,500     │ 2.1%        │ 18.5%        ││
│  └─────────────┴─────────────┴─────────────┴──────────────┘│
│                                                                │
│  DETAILED BREAKDOWNS                                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Collection by Payment Type                         │ │
│  │    Interest Payments  : ₹5,23,000 (42%)              │ │
│  │    Partial Payments   : ₹3,21,000 (26%)              │ │
│  │    Full Settlements   : ₹2,81,000 (23%)              │ │
│  │    Renewals          : ₹1,09,000 (9%)                │ │
│  │                                                        │ │
│  │ 2. Portfolio Health                                  │ │
│  │    Active Loans      : 87 (67%)  Portfolio: ₹28L    │ │
│  │    Overdue 1-30 days : 12 (9%)   Amount: ₹4.2L      │ │
│  │    Overdue 30+ days  : 18 (14%)  Amount: ₹6.8L      │ │
│  │    Redeemed          : 234 (-)   Recovered: ₹89L     │ │
│  │    Auctioned         : 24 (-)    Realized: ₹7.45L    │ │
│  │                                                        │ │
│  │ 3. Customer Demographics                             │ │
│  │    Total Customers   : 342                           │ │
│  │    Active Borrowers  : 132 (38%)                     │ │
│  │    Repeat Rate       : 73% (Good retention)          │ │
│  │    Avg Credit Score  : 3.8/5.0                       │ │
│  │                                                        │ │
│  │ 4. Revenue & Profitability                           │ │
│  │    Total Interest Received  : ₹34,56,000 YTD        │ │
│  │    Total GST Collected      : ₹6,22,080 YTD         │ │
│  │    Processing Fees          : ₹1,23,000 YTD         │ │
│  │    Gross Revenue            : ₹42,01,080 YTD        │ │
│  │    (Less: Vault storage, insurance, staff) = ₹18L  │ │
│  │    Net Profit               : ₹24,01,080 YTD        │ │
│  │                                                        │ │
│  │ 5. Branch Comparison (Top 3)                        │ │
│  │    Chennai Main  : ₹34.5L YTD | 127 customers       │ │
│  │    Bangalore     : ₹28.2L YTD | 98 customers        │ │
│  │    Hyderabad     : ₹22.1L YTD | 75 customers        │ │
│  │                                                        │ │
│  │ [Export PDF] [Print] [Email Report] [Custom Date]   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.16 Reminders & Follow-ups (Enhanced)

```
┌──────────────────────────────────────────────────────────────┐
│  🔔 Smart Reminders & Follow-up Management                   │
├──────────────────────────────────────────────────────────────┤
│  Filter: [All ▼] | Show: [Pending ▼] | Send via: [All ▼]   │
│                                                                │
│  TODAY'S REMINDERS (8)                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔴 CRITICAL - Overdue Collection (2)                  │ │
│  │ ├─ PWN-0401 (Ramesh) - 5 days overdue - ₹1,125 due  │ │
│  │ │  [📞 Call] [📱 SMS] [📧 Email] [Mark Done]          │ │
│  │ │                                                      │ │
│  │ └─ PWN-0402 (Vikram) - 3 days overdue - ₹2,350 due  │ │
│  │    [📞 Call] [📱 SMS] [📧 Email] [Mark Done]          │ │
│  │                                                        │ │
│  │ 🟡 WARNING - Due Within 3 Days (5)                    │ │
│  │ ├─ PWN-0420 (Priya) - Due in 1 day - ₹3,200 due     │ │
│  │ ├─ PWN-0421 (Suresh) - Due in 2 days - ₹2,100 due   │ │
│  │ ├─ PWN-0422 (Anjali) - Due in 3 days - ₹4,500 due   │ │
│  │ │                                                      │ │
│  │ 🟢 INFO - Expiring Soon (1)                           │ │
│  │ └─ PWN-0419 (Kumar) - Due in 7 days - Renewal option │ │
│  │                                                        │ │
│  │ ✅ COMPLETED - Follow-ups Done (12)                   │ │
│  │ ├─ PWN-0417 (Deepak) - Redeemed 21-May              │ │
│  │ ├─ PWN-0418 (Arjun) - Renewed 20-May                │ │
│  │ ... (10 more)                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                                │
│  BULK ACTIONS                                                │
│  [Send SMS to All Due] [Send Email to All Overdue]          │
│  [Generate Call List] [Create Follow-up Report]             │
│  [WhatsApp Broadcast] [Export Contact List]                 │
└──────────────────────────────────────────────────────────────┘
```

---

### 5.17 Settings & Configuration (Enhanced)

```
┌──────────────────────────────────────────────────────────────┐
│  ⚙️  Settings & Business Configuration                       │
├────────────────┬────────────────────────────────────────────┤
│ 🏢 Company     │ COMPANY PROFILE                           │
│ 🏪 Branch      │ ┌──────────────────────────────────────┐ │
│ 💰 Interest    │ │ Shop Logo: [Upload Zone]             │ │
│ 🖨 Receipt     │ │ Shop Name: Sri Lakshmi Pawn Brokers  │ │
│ 👥 Users       │ │ Reg. No: RB/2023/0045               │ │
│ 🔐 Security    │ │ GST: 33ABCDE1234F1Z5                │ │
│ 📋 Audit       │ │ Address: 123 Gandhi Nagar, T Nagar   │ │
│ 📧 API Config  │ │ Phone: 044-28340987                 │ │
│ 🌐 SMS/Email   │ │ Mobile: 9876543210                  │ │
│                │ │ Email: info@srilakshmipawn.com       │ │
│                │ │ Website: www.srilakshmipawn.com      │ │
│                │ │ RBI License Expires: 15-Dec-2026     │ │
│                │ │                                      │ │
│                │ │ Insurance Provider: XYZ Insurance    │ │
│                │ │ Insurance Amount: ₹50,00,000        │ │
│                │ │ Policy No: INSP-2025-0045            │ │
│                │ │                                      │ │
│                │ │ [📞 Contact Details]                 │ │
│                │ │ [✉️ Email Templates]                 │ │
│                │ │ [📱 SMS Templates]                   │ │
│                │ │ [💾 SAVE]                            │ │
│                │ └──────────────────────────────────────┘ │
├────────────────┼────────────────────────────────────────────┤
│ (active)       │ BRANCH MANAGEMENT (New)                  │
│                │ ┌──────────────────────────────────────┐ │
│                │ │ [+ Add New Branch]                   │ │
│                │ │                                      │ │
│                │ │ Branch: Chennai Main                 │ │
│                │ │ Manager: Suresh Kumar                │ │
│                │ │ Open: 10 AM | Close: 7 PM           │ │
│                │ │ Holidays: [Manage]                   │ │
│                │ │ Vaults: [VAULT-A, VAULT-B]          │ │
│                │ │ Staff: [Manage Users]                │ │
│                │ │ [Edit] [Deactivate]                  │ │
│                │ │                                      │ │
│                │ │ Branch: Bangalore                    │ │
│                │ │ Manager: Rajesh Nair                 │ │
│                │ │ [Edit] [Deactivate]                  │ │
│                │ │ ...                                  │ │
│                │ └──────────────────────────────────────┘ │
├────────────────┼────────────────────────────────────────────┤
│                │ INTEREST RATE POLICIES (New)              │
│                │ ┌──────────────────────────────────────┐ │
│                │ │ Interest Type: [Flat Rate ▼]         │ │
│                │ │ Default Rate: 2.5 % per month       │ │
│                │ │ Grace Period: 5 days                │ │
│                │ │                                      │ │
│                │ │ Penalty Type: [Fixed ▼]             │ │
│                │ │ Penalty Pct: 1% per month overdue   │ │
│                │ │ Max Penalty: ₹5,000                 │ │
│                │ │                                      │ │
│                │ │ Min Loan: ₹5,000 | Max: ₹50,00,000 │ │
│                │ │ Min Duration: 1 month | Max: 12 mo  │ │
│                │ │ Eligible %: 75% of collateral       │ │
│                │ │                                      │ │
│                │ │ [✓ Save]                             │ │
│                │ └──────────────────────────────────────┘ │
│                                                                │
│                │ AUDIT TRAIL & COMPLIANCE (New)            │
│                │ ┌──────────────────────────────────────┐ │
│                │ │ Enable Audit Logging: ✅             │ │
│                │ │ Audit Frequency: [Weekly ▼]          │ │
│                │ │ Vault Audit: [Monthly ▼]             │ │
│                │ │                                      │ │
│                │ │ RBI Compliance:                      │ │
│                │ │ ✅ KYC Verification Required         │ │
│                │ │ ✅ Auction System Enabled            │ │
│                │ │ ✅ Interest Capped at 24% p.a.      │ │
│                │ │                                      │ │
│                │ │ [Download Audit Report]              │ │
│                │ │ [✓ Save]                             │ │
│                │ └──────────────────────────────────────┘ │
│                                                                │
│                │ SMS & EMAIL INTEGRATION (New)             │
│                │ ┌──────────────────────────────────────┐ │
│                │ │ SMS Provider: Twilio ▼               │ │
│                │ │ API Key: [••••••••••••••]            │ │
│                │ │ Credit Balance: ₹5,432               │ │
│                │ │ Auto Reminders: ✅ Enabled           │ │
│                │ │ Frequency: [3 days before due ▼]     │ │
│                │ │                                      │ │
│                │ │ Email Provider: Gmail                │ │
│                │ │ Status: Connected                    │ │
│                │ │ Receipts via Email: ✅              │ │
│                │ │                                      │ │
│                │ │ [✓ Save] [Test SMS] [Test Email]    │ │
│                │ └──────────────────────────────────────┘ │
└────────────────┴────────────────────────────────────────────┘
```

---

## 6. Business Logic & Calculations (Enhanced)

### Ornament Valuation
```
net_weight = gross_weight - stone_weight
market_value = net_weight × current_rate
eligible_amount = market_value × 0.75   (standard 75% rule)
```

### Interest Calculation (Multiple Options)
```
FLAT RATE:
  monthly_interest = principal × interest_pct / 100
  total_interest = monthly_interest × duration
  total_payable = principal + total_interest

COMPOUND RATE:
  total_payable = principal × (1 + interest_pct/100)^duration

REDUCING RATE (EMI):
  emi = principal × [interest_pct/100 × (1+interest_pct/100)^duration] / 
        [(1+interest_pct/100)^duration - 1]
```

### Overdue & Penalty Calculation
```
days_overdue = today - maturity_date
IF days_overdue > 0:
  penalty = principal × (penalty_pct / 100) × (days_overdue / 30)
  penalty = min(penalty, max_penalty)
ELSE:
  penalty = 0
```

### Loan Eligibility (Customer Level)
```
credit_score = Σ(loan_count × 0.1) + (1 - default_rate) × 5.0
              + (repayment_speed × 0.2)
              
credit_score = min(5.0, max(1.0, score))

risk_level = CASE
  WHEN credit_score >= 4.5 THEN "Low"
  WHEN credit_score >= 3.0 THEN "Medium"
  ELSE "High"

max_eligible = base_loan × risk_multiplier × credit_score
```

### Auction Pricing (Legal Compliance)
```
reserve_price = collateral_value × 0.80   (80% minimum bid)
starting_bid = collateral_value × 0.90    (90% starting point)

IF auction_price > collateral_value:
  surplus = auction_price - principal - all_charges
  => returned to customer

IF auction_price < principal + charges:
  deficit = principal + charges - auction_price
  => customer remains liable
```

---

## 7. Advanced Features Comparison

### New vs. Old
| Feature | v1.0 | v2.0 | Industry Benefit |
|---------|------|------|-----------------|
| **Quick Pawn** | ❌ | ✅ | 90-second entry, reduce counter time |
| **KYC Full** | Basic | ✅ Enhanced | RBI compliance, risk scoring |
| **Vault Tracking** | ❌ | ✅ | Prevent loss, insurance claims |
| **Multi-branch** | ❌ | ✅ | Expansion scalability |
| **Loan Renewal** | Basic | ✅ Advanced | Increase retention, collections |
| **Partial Redemption** | ❌ | ✅ | Customer flexibility |
| **Auction System** | ❌ | ✅ | Legal compliance (RBI), default recovery |
| **Digital Receipts** | Print only | ✅ WhatsApp/Email | Reduce paper, track delivery |
| **Audit Trail** | ❌ | ✅ Full logging | Regulatory compliance |
| **Advanced Reports** | Basic stats | ✅ Analytics | ROI, default rates, portfolio health |
| **Payment Plans** | Single | ✅ Multiple | Flexible collections |
| **Risk Scoring** | ❌ | ✅ Auto | Data-driven decisions |

---

## 8. Industry Workflow (Real Example)

### Day-in-Life: Malabar-Style Operation

**9:30 AM - Branch Opens**
```
Manager checks Dashboard → 3 overdue loans, 5 due today
Quick Pawn counter staff ready → Quick Pawn menu active
Vault temp monitoring: 18.5°C ✓ | All compartments audited ✓
```

**10:15 AM - New Customer Walk-in (First Time)**
```
Counter staff: "New customer? Let me start KYC..."
Opens Customer Form → Photos taken → Aadhaar verified via API
Risk Level Auto-calculated → "Low" (first-time, but good refs)
Ready for pawn in ~7 minutes (vs 30 min in manual)
```

**10:45 AM - Regular Customer (Repeat)**
```
"Namaskaram! Here to pawn again?"
Counter: Clicks ⚡ QUICK PAWN
Selects customer from dropdown → Auto-filled details
"Weight this chain?" → enters 12.5 gm → Value auto-calculated
"Duration?" → 3 months → Loan suggested ₹45,000
Customer agrees → Print ticket → Ornaments go to vault
Time: ~2 minutes (vs 15 min full form)
```

**12:30 PM - Collections Time**
```
Manager: "Check TODAY'S ALERTS on dashboard"
See: 5 loans due today → Bulk WhatsApp reminder sent
Customers start arriving for interest payments
Counter: Payment Screen → Select payment type
Customer pays ₹2,500 → Receipt printed + WhatsApp sent
Repeat 15 times → ₹37,500 collected by EOD
```

**3:00 PM - Overdue Follow-up**
```
HR calls overdue customers (names on Reminders screen)
"Sir, your loan PWN-0401 is 5 days overdue..."
Customer: "I'll come tomorrow"
Reminder marked → Auto-follow-up scheduled
If no payment in 15 days → Escalate to auction prep
```

**5:00 PM - Redemption Counter**
```
"I want my jewels back!"
Counter: Payment Screen → Select "Full Settlement"
Shows: Principal ₹45,000 + Interest ₹2,500 + GST ₹450 = ₹47,950
Customer pays → Vault staff retrieves from VAULT-A-12-3
Condition verified → Digital receipt generated
WhatsApp sent with timestamp → "Your ornaments released 5 PM today"
Ornaments handed over → Transaction complete
```

**6:00 PM - End-of-Day Reconciliation**
```
Manage

r reviews Dashboard Summary:
- Collections: ₹1,23,450 (24 transactions)
- Reminders sent: 45
- New pawns: 8
- Renewals: 3
- Redemptions: 5
- Vault status: Normal
All data auto-syncs to Head Office (multi-branch)
```

**Monthly - Compliance Audit**
```
Legal team: "Generate auction list for 6+ months defaulted"
System auto-identifies 12 loans → Creates RBI-compliant auction notice
Auctioneer scheduled → Public notification printed/online
Auction held → ₹7,45,320 realized → 87% default recovery
Audit Trail shows every step → Submitted to RBI
```

---

## 9. How It Works for Clients (Customer Journey)

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER JOURNEY MAP                         │
└─────────────────────────────────────────────────────────────────┘

FIRST-TIME CUSTOMER (New)
├─ Walks into branch
├─ "Welcome! Let's start your KYC"
├─ Takes photo, captures Aadhaar/PAN (digital or scanned)
├─ System auto-verifies via NSDL API
├─ Risk score calculated automatically
├─ "Perfect! You're approved for up to ₹50,000 loans"
│
├─ "What would you like to pawn?"
├─ Shows 12 gold ornaments
├─ Counter staff weighs each, enters details
├─ System suggests: "Based on your items, we can lend ₹85,000"
├─ Customer decides: "₹45,000 for 3 months is fine"
│
├─ "Where would you like your items stored?"
├─ Chooses: Vault A, Compartment 3
├─ Items moved to vault, tracked digitally
├─ System prints ticket: PWN-2025-0423
├─ "Your maturity date is 15-Jun-2025. You'll get ₹45,000 now"
└─ First-time customer onboarded in ~12 minutes

REPEAT CUSTOMER (Coming back)
├─ "Welcome back, Ramesh!"
├─ Dashboard shows: "You have 1 active loan, due in 5 days"
├─ Two options:
│  ├─ PAY INTEREST (collect payment)
│  │  ├─ "Interest due: ₹1,125 (for 1 month)"
│  │  ├─ Customer pays ₹1,200 (cash)
│  │  ├─ Change: ₹75
│  │  ├─ Receipt printed + WhatsApp receipt
│  │  └─ "Interest paid! Next due: 15-Jul"
│  │
│  └─ RENEW LOAN (extend)
│     ├─ "Renew another 3 months? Your new due: 15-Sep"
│     ├─ "New interest: ₹3,375"
│     ├─ "Can you increase to ₹60,000? You're eligible!"
│     ├─ Customer decides: "Renew ₹45,000 only"
│     ├─ Pay ₹3,375 or auto-deduct from principal
│     └─ System creates new loan term
│
└─ Repeat transaction in ~3-5 minutes

REDEMPTION (Get gold back)
├─ "Ready to get your gold?"
├─ Loan paid completely? YES
├─ Amount due: Principal + Interest + GST = ₹48,950
├─ Customer pays
├─ Vault staff retrieves items from VAULT-A-12-3
├─ Condition check: "Items verified, no damage"
├─ Digital certificate issued
├─ WhatsApp: "Your ornaments released at 5:15 PM"
├─ Customer signature: "Items received, verified"
└─ Relationship continues: "Hope to serve you again!"

DEFAULT SCENARIO (Loan goes unpaid)
├─ 30 days overdue: SMS + WhatsApp reminder
├─ 60 days overdue: Phone call + letter
├─ 90 days overdue: Branch manager calls + reminder via Aadhaar
├─ 180+ days overdue: Marked for auction
├─ Legal notice sent
├─ Auction prepared per RBI rules
├─ Items auctioned off
├─ IF proceeds > loan: Surplus returned to customer
├─ IF proceeds < loan: Customer liable for difference
└─ Auction report filed with RBI
```

---

## 10. Technical Architecture & Data Flow

### Real-time Updates
```
Dashboard (Auto-refresh every 30 seconds)
  ↓
  ├─ Today's collection (live)
  ├─ Alert count (live reminders)
  ├─ Overdue summary (updated)
  └─ Vault temperature (if IoT enabled)

Pawn Entry (Instant)
  ↓
  ├─ Valuation calculated
  ├─ Eligibility scored
  ├─ Vault space checked
  ├─ Rate fetched
  └─ Ticket printed immediately

Payment (Real-time)
  ↓
  ├─ Amount validated
  ├─ Receipt generated
  ├─ SMS sent
  ├─ Email sent
  ├─ Balance updated
  └─ History logged
```

---

## 11. Compliance & Legal (RBI-Aligned)

✅ **RBI Requirements Covered:**
- KYC Verification (Aadhaar/PAN mandatory)
- Interest cap at 24% p.a. (enforced)
- Auction after 6 months default (automated)
- Auction notices filed (RBI template)
- Detailed records maintained (audit trail)
- Customer redressal system (reminder/follow-up)
- GST compliance (automatically calculated)
- No pledging articles pledge again (business rule)

✅ **Data Security:**
- User authentication (login required)
- Role-based access (admin/staff/manager)
- Audit trail (all actions logged)
- Data backup (recommended daily)
- Encrypted customer data (Aadhaar masked)

---

## 12. ROI & Benefits Summary

| Business Aspect | Impact |
|---|---|
| **Speed** | Pawn entry: 12 min → 2 min (6x faster) |
| **Collections** | SMS/WhatsApp reminders: +15-20% collection rate |
| **Default Recovery** | Auction system + overdue mgmt: 85-90% recovery |
| **Staff Productivity** | Automated calculations save 3-4 hours/day/branch |
| **Customer Satisfaction** | Fast service + transparent rates: +25% repeat rate |
| **Compliance** | Audit trail eliminates manual paperwork: -40% overhead |
| **Scalability** | Multi-branch support: ready for growth |
| **Profitability** | Total system value: 8-12 months payoff period |

---

*PawnBook Pro v2.0 · Enterprise Pawn Broking System · Based on Malabar Gold & Diamonds & Oyalukas best practices · RBI-Compliant · Built for Growth · © 2025*