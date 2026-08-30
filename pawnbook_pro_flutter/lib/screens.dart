// PawnBook Pro v2.0 - Core Screens and Modules widgets
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'models.dart';
import 'database.dart';

// Color definitions matching the premium Gold ERP styling
const Color kBgMain = Color(0xFF0B0F19);
const Color kBgSidebar = Color(0xFF0F1422);
const Color kBgCard = Color(0xFF161C2D);
const Color kGold = Color(0xFFD4AF37);
const Color kGoldGlow = Color(0x4DD4AF37);
const Color kSuccess = Color(0xFF10B981);
const Color kWarning = Color(0xFFF59E0B);
const Color kDanger = Color(0xFFEF4444);
const Color kTextMain = Color(0xFFE2E8F0);
const Color kTextMuted = Color(0xFF94A3B8);

final currencyFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

// ==================== WIDGET: DASHBOARD SCREEN ==================== //
class DashboardScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  final Function(String) onNavigate;
  final Function(Loan) onRouteToRepay;

  const DashboardScreen({
    Key? key,
    required this.onStateChange,
    required this.onNavigate,
    required this.onRouteToRepay,
  }) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final LocalDatabase db = LocalDatabase.instance;

  @override
  Widget build(BuildContext context) {
    // Expected Today Collection
    double expectedToday = 0;
    int expectedTxns = 0;
    for (var l in db.loans.where((l) => l.branchId == db.currentBranch!.id)) {
      if (l.status == 'Active' && l.maturityDate == '2026-05-30') {
        expectedToday += (l.principal + l.interestDue + (l.interestDue * 0.18));
        expectedTxns++;
      } else if (l.status == 'Overdue') {
        expectedToday += (l.principal + l.interestDue + l.penalty + (l.interestDue * 0.18));
        expectedTxns++;
      }
    }

    // Month Interest Collected
    double monthInterest = 0;
    for (var l in db.loans.where((l) => l.branchId == db.currentBranch!.id)) {
      for (var p in l.payments) {
        if (p.date.startsWith('2026-05') && p.status == 'Success') {
          monthInterest += p.interest;
        }
      }
    }

    // Active Portfolio Sum
    double activeVal = 0;
    int activeCount = 0;
    for (var l in db.loans.where((l) => l.branchId == db.currentBranch!.id)) {
      if (l.status == 'Active' || l.status == 'Overdue' || l.status == 'Renewal') {
        activeVal += l.principal;
        activeCount++;
      }
    }

    final dueLoans = db.loans.where((l) => l.branchId == db.currentBranch!.id && l.status == 'Active' && l.maturityDate == '2026-05-30').toList();
    final overdueLoans = db.loans.where((l) => l.branchId == db.currentBranch!.id && (l.status == 'Overdue' || l.daysOverdue > 0)).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Dashboard Summary', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: kTextMain)),
                  const SizedBox(height: 4),
                  const Text('Branch operations overview, expected collections and due alerts.', style: TextStyle(fontSize: 13, color: kTextMuted)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: kTextMuted.withOpacity(0.3)),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('Today: 30-May-2026', style: TextStyle(color: kTextMain, fontSize: 13, fontWeight: FontWeight.w600)),
              )
            ],
          ),
          const SizedBox(height: 24),

          // KPIs Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final crossAxisCount = width > 800 ? 3 : (width > 500 ? 2 : 1);
              return GridView.count(
                crossAxisCount: crossAxisCount,
                childAspectRatio: 2.2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _buildKpiCard('Expected Today', currencyFormatter.format(expectedToday), '${expectedTxns} expected txns due/overdue', Icons.handholding_usd, kGold),
                  _buildKpiCard('This Month Interest', currencyFormatter.format(monthInterest), 'Collected so far', Icons.bar_chart, kSuccess),
                  _buildKpiCard('Active Portfolio', currencyFormatter.format(activeVal), '${activeCount} active loans outstanding', Icons.business_center, kGold),
                ],
              );
            },
          ),
          const SizedBox(height: 24),

          // Alerts & Quick Actions
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 2,
                child: Card(
                  color: kBgCard,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: kGoldGlow),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Active Branch Alerts', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                        const Divider(color: kGoldGlow, height: 24),
                        if (dueLoans.isEmpty && overdueLoans.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Center(
                              child: Text('✅ Branch portfolio healthy. No critical collections pending today.', style: TextStyle(color: kSuccess, fontSize: 13)),
                            ),
                          )
                        else
                          ListView(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              ...overdueLoans.map((l) {
                                final cust = db.customers.firstWhere((c) => c.id == l.customerId);
                                final totalDue = l.principal + l.interestDue + l.penalty + (l.interestDue * 0.18);
                                return _buildAlertItem(
                                  'OVERDUE (${l.daysOverdue} Days)',
                                  l.ticket,
                                  cust.name,
                                  currencyFormatter.format(totalDue),
                                  l.maturityDate,
                                  true,
                                  () => widget.onRouteToRepay(l),
                                );
                              }),
                              ...dueLoans.map((l) {
                                final cust = db.customers.firstWhere((c) => c.id == l.customerId);
                                final totalDue = l.principal + l.interestDue + (l.interestDue * 0.18);
                                return _buildAlertItem(
                                  'DUE TODAY',
                                  l.ticket,
                                  cust.name,
                                  currencyFormatter.format(totalDue),
                                  l.maturityDate,
                                  false,
                                  () => widget.onRouteToRepay(l),
                                );
                              }),
                            ],
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Card(
                  color: kBgCard,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: kGoldGlow),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Quick Access', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                        const Divider(color: kGoldGlow, height: 24),
                        _buildQuickActionTile('Quick Pawn', Icons.bolt, () => widget.onNavigate('quick-pawn')),
                        const SizedBox(height: 12),
                        _buildQuickActionTile('New Pawn', Icons.file_copy, () => widget.onNavigate('new-pawn')),
                        const SizedBox(height: 12),
                        _buildQuickActionTile('Payments', Icons.payment, () => widget.onNavigate('pawn-list')),
                      ],
                    ),
                  ),
                ),
              )
            ],
          ),
          const SizedBox(height: 24),

          // Recent Transactions
          Card(
            color: kBgCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: kGoldGlow),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Recent Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                  const Divider(color: kGoldGlow, height: 24),
                  _buildRecentTransactionsTable(),
                ],
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildKpiCard(String label, String value, String desc, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: kBgCard,
        border: Border.all(color: kGoldGlow),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(label, style: const TextStyle(fontSize: 11, color: kTextMuted, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
              const SizedBox(height: 6),
              Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kGold)),
              const SizedBox(height: 4),
              Text(desc, style: const TextStyle(fontSize: 10, color: kTextMuted)),
            ],
          ),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Icon(icon, color: color, size: 20),
          )
        ],
      ),
    );
  }

  Widget _buildAlertItem(String badge, String ticket, String name, String amount, String maturity, bool isOverdue, VoidCallback onClick) {
    return Container(
      margin: const EdgeInsets.bottom(12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isOverdue ? kDanger.withOpacity(0.04) : kWarning.withOpacity(0.04),
        border: Border.all(color: isOverdue ? kDanger.withOpacity(0.2) : kWarning.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isOverdue ? kDanger.withOpacity(0.1) : kWarning.withOpacity(0.1),
                  border: Border.all(color: isOverdue ? kDanger : kWarning),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(badge, style: TextStyle(color: isOverdue ? kDanger : kWarning, fontSize: 9, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(ticket, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: kTextMain)),
                  const SizedBox(height: 2),
                  Text(name, style: const TextStyle(fontSize: 11, color: kTextMuted)),
                ],
              )
            ],
          ),
          Row(
            children: [
              Text(amount, style: TextStyle(color: isOverdue ? kDanger : kWarning, fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: onClick,
                style: ElevatedButton.styleFrom(
                  backgroundColor: kGold,
                  foregroundColor: kBgMain,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  minimumSize: Size.zero,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                child: const Text('Collect', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildQuickActionTile(String title, IconData icon, VoidCallback onClick) {
    return InkWell(
      onTap: onClick,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.3),
          border: Border.all(color: kGoldGlow),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(icon, color: kGold, size: 20),
            const SizedBox(width: 16),
            Text(title, style: const TextStyle(color: kTextMain, fontSize: 13, fontWeight: FontWeight.bold)),
            const Spacer(),
            const Icon(Icons.arrow_forward_ios, color: kGold, size: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentTransactionsTable() {
    final List<Map<String, dynamic>> allTxns = [];
    for (var l in db.loans.where((l) => l.branchId == db.currentBranch!.id)) {
      final cust = db.customers.firstWhere((c) => c.id == l.customerId);
      for (var p in l.payments) {
        allTxns.add({
          'ticket': l.ticket,
          'customer': cust.name,
          'date': p.date,
          'type': p.type,
          'amount': p.totalAmount,
          'mode': p.mode,
          'collectedBy': p.collectedBy,
        });
      }
    }

    allTxns.sort((a, b) => b['date'].compareTo(a['date']));
    final latest = allTxns.take(5).toList();

    if (latest.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16.0),
        child: Center(
          child: Text('No transaction logs recorded today.', style: TextStyle(color: kTextMuted, fontSize: 13)),
        ),
      );
    }

    return Table(
      border: TableBorder(bottom: BorderSide(color: kTextMuted.withOpacity(0.1))),
      columnWidths: const {
        0: FlexColumnWidth(1.2),
        1: FlexColumnWidth(2.0),
        2: FlexColumnWidth(1.5),
        3: FlexColumnWidth(1.5),
        4: FlexColumnWidth(1.5),
      },
      children: [
        const TableRow(
          children: [
            Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Text('Ticket', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
            Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Text('Customer', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
            Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Text('Type', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
            Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Text('Amount', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
            Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Text('Channel', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
          ]
        ),
        ...latest.map((t) => TableRow(
          children: [
            Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(t['ticket'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: kTextMain))),
            Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(t['customer'], style: const TextStyle(fontSize: 12, color: kTextMain))),
            Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(t['type'], style: const TextStyle(fontSize: 12, color: kTextMain))),
            Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(currencyFormatter.format(t['amount']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: kGold))),
            Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(t['mode'], style: const TextStyle(fontSize: 12, color: kTextMuted))),
          ]
        ))
      ],
    );
  }
}

// ==================== WIDGET: QUICK PAWN SCREEN (WIZARD) ==================== //
class QuickPawnScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  final Function(Loan) onShowReceipt;

  const QuickPawnScreen({
    Key? key,
    required this.onStateChange,
    required this.onShowReceipt,
  }) : super(key: key);

  @override
  State<QuickPawnScreen> createState() => _QuickPawnScreenState();
}

class _QuickPawnScreenState extends State<QuickPawnScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  int _currentStep = 1;
  Customer? _selectedCustomer;
  String _ornamentType = 'Gold Chain';
  String _metalQuality = 'Gold 22K';
  final _grossWtController = TextEditingController();
  final _stoneWtController = TextEditingController();
  final _loanAmountController = TextEditingController();
  String _durationMonths = '3';
  String _interestType = 'Flat';
  String? _selectedVaultId;

  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    final branchVaults = db.vaults.where((v) => v.branchId == db.currentBranch!.id).toList();
    if (branchVaults.isNotEmpty) {
      _selectedVaultId = branchVaults.first.id;
    }
  }

  @override
  Widget build(BuildContext context) {
    // Live calculations
    double gross = double.tryParse(_grossWtController.text) ?? 0.0;
    double stone = double.tryParse(_stoneWtController.text) ?? 0.0;
    double net = (gross - stone).clamp(0.0, double.infinity);
    
    double rate = 0.0;
    if (_metalQuality == 'Gold 22K') rate = db.currentRates.gold22K;
    else if (_metalQuality == 'Gold 24K') rate = db.currentRates.gold24K;
    else if (_metalQuality == 'Silver') rate = db.currentRates.silver;
    else if (_metalQuality == 'Platinum') rate = db.currentRates.platinum;

    double marketValue = net * rate;
    double eligibleLimit = marketValue * 0.75;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('⚡ Quick Pawn Entry', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: kTextMain)),
                const SizedBox(height: 4),
                const Text('Process repeat pawn entries in less than 90 seconds for verified customers.', style: TextStyle(fontSize: 13, color: kTextMuted)),
                const SizedBox(height: 24),

                // Wizard Steps Indicator
                Row(
                  children: [
                    _buildStepIndicator(1, 'SELECT CUSTOMER', _currentStep == 1),
                    const SizedBox(width: 8),
                    _buildStepIndicator(2, 'VALUATION', _currentStep == 2),
                    const SizedBox(width: 8),
                    _buildStepIndicator(3, 'TERM & DISBURSE', _currentStep == 3),
                  ],
                ),
                const SizedBox(height: 24),

                Card(
                  color: kBgCard,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: kGoldGlow),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: _buildStepContent(net, marketValue, eligibleLimit),
                  ),
                )
              ],
            ),
          ),
        ),
        const SizedBox(width: 20),
        
        // Sidebar valuation engine
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(24.0),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kGoldGlow),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Valuation Appraisal', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.bold)),
                const Divider(color: kGoldGlow, height: 24),
                _buildValuationRow('Customer:', _selectedCustomer?.name ?? 'None'),
                _buildValuationRow('KYC:', _selectedCustomer?.kycStatus ?? '-', valueColor: _selectedCustomer?.kycStatus == 'Verified' ? kSuccess : kWarning),
                _buildValuationRow('Metal:', _metalQuality),
                _buildValuationRow('Net Weight:', '${net.toStringAsFixed(2)} gm'),
                _buildValuationRow('Price per gram:', currencyFormatter.format(rate)),
                _buildValuationRow('Collateral Worth:', currencyFormatter.format(marketValue), valueColor: kSuccess, isBold: true),
                _buildValuationRow('RBI LTV limit (75%):', currencyFormatter.format(eligibleLimit), isBold: true),
                const Divider(color: kGoldGlow, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Suggested Loan:', style: TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(currencyFormatter.format(eligibleLimit), style: const TextStyle(color: kGold, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                )
              ],
            ),
          ),
        )
      ],
    );
  }

  Widget _buildStepIndicator(int stepNum, String title, bool isActive) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? kGold : kGoldGlow.withOpacity(0.1),
              width: 3,
            )
          )
        ),
        child: Center(
          child: Text(
            '$stepNum. $title',
            style: TextStyle(
              color: isActive ? kGold : kTextMuted,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStepContent(double net, double market, double limit) {
    if (_currentStep == 1) {
      final customersList = db.customers.where((c) => 
        c.name.toLowerCase().contains(_searchQuery.toLowerCase()) || 
        c.mobile.contains(_searchQuery)
      ).toList();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Search Customer Dossier', style: TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          TextField(
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
            style: const TextStyle(color: kTextMain),
            decoration: InputDecoration(
              hintText: 'Enter name or mobile number...',
              hintStyle: const TextStyle(color: kTextMuted),
              prefixIcon: const Icon(Icons.search, color: kGold),
              filled: true,
              fillColor: Colors.black.withOpacity(0.3),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
            ),
          ),
          const SizedBox(height: 20),
          Container(
            maxHeight: 250,
            overflow: Clip.hardEdge,
            child: customersList.isEmpty
              ? const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Center(child: Text('No verified customer match.', style: TextStyle(color: kTextMuted))),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: customersList.length,
                  itemBuilder: (context, index) {
                    final c = customersList[index];
                    return ListTile(
                      title: Text(c.name, style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold)),
                      subtitle: Text(c.mobile, style: const TextStyle(color: kTextMuted)),
                      trailing: ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _selectedCustomer = c;
                            _currentStep = 2;
                          });
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain),
                        child: const Text('Select'),
                      ),
                    );
                  },
                ),
          )
        ],
      );
    } else if (_currentStep == 2) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Asset Appraisal Weight Specs', style: TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildDropdown('Ornament Type', _ornamentType, ['Gold Chain', 'Bangles', 'Ring', 'Pendant', 'Necklace'], (val) {
                  setState(() {
                    _ornamentType = val!;
                  });
                }),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdown('Metal Quality', _metalQuality, ['Gold 22K', 'Gold 24K', 'Silver', 'Platinum'], (val) {
                  setState(() {
                    _metalQuality = val!;
                  });
                }),
              )
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField('Gross Weight (g)', _grossWtController, TextInputType.number, (val) {
                  setState(() {});
                }),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildTextField('Stone Deduction (g)', _stoneWtController, TextInputType.number, (val) {
                  setState(() {});
                }),
              )
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              OutlinedButton(
                onPressed: () => setState(() => _currentStep = 1),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: kGold), foregroundColor: kGold),
                child: const Text('Back'),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: () {
                  if (net <= 0) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid ornament weight parameters.')));
                    return;
                  }
                  setState(() {
                    _loanAmountController.text = limit.toStringAsFixed(0);
                    _currentStep = 3;
                  });
                },
                style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain),
                child: const Text('Confirm Weight'),
              ),
            ],
          )
        ],
      );
    } else {
      final branchVaults = db.vaults.where((v) => v.branchId == db.currentBranch!.id).toList();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Loan Sum & Accrual Terms', style: TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildTextField('Required Loan Principal (₹)', _loanAmountController, TextInputType.number, (val) {}),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdown('Accrual Term (Months)', _durationMonths, ['3', '6', '12'], (val) {
                  setState(() {
                    _durationMonths = val!;
                  });
                }),
              )
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildDropdown('Accrual Interest Model', _interestType, ['Flat', 'Compound', 'Reducing'], (val) {
                  setState(() {
                    _interestType = val!;
                  });
                }),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildDropdown('Vault Box Allocation', _selectedVaultId ?? '', branchVaults.map((e) => e.id).toList(), (val) {
                  setState(() {
                    _selectedVaultId = val;
                  });
                }),
              )
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              OutlinedButton(
                onPressed: () => setState(() => _currentStep = 2),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: kGold), foregroundColor: kGold),
                child: const Text('Back'),
              ),
              const SizedBox(width: 12),
              ElevatedButton(
                onPressed: _submitQuickPawn,
                style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain),
                child: const Text('⚡ Disburse & Issue Ticket'),
              ),
            ],
          )
        ],
      );
    }
  }

  void _submitQuickPawn() {
    double principal = double.tryParse(_loanAmountController.text) ?? 0.0;
    double gross = double.tryParse(_grossWtController.text) ?? 0.0;
    double stone = double.tryParse(_stoneWtController.text) ?? 0.0;
    double net = gross - stone;

    double rate = 0.0;
    if (_metalQuality == 'Gold 22K') rate = db.currentRates.gold22K;
    else if (_metalQuality == 'Gold 24K') rate = db.currentRates.gold24K;
    else if (_metalQuality == 'Silver') rate = db.currentRates.silver;
    else if (_metalQuality == 'Platinum') rate = db.currentRates.platinum;

    double limit = net * rate * 0.75;
    if (principal > limit) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('LTV Breach! Suggested loan sum exceeds the legal maximum 75% cap of ₹${limit.toStringAsFixed(0)}.'),
      ));
      return;
    }

    final loanId = 'L_${DateTime.now().millisecondsSinceEpoch}';
    final ticketNo = 'PWN-2026-${1000 + Random().nextInt(9000)}';
    
    int duration = int.parse(_durationMonths);
    final maturity = DateTime.now().add(Duration(days: duration * 30));
    
    double interestPct = _interestType == 'Reducing' ? 2.0 : 2.5;
    double interestDue = principal * (interestPct / 100) * duration;

    final newLoan = Loan(
      id: loanId,
      ticket: ticketNo,
      customerId: _selectedCustomer!.id,
      branchId: db.currentBranch!.id,
      loanDate: DateTime.now().toIso8601String().split('T')[0],
      maturityDate: maturity.toIso8601String().split('T')[0],
      duration: duration,
      daysOverdue: 0,
      renewalCount: 0,
      principal: principal,
      interestType: _interestType,
      interestPct: interestPct,
      gstPercent: 18,
      totalGrossWt: gross,
      totalNetWt: net,
      totalStoneWt: stone,
      eligiblePct: 0.75,
      marketValue: net * rate,
      collateralValue: net * rate,
      status: 'Active',
      vaultRef: _selectedVaultId!,
      lockedBox: 'BOX-${10 + Random().nextInt(150)}',
      insured: true,
      insuranceRefNo: 'INS-2026-${1000 + Random().nextInt(8000)}',
      amountPaid: 0.0,
      interestDue: interestDue,
      penalty: 0.0,
      balancePayable: principal + interestDue,
      condition: 'Good',
      notes: 'Quick counter disburse.',
      observations: 'Standard physical assay checked.',
      ornaments: [
        OrnamentDetail(
          id: 'ORN_${DateTime.now().millisecondsSinceEpoch}',
          type: _ornamentType,
          category: 'Jewelry',
          metal: _metalQuality,
          purity: _metalQuality.contains('22K') ? '22K' : '24K',
          grossWt: gross,
          stone: stone,
          net: net,
          rate: rate,
          rateDate: DateTime.now().toIso8601String().split('T')[0],
          value: net * rate,
          tested: true,
          testDate: DateTime.now().toIso8601String().split('T')[0],
          verifiedBy: db.currentUser!.name,
          certNo: 'CERT-2026-${1000 + Random().nextInt(9000)}',
        )
      ],
      payments: [],
    );

    db.addNewLoan(newLoan);
    widget.onStateChange();
    widget.onShowReceipt(newLoan);
  }

  Widget _buildValuationRow(String label, String value, {Color valueColor = kTextMain, bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: kTextMuted, fontSize: 13)),
          Text(value, style: TextStyle(color: valueColor, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildDropdown(String label, String currentVal, List<String> items, Function(String?) onChange) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            border: Border.all(color: kGoldGlow),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: currentVal,
              isExpanded: true,
              dropdownColor: kBgSidebar,
              style: const TextStyle(color: kTextMain, fontSize: 13),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: onChange,
            ),
          ),
        )
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, TextInputType type, Function(String) onInput) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: type,
          onChanged: onInput,
          style: const TextStyle(color: kTextMain, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
          ),
        )
      ],
    );
  }
}

