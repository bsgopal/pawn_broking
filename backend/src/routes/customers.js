import express from 'express';
import { getTenantModel } from '../config/tenantConnectionManager.js';
import { getCurrentTenantCode } from '../middleware/tenantContext.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all customers with search & pagination
// @route   GET /api/customers
router.get('/', protect, async (req, res) => {
  try {
    const { search = '', kycStatus, riskLevel, limit = 100, page = 1 } = req.query;
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Customer = getTenantModel(tenantCode, 'Customer');

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { aadhaarNo: { $regex: search, $options: 'i' } },
        { customerNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (kycStatus && kycStatus !== 'ALL') query.kycStatus = kycStatus;
    if (riskLevel && riskLevel !== 'ALL') query.riskLevel = riskLevel;

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
      Customer.countDocuments(query)
    ]);

    res.json({ success: true, count: customers.length, total, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Quick Search customer by mobile or name
// @route   GET /api/customers/search
router.get('/search', protect, async (req, res) => {
  try {
    const { q = '' } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, customers: [] });

    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Customer = getTenantModel(tenantCode, 'Customer');

    const customers = await Customer.find({
      $or: [
        { mobile: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { aadhaarNo: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);

    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single customer profile with active loan history
// @route   GET /api/customers/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Customer = getTenantModel(tenantCode, 'Customer');
    const Loan = getTenantModel(tenantCode, 'Loan');

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const loans = await Loan.find({ customerId: customer._id }).sort({ loanDate: -1 });

    res.json({ success: true, customer, loans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new customer with KYC details
// @route   POST /api/customers
router.post('/', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Customer = getTenantModel(tenantCode, 'Customer');

    const { name, mobile, aadhaarNo, panNo, address, city, nominee, nomineeMob, relation, photo, occupation } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ success: false, message: 'Customer Name and Mobile are required' });
    }

    const existing = await Customer.findOne({ mobile: mobile.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Customer with this mobile already exists', customer: existing });
    }

    const totalCount = await Customer.countDocuments();
    const customerNumber = `CUST-${String(totalCount + 1).padStart(4, '0')}`;

    const customer = await Customer.create({
      customerNumber,
      name: name.trim(),
      mobile: mobile.trim(),
      aadhaarNo: aadhaarNo || '',
      panNo: (panNo || '').toUpperCase(),
      address: address || '',
      city: city || '',
      nominee: nominee || '',
      nomineeMob: nomineeMob || '',
      relation: relation || '',
      occupation: occupation || '',
      photo: photo || '',
      kycStatus: aadhaarNo ? 'VERIFIED' : 'PENDING'
    });

    res.status(201).json({ success: true, message: 'Customer registered successfully', customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update customer KYC and profile
// @route   PUT /api/customers/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const tenantCode = req.customerCode || getCurrentTenantCode();
    const Customer = getTenantModel(tenantCode, 'Customer');

    const customer = await Customer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, message: 'Customer updated', customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
