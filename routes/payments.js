const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/payments — Pay a bill ──────────────────────
router.post('/', optionalAuth, (req, res) => {
  try {
    const { propertyId, billType, payerPhone, provider } = req.body;

    const property = db.get('properties').find({ _id: propertyId }).value();
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const bill = property.bills?.[billType];
    if (!bill) return res.status(400).json({ success: false, message: 'Invalid bill type' });
    if (bill.status === 'Paid') return res.status(400).json({ success: false, message: 'Bill already paid' });

    // Mark bill as Paid in property
    const updatedBills = { ...property.bills };
    updatedBills[billType] = { ...bill, status: 'Paid' };
    db.get('properties').find({ _id: propertyId }).assign({ bills: updatedBills }).write();

    // Create payment record
    const receiptId     = uuidv4();
    const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`;

    const payment = {
      _id:           uuidv4(),
      receiptId,
      propertyId,
      propertyTitle: property.title,
      propertyAddress: property.address,
      payerId:       req.user?._id || null,
      payerPhone,
      billType,
      billName:      bill.name,
      amount:        bill.amount,
      provider,
      transactionId,
      status:        'success',
      paidAt:        new Date().toISOString()
    };

    db.get('payments').push(payment).write();

    res.status(201).json({
      success: true,
      message: 'Payment successful',
      payment: { receiptId, transactionId, billName: bill.name, amount: bill.amount, provider, payerPhone, paidAt: payment.paidAt }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/payments/receipt/:receiptId ──────────────────
router.get('/receipt/:receiptId', (req, res) => {
  const payment = db.get('payments').find({ receiptId: req.params.receiptId }).value();
  if (!payment) return res.status(404).json({ success: false, message: 'Receipt not found' });

  // Attach property info inline
  const property = db.get('properties').find({ _id: payment.propertyId }).value();
  res.json({ success: true, payment: { ...payment, property: property ? { title: property.title, address: property.address } : { title: payment.propertyTitle, address: payment.propertyAddress } } });
});

// ── GET /api/payments/my — User payment history ───────────
router.get('/my', protect, (req, res) => {
  const payments = db.get('payments').filter({ payerId: req.user._id }).value()
    .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt))
    .slice(0, 50);
  res.json({ success: true, payments });
});

module.exports = router;