// ==================== WIDGET: NEW PAWN & KYC SCREEN ==================== //
class NewPawnScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  final Function(Loan) onShowReceipt;

  const NewPawnScreen({
    Key? key,
    required this.onStateChange,
    required this.onShowReceipt,
  }) : super(key: key);

  @override
  State<NewPawnScreen> createState() => _NewPawnScreenState();
}

class _NewPawnScreenState extends State<NewPawnScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _aadhaarController = TextEditingController();
  final _panController = TextEditingController();
  final _nomineeController = TextEditingController();
  final _addressController = TextEditingController();

  String _ornamentType = 'Gold Chain';
  String _metalQuality = 'Gold 22K';
  final _grossController = TextEditingController();
  final _stoneController = TextEditingController();
  final _loanAmountController = TextEditingController();
  String _duration = '3';
  String _interestType = 'Flat';
  String? _vaultId;
  bool _insured = true;

  @override
  void initState() {
    super.initState();
    final branchVaults = db.vaults.where((v) => v.branchId == db.currentBranch!.id).toList();
    if (branchVaults.isNotEmpty) {
      _vaultId = branchVaults.first.id;
    }
  }

  @override
  Widget build(BuildContext context) {
    double gross = double.tryParse(_grossController.text) ?? 0.0;
    double stone = double.tryParse(_stoneController.text) ?? 0.0;
    double net = (gross - stone).clamp(0.0, double.infinity);
    
    double rate = 0.0;
    if (_metalQuality == 'Gold 22K') rate = db.currentRates.gold22K;
    else if (_metalQuality == 'Gold 24K') rate = db.currentRates.gold24K;
    else if (_metalQuality == 'Silver') rate = db.currentRates.silver;
    else if (_metalQuality == 'Platinum') rate = db.currentRates.platinum;

    double market = net * rate;
    double limit = market * 0.75;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              color: kBgCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('📝 Full Loan Entry & KYC', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),

                    // Customer fields
                    _buildRowFields([
                      _buildTextField('Full Client Name', _nameController),
                      _buildTextField('Primary Mobile No.', _mobileController),
                    ]),
                    const SizedBox(height: 16),
                    _buildRowFields([
                      _buildTextField('Aadhaar Card No.', _aadhaarController),
                      _buildTextField('PAN Identification No.', _panController),
                    ]),
                    const SizedBox(height: 16),
                    _buildRowFields([
                      _buildTextField('Nominee Representative', _nomineeController),
                      _buildTextField('Residential Address', _addressController),
                    ]),
                    const SizedBox(height: 24),

                    const Text('Ornament Specifications', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),
                    _buildRowFields([
                      _buildDropdown('Asset Category', _ornamentType, ['Gold Chain', 'Bangles', 'Ring', 'Pendant', 'Necklace'], (val) => setState(() => _ornamentType = val!)),
                      _buildDropdown('Metal / Purity', _metalQuality, ['Gold 22K', 'Gold 24K', 'Silver', 'Platinum'], (val) {
                        setState(() {
                          _metalQuality = val!;
                          _loanAmountController.text = (net * rate * 0.75).toStringAsFixed(0);
                        });
                      }),
                    ]),
                    const SizedBox(height: 16),
                    _buildRowFields([
                      _buildTextField('Gross weight (g)', _grossController, onInput: (val) {
                        setState(() {
                          _loanAmountController.text = (net * rate * 0.75).toStringAsFixed(0);
                        });
                      }),
                      _buildTextField('Stone deduction (g)', _stoneController, onInput: (val) {
                        setState(() {
                          _loanAmountController.text = (net * rate * 0.75).toStringAsFixed(0);
                        });
                      }),
                    ]),
                    const SizedBox(height: 24),

                    const Text('Loan Parameters', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),
                    _buildRowFields([
                      _buildTextField('Principal Loan Value (₹)', _loanAmountController),
                      _buildDropdown('Maturity Period', _duration, ['3', '6', '12'], (val) => setState(() => _duration = val!)),
                    ]),
                    const SizedBox(height: 16),
                    _buildRowFields([
                      _buildDropdown('Interest Rate Model', _interestType, ['Flat', 'Compound', 'Reducing'], (val) => setState(() => _interestType = val!)),
                      _buildDropdown('Vault Box Compartment', _vaultId ?? '', db.vaults.where((v) => v.branchId == db.currentBranch!.id).map((e) => e.id).toList(), (val) => setState(() => _vaultId = val)),
                    ]),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Checkbox(
                          value: _insured,
                          activeColor: kGold,
                          onChanged: (val) => setState(() => _insured = val!),
                        ),
                        const Text('Pledged gold assets insured under branch insurance program', style: TextStyle(color: kTextMain, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: () => _submitFullPawn(net, rate),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kGold,
                        foregroundColor: kBgMain,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('DISBURSE LOAN & ISSUE DOCUMENTATIONS', style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),
        
        // Sidebar appraisal
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kGoldGlow),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('LTV Evaluation', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.bold)),
                const Divider(color: kGoldGlow, height: 24),
                _buildValuationRow('Selected Quality:', _metalQuality),
                _buildValuationRow('Net Weighing:', '${net.toStringAsFixed(2)} gm'),
                _buildValuationRow('Spot Counter Rate:', currencyFormatter.format(rate)),
                _buildValuationRow('Collateral Appraisal:', currencyFormatter.format(market), valueColor: kSuccess, isBold: true),
                _buildValuationRow('RBI appraisal limit (75%):', currencyFormatter.format(limit), isBold: true),
                const Divider(color: kGoldGlow, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Suggested Loan:', style: TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(currencyFormatter.format(limit), style: const TextStyle(color: kGold, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                )
              ],
            ),
          ),
        )
      ],
    );
  }

  void _submitFullPawn(double net, double rate) {
    if (_nameController.text.isEmpty || _mobileController.text.isEmpty || _grossController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please complete name, mobile and ornament weights.')));
      return;
    }

    double principal = double.tryParse(_loanAmountController.text) ?? 0.0;
    double limit = net * rate * 0.75;
    if (principal > limit) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('LTV Breach! Suggested principal exceeds the 75% cap of ₹${limit.toStringAsFixed(0)}.'),
      ));
      return;
    }

    // Bind or register Customer
    Customer? c = db.customers.cast<Customer?>().firstWhere(
      (c) => c?.mobile == _mobileController.text,
      orElse: () => null,
    );

    if (c == null) {
      c = Customer(
        id: 'C_${DateTime.now().millisecondsSinceEpoch}',
        name: _nameController.text,
        mobile: _mobileController.text,
        altMobile: '',
        email: '${_nameController.text.toLowerCase().replaceAll(' ', '')}@example.com',
        aadhaarNo: _aadhaarController.text.isNotEmpty ? 'XXXX XXXX ${_aadhaarController.text.substring(max(0, _aadhaarController.text.length - 4))}' : 'Unverified',
        aadhaarVerified: true,
        panNo: _panController.text,
        panVerified: true,
        drivingLicense: '',
        voterId: '',
        dob: '1990-01-01',
        gender: 'M',
        occupation: 'Trader',
        monthlyIncome: 35000,
        address: _addressController.text,
        city: db.currentBranch!.city,
        state: 'Tamil Nadu',
        zipcode: '600017',
        nominee: _nomineeController.text,
        nomineeMob: '',
        relation: 'Spouse',
        status: 'Active',
        kycStatus: 'Verified',
        loyaltyPoints: 30,
        totalLoansCount: 1,
        totalDefault: 0,
        creditScore: 4.0,
        riskLevel: 'Low',
        notes: 'Dossier created locally.',
        photo: '',
      );
      db.addCustomer(c);
    }

    final loanId = 'L_${DateTime.now().millisecondsSinceEpoch}';
    final ticketNo = 'PWN-2026-${1000 + Random().nextInt(9000)}';
    int duration = int.parse(_duration);
    final maturity = DateTime.now().add(Duration(days: duration * 30));
    double interestPct = _interestType == 'Reducing' ? 2.0 : 2.5;
    double interestDue = principal * (interestPct / 100) * duration;

    final newLoan = Loan(
      id: loanId,
      ticket: ticketNo,
      customerId: c.id,
      branchId: db.currentBranch!.id,
      loanDate: DateTime.now().toIso8601String().split('T')[0],
      maturityDate: maturity.toIso8601String().split('T')[0],
      duration: duration,
      daysOverdue: 0,
      renewalCount: 0,
      principal: principal,
      interestType: _interestType,
      interestPct: interestPct,
      gstPercent: 18,
      totalGrossWt: double.parse(_grossController.text),
      totalNetWt: net,
      totalStoneWt: double.tryParse(_stoneController.text) ?? 0.0,
      eligiblePct: 0.75,
      marketValue: net * rate,
      collateralValue: net * rate,
      status: 'Active',
      vaultRef: _vaultId!,
      lockedBox: 'BOX-${10 + Random().nextInt(150)}',
      insured: _insured,
      insuranceRefNo: _insured ? 'INS-2026-${1000 + Random().nextInt(8000)}' : '',
      amountPaid: 0.0,
      interestDue: interestDue,
      penalty: 0.0,
      balancePayable: principal + interestDue,
      condition: 'Good',
      notes: 'Full KYC pawn booking.',
      observations: 'Appraised and certified securely.',
      ornaments: [
        OrnamentDetail(
          id: 'ORN_${DateTime.now().millisecondsSinceEpoch}',
          type: _ornamentType,
          category: 'Jewelry',
          metal: _metalQuality,
          purity: _metalQuality.contains('22K') ? '22K' : '24K',
          grossWt: double.parse(_grossController.text),
          stone: double.tryParse(_stoneController.text) ?? 0.0,
          net: net,
          rate: rate,
          rateDate: DateTime.now().toIso8601String().split('T')[0],
          value: net * rate,
          tested: true,
          testDate: DateTime.now().toIso8601String().split('T')[0],
          verifiedBy: db.currentUser!.name,
          certNo: 'CERT-2026-${1000 + Random().nextInt(9000)}',
        )
      ],
      payments: [],
    );

    db.addNewLoan(newLoan);
    widget.onStateChange();
    widget.onShowReceipt(newLoan);
  }

  Widget _buildRowFields(List<Widget> children) {
    return Row(
      children: children.map((e) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 16.0), child: e))).toList(),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {TextInputType type = TextInputType.text, Function(String)? onInput}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: type,
          onChanged: onInput,
          style: const TextStyle(color: kTextMain, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
          ),
        )
      ],
    );
  }

  Widget _buildDropdown(String label, String val, List<String> items, Function(String?) onChange) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            border: Border.all(color: kGoldGlow),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              dropdownColor: kBgSidebar,
              style: const TextStyle(color: kTextMain, fontSize: 13),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: onChange,
            ),
          ),
        )
      ],
    );
  }

  Widget _buildValuationRow(String label, String value, {Color valueColor = kTextMain, bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: kTextMuted, fontSize: 13)),
          Text(value, style: TextStyle(color: valueColor, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
        ],
      ),
    );
  }
}

