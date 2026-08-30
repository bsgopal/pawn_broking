// PawnBook Pro v2.0 - Serializable Dart Data Models
import 'dart:convert';

class Branch {
  final String id;
  final String name;
  final String code;
  final String manager;
  final String phone;
  final String mobile;
  final String email;
  final String address;
  final String city;
  final String openTime;
  final String closeTime;
  final List<String> vaults;
  final List<String> staff;

  Branch({
    required this.id,
    required this.name,
    required this.code,
    required this.manager,
    required this.phone,
    required this.mobile,
    required this.email,
    required this.address,
    required this.city,
    required this.openTime,
    required this.closeTime,
    required this.vaults,
    required this.staff,
  });

  factory Branch.fromJson(Map<String, dynamic> json) => Branch(
    id: json['id'],
    name: json['name'],
    code: json['code'],
    manager: json['manager'],
    phone: json['phone'],
    mobile: json['mobile'],
    email: json['email'],
    address: json['address'],
    city: json['city'],
    openTime: json['openTime'],
    closeTime: json['closeTime'],
    vaults: List<String>.from(json['vaults']),
    staff: List<String>.from(json['staff']),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'code': code,
    'manager': manager,
    'phone': phone,
    'mobile': mobile,
    'email': email,
    'address': address,
    'city': city,
    'openTime': openTime,
    'closeTime': closeTime,
    'vaults': vaults,
    'staff': staff,
  };
}

class User {
  final String id;
  final String mobile;
  final String password;
  final String name;
  final String role;
  final String branchId;
  final String status;

