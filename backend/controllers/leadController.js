import mongoose from 'mongoose';
import Lead from '../models/Lead.js';

const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

// Initial Mock Leads for offline memory resilience
let memoryLeads = [
  {
    _id: 'lead_1',
    name: 'Ananya Sharma',
    email: 'ananya.s@gmail.com',
    phone: '+91 9876543210',
    destination: 'Meghalaya Backpacking',
    travelersCount: 4,
    travelMonth: 'October 2026',
    budgetPerPerson: '₹15,000 - ₹25,000',
    message: 'Looking for a customized group departure package for 4 friends.',
    status: 'NEW',
    assignedTo: 'Sales Concierge Team',
    createdAt: new Date('2026-08-10')
  },
  {
    _id: 'lead_2',
    name: 'Rohan Verma',
    email: 'rohan.v@outlook.com',
    phone: '+91 9123456789',
    destination: 'Spiti Valley Circuit',
    travelersCount: 2,
    travelMonth: 'September 2026',
    budgetPerPerson: '₹20,000+',
    message: 'Interested in bike trip option or Force Traveler departure.',
    status: 'CONTACTED',
    assignedTo: 'High Altitude Specialist',
    createdAt: new Date('2026-08-12')
  }
];

// @desc    Submit callback / customized trip lead form
// @route   POST /api/leads
// @access  Public
export const createLead = async (req, res) => {
  try {
    const { name, email, phone, destination, travelersCount, travelMonth, budgetPerPerson, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone number are required.' });
    }

    let newLead = null;
    if (isDbConnected()) {
      try {
        newLead = await Lead.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          destination: destination || 'Meghalaya',
          travelersCount: Number(travelersCount) || 2,
          travelMonth: travelMonth || 'September 2026',
          budgetPerPerson: budgetPerPerson || '₹15,000 - ₹25,000',
          message: message || '',
          status: 'NEW'
        });
      } catch (dbErr) {
        console.warn('Lead DB save warning:', dbErr.message);
      }
    }

    if (!newLead) {
      newLead = {
        _id: 'lead_' + Date.now(),
        name,
        email,
        phone,
        destination,
        travelersCount: Number(travelersCount) || 2,
        travelMonth: travelMonth || 'September 2026',
        budgetPerPerson: budgetPerPerson || '₹15,000 - ₹25,000',
        message: message || '',
        status: 'NEW',
        assignedTo: 'Sales Concierge Team',
        createdAt: new Date()
      };
      memoryLeads.unshift(newLead);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your custom trip inquiry has been received. Our concierge team will contact you within 2 hours.',
      lead: newLead
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error processing lead submission' });
  }
};

// @desc    Get all lead inquiries for Admin CRM pipeline
// @route   GET /api/leads
// @access  Private/Admin
export const getLeads = async (req, res) => {
  try {
    let leads = [];
    if (isDbConnected()) {
      try {
        leads = await Lead.find().sort({ createdAt: -1 });
      } catch (dbErr) {
        console.warn('Lead DB query warning:', dbErr.message);
      }
    }

    if (leads.length === 0) {
      leads = memoryLeads;
    }

    res.json(leads);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error fetching leads' });
  }
};

// @desc    Update lead status & notes (Admin CRM)
// @route   PUT /api/leads/:id/status
// @access  Private/Admin
export const updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo } = req.body;

    let lead = null;
    if (isDbConnected()) {
      try {
        lead = await Lead.findById(id);
      } catch (e) {}
    }

    if (!lead) {
      const memIndex = memoryLeads.findIndex((l) => String(l._id) === String(id));
      if (memIndex !== -1) {
        memoryLeads[memIndex] = {
          ...memoryLeads[memIndex],
          ...(status ? { status } : {}),
          ...(notes ? { notes } : {}),
          ...(assignedTo ? { assignedTo } : {})
        };
        return res.json(memoryLeads[memIndex]);
      }
      return res.status(404).json({ message: 'Lead record not found.' });
    }

    if (status) lead.status = status;
    if (notes) lead.notes = notes;
    if (assignedTo) lead.assignedTo = assignedTo;

    if (isDbConnected() && typeof lead.save === 'function') {
      await lead.save();
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error updating lead' });
  }
};