// ==================== WIDGET: PAWN LEDGER LIST SCREEN ==================== //
class PawnListScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  final Function(Loan, String) onRouteToPayment;

  const PawnListScreen({
    Key? key,
    required this.onStateChange,
    required this.onRouteToPayment,
  }) : super(key: key);

  @override
  State<PawnListScreen> createState() => _PawnListScreenState();
}

class _PawnListScreenState extends State<PawnListScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  String _searchQuery = '';
  String _statusFilter = 'All';

  @override
  Widget build(BuildContext context) {
    final list = db.loans.where((l) {
      final cust = db.customers.firstWhere((c) => c.id == l.customerId);
      final matchesSearch = l.ticket.toLowerCase().contains(_searchQuery.toLowerCase()) || cust.name.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesStatus = _statusFilter == 'All' || l.status == _statusFilter;
      return l.branchId == db.currentBranch!.id && matchesSearch && matchesStatus;
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Collateral Loan Ledger', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kGold)),
                      const SizedBox(height: 4),
                      Text('${list.length} loans logged for current branch operations.', style: const TextStyle(fontSize: 12, color: kTextMuted)),
                    ],
                  ),
                  Row(
                    children: [
                      _buildFilterDropdown(),
                      const SizedBox(width: 12),
                      _buildSearchField(),
                    ],
                  )
                ],
              ),
              const Divider(color: kGoldGlow, height: 32),
              
              if (list.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40.0),
                  child: Center(
                    child: Text('No matching collateral loans in ledger records.', style: TextStyle(color: kTextMuted, fontSize: 13)),
                  ),
                )
              else
                Table(
                  border: TableBorder(bottom: BorderSide(color: kTextMuted.withOpacity(0.1))),
                  columnWidths: const {
                    0: FlexColumnWidth(1.2),
                    1: FlexColumnWidth(2.0),
                    2: FlexColumnWidth(1.2),
                    3: FlexColumnWidth(1.2),
                    4: FlexColumnWidth(1.2),
                    5: FlexColumnWidth(1.2),
                    6: FlexColumnWidth(1.8),
                  },
                  children: [
                    const TableRow(
                      children: [
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Ticket', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Customer', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Disbursed', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Maturity', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Principal', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Status', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Actions', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                      ]
                    ),
                    ...list.map((l) {
                      final cust = db.customers.firstWhere((c) => c.id == l.customerId);
                      Color statusColor = kSuccess;
                      if (l.status == 'Overdue') statusColor = kDanger;
                      else if (l.status == 'Redeemed') statusColor = kTextMuted;
                      
                      return TableRow(
                        children: [
                          Padding(padding: const EdgeInsets.symmetric(vertical: 12.0), child: Text(l.ticket, style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12))),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(cust.name, style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12)),
                                Text(cust.mobile, style: const TextStyle(color: kTextMuted, fontSize: 10)),
                              ],
                            ),
                          ),
                          Padding(padding: const EdgeInsets.symmetric(vertical: 12.0), child: Text(l.loanDate, style: const TextStyle(color: kTextMain, fontSize: 12))),
                          Padding(padding: const EdgeInsets.symmetric(vertical: 12.0), child: Text(l.maturityDate, style: const TextStyle(color: kTextMain, fontSize: 12))),
                          Padding(padding: const EdgeInsets.symmetric(vertical: 12.0), child: Text(currencyFormatter.format(l.principal), style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12))),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12.0),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                border: Border.all(color: statusColor),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(l.status, style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 8.0),
                            child: l.status != 'Redeemed' && l.status != 'Auctioned'
                              ? Row(
                                  children: [
                                    ElevatedButton(
                                      onPressed: () => widget.onRouteToPayment(l, 'Interest'),
                                      style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain, minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                                      child: const Text('Pay', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                    const SizedBox(width: 6),
                                    OutlinedButton(
                                      onPressed: () => widget.onRouteToPayment(l, 'Renewal'),
                                      style: OutlinedButton.styleFrom(side: const BorderSide(color: kGold), foregroundColor: kGold, minimumSize: Size.zero, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                                      child: const Text('Renew', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    )
                                  ],
                                )
                              : const Text('Cleared Handover', style: TextStyle(color: kTextMuted, fontSize: 11)),
                          )
                        ],
                      );
                    })
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchField() {
    return SizedBox(
      width: 200,
      height: 38,
      child: TextField(
        onChanged: (val) => setState(() => _searchQuery = val),
        style: const TextStyle(color: kTextMain, fontSize: 12),
        decoration: InputDecoration(
          hintText: 'Search...',
          hintStyle: const TextStyle(color: kTextMuted),
          prefixIcon: const Icon(Icons.search, color: kGold, size: 16),
          filled: true,
          fillColor: Colors.black.withOpacity(0.3),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
        ),
      ),
    );
  }

  Widget _buildFilterDropdown() {
    return Container(
      height: 38,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        border: Border.all(color: kGoldGlow),
        borderRadius: BorderRadius.circular(8),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _statusFilter,
          dropdownColor: kBgSidebar,
          style: const TextStyle(color: kTextMain, fontSize: 12),
          items: ['All', 'Active', 'Overdue', 'Redeemed'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (val) => setState(() => _statusFilter = val!),
        ),
      ),
    );
  }
}

