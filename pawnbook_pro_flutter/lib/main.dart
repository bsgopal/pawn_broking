// PawnBook Pro v2.0 - Responsive Main Entry Shell with JWT Auto-Login
import 'package:flutter/material.dart';
import 'models.dart';
import 'database.dart';
import 'screens.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize persistence layer and authenticate auto-login if active JWT token is found
  await LocalDatabase.instance.initialize();
  
  runApp(const PawnBookApp());
}

class PawnBookApp extends StatelessWidget {
  const PawnBookApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PawnBook Pro — Advanced Jewelry Pawn Broking ERP',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: kBgMain,
        primaryColor: kGold,
        hintColor: kGold,
        cardColor: kBgCard,
        // Corporate typography configuration mapping Segoe UI / Roboto
        fontFamily: 'Segoe UI',
        appBarTheme: const AppBarTheme(
          backgroundColor: kBgSidebar,
          elevation: 0,
          border: Border(bottom: BorderSide(color: kGoldGlow, width: 0.5)),
        ),
        cardTheme: CardTheme(
          color: kBgCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: kGoldGlow, width: 0.5),
          ),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: kTextMain, fontSize: 14),
          bodyMedium: TextStyle(color: kTextMuted, fontSize: 12),
        ),
      ),
      home: const AuthenticationWrapper(),
    );
  }
}

class AuthenticationWrapper extends StatefulWidget {
  const AuthenticationWrapper({Key? key}) : super(key: key);

  @override
  State<AuthenticationWrapper> createState() => _AuthenticationWrapperState();
}

class _AuthenticationWrapperState extends State<AuthenticationWrapper> {
  final LocalDatabase db = LocalDatabase.instance;
  late bool _isAuthenticated;

  @override
  void initState() {
    super.initState();
    // Auto-login succeeds if db has decoded a valid JWT payload on initialization
    _isAuthenticated = db.currentUser != null;
  }

  void _onLoginSuccess() {
    setState(() {
      _isAuthenticated = true;
    });
  }

  void _onLogout() async {
    await db.logout();
    setState(() {
      _isAuthenticated = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isAuthenticated && db.currentUser != null) {
      return MainAppShell(onLogout: _onLogout);
    }
    return LoginScreen(onLoginSuccess: _onLoginSuccess);
  }
}

// ==================== GOOGLE/MICROSOFT THEMED LOGIN ==================== //
class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({Key? key, required this.onLoginSuccess}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final LocalDatabase db = LocalDatabase.instance;
  String? _selectedBranchId;
  final _mobileController = TextEditingController(text: '9345578103');
  final _passwordController = TextEditingController(text: '123456');
  String _errorMsg = '';

  @override
  void initState() {
    super.initState();
    if (db.branches.isNotEmpty) {
      _selectedBranchId = db.branches.first.id;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), kBgMain],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            child: Container(
              width: 380,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
              decoration: BoxDecoration(
                color: kBgCard.withOpacity(0.7),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withOpacity(0.08)),
                boxShadow: const [
                  BoxShadow(color: Colors.black38, blurRadius: 20, offset: Offset(0, 8)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Center(
                    child: Column(
                      children: [
                        Text(
                          'PAWNBOOK PRO',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: kGold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Enterprise Jewelry Broking System',
                          style: TextStyle(color: kTextMuted, fontSize: 10, letterSpacing: 0.5),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  if (_errorMsg.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.bottom(20),
                      decoration: BoxDecoration(
                        color: kDanger.withOpacity(0.08),
                        border: Border.all(color: kDanger.withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(_errorMsg, style: const TextStyle(color: kDanger, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),

                  _buildBranchDropdown(),
                  const SizedBox(height: 18),
                  _buildTextField('Operator Mobile', _mobileController, Icons.phone, false),
                  const SizedBox(height: 18),
                  _buildTextField('Security Password', _passwordController, Icons.lock, true),
                  const SizedBox(height: 28),

                  ElevatedButton(
                    onPressed: _handleLogin,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kGold,
                      foregroundColor: kBgMain,
                      minimumSize: const Size.fromHeight(48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      elevation: 0,
                    ),
                    child: const Text('AUTHENTICATE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, letterSpacing: 0.5)),
                  ),
                  
                  const SizedBox(height: 24),
                  const Center(
                    child: Text(
                      'Demo: 9345578103 / pass: 123456\nSecured under offline JWT token credentials',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kTextMuted, fontSize: 9, height: 1.4),
                    ),
                  )
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBranchDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Operational Counter Branch', style: TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.2),
            border: Border.all(color: Colors.white.withOpacity(0.1)),
            borderRadius: BorderRadius.circular(4),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedBranchId,
              isExpanded: true,
              dropdownColor: kBgSidebar,
              items: db.branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name, style: const TextStyle(fontSize: 12)))).toList(),
              onChanged: (val) => setState(() => _selectedBranchId = val),
            ),
          ),
        )
      ],
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, IconData icon, bool isObscured) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        SizedBox(
          height: 40,
          child: TextField(
            controller: controller,
            obscureText: isObscured,
            style: const TextStyle(color: kTextMain, fontSize: 12),
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.black.withOpacity(0.2),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide(color: Colors.white.withOpacity(0.1))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: const BorderSide(color: kGold)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            ),
          ),
        )
      ],
    );
  }

