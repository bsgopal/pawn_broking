// PawnBook Pro v2.0 - Smart Auto-Detecting Dual-Mode API & Local Persistence Client
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import 'models.dart';

// Simulated JSON Web Token Service (Used during Offline Fallback)
class JwtService {
  static final _encoder = base64Url.encoder;
  static final _decoder = base64Url.decoder;

  static String generateToken(User user, Branch branch) {
    final Map<String, dynamic> header = {'alg': 'HS256', 'typ': 'JWT'};
    final Map<String, dynamic> payload = {
      'userId': user.id,
      'name': user.name,
      'role': user.role,
      'branchId': branch.id,
      'exp': DateTime.now().add(const Duration(hours: 24)).millisecondsSinceEpoch ~/ 1000,
    };
    return '${_base64UrlEncode(jsonEncode(header))}.${_base64UrlEncode(jsonEncode(payload))}.${_base64UrlEncode('pb_secure_offline_signature')}';
  }

  static Map<String, dynamic>? decodeAndValidateToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      final payload = jsonDecode(_base64UrlDecode(parts[1]));
      if ((DateTime.now().millisecondsSinceEpoch ~/ 1000) > (payload['exp'] as int)) return null;
      return payload;
    } catch (e) {
      return null;
    }
  }

  static String _base64UrlEncode(String input) => _encoder.convert(utf8.encode(input)).replaceAll('=', '');
  static String _base64UrlDecode(String input) {
    String normalized = input;
    int remainder = input.length % 4;
    if (remainder == 2) normalized += '==';
    else if (remainder == 3) normalized += '=';
    return utf8.decode(_decoder.convert(normalized));
  }
}

class LocalDatabase {
  static final LocalDatabase instance = LocalDatabase._init();
  LocalDatabase._init();