// ==================== WIDGET: VAULT MANAGER SCREEN ==================== //
class VaultManagerScreen extends StatefulWidget {
  final VoidCallback onStateChange;

  const VaultManagerScreen({
    Key? key,
    required this.onStateChange,
  }) : super(key: key);

  @override
  State<VaultManagerScreen> createState() => _VaultManagerScreenState();
}

class _VaultManagerScreenState extends State<VaultManagerScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  String _selectedVault = 'VAULT-A-12-3';

  @override
  Widget build(BuildContext context) {
    final branchVaults = db.vaults.where((v) => v.branchId == db.currentBranch!.id).toList();
    final activeVault = db.vaults.firstWhere((v) => v.id == _selectedVault);
    final storedLoans = db.loans.where((l) => l.vaultRef == _selectedVault && l.status != 'Redeemed').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Vault Inventory & Occupancy Grid', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kGold)),
                  ElevatedButton(
                    onPressed: () => _executeAudit(activeVault.id),
                    style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain),
                    child: const Text('Execute Vault Audit Inspection'),
                  ),
                ],
              ),
              const Divider(color: kGoldGlow, height: 32),

              // Visual 4x3 compartments grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  childAspectRatio: 2.2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: branchVaults.length,
                itemBuilder: (context, index) {
                  final v = branchVaults[index];
                  double fill = v.currentItems / v.capacity;
                  Color fillCol = kSuccess;
                  if (fill >= 0.9) fillCol = kDanger;
                  else if (fill >= 0.6) fillCol = kWarning;

                  bool isSelected = v.id == _selectedVault;

                  return InkWell(
                    onTap: () => setState(() => _selectedVault = v.id),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected ? kGold.withOpacity(0.08) : Colors.black.withOpacity(0.2),
                        border: Border.all(color: isSelected ? kGold : kGoldGlow),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('COMP ${v.compartmentNo}', style: const TextStyle(fontWeight: FontWeight.bold, color: kGold, fontSize: 13)),
                              Text('Box ${v.boxNo}', style: const TextStyle(color: kTextMuted, fontSize: 10)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          LinearProgressIndicator(value: fill, backgroundColor: Colors.white.withOpacity(0.1), color: fillCol),
                          const SizedBox(height: 6),
                          Text('${v.currentItems}/${v.capacity} Slots occupied', style: const TextStyle(color: kTextMuted, fontSize: 9)),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 32),

              // Vault Compartment detailed records
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Card(
                      color: Colors.black.withOpacity(0.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: kGoldGlow)),
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Box COMP ${activeVault.compartmentNo} Inventory Logs', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                            const Divider(color: kGoldGlow, height: 20),
                            _buildVaultItemRow('Operational Status:', 'Sealed SECURE'),
                            _buildVaultItemRow('Insurance valuation:', currencyFormatter.format(storedLoans.length * 95000)),
                            _buildVaultItemRow('Ambient Temperature:', '${activeVault.temperature.toStringAsFixed(1)} °C'),
                            _buildVaultItemRow('Audit Status verified:', activeVault.lastAudited),
                            const SizedBox(height: 16),
                            const Text('Pledged Items list:', style: TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12)),
                            if (storedLoans.isEmpty)
                              const Padding(
                                padding: EdgeInsets.all(12.0),
                                child: Text('No locked assets stored inside.', style: TextStyle(color: kTextMuted, fontSize: 12)),
                              )
                            else
                              ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: storedLoans.length,
                                itemBuilder: (context, index) {
                                  final l = storedLoans[index];
                                  return ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    title: Text(l.ticket, style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 12)),
                                    subtitle: Text(l.ornaments[0].type, style: const TextStyle(color: kTextMuted, fontSize: 11)),
                                    trailing: Text(currencyFormatter.format(l.principal), style: const TextStyle(color: kGold, fontWeight: FontWeight.bold, fontSize: 12)),
                                  );
                                },
                              )
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Card(
                      color: Colors.black.withOpacity(0.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: kGoldGlow)),
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Vault Operations Log', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                            const Divider(color: kGoldGlow, height: 20),
                            ...db.audits.where((a) => a.action.contains('Vault') || a.action.contains('Inspection') || a.action.contains('New')).take(5).map((a) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(a.action, style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12)),
                                      Text(a.timestamp.substring(11, 16), style: const TextStyle(color: kTextMuted, fontSize: 10)),
                                    ],
                                  ),
                                  const SizedBox(height: 2),
                                  Text(a.details, style: const TextStyle(color: kTextMuted, fontSize: 11)),
                                ],
                              ),
                            ))
                          ],
                        ),
                      ),
                    ),
                  )
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  void _executeAudit(String id) {
    setState(() {
      db.executeVaultInspection(id);
    });
    widget.onStateChange();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vault inspection complete! Security logs synced.')));
  }

  Widget _buildVaultItemRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: kTextMuted, fontSize: 12)),
          Text(value, style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }
}