  void _handleLogin() async {
    if (_selectedBranchId == null || _mobileController.text.isEmpty || _passwordController.text.isEmpty) {
      setState(() {
        _errorMsg = 'Please complete all counter fields.';
      });
      return;
    }

    final success = await db.authenticate(_mobileController.text, _passwordController.text, _selectedBranchId!);
    if (success) {
      widget.onLoginSuccess();
    } else {
      setState(() {
        _errorMsg = 'Invalid security parameters or signature mismatch.';
      });
    }
  }
}

// ==================== RESPONSIVE WORKSPACE SHELL ==================== //
class MainAppShell extends StatefulWidget {
  final VoidCallback onLogout;

  const MainAppShell({Key? key, required this.onLogout}) : super(key: key);

  @override
  State<MainAppShell> createState() => _MainAppShellState();
}

class _MainAppShellState extends State<MainAppShell> {
  final LocalDatabase db = LocalDatabase.instance;
  String _activePage = 'dashboard';

  Loan? _printableLoan;
  Payment? _printablePayment;

  // Mobile Bottom Navigation tabs map
  final List<String> _mobileTabs = ['dashboard', 'quick-pawn', 'pawn-list', 'vault-manager'];

  @override
  Widget build(BuildContext context) {
    final activeLoans = db.loans.where((l) => l.branchId == db.currentBranch!.id).toList();
    final overdueCount = activeLoans.where((l) => l.status == 'Overdue' || l.daysOverdue > 0).length;
    final dueCount = activeLoans.where((l) => l.maturityDate == '2026-05-30' && l.status == 'Active').length;

    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth <= 800;

        return PopScope(
          canPop: _activePage == 'dashboard',
          onPopInvoked: (didPop) {
            if (didPop) return;
            // Back action pushes users to Dashboard instead of terminating the app
            setState(() {
              _activePage = 'dashboard';
            });
          },
          child: Scaffold(
            appBar: isMobile
              ? AppBar(
                  title: Text(db.currentBranch!.name, style: const TextStyle(color: kGold, fontSize: 14, fontWeight: FontWeight.bold)),
                  actions: [
                    _buildTopbarAlertCard('${overdueCount} Overdue', kDanger, Icons.notifications_active),
                    const SizedBox(width: 8),
                  ],
                )
              : null,
            drawer: isMobile ? _buildMobileDrawer(activeLoans.length, overdueCount) : null,
            body: Stack(
              children: [
                Row(
                  children: [
                    // Sidebar drawer visible only on Desktop Viewports
                    if (!isMobile)
                      Container(
                        width: 240,
                        color: kBgSidebar,
                        decoration: BoxDecoration(border: Border(right: BorderSide(color: Colors.white.withOpacity(0.05)))),
                        child: Column(
                          children: [
                            _buildSidebarHeader(),
                            Expanded(
                              child: ListView(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                children: [
                                  _buildSidebarTile('dashboard', 'Dashboard', Icons.dashboard),
                                  _buildSidebarTile('quick-pawn', '⚡ Quick Pawn', Icons.bolt),
                                  _buildSidebarTile('new-pawn', 'New Pawn', Icons.file_copy),
                                  _buildSidebarTile('pawn-list', 'Pawn List', Icons.list, badge: activeLoans.length),
                                  _buildSidebarTile('vault-manager', 'Vault Manager', Icons.security),
                                  _buildSidebarTile('redemption-hub', 'Redemption Hub', Icons.handshake),
                                  _buildSidebarTile('overdue-manager', 'Overdue Manager', Icons.warning, badge: overdueCount, isYellowBadge: true),
                                  _buildSidebarTile('auction-board', 'Auctions', Icons.gavel),
                                  _buildSidebarTile('daily-rates', 'Precious Rates', Icons.monetization_on),
                                  _buildSidebarTile('reports', 'Reports', Icons.pie_chart),
                                  _buildSidebarTile('audit-trail', 'Audit Trail', Icons.history),
                                  _buildSidebarTile('settings', 'Settings', Icons.settings),
                                ],
                              ),
                            ),
                            _buildSidebarFooter(),
                          ],
                        ),
                      ),

                    // Main view panel
                    Expanded(
                      child: Column(
                        children: [
                          // Standard Desktop Topbar Header
                          if (!isMobile)
                            Container(
                              height: 70,
                              color: kBgSidebar,
                              padding: const EdgeInsets.symmetric(horizontal: 24),
                              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(color: kGold.withOpacity(0.08), border: Border.all(color: kGold.withOpacity(0.3)), borderRadius: BorderRadius.circular(4)),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.location_on, color: kGold, size: 13),
                                        const SizedBox(width: 6),
                                        Text(db.currentBranch!.name, style: const TextStyle(color: kGold, fontSize: 11, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      _buildTopbarAlertCard('${overdueCount} Overdue', kDanger, Icons.notifications_active),
                                      const SizedBox(width: 12),
                                      _buildTopbarAlertCard('${dueCount} Due Today', kWarning, Icons.hourglass_empty),
                                    ],
                                  )
                                ],
                              ),
                            ),

                          // Metal pricing ticker ribbon (scaled for mobile viewports)
                          Container(
                            height: 38,
                            color: Colors.black.withOpacity(0.4),
                            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))),
                            child: SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Row(
                                children: [
                                  _buildTickerItem('Gold 22K', db.currentRates.gold22K),
                                  const SizedBox(width: 24),
                                  _buildTickerItem('Gold 24K', db.currentRates.gold24K),
                                  const SizedBox(width: 24),
                                  _buildTickerItem('Silver', db.currentRates.silver),
                                  const SizedBox(width: 24),
                                  _buildTickerItem('Platinum', db.currentRates.platinum),
                                ],
                              ),
                            ),
                          ),

                          // Dynamic Workspace Panel View
                          Expanded(
                            child: Container(
                              color: kBgMain,
                              child: _renderActiveScreen(),
                            ),
                          )
                        ],
                      ),
                    )
                  ],
                ),

                // Printable receipts modal overlays
                if (_printableLoan != null) _buildPrintTicketOverlay(),
              ],
            ),
            bottomNavigationBar: isMobile
              ? BottomNavigationBar(
                  currentIndex: _mobileTabs.contains(_activePage) ? _mobileTabs.indexOf(_activePage) : 0,
                  backgroundColor: kBgSidebar,
                  selectedItemColor: kGold,
                  unselectedItemColor: kTextMuted,
                  selectedFontSize: 11,
                  unselectedFontSize: 11,
                  type: BottomNavigationBarType.fixed,
                  onTap: (index) {
                    setState(() {
                      _activePage = _mobileTabs[index];
                    });
                  },
                  items: const [
                    BottomNavigationBarItem(icon: Icon(Icons.dashboard, size: 20), label: 'Dashboard'),
                    BottomNavigationBarItem(icon: Icon(Icons.bolt, size: 20), label: 'Quick Pawn'),
                    BottomNavigationBarItem(icon: Icon(Icons.list, size: 20), label: 'Pawn List'),
                    BottomNavigationBarItem(icon: Icon(Icons.security, size: 20), label: 'Vaults'),
                  ],
                )
              : null,
          ),
        );
      },
    );
  }

  Widget _buildMobileDrawer(int loansLen, int overdueCount) {
    return Drawer(
      backgroundColor: kBgSidebar,
      child: Column(
        children: [
          _buildSidebarHeader(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildSidebarTile('new-pawn', 'New Pawn', Icons.file_copy),
                _buildSidebarTile('redemption-hub', 'Redemption Hub', Icons.handshake),
                _buildSidebarTile('overdue-manager', 'Overdue Manager', Icons.warning, badge: overdueCount, isYellowBadge: true),
                _buildSidebarTile('auction-board', 'Auctions', Icons.gavel),
                _buildSidebarTile('daily-rates', 'Precious Rates', Icons.monetization_on),
                _buildSidebarTile('reports', 'Reports', Icons.pie_chart),
                _buildSidebarTile('audit-trail', 'Audit Trail', Icons.history),
                _buildSidebarTile('settings', 'Settings', Icons.settings),
              ],
            ),
          ),
          _buildSidebarFooter(),
        ],
      ),
    );
  }

  Widget _buildSidebarHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))),
      child: const Center(
        child: Column(
          children: [
            Text(
              'PAWNBOOK PRO',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: kGold, letterSpacing: 1.0),
            ),
            SizedBox(height: 2),
            Text(
              'Secure Jewelry Broking ERP',
              style: TextStyle(color: kTextMuted, fontSize: 9, letterSpacing: 0.5),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildSidebarTile(String pageId, String title, IconData icon, {int badge = 0, bool isYellowBadge = false}) {
    bool isActive = _activePage == pageId;
    return InkWell(
      onTap: () {
        setState(() {
          _activePage = pageId;
        });
        if (Navigator.of(context).canPop()) {
          Navigator.of(context).pop(); // Dismiss drawer on Mobile viewports
        }
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: isActive ? kBgCard : Colors.transparent,
          border: isActive ? const Border(left: BorderSide(color: kGold, width: 3)) : null,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Row(
          children: [
            Icon(icon, color: isActive ? kGold : kTextMuted, size: 18),
            const SizedBox(width: 12),
            Text(
              title,
              style: TextStyle(
                color: isActive ? kGold : kTextMuted,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            if (badge > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isYellowBadge ? kWarning : kDanger,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge.toString(),
                  style: TextStyle(
                    color: isYellowBadge ? kBgMain : Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 9,
                  ),
                ),
              )
          ],
        ),
      ),
    );
  }

  Widget _buildSidebarFooter() {
    final initials = db.currentUser!.name.split(' ').map((e) => e[0]).join('');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05)))),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: kGold,
                child: Text(initials, style: const TextStyle(color: kBgMain, fontWeight: FontWeight.bold, fontSize: 11)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(db.currentUser!.name, style: const TextStyle(color: kTextMain, fontSize: 12, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                    Text('${db.currentUser!.role} Operator', style: const TextStyle(color: kTextMuted, fontSize: 10)),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: widget.onLogout,
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.white.withOpacity(0.1)),
              foregroundColor: kTextMuted,
              minimumSize: const Size.fromHeight(36),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            ),
            child: const Text('Revoke Token & Exit', style: TextStyle(fontSize: 11)),
          )
        ],
      ),
    );
  }

  Widget _buildTopbarAlertCard(String text, Color borderCol, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: borderCol.withOpacity(0.05),
        border: Border.all(color: borderCol.withOpacity(0.2)),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: borderCol, size: 12),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(color: borderCol, fontSize: 10, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildTickerItem(String label, double value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 5, height: 5, decoration: const BoxDecoration(color: kGold, shape: BoxShape.circle)),
        const SizedBox(width: 6),
        Text('$label: ', style: const TextStyle(color: kTextMuted, fontSize: 11)),
        Text(currencyFormatter.format(value), style: const TextStyle(color: kTextMain, fontWeight: FontWeight.bold, fontSize: 11)),
      ],
    );
  }

  Widget _renderActiveScreen() {
    switch (_activePage) {
      case 'dashboard':
        return DashboardScreen(
          onStateChange: () => setState(() {}),
          onNavigate: (page) => setState(() => _activePage = page),
          onRouteToRepay: (loan) {
            setState(() {
              _printableLoan = loan;
              _printablePayment = null;
              _activePage = 'payment-screen';
            });
          },
        );
      case 'quick-pawn':
        return QuickPawnScreen(
          onStateChange: () => setState(() {}),
          onShowReceipt: (loan) {
            setState(() {
              _printableLoan = loan;
              _printablePayment = null;
            });
          },
        );
      case 'new-pawn':
        return NewPawnScreen(
          onStateChange: () => setState(() {}),
          onShowReceipt: (loan) {
            setState(() {
              _printableLoan = loan;
              _printablePayment = null;
            });
          },
        );
      case 'pawn-list':
        return PawnListScreen(
          onStateChange: () => setState(() {}),
          onRouteToPayment: (loan, mode) {
            setState(() {
              _printableLoan = loan;
              _printablePayment = null;
              _activePage = 'payment-screen';
            });
          },
        );
      case 'vault-manager':
        return VaultManagerScreen(
          onStateChange: () => setState(() {}),
        );
      case 'payment-screen':
        return PaymentScreen(
          initialLoan: _printableLoan ?? db.loans.firstWhere((element) => element.status == 'Active'),
          initialMode: 'Interest',
          onStateChange: () => setState(() {}),
          onShowVoucher: (loan, pmt) {
            setState(() {
              _printableLoan = loan;
              _printablePayment = pmt;
            });
          },
        );
      case 'redemption-hub':
        return RedemptionScreen(
          onStateChange: () => setState(() {}),
        );
      case 'overdue-manager':
        return OverdueScreen(
          onStateChange: () => setState(() {}),
        );
      case 'auction-board':
        return const AuctionScreen();
      case 'daily-rates':
        return DailyRatesScreen(
          onStateChange: () => setState(() {}),
        );
      case 'reports':
        return const ReportsScreen();
      case 'audit-trail':
        return const AuditScreen();
      case 'settings':
        return SettingsScreen(
          onStateChange: () => setState(() {}),
        );
      default:
        return const Center(child: Text('Panel view offline.'));
    }
  }

  Widget _buildPrintTicketOverlay() {
    final loan = _printableLoan!;
    final pmt = _printablePayment;
    final cust = db.customers.firstWhere((c) => c.id == loan.customerId);

    return Scaffold(
      backgroundColor: Colors.black87,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Container(
            width: 440,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 20)],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      Text(db.settings.shopName, style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w900, fontSize: 16, fontFamily: 'Segoe UI', letterSpacing: 0.5)),
                      const SizedBox(height: 2),
                      Text(db.settings.address, style: const TextStyle(color: Colors.black54, fontSize: 11)),
                      Text('LIC: ${db.settings.rbiLicenseNo} | GSTIN: ${db.settings.gstinNo}', style: const TextStyle(color: Colors.black54, fontSize: 10)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(border: Border.all(color: Colors.black, width: 1.5)),
                        child: Text(pmt == null ? 'GOLD LOAN TICKET' : 'REPAYMENT RECEIPT', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
                      )
                    ],
                  ),
                ),
                const Divider(color: Colors.black87, height: 28),
                
                _buildTicketRow('Ticket Number:', loan.ticket),
                _buildTicketRow('Client Name:', cust.name),
                _buildTicketRow('Contact Phone:', cust.mobile),
                
                if (pmt == null) ...[
                  _buildTicketRow('Asset category:', loan.ornaments[0].type),
                  _buildTicketRow('Net Valuation Wt:', '${loan.totalNetWt.toStringAsFixed(2)} gm'),
                  _buildTicketRow('Collateral appraisal:', currencyFormatter.format(loan.collateralValue)),
                  const Divider(color: Colors.black54, height: 16),
                  _buildTicketRow('Disbursed Principal:', currencyFormatter.format(loan.principal), isBold: true),
                  _buildTicketRow('Vault storage box:', loan.vaultRef),
                ] else ...[
                  _buildTicketRow('Repayment action:', pmt.type, isBold: true),
                  _buildTicketRow('Principal clear:', currencyFormatter.format(pmt.principal)),
                  _buildTicketRow('Interest collected:', currencyFormatter.format(pmt.interest)),
                  _buildTicketRow('CGST/SGST tax (18%):', currencyFormatter.format(pmt.gst)),
                  _buildTicketRow('Overdue penalty clear:', currencyFormatter.format(pmt.penalty)),
                  const Divider(color: Colors.black54, height: 16),
                  _buildTicketRow('Net cash collected:', currencyFormatter.format(pmt.totalAmount), isBold: true),
                  _buildTicketRow('Remaining balance:', currencyFormatter.format(loan.principal)),
                ],

                const Divider(color: Colors.black87, height: 28),
                const Center(
                  child: Text('Assayed and locked securely under safe branch custody.\nRates capped under RBI 24% p.a. guidelines.', textAlign: TextAlign.center, style: TextStyle(color: Colors.black54, fontSize: 9)),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _printableLoan = null;
                          _printablePayment = null;
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.black),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                      child: const Text('Close'),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          _printableLoan = null;
                          _printablePayment = null;
                        });
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Print job queued successfully!')));
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                      child: const Text('Print Voucher'),
                    )
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTicketRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.black87, fontSize: 11)),
          Text(value, style: TextStyle(color: Colors.black, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, fontSize: 11)),
        ],
      ),
    );
  }
}