  // Smart configuration: Dynamic base URL resolution depending on running platform
  String get baseUrl {
    if (kIsWeb) return 'http://localhost:3000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000'; // Loopback to host machine
    } catch (e) {}
    return 'http://localhost:3000';
  }

  bool isServerActive = false; // Set dynamically on launch

  // Global In-Memory Runtime Cache
  List<Branch> branches = [];
  List<User> users = [];
  List<Customer> customers = [];
  List<Loan> loans = [];
  List<VaultCompartment> vaults = [];
  List<PreciousRates> ratesHistory = [];
  PreciousRates currentRates = PreciousRates(date: '2026-05-30', gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500);
  List<AuctionLot> auctions = [];
  List<AuditEntry> audits = [];
  SystemSettings settings = SystemSettings(
    shopName: 'Sri Lakshmi Pawn Brokers',
    rbiLicenseNo: 'RB/2026/0045',
    gstinNo: '33ABCDE1234F1Z5',
    address: '123 Gandhi Nagar, T Nagar, Chennai',
    eligibleCollateralPct: 75,
    rbiInterestCapPa: 24,
    defaultGracePeriodDays: 5,
    defaultPenaltyPct: 1,
    smsRemindersEnabled: true,
  );

  User? currentUser;
  Branch? currentBranch;
  String? activeJwtToken;

  bool _isInitialized = false;

  Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (activeJwtToken != null) 'Authorization': 'Bearer $activeJwtToken',
  };

  // Diagnostic Ping check + Seeding
  Future<void> initialize() async {
    if (_isInitialized) return;

    // 1. Diagnostic ping: check if Express backend is running on target port
    try {
      final response = await http.get(Uri.parse('$baseUrl/api/rates')).timeout(const Duration(milliseconds: 1500));
      if (response.statusCode == 200) {
        isServerActive = true;
      }
    } catch (e) {
      isServerActive = false; // Server unreachable: shift automatically to Offline Fallback Mode
    }

    if (isServerActive) {
      await _initializeFullStackMode();
    } else {
      await _initializeOfflineMode();
    }

    _isInitialized = true;
  }

  // ==================== MODE A: FULL-STACK NETWORK CLIENT ==================== //
  Future<void> _initializeFullStackMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? token = prefs.getString('pawnbook_pro_jwt_token');

      if (token != null) {
        activeJwtToken = token;
        // Verify token with backend
        final response = await http.get(Uri.parse('$baseUrl/api/auth/verify'), headers: headers);
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          currentUser = User.fromJson(data['user']);
          currentBranch = Branch.fromJson(data['branch']);
          
          // Preload data from server files
          await fetchAllServerData();
        } else {
          await prefs.remove('pawnbook_pro_jwt_token');
          activeJwtToken = null;
        }
      } else {
        // Fallback fetch static data for counter login
        final response = await http.post(
          Uri.parse('$baseUrl/api/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'mobile': '9345578103', 'password': 'dummy_does_not_exist'}),
        );
        // Will fail but server sets default tables during boot. We pull branches dynamically.
      }
    } catch (e) {}
  }

  Future<void> fetchAllServerData() async {
    try {
      final loansRes = await http.get(Uri.parse('$baseUrl/api/loans'), headers: headers);
      if (loansRes.statusCode == 200) {
        loans = (jsonDecode(loansRes.body) as List).map((l) => Loan.fromJson(l)).toList();
      }

      final custsRes = await http.get(Uri.parse('$baseUrl/api/customers'), headers: headers);
      if (custsRes.statusCode == 200) {
        customers = (jsonDecode(custsRes.body) as List).map((c) => Customer.fromJson(c)).toList();
      }

      final vaultsRes = await http.get(Uri.parse('$baseUrl/api/vaults'), headers: headers);
      if (vaultsRes.statusCode == 200) {
        vaults = (jsonDecode(vaultsRes.body) as List).map((v) => VaultCompartment.fromJson(v)).toList();
      }

      final ratesRes = await http.get(Uri.parse('$baseUrl/api/rates'), headers: headers);
      if (ratesRes.statusCode == 200) {
        final ratesData = jsonDecode(ratesRes.body);
        currentRates = PreciousRates.fromJson(ratesData['current']);
        ratesHistory = (ratesData['history'] as List).map((h) => PreciousRates.fromJson(h)).toList();
      }

      final auditsRes = await http.get(Uri.parse('$baseUrl/api/audits'), headers: headers);
      if (auditsRes.statusCode == 200) {
        audits = (jsonDecode(auditsRes.body) as List).map((a) => AuditEntry.fromJson(a)).toList();
      }

      final setsRes = await http.get(Uri.parse('$baseUrl/api/settings'), headers: headers);
      if (setsRes.statusCode == 200) {
        settings = SystemSettings.fromJson(jsonDecode(setsRes.body));
      }
    } catch (e) {}
  }

  // ==================== MODE B: STANDALONE OFFLINE FALLBACK ==================== //
  Future<void> _initializeOfflineMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? dbJson = prefs.getString('pawnbook_pro_db_flutter');
      if (dbJson != null) {
        final Map<String, dynamic> state = jsonDecode(dbJson);
        _loadStateFromMap(state);
      } else {
        _seedMockData();
        await persist();
      }

      final String? storedToken = prefs.getString('pawnbook_pro_jwt_token');
      if (storedToken != null) {
        final payload = JwtService.decodeAndValidateToken(storedToken);
        if (payload != null) {
          currentUser = users.firstWhere((u) => u.id == payload['userId']);
          currentBranch = branches.firstWhere((b) => b.id == payload['branchId']);
          activeJwtToken = storedToken;
        } else {
          await prefs.remove('pawnbook_pro_jwt_token');
        }
      }
    } catch (e) {
      _seedMockData();
    }
  }

  void _loadStateFromMap(Map<String, dynamic> state) {
    branches = (state['branches'] as List).map((b) => Branch.fromJson(b)).toList();
    users = (state['users'] as List).map((u) => User.fromJson(u)).toList();
    customers = (state['customers'] as List).map((c) => Customer.fromJson(c)).toList();
    loans = (state['loans'] as List).map((l) => Loan.fromJson(l)).toList();
    vaults = (state['vaults'] as List).map((v) => VaultCompartment.fromJson(v)).toList();
    ratesHistory = (state['ratesHistory'] as List).map((r) => PreciousRates.fromJson(r)).toList();
    currentRates = PreciousRates.fromJson(state['currentRates']);
    auctions = (state['auctions'] as List).map((a) => AuctionLot.fromJson(a)).toList();
    audits = (state['audits'] as List).map((a) => AuditEntry.fromJson(a)).toList();
    settings = SystemSettings.fromJson(state['settings']);
  }

  Map<String, dynamic> _saveStateToMap() {
    return {
      'branches': branches.map((b) => b.toJson()).toList(),
      'users': users.map((u) => u.toJson()).toList(),
      'customers': customers.map((c) => c.toJson()).toList(),
      'loans': loans.map((l) => l.toJson()).toList(),
      'vaults': vaults.map((v) => v.toJson()).toList(),
      'ratesHistory': ratesHistory.map((r) => r.toJson()).toList(),
      'currentRates': currentRates.toJson(),
      'auctions': auctions.map((a) => a.toJson()).toList(),
      'audits': audits.map((a) => a.toJson()).toList(),
      'settings': settings.toJson(),
    };
  }

  Future<void> persist() async {
    if (isServerActive) return; // DB operations are saved in backend files directly
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('pawnbook_pro_db_flutter', jsonEncode(_saveStateToMap()));
    } catch (e) {}
  }

  // ==================== UNIFIED CRUD INTERFACES ==================== //

  // Auth logins
  Future<bool> authenticate(String mobile, String password, String branchId) async {
    if (isServerActive) {
      try {
        final response = await http.post(
          Uri.parse('$baseUrl/api/auth/login'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({'mobile': mobile, 'password': password, 'branchId': branchId}),
        );

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body);
          currentUser = User.fromJson(data['user']);
          currentBranch = Branch.fromJson(data['branch']);
          activeJwtToken = data['token'];

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('pawnbook_pro_jwt_token', activeJwtToken!);

          await fetchAllServerData();
          return true;
        }
      } catch (e) {}
      return false;
    } else {
      // Offline Flow
      final user = users.cast<User?>().firstWhere((u) => u?.mobile == mobile && u?.password == password, orElse: () => null);
      if (user != null) {
        currentUser = user;
        currentBranch = branches.firstWhere((b) => b.id == branchId);
        
        final token = JwtService.generateToken(user, currentBranch!);
        activeJwtToken = token;
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('pawnbook_pro_jwt_token', token);
        
        logAuditEvent('Offline Login', 'Operator authenticated under offline persistence parameters.');
        return true;
      }
      return false;
    }
  }

  Future<void> logout() async {
    if (isServerActive) {
      currentUser = null;
      currentBranch = null;
      activeJwtToken = null;
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('pawnbook_pro_jwt_token');
      } catch (e) {}
    } else {
      logAuditEvent('Offline Logout', 'Session closed.');
      currentUser = null;
      currentBranch = null;
      activeJwtToken = null;
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('pawnbook_pro_jwt_token');
      } catch (e) {}
    }
  }

  // Audit Logs Helper
  void logAuditEvent(String action, String details) {
    final entry = AuditEntry(
      timestamp: DateTime.now().toIso8601String(),
      username: currentUser?.name ?? 'System',
      branchCode: currentBranch?.code ?? 'Global',
      action: action,
      details: details,
    );
    audits.insert(0, entry);
    persist();
  }

  // Disburse Loan
  Future<void> addNewLoan(Loan newLoan) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/loans'),
          headers: headers,
          body: jsonEncode(newLoan.toJson()),
        );
        await fetchAllServerData(); // Sync state
      } catch (e) {}
    } else {
      loans.insert(0, newLoan);
      final v = vaults.firstWhere((element) => element.id == newLoan.vaultRef);
      v.currentItems = (v.currentItems + 1).clamp(0, v.capacity);
      v.loanIds.add(newLoan.id);
      
      logAuditEvent('New Pawn Ticket', 'Created Gold Loan Ticket ${newLoan.ticket} locally.');
      persist();
    }
  }

  // Payments Billing repays
  Future<void> processPayment(Loan l, Payment p, String action) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/payments'),
          headers: headers,
          body: jsonEncode({
            'loanId': l.id,
            'payment': p.toJson(),
            'action': action,
          }),
        );
        await fetchAllServerData();
      } catch (e) {}
    } else {
      l.payments.add(p);
      l.amountPaid += p.totalAmount;
      
      if (action == 'Interest') {
        l.interestDue = 0;
        l.penalty = 0;
        l.status = 'Active';
        l.daysOverdue = 0;
      } else if (action == 'Partial') {
        l.principal = (l.principal - p.principal).clamp(0.0, double.infinity);
        l.interestDue = 0;
        l.penalty = 0;
        l.status = 'Active';
        l.daysOverdue = 0;
      } else if (action == 'Full Settlement') {
        l.principal = 0;
        l.interestDue = 0;
        l.penalty = 0;
        l.status = 'Redeemed';
        l.daysOverdue = 0;
        
        final v = vaults.firstWhere((element) => element.id == l.vaultRef);
        v.currentItems = (v.currentItems - 1).clamp(0, v.capacity);
        v.loanIds.remove(l.id);
      } else if (action == 'Renewal') {
        l.interestDue = 0;
        l.penalty = 0;
        l.renewalCount++;
        final nextMaturity = DateTime.now().add(Duration(days: l.duration * 30));
        l.maturityDate = nextMaturity.toIso8601String().split('T')[0];
        l.status = 'Active';
        l.daysOverdue = 0;
      }
      
      logAuditEvent('Repayment Collected', 'Processed ${p.type} locally.');
      persist();
    }
  }

  // Customer dossier adds
  Future<void> addCustomer(Customer c) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/customers'),
          headers: headers,
          body: jsonEncode(c.toJson()),
        );
        await fetchAllServerData();
      } catch (e) {}
    } else {
      customers.add(c);
      logAuditEvent('Customer Enrolled', 'Created locally.');
      persist();
    }
  }

  // Board rates update
  Future<void> updateRates(double g22, double g24, double sil, double plat) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/rates'),
          headers: headers,
          body: jsonEncode({'gold22K': g22, 'gold24K': g24, 'silver': sil, 'platinum': plat}),
        );
        await fetchAllServerData();
      } catch (e) {}
    } else {
      final todayStr = DateTime.now().toIso8601String().split('T')[0];
      final fresh = PreciousRates(date: todayStr, gold22K: g22, gold24K: g24, silver: sil, platinum: plat);
      currentRates = fresh;
      ratesHistory.add(fresh);
      
      logAuditEvent('Rates Update', 'Metal prices update locally.');
      persist();
    }
  }

  // Vault inspections
  Future<void> executeVaultInspection(String vaultId) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/vaults/$vaultId/audit'),
          headers: headers,
        );
        await fetchAllServerData();
      } catch (e) {}
    } else {
      final v = vaults.firstWhere((element) => element.id == vaultId);
      v.lastAudited = DateTime.now().toIso8601String().split('T')[0];
      v.temperature = 18.0 + (indexMultiplier(vaultId) * 0.1);
      
      logAuditEvent('Vault Inspection', 'Manual safety inspection completed locally.');
      persist();
    }
  }

  // System settings
  Future<void> saveSettings(SystemSettings sets) async {
    if (isServerActive) {
      try {
        await http.post(
          Uri.parse('$baseUrl/api/settings'),
          headers: headers,
          body: jsonEncode(sets.toJson()),
        );
        await fetchAllServerData();
      } catch (e) {}
    } else {
      settings = sets;
      logAuditEvent('Settings Saved', 'Corporate lending parameters updated locally.');
      persist();
    }
  }

  int indexMultiplier(String id) {
    final match = RegExp(r'\d+$').firstMatch(id);
    return match != null ? int.parse(match.group(0)!) : 0;
  }

  void _seedMockData() {
    branches = [
      Branch(id: 'B001', name: 'Chennai Main', code: 'CHN001', manager: 'Suresh Kumar', phone: '044-28340987', mobile: '9876543210', email: 'chn@srilakshmipawn.com', address: '123 Gandhi Nagar, T Nagar', city: 'Chennai', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Main Vault - Safe A', 'Secondary Vault - Safe B'], staff: ['Ravi Sharma', 'Priya Nair']),
      Branch(id: 'B002', name: 'Bangalore Main', code: 'BLR002', manager: 'Rajesh Nair', phone: '080-41258963', mobile: '9876543211', email: 'blr@srilakshmipawn.com', address: '45 MG Road, Indiranagar', city: 'Bangalore', openTime: '10:00 AM', closeTime: '07:00 PM', vaults: ['Vault Alpha'], staff: ['Anil Kumar']),
    ];

    users = [
      User(id: 'U001', mobile: '9345578103', password: '123456', name: 'Ravi Sharma', role: 'Staff', branchId: 'B001', status: 'Active'),
      User(id: 'U002', mobile: '9876543210', password: 'password123', name: 'Suresh Kumar', role: 'Manager', branchId: 'B001', status: 'Active'),
    ];

    customers = [];
    loans = [];

    vaults = List.generate(12, (index) {
      final compNo = index + 1;
      return VaultCompartment(
        id: 'VAULT-A-12-$compNo',
        branchId: 'B001',
        vaultName: 'Main Vault - Safe A',
        compartmentNo: compNo,
        boxNo: compNo,
        capacity: 10,
        currentItems: 0,
        temperature: 18.2 + (index * 0.1),
        lastAudited: '',
        loanIds: [],
      );
    });

    ratesHistory = [
      PreciousRates(date: '2026-05-30', gold22K: 6250, gold24K: 6820, silver: 82, platinum: 3500),
    ];
    currentRates = ratesHistory.last;

    auctions = [];
    audits = [];
  }
}