// ==================== WIDGET: PAYMENT SCREEN ==================== //
class PaymentScreen extends StatefulWidget {
  final Loan initialLoan;
  final String initialMode;
  final VoidCallback onStateChange;
  final Function(Loan, Payment) onShowVoucher;

  const PaymentScreen({
    Key? key,
    required this.initialLoan,
    required this.initialMode,
    required this.onStateChange,
    required this.onShowVoucher,
  }) : super(key: key);

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  late Loan _loan;
  late String _action;
  final _amountTenderedController = TextEditingController();
  String _payMode = 'Cash';
  final _refNoController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loan = widget.initialLoan;
    _action = widget.initialMode;
    _updateSuggestedSum();
  }

  void _updateSuggestedSum() {
    double outstanding = _loan.principal;
    double interest = _loan.interestDue;
    double gst = interest * 0.18;
    double penalty = _loan.penalty;
    
    double suggestion = 0.0;
    if (_action == 'Interest') {
      suggestion = interest + gst + penalty;
    } else if (_action == 'Partial') {
      suggestion = interest + gst + penalty + (outstanding * 0.1);
    } else if (_action == 'Full Settlement') {
      suggestion = outstanding + interest + gst + penalty;
    } else {
      suggestion = interest + gst + penalty;
    }
    _amountTenderedController.text = suggestion.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    double outstanding = _loan.principal;
    double interest = _loan.interestDue;
    double gst = interest * 0.18;
    double penalty = _loan.penalty;

    double tendered = double.tryParse(_amountTenderedController.text) ?? 0.0;

    double totalDues = 0.0;
    if (_action == 'Interest') {
      totalDues = interest + gst + penalty;
    } else if (_action == 'Partial') {
      totalDues = interest + gst + penalty + (outstanding * 0.1);
    } else if (_action == 'Full Settlement') {
      totalDues = outstanding + interest + gst + penalty;
    } else {
      totalDues = interest + gst + penalty;
    }

    double change = (tendered - totalDues).clamp(0.0, double.infinity);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              color: kBgCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('💳 Payment Collections Terminal: ${_loan.ticket}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),

                    // Actions selection
                    _buildDropdown('Repayment Action', _action, ['Interest', 'Partial', 'Full Settlement', 'Renewal'], (val) {
                      setState(() {
                        _action = val!;
                        _updateSuggestedSum();
                      });
                    }),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField('Amount paid by Client (₹)', _amountTenderedController, TextInputType.number, (val) => setState(() {})),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Change refund (₹)', style: TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: Colors.black.withOpacity(0.3),
                                  border: Border.all(color: kGoldGlow),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(currencyFormatter.format(change), style: const TextStyle(color: kSuccess, fontWeight: FontWeight.bold, fontSize: 13)),
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                    const SizedBox(height: 16),

                    Row(
                      children: [
                        Expanded(
                          child: _buildDropdown('Payment channel', _payMode, ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'], (val) => setState(() => _payMode = val!)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField('Reference No (Digital TXN)', _refNoController, TextInputType.text, (val) {}),
                        )
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildTextField('Operator check notes', _notesController, TextInputType.text, (val) {}),
                    const SizedBox(height: 24),

                    ElevatedButton(
                      onPressed: () => _submitRepayment(totalDues, outstanding, interest, gst, penalty),
                      style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
                      child: const Text('SUBMIT REPAYMENT & ISSUE RECEIPT', style: TextStyle(fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),

        // Sidebar account checkouts
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kGoldGlow),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Billing Accounting', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.bold)),
                const Divider(color: kGoldGlow, height: 24),
                _buildBillingRow('Outstanding Principal:', currencyFormatter.format(outstanding)),
                _buildBillingRow('Interest Accrued:', currencyFormatter.format(interest)),
                _buildBillingRow('Overdue penalty (1%):', currencyFormatter.format(penalty), valueColor: kDanger),
                _buildBillingRow('GST on interest (18%):', currencyFormatter.format(gst)),
                _buildBillingRow('Transaction Context:', _action, valueColor: kGold),
                const Divider(color: kGoldGlow, height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Dues Payable:', style: TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(currencyFormatter.format(totalDues), style: const TextStyle(color: kGold, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                )
              ],
            ),
          ),
        )
      ],
    );
  }

  void _submitRepayment(double totalDues, double principal, double interest, double gst, double penalty) {
    double tendered = double.tryParse(_amountTenderedController.text) ?? 0.0;
    if (tendered < totalDues) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tendered sum insufficient to cover action dues.')));
      return;
    }

    double principalPaid = 0.0;
    if (_action == 'Partial') {
      principalPaid = totalDues - (interest + gst + penalty);
    } else if (_action == 'Full Settlement') {
      principalPaid = principal;
    }

    final pmt = Payment(
      id: 'PMT_${DateTime.now().millisecondsSinceEpoch}',
      date: DateTime.now().toIso8601String().split('T')[0],
      type: _action,
      principal: principalPaid,
      interest: interest,
      gst: gst,
      penalty: penalty,
      totalAmount: totalDues,
      mode: _payMode,
      refNo: _refNoController.text.isNotEmpty ? _refNoController.text : 'CASH-EOD-${Random().nextInt(90) + 10}',
      status: 'Success',
      collectedBy: db.currentUser!.name,
    );

    db.processPayment(_loan, pmt, _action);
    widget.onStateChange();
    widget.onShowVoucher(_loan, pmt);
  }

  Widget _buildDropdown(String label, String val, List<String> items, Function(String?) onChange) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.3),
            border: Border.all(color: kGoldGlow),
            borderRadius: BorderRadius.circular(8),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              dropdownColor: kBgSidebar,
              style: const TextStyle(color: kTextMain, fontSize: 13),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: onChange,
            ),
          ),
        )
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, [TextInputType type = TextInputType.text, Function(String)? onInput]) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: type,
          onChanged: onInput,
          style: const TextStyle(color: kTextMain, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGold)),
          ),
        )
      ],
    );
  }

  Widget _buildBillingRow(String label, String value, {Color valueColor = kTextMain}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: kTextMuted, fontSize: 13)),
          Text(value, style: TextStyle(color: valueColor, fontSize: 13)),
        ],
      ),
    );
  }
}