  User({
    required this.id,
    required this.mobile,
    required this.password,
    required this.name,
    required this.role,
    required this.branchId,
    required this.status,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'],
    mobile: json['mobile'],
    password: json['password'],
    name: json['name'],
    role: json['role'],
    branchId: json['branchId'],
    status: json['status'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'mobile': mobile,
    'password': password,
    'name': name,
    'role': role,
    'branchId': branchId,
    'status': status,
  };
}

class Customer {
  final String id;
  final String name;
  final String mobile;
  final String altMobile;
  final String email;
  final String aadhaarNo;
  final bool aadhaarVerified;
  final String panNo;
  final bool panVerified;
  final String drivingLicense;
  final String voterId;
  final String dob;
  final String gender;
  final String occupation;
  final double monthlyIncome;
  final String address;
  final String city;
  final String state;
  final String zipcode;
  final String nominee;
  final String nomineeMob;
  final String relation;
  final String status;
  final String kycStatus;
  final int loyaltyPoints;
  final int totalLoansCount;
  final int totalDefault;
  final double creditScore;
  final String riskLevel;
  final String notes;
  final String photo;

  Customer({
    required this.id,
    required this.name,
    required this.mobile,
    required this.altMobile,
    required this.email,
    required this.aadhaarNo,
    required this.aadhaarVerified,
    required this.panNo,
    required this.panVerified,
    required this.drivingLicense,
    required this.voterId,
    required this.dob,
    required this.gender,
    required this.occupation,
    required this.monthlyIncome,
    required this.address,
    required this.city,
    required this.state,
    required this.zipcode,
    required this.nominee,
    required this.nomineeMob,
    required this.relation,
    required this.status,
    required this.kycStatus,
    required this.loyaltyPoints,
    required this.totalLoansCount,
    required this.totalDefault,
    required this.creditScore,
    required this.riskLevel,
    required this.notes,
    required this.photo,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
    id: json['id'],
    name: json['name'],
    mobile: json['mobile'],
    altMobile: json['altMobile'] ?? '',
    email: json['email'] ?? '',
    aadhaarNo: json['aadhaarNo'] ?? '',
    aadhaarVerified: json['aadhaarVerified'] ?? false,
    panNo: json['panNo'] ?? '',
    panVerified: json['panVerified'] ?? false,
    drivingLicense: json['drivingLicense'] ?? '',
    voterId: json['voterId'] ?? '',
    dob: json['dob'] ?? '',
    gender: json['gender'] ?? 'M',
    occupation: json['occupation'] ?? '',
    monthlyIncome: (json['monthlyIncome'] as num?)?.toDouble() ?? 0.0,
    address: json['address'] ?? '',
    city: json['city'] ?? '',
    state: json['state'] ?? '',
    zipcode: json['zipcode'] ?? '',
    nominee: json['nominee'] ?? '',
    nomineeMob: json['nomineeMob'] ?? '',
    relation: json['relation'] ?? '',
    status: json['status'] ?? 'Active',
    kycStatus: json['kycStatus'] ?? 'Pending',
    loyaltyPoints: json['loyaltyPoints'] ?? 0,
    totalLoansCount: json['totalLoansCount'] ?? 0,
    totalDefault: json['totalDefault'] ?? 0,
    creditScore: (json['creditScore'] as num?)?.toDouble() ?? 4.0,
    riskLevel: json['riskLevel'] ?? 'Low',
    notes: json['notes'] ?? '',
    photo: json['photo'] ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'mobile': mobile,
    'altMobile': altMobile,
    'email': email,
    'aadhaarNo': aadhaarNo,
    'aadhaarVerified': aadhaarVerified,
    'panNo': panNo,
    'panVerified': panVerified,
    'drivingLicense': drivingLicense,
    'voterId': voterId,
    'dob': dob,
    'gender': gender,
    'occupation': occupation,
    'monthlyIncome': monthlyIncome,
    'address': address,
    'city': city,
    'state': state,
    'zipcode': zipcode,
    'nominee': nominee,
    'nomineeMob': nomineeMob,
    'relation': relation,
    'status': status,
    'kycStatus': kycStatus,
    'loyaltyPoints': loyaltyPoints,
    'totalLoansCount': totalLoansCount,
    'totalDefault': totalDefault,
    'creditScore': creditScore,
    'riskLevel': riskLevel,
    'notes': notes,
    'photo': photo,
  };
}

class OrnamentDetail {
  final String id;
  final String type;
  final String category;
  final String metal;
  final String purity;
  final double grossWt;
  final double stone;
  final double net;
  final double rate;
  final String rateDate;
  final double value;
  final bool tested;
  final String testDate;
  final String verifiedBy;
  final String certNo;

  OrnamentDetail({
    required this.id,
    required this.type,
    required this.category,
    required this.metal,
    required this.purity,
    required this.grossWt,
    required this.stone,
    required this.net,
    required this.rate,
    required this.rateDate,
    required this.value,
    required this.tested,
    required this.testDate,
    required this.verifiedBy,
    required this.certNo,
  });

  factory OrnamentDetail.fromJson(Map<String, dynamic> json) => OrnamentDetail(
    id: json['id'],
    type: json['type'],
    category: json['category'],
    metal: json['metal'],
    purity: json['purity'],
    grossWt: (json['grossWt'] as num).toDouble(),
    stone: (json['stone'] as num).toDouble(),
    net: (json['net'] as num).toDouble(),
    rate: (json['rate'] as num).toDouble(),
    rateDate: json['rateDate'],
    value: (json['value'] as num).toDouble(),
    tested: json['tested'] ?? true,
    testDate: json['testDate'] ?? '',
    verifiedBy: json['verifiedBy'] ?? '',
    certNo: json['certNo'] ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'category': category,
    'metal': metal,
    'purity': purity,
    'grossWt': grossWt,
    'stone': stone,
    'net': net,
    'rate': rate,
    'rateDate': rateDate,
    'value': value,
    'tested': tested,
    'testDate': testDate,
    'verifiedBy': verifiedBy,
    'certNo': certNo,
  };
}

class Payment {
  final String id;
  final String date;
  final String type; // Interest, Partial, Full Settlement, Renewal
  final double principal;
  final double interest;
  final double gst;
  final double penalty;
  final double totalAmount;
  final String mode; // Cash, Card, UPI, Cheque, Bank Transfer
  final String refNo;
  final String status; // Success, Pending
  final String collectedBy;

  Payment({
    required this.id,
    required this.date,
    required this.type,
    required this.principal,
    required this.interest,
    required this.gst,
    required this.penalty,
    required this.totalAmount,
    required this.mode,
    required this.refNo,
    required this.status,
    required this.collectedBy,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => Payment(
    id: json['id'],
    date: json['date'],
    type: json['type'],
    principal: (json['principal'] as num).toDouble(),
    interest: (json['interest'] as num).toDouble(),
    gst: (json['gst'] as num).toDouble(),
    penalty: (json['penalty'] as num).toDouble(),
    totalAmount: (json['totalAmount'] as num).toDouble(),
    mode: json['mode'] ?? 'Cash',
    refNo: json['refNo'] ?? '',
    status: json['status'] ?? 'Success',
    collectedBy: json['collectedBy'] ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'date': date,
    'type': type,
    'principal': principal,
    'interest': interest,
    'gst': gst,
    'penalty': penalty,
    'totalAmount': totalAmount,
    'mode': mode,
    'refNo': refNo,
    'status': status,
    'collectedBy': collectedBy,
  };
}

class Loan {
  final String id;
  final String ticket;
  final String customerId;
  final String branchId;
  final String loanDate;
  String maturityDate;
  final int duration; // months
  int daysOverdue;
  int renewalCount;
  double principal;
  final String interestType; // Flat, Compound, Reducing
  final double interestPct;
  final double gstPercent;
  final double totalGrossWt;
  double totalNetWt;
  final double totalStoneWt;
  final double eligiblePct;
  final double marketValue;
  double collateralValue;
  String status; // Active, Overdue, Redeemed, Auctioned
  final String vaultRef;
  final String lockedBox;
  final bool insured;
  final String insuranceRefNo;
  double amountPaid;
  double interestDue;
  double penalty;
  double balancePayable;
  final String condition;
  final String notes;
  final String observations;
  final List<OrnamentDetail> ornaments;
  final List<Payment> payments;

  Loan({
    required this.id,
    required this.ticket,
    required this.customerId,
    required this.branchId,
    required this.loanDate,
    required this.maturityDate,
    required this.duration,
    required this.daysOverdue,
    required this.renewalCount,
    required this.principal,
    required this.interestType,
    required this.interestPct,
    required this.gstPercent,
    required this.totalGrossWt,
    required this.totalNetWt,
    required this.totalStoneWt,
    required this.eligiblePct,
    required this.marketValue,
    required this.collateralValue,
    required this.status,
    required this.vaultRef,
    required this.lockedBox,
    required this.insured,
    required this.insuranceRefNo,
    required this.amountPaid,
    required this.interestDue,
    required this.penalty,
    required this.balancePayable,
    required this.condition,
    required this.notes,
    required this.observations,
    required this.ornaments,
    required this.payments,
  });

  factory Loan.fromJson(Map<String, dynamic> json) => Loan(
    id: json['id'],
    ticket: json['ticket'],
    customerId: json['customerId'],
    branchId: json['branchId'],
    loanDate: json['loanDate'],
    maturityDate: json['maturityDate'],
    duration: json['duration'],
    daysOverdue: json['daysOverdue'] ?? 0,
    renewalCount: json['renewalCount'] ?? 0,
    principal: (json['principal'] as num).toDouble(),
    interestType: json['interestType'],
    interestPct: (json['interestPct'] as num).toDouble(),
    gstPercent: (json['gstPercent'] as num?)?.toDouble() ?? 18.0,
    totalGrossWt: (json['totalGrossWt'] as num).toDouble(),
    totalNetWt: (json['totalNetWt'] as num).toDouble(),
    totalStoneWt: (json['totalStoneWt'] as num).toDouble(),
    eligiblePct: (json['eligiblePct'] as num?)?.toDouble() ?? 0.75,
    marketValue: (json['marketValue'] as num).toDouble(),
    collateralValue: (json['collateralValue'] as num).toDouble(),
    status: json['status'],
    vaultRef: json['vaultRef'],
    lockedBox: json['lockedBox'] ?? '',
    insured: json['insured'] ?? true,
    insuranceRefNo: json['insuranceRefNo'] ?? '',
    amountPaid: (json['amountPaid'] as num).toDouble(),
    interestDue: (json['interestDue'] as num).toDouble(),
    penalty: (json['penalty'] as num).toDouble(),
    balancePayable: (json['balancePayable'] as num).toDouble(),
    condition: json['condition'] ?? 'Good',
    notes: json['notes'] ?? '',
    observations: json['observations'] ?? '',
    ornaments: (json['ornaments'] as List).map((o) => OrnamentDetail.fromJson(o)).toList(),
    payments: (json['payments'] as List).map((p) => Payment.fromJson(p)).toList(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'ticket': ticket,
    'customerId': customerId,
    'branchId': branchId,
    'loanDate': loanDate,
    'maturityDate': maturityDate,
    'duration': duration,
    'daysOverdue': daysOverdue,
    'renewalCount': renewalCount,
    'principal': principal,
    'interestType': interestType,
    'interestPct': interestPct,
    'gstPercent': gstPercent,
    'totalGrossWt': totalGrossWt,
    'totalNetWt': totalNetWt,
    'totalStoneWt': totalStoneWt,
    'eligiblePct': eligiblePct,
    'marketValue': marketValue,
    'collateralValue': collateralValue,
    'status': status,
    'vaultRef': vaultRef,
    'lockedBox': lockedBox,
    'insured': insured,
    'insuranceRefNo': insuranceRefNo,
    'amountPaid': amountPaid,
    'interestDue': interestDue,
    'penalty': penalty,
    'balancePayable': balancePayable,
    'condition': condition,
    'notes': notes,
    'observations': observations,
    'ornaments': ornaments.map((o) => o.toJson()).toList(),
    'payments': payments.map((p) => p.toJson()).toList(),
  };
}

class VaultCompartment {
  final String id;
  final String branchId;
  final String vaultName;
  final int compartmentNo;
  final int boxNo;
  final int capacity;
  int currentItems;
  double temperature;
  String lastAudited;
  final List<String> loanIds;

  VaultCompartment({
    required this.id,
    required this.branchId,
    required this.vaultName,
    required this.compartmentNo,
    required this.boxNo,
    required this.capacity,
    required this.currentItems,
    required this.temperature,
    required this.lastAudited,
    required this.loanIds,
  });

  factory VaultCompartment.fromJson(Map<String, dynamic> json) => VaultCompartment(
    id: json['id'],
    branchId: json['branchId'],
    vaultName: json['vaultName'],
    compartmentNo: json['compartmentNo'],
    boxNo: json['boxNo'],
    capacity: json['capacity'] ?? 10,
    currentItems: json['currentItems'] ?? 0,
    temperature: (json['temperature'] as num?)?.toDouble() ?? 18.0,
    lastAudited: json['lastAudited'] ?? '',
    loanIds: List<String>.from(json['loanIds'] ?? []),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'branchId': branchId,
    'vaultName': vaultName,
    'compartmentNo': compartmentNo,
    'boxNo': boxNo,
    'capacity': capacity,
    'currentItems': currentItems,
    'temperature': temperature,
    'lastAudited': lastAudited,
    'loanIds': loanIds,
  };
}

class AuctionLot {
  final String id;
  final String date;
  final double estimatedValue;
  String status; // Scheduled, Live, Completed
  final String venue;
  final String biddingStartTime;
  final String auctioneer;
  final String terms;
  final List<Map<String, dynamic>> loans;
  final Map<String, dynamic>? results;

  AuctionLot({
    required this.id,
    required this.date,
    required this.estimatedValue,
    required this.status,
    required this.venue,
    required this.biddingStartTime,
    required this.auctioneer,
    required this.terms,
    required this.loans,
    this.results,
  });

  factory AuctionLot.fromJson(Map<String, dynamic> json) => AuctionLot(
    id: json['id'],
    date: json['date'],
    estimatedValue: (json['estimatedValue'] as num).toDouble(),
    status: json['status'],
    venue: json['venue'] ?? '',
    biddingStartTime: json['biddingStartTime'] ?? '',
    auctioneer: json['auctioneer'] ?? '',
    terms: json['terms'] ?? '',
    loans: List<Map<String, dynamic>>.from(json['loans'] ?? []),
    results: json['results'] != null ? Map<String, dynamic>.from(json['results']) : null,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'date': date,
    'estimatedValue': estimatedValue,
    'status': status,
    'venue': venue,
    'biddingStartTime': biddingStartTime,
    'auctioneer': auctioneer,
    'terms': terms,
    'loans': loans,
    'results': results,
  };
}

class PreciousRates {
  final String date;
  final double gold22K;
  final double gold24K;
  final double silver;
  final double platinum;

  PreciousRates({
    required this.date,
    required this.gold22K,
    required this.gold24K,
    required this.silver,
    required this.platinum,
  });

  factory PreciousRates.fromJson(Map<String, dynamic> json) => PreciousRates(
    date: json['date'],
    gold22K: (json['gold22K'] as num).toDouble(),
    gold24K: (json['gold24K'] as num).toDouble(),
    silver: (json['silver'] as num).toDouble(),
    platinum: (json['platinum'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'date': date,
    'gold22K': gold22K,
    'gold24K': gold24K,
    'silver': silver,
    'platinum': platinum,
  };
}

class AuditEntry {
  final String timestamp;
  final String username;
  final String branchCode;
  final String action;
  final String details;

  AuditEntry({
    required this.timestamp,
    required this.username,
    required this.branchCode,
    required this.action,
    required this.details,
  });

  factory AuditEntry.fromJson(Map<String, dynamic> json) => AuditEntry(
    timestamp: json['timestamp'],
    username: json['username'],
    branchCode: json['branchCode'],
    action: json['action'],
    details: json['details'],
  );

  Map<String, dynamic> toJson() => {
    'timestamp': timestamp,
    'username': username,
    'branchCode': branchCode,
    'action': action,
    'details': details,
  };
}

class SystemSettings {
  String shopName;
  String rbiLicenseNo;
  String gstinNo;
  String address;
  double eligibleCollateralPct;
  double rbiInterestCapPa;
  int defaultGracePeriodDays;
  double defaultPenaltyPct;
  bool smsRemindersEnabled;

  SystemSettings({
    required this.shopName,
    required this.rbiLicenseNo,
    required this.gstinNo,
    required this.address,
    required this.eligibleCollateralPct,
    required this.rbiInterestCapPa,
    required this.defaultGracePeriodDays,
    required this.defaultPenaltyPct,
    required this.smsRemindersEnabled,
  });

  factory SystemSettings.fromJson(Map<String, dynamic> json) => SystemSettings(
    shopName: json['shopName'] ?? 'Sri Lakshmi Pawn Brokers',
    rbiLicenseNo: json['rbiLicenseNo'] ?? 'RB/2026/0045',
    gstinNo: json['gstinNo'] ?? '33ABCDE1234F1Z5',
    address: json['address'] ?? '123 Gandhi Nagar, T Nagar, Chennai',
    eligibleCollateralPct: (json['eligibleCollateralPct'] as num?)?.toDouble() ?? 75.0,
    rbiInterestCapPa: (json['rbiInterestCapPa'] as num?)?.toDouble() ?? 24.0,
    defaultGracePeriodDays: json['defaultGracePeriodDays'] ?? 5,
    defaultPenaltyPct: (json['defaultPenaltyPct'] as num?)?.toDouble() ?? 1.0,
    smsRemindersEnabled: json['smsRemindersEnabled'] ?? true,
  );

  Map<String, dynamic> toJson() => {
    'shopName': shopName,
    'rbiLicenseNo': rbiLicenseNo,
    'gstinNo': gstinNo,
    'address': address,
    'eligibleCollateralPct': eligibleCollateralPct,
    'rbiInterestCapPa': rbiInterestCapPa,
    'defaultGracePeriodDays': defaultGracePeriodDays,
    'defaultPenaltyPct': defaultPenaltyPct,
    'smsRemindersEnabled': smsRemindersEnabled,
  };
}