// ==================== WIDGETS: MOCK GRAPH PAINTERS (REPORTS) ==================== //
class DailyRatesScreen extends StatefulWidget {
  final VoidCallback onStateChange;

  const DailyRatesScreen({Key? key, required this.onStateChange}) : super(key: key);

  @override
  State<DailyRatesScreen> createState() => _DailyRatesScreenState();
}

class _DailyRatesScreenState extends State<DailyRatesScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  final _gold22Controller = TextEditingController();
  final _gold24Controller = TextEditingController();
  final _silverController = TextEditingController();
  final _platinumController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _gold22Controller.text = db.currentRates.gold22K.toStringAsFixed(0);
    _gold24Controller.text = db.currentRates.gold24K.toStringAsFixed(0);
    _silverController.text = db.currentRates.silver.toStringAsFixed(0);
    _platinumController.text = db.currentRates.platinum.toStringAsFixed(0);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              color: kBgCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('💰 Counter Metal Rates Manager', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),
                    Row(
                      children: [
                        Expanded(child: _buildTextField('Gold 22K (₹/g)', _gold22Controller)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTextField('Gold 24K (₹/g)', _gold24Controller)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: _buildTextField('Silver (₹/g)', _silverController)),
                        const SizedBox(width: 16),
                        Expanded(child: _buildTextField('Platinum (₹/g)', _platinumController)),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _updateRates,
                      style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                      child: const Text('Update spot board rates'),
                    ),
                    const SizedBox(height: 32),

                    const Text('Historical Valuation Index', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 20),
                    Container(
                      maxHeight: 200,
                      child: ListView.builder(
                        shrinkWrap: true,
                        itemCount: db.ratesHistory.length,
                        itemBuilder: (context, index) {
                          final r = db.ratesHistory[db.ratesHistory.length - 1 - index];
                          return ListTile(
                            title: Text(r.date, style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold)),
                            trailing: Text('Gold 22K: ₹${r.gold22K.toStringAsFixed(0)} | Silver: ₹${r.silver.toStringAsFixed(0)}', style: const TextStyle(color: kGold, fontSize: 13)),
                          );
                        },
                      ),
                    )
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),
        
        // Line chart container
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kGoldGlow),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Gold 22K Trend Index', style: TextStyle(color: kGold, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                Container(
                  width: double.infinity,
                  height: 180,
                  child: CustomPaint(
                    painter: LineChartPainter(history: db.ratesHistory.take(8).toList()),
                  ),
                ),
              ],
            ),
          ),
        )
      ],
    );
  }

  void _updateRates() {
    double g22 = double.tryParse(_gold22Controller.text) ?? 0;
    double g24 = double.tryParse(_gold24Controller.text) ?? 0;
    double sil = double.tryParse(_silverController.text) ?? 0;
    double plat = double.tryParse(_platinumController.text) ?? 0;

    if (g22 <= 0 || g24 <= 0) return;

    db.updateRates(g22, g24, sil, plat);
    widget.onStateChange();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Metal rate board synced!')));
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: TextInputType.number,
          style: const TextStyle(color: kTextMain, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
          ),
        )
      ],
    );
  }
}

class LineChartPainter extends CustomPainter {
  final List<PreciousRates> history;
  LineChartPainter({required this.history});

  @override
  void paint(Canvas canvas, Size size) {
    if (history.length < 2) return;
    
    final paintLine = Paint()
      ..color = kGold
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    final paintDot = Paint()
      ..color = kGold
      ..style = PaintingStyle.fill;

    double minP = history.map((e) => e.gold22K).reduce(min) - 10;
    double maxP = history.map((e) => e.gold22K).reduce(max) + 10;
    double range = maxP - minP;

    final points = <Offset>[];
    for (int i = 0; i < history.length; i++) {
      double x = (i / (history.length - 1)) * (size.width - 20) + 10;
      double y = size.height - (((history[i].gold22K - minP) / range) * (size.height - 30) + 15);
      points.add(Offset(x, y));
    }

    final path = Path()..moveTo(points[0].dx, points[0].dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(path, paintLine);

    for (var pt in points) {
      canvas.drawCircle(pt, 4.0, paintDot);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// ==================== WIDGETS: REPORTS SCREEN ==================== //
class ReportsScreen extends StatelessWidget {
  const ReportsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('📊 Analytical Intelligence Reports', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: kGold)),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Card(
                  color: kBgCard,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Monthly Interest Collections (₹)', style: TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 15)),
                        const Divider(color: kGoldGlow, height: 24),
                        Container(
                          width: double.infinity,
                          height: 220,
                          child: CustomPaint(
                            painter: BarChartPainter(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Card(
                  color: kBgCard,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Portfolio Asset Allocations', style: TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 15)),
                        const Divider(color: kGoldGlow, height: 24),
                        Container(
                          width: double.infinity,
                          height: 220,
                          child: CustomPaint(
                            painter: DonutChartPainter(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            ],
          )
        ],
      ),
    );
  }
}

class BarChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paintBar = Paint()
      ..color = kGold
      ..style = PaintingStyle.fill;

    final collections = [350000, 480000, 520000, 410000, 680000];
    double maxVal = collections.reduce(max) * 1.1;

    for (int i = 0; i < collections.length; i++) {
      double barHeight = (collections[i] / maxVal) * (size.height - 40);
      double x = i * (size.width / collections.length) + 15;
      double y = size.height - barHeight - 20;
      
      canvas.drawRRect(
        RRect.fromRectAndRadius(Rect.fromLTWH(x, y, 32, barHeight), const Radius.circular(4)),
        paintBar,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class DonutChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final rect = Rect.fromCircle(center: center, radius: 70);

    final paintActive = Paint()
      ..color = kGold
      ..strokeWidth = 20
      ..style = PaintingStyle.stroke;

    final paintOverdue = Paint()
      ..color = kDanger
      ..strokeWidth = 20
      ..style = PaintingStyle.stroke;

    final paintSettled = Paint()
      ..color = kSuccess
      ..strokeWidth = 20
      ..style = PaintingStyle.stroke;

    // Active (67% = 4.2 rad), Overdue (23% = 1.4 rad), Settled (10% = 0.6 rad)
    canvas.drawArc(rect, -pi / 2, 4.2, false, paintActive);
    canvas.drawArc(rect, -pi / 2 + 4.2, 1.4, false, paintOverdue);
    canvas.drawArc(rect, -pi / 2 + 5.6, 0.68, false, paintSettled);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ==================== SCREEN: OTHER COMPONENT MODULES ==================== //
class RedemptionScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  const RedemptionScreen({Key? key, required this.onStateChange}) : super(key: key);

  @override
  State<RedemptionScreen> createState() => _RedemptionScreenState();
}

class _RedemptionScreenState extends State<RedemptionScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  String _searchQuery = '';
  Loan? _selectedLoan;

  @override
  Widget build(BuildContext context) {
    final list = db.loans.where((l) => l.branchId == db.currentBranch!.id && l.status == 'Redeemed').toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Handover redemption coordinator', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
              const Divider(color: kGoldGlow, height: 24),
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                style: const TextStyle(color: kTextMain),
                decoration: InputDecoration(
                  hintText: 'Search settled loans...',
                  hintStyle: const TextStyle(color: kTextMuted),
                  prefixIcon: const Icon(Icons.search, color: kGold),
                  filled: true,
                  fillColor: Colors.black.withOpacity(0.3),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
                ),
              ),
              const SizedBox(height: 20),

              if (list.isEmpty)
                const Center(child: Text('No settled tickets pending asset release.', style: TextStyle(color: kTextMuted, fontSize: 13)))
              else
                ListView.builder(
                  shrinkWrap: true,
                  itemCount: list.length,
                  itemBuilder: (context, index) {
                    final l = list[index];
                    return ListTile(
                      title: Text(l.ticket, style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold)),
                      subtitle: Text('Location: ${l.vaultRef}', style: const TextStyle(color: kTextMuted)),
                      trailing: ElevatedButton(
                        onPressed: () {
                          db.logAuditEvent('Handover Executed', 'Physical ornaments for ticket ${l.ticket} returned to customer.');
                          widget.onStateChange();
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Asset release completed!')));
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain),
                        child: const Text('Execute Release Handover'),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class OverdueScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  const OverdueScreen({Key? key, required this.onStateChange}) : super(key: key);

  @override
  State<OverdueScreen> createState() => _OverdueScreenState();
}

class _OverdueScreenState extends State<OverdueScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  Loan? _selectedLoan;
  String _template = 'Overdue';

  @override
  Widget build(BuildContext context) {
    final list = db.loans.where((l) => l.branchId == db.currentBranch!.id && l.status == 'Overdue').toList();

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              color: kBgCard,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Delinquency Accounts Registry', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
                    const Divider(color: kGoldGlow, height: 24),
                    if (list.isEmpty)
                      const Center(child: Text('Zero overdue loans registered.', style: TextStyle(color: kSuccess, fontWeight: FontWeight.bold)))
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        itemCount: list.length,
                        itemBuilder: (context, index) {
                          final l = list[index];
                          final cust = db.customers.firstWhere((c) => c.id == l.customerId);
                          return ListTile(
                            title: Text('${l.ticket} — ${cust.name}', style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold)),
                            subtitle: Text('Late: ${l.daysOverdue} Days', style: const TextStyle(color: kDanger)),
                            onTap: () => setState(() => _selectedLoan = l),
                          );
                        },
                      )
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 20),

        // Simulated notifications drawer
        Expanded(
          child: Container(
            margin: const EdgeInsets.all(24),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: kBgCard, border: Border.all(color: kGoldGlow), borderRadius: BorderRadius.circular(12)),
            child: _selectedLoan == null
              ? const Center(child: Text('Select an overdue loan to simulate templates.', style: TextStyle(color: kTextMuted)))
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Simulate Communication Notice', style: TextStyle(color: kGold, fontWeight: FontWeight.bold, fontSize: 16)),
                    const Divider(color: kGoldGlow, height: 24),
                    DropdownButton<String>(
                      value: _template,
                      dropdownColor: kBgSidebar,
                      style: const TextStyle(color: kTextMain),
                      isExpanded: true,
                      items: ['Overdue', 'DueSoon', 'AuctionNotice'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                      onChanged: (val) => setState(() => _template = val!),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.3), border: Border.all(color: kGoldGlow), borderRadius: BorderRadius.circular(8)),
                      child: Text(_getMessageText(), style: const TextStyle(color: kTextMain, fontSize: 12)),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: _getMessageText()));
                        db.logAuditEvent('Notice Dispatched', 'Simulated warning SMS/WhatsApp message sent.');
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message copied to clipboard! (Simulated Gateway Push)')));
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain, minimumSize: const Size.fromHeight(45)),
                      child: const Text('DISPATCH NOTICE ALERT'),
                    )
                  ],
                ),
          ),
        )
      ],
    );
  }

  String _getMessageText() {
    if (_selectedLoan == null) return '';
    final cust = db.customers.firstWhere((c) => c.id == _selectedLoan!.customerId);
    if (_template == 'Overdue') {
      return '⚠️ OVERDUE ALERT: Dear ${cust.name}, Gold loan ${_selectedLoan!.ticket} is overdue. Dues: ₹${_selectedLoan!.balancePayable.toStringAsFixed(0)}. Please clear immediately to prevent legal foreclosures.';
    } else {
      return 'Dear ${cust.name}, friendly reminder that Gold loan ${_selectedLoan!.ticket} will mature soon. Please arrange repayment. Regards, Sri Lakshmi Pawn.';
    }
  }
}

class AuctionScreen extends StatelessWidget {
  const AuctionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final list = LocalDatabase.instance.loans.where((l) => l.branchId == LocalDatabase.instance.currentBranch!.id && l.status == 'Overdue' && l.daysOverdue >= 180).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('📈 Delinquent Collaterals Auction Pool', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
              const Divider(color: kGoldGlow, height: 24),
              const Text('Loans defaulted for 6+ months (180+ days overdue) processed under RBI disposal rules.', style: TextStyle(color: kTextMuted, fontSize: 13)),
              const SizedBox(height: 20),

              if (list.isEmpty)
                const Center(child: Text('Zero loans currently eligible for public foreclosure auctions.', style: TextStyle(color: kSuccess, fontWeight: FontWeight.bold, fontSize: 13)))
              else
                Table(
                  border: TableBorder(bottom: BorderSide(color: kTextMuted.withOpacity(0.1))),
                  children: [
                    const TableRow(
                      children: [
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Ticket', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Appraised Worth', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Reserve Price (80%)', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                        Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Default Days', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                      ]
                    ),
                    ...list.map((l) => TableRow(
                      children: [
                        Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(l.ticket, style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12))),
                        Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(currencyFormatter.format(l.collateralValue), style: const TextStyle(color: kTextMain, fontSize: 12))),
                        Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(currencyFormatter.format(l.collateralValue * 0.8), style: const TextStyle(color: kSuccess, fontWeight: FontWeight.bold, fontSize: 12))),
                        Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text('${l.daysOverdue} Days', style: const TextStyle(color: kDanger, fontSize: 12))),
                      ]
                    ))
                  ],
                )
            ],
          ),
        ),
      ),
    );
  }
}

class AuditScreen extends StatelessWidget {
  const AuditScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('⏳ Central Compliance Audit Records', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
              const Divider(color: kGoldGlow, height: 24),
              Table(
                border: TableBorder(bottom: BorderSide(color: kTextMuted.withOpacity(0.1))),
                columnWidths: const {
                  0: FlexColumnWidth(1.2),
                  1: FlexColumnWidth(1.2),
                  2: FlexColumnWidth(1.2),
                  3: FlexColumnWidth(3.0),
                },
                children: [
                  const TableRow(
                    children: [
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('User', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Branch', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Action', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('Details', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold))),
                    ]
                  ),
                  ...LocalDatabase.instance.audits.map((a) => TableRow(
                    children: [
                      Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(a.username, style: const TextStyle(fontWeight: FontWeight.bold, color: kTextMain, fontSize: 12))),
                      Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(a.branchCode, style: const TextStyle(color: kTextMain, fontSize: 12))),
                      Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(a.action, style: const TextStyle(color: kTextMain, fontSize: 12))),
                      Padding(padding: const EdgeInsets.symmetric(vertical: 10.0), child: Text(a.details, style: const TextStyle(color: kTextMuted, fontSize: 12))),
                    ]
                  ))
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}

class SettingsScreen extends StatefulWidget {
  final VoidCallback onStateChange;
  const SettingsScreen({Key? key, required this.onStateChange}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  final _shopNameController = TextEditingController();
  final _licNoController = TextEditingController();
  final _gstinController = TextEditingController();
  final _addrController = TextEditingController();
  final _ltvController = TextEditingController();
  final _graceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _shopNameController.text = db.settings.shopName;
    _licNoController.text = db.settings.rbiLicenseNo;
    _gstinController.text = db.settings.gstinNo;
    _addrController.text = db.settings.address;
    _ltvController.text = db.settings.eligibleCollateralPct.toStringAsFixed(0);
    _graceController.text = db.settings.defaultGracePeriodDays.toString();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Card(
        color: kBgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: kGoldGlow)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('⚙️ Corporate Config & Policies Settings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: kGold)),
              const Divider(color: kGoldGlow, height: 24),
              _buildTextField('Shop Name', _shopNameController),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildTextField('RBI License', _licNoController)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildTextField('GSTIN Register No', _gstinController)),
                ],
              ),
              const SizedBox(height: 16),
              _buildTextField('Physical Address', _addrController),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildTextField('LTV Ratio Cap (%)', _ltvController)),
                  const SizedBox(width: 16),
                  Expanded(child: _buildTextField('Interest grace days', _graceController)),
                ],
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saveSettings,
                style: ElevatedButton.styleFrom(backgroundColor: kGold, foregroundColor: kBgMain, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                child: const Text('Save configuration board'),
              )
            ],
          ),
        ),
      ),
    );
  }

  void _saveSettings() {
    db.settings.shopName = _shopNameController.text;
    db.settings.rbiLicenseNo = _licNoController.text;
    db.settings.gstinNo = _gstinController.text;
    db.settings.address = _addrController.text;
    db.settings.eligibleCollateralPct = double.tryParse(_ltvController.text) ?? 75.0;
    db.settings.defaultGracePeriodDays = int.tryParse(_graceController.text) ?? 5;
    
    db.logAuditEvent('Settings Updated', 'Corporate profile and lending LTV margin ratios altered.');
    widget.onStateChange();
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('System configuration settings saved successfully!')));
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 12, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          style: const TextStyle(color: kTextMain, fontSize: 13),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.black.withOpacity(0.3),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: kGoldGlow)),
          ),
        )
      ],
    );
  }
}
