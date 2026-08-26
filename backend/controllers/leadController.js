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
    leadType: 'callback_request',
    tripId: 'spiti-valley-circuit-roadtrip',
    tripTitle: 'Full Spiti Valley Circuit Group Tour From Delhi: Shimla To Manali',
    destination: 'Spiti Valley, Himachal',
    preferredCallDate: '2026-08-28',
    preferredCallWindow: 'Afternoon',
    travelersCount: 4,
    travelMonth: 'October 2026',
    travelDate: '04 Oct 2026 - 12 Oct 2026',
    budgetPerPerson: '₹24,999',
    message: 'Want to confirm room sharing options for a 4-person group.',
    status: 'NEW',
    source: 'trip_page',
    assignedTo: 'Sales Concierge Team',
    createdAt: new Date('2026-08-24T10:30:00Z')
  },
  {
    _id: 'lead_2',
    name: 'Rohan Verma',
    email: 'rohan.v@outlook.com',
    phone: '+91 9123456789',
    leadType: 'trip_enquiry',
    tripId: 'meghalaya-backpacking',
    tripTitle: 'Meghalaya Living Root Bridges & Waterfalls Expedition',
    destination: 'Meghalaya',
    preferredCallDate: '2026-08-27',
    preferredCallWindow: 'Evening',
    travelersCount: 2,
    travelMonth: 'September 2026',
    travelDate: '15 Sep 2026 - 20 Sep 2026',
    budgetPerPerson: '₹18,500',
    message: 'Interested in private transfer upgrade.',
    status: 'CONTACTED',
    source: 'trip_page',
    assignedTo: 'High Altitude Specialist',
    createdAt: new Date('2026-08-25T14:15:00Z')
  }
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @desc    Submit callback request / customized trip inquiry lead form
// @route   POST /api/leads
// @access  Public / Optional Auth
export const createLead = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      leadType, 
      tripId, 
      tripTitle, 
      destination, 
      travelersCount, 
      travelMonth, 
      travelDate, 
      budgetPerPerson, 
      preferredCallDate, 
      preferredCallWindow, 
      message, 
      source 
    } = req.body;

    // 1. Strict Server-Side Validations
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Please provide a valid full name (at least 2 characters).' });
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit phone number.' });
    }

    const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone}` : `+${cleanPhone}`;
    const determinedLeadType = leadType || (preferredCallWindow ? 'callback_request' : 'trip_enquiry');
    const determinedSource = source || (tripId ? 'trip_page' : 'contact_page');
    const validCallWindows = ['Morning', 'Afternoon', 'Evening', 'Anytime', ''];
    const safeCallWindow = validCallWindows.includes(preferredCallWindow) ? preferredCallWindow : 'Anytime';
    
    // Securely link authenticated user if token was decoded by optionalAuth
    const authUserId = req.user ? (req.user._id || req.user.id) : null;

    // 2. Duplicate / Spam Throttling (15-minute cool-down window per user/trip)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    if (isDbConnected()) {
      try {
        const queryFilter = {
          createdAt: { $gte: fifteenMinutesAgo },
          $or: [
            { email: cleanEmail },
            { phone: formattedPhone },
            { phone: cleanPhone }
          ]
        };

        if (tripId) {
          queryFilter.tripId = String(tripId);
        }

        const existingLead = await Lead.findOne(queryFilter).sort({ createdAt: -1 });

        if (existingLead) {
          console.log(`ℹ️ [Lead Throttled] Duplicate callback/lead prevented for ${cleanEmail} (Lead ID: ${existingLead._id})`);
          return res.status(200).json({
            success: true,
            isDuplicateThrottled: true,
            message: 'We already received your inquiry for this journey! Our certified travel specialist is preparing your details and will connect with you shortly.',
            lead: existingLead
          });
        }
      } catch (err) {
        console.warn('Duplicate check warning:', err.message);
      }
    } else {
      // In-Memory Duplicate Check
      const recentMemLead = memoryLeads.find(l => 
        (l.email === cleanEmail || l.phone === formattedPhone) &&
        (!tripId || l.tripId === String(tripId)) &&
        new Date(l.createdAt) >= fifteenMinutesAgo
      );

      if (recentMemLead) {
        return res.status(200).json({
          success: true,
          isDuplicateThrottled: true,
          message: 'We already received your inquiry for this journey! Our certified travel specialist is preparing your details and will connect with you shortly.',
          lead: recentMemLead
        });
      }
    }

    // 3. Create and Persist Lead
    let newLead = null;
    if (isDbConnected()) {
      try {
        newLead = await Lead.create({
          name: name.trim(),
          email: cleanEmail,
          phone: formattedPhone,
          leadType: determinedLeadType,
          tripId: tripId ? String(tripId) : '',
          tripTitle: tripTitle ? String(tripTitle).trim() : '',
          destination: destination || (tripTitle ? String(tripTitle) : 'Expedition'),
          travelersCount: Number(travelersCount) || 1,
          travelMonth: travelMonth || '',
          travelDate: travelDate || '',
          budgetPerPerson: budgetPerPerson || '',
          preferredCallDate: preferredCallDate || new Date().toISOString().split('T')[0],
          preferredCallWindow: safeCallWindow,
          userId: authUserId,
          message: message ? String(message).trim() : '',
          status: 'NEW',
          source: determinedSource,
          assignedTo: 'Sales Concierge Team',
          whatsappNotification: {
            sent: true,
            status: 'SIMULATED_SENT',
            sentAt: new Date()
          }
        });
      } catch (dbErr) {
        console.warn('Lead DB save warning:', dbErr.message);
      }
    }

    if (!newLead) {
      newLead = {
        _id: 'lead_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        phone: formattedPhone,
        leadType: determinedLeadType,
        tripId: tripId ? String(tripId) : '',
        tripTitle: tripTitle ? String(tripTitle).trim() : '',
        destination: destination || (tripTitle ? String(tripTitle) : 'Expedition'),
        travelersCount: Number(travelersCount) || 1,
        travelMonth: travelMonth || '',
        travelDate: travelDate || '',
        budgetPerPerson: budgetPerPerson || '',
        preferredCallDate: preferredCallDate || new Date().toISOString().split('T')[0],
        preferredCallWindow: safeCallWindow,
        userId: authUserId,
        message: message ? String(message).trim() : '',
        status: 'NEW',
        source: determinedSource,
        assignedTo: 'Sales Concierge Team',
        whatsappNotification: {
          sent: true,
          status: 'SIMULATED_SENT',
          sentAt: new Date()
        },
        createdAt: new Date()
      };
      memoryLeads.unshift(newLead);
    }

    console.log(`\n======================================================`);
    console.log(`📞 [CRM NEW LEAD CAPTURED: ${determinedLeadType.toUpperCase()}]`);
    console.log(`Traveler: ${newLead.name} (${newLead.email} • ${newLead.phone})`);
    console.log(`Expedition: ${newLead.tripTitle || newLead.destination}`);
    console.log(`Preferred Call: ${newLead.preferredCallDate} [${newLead.preferredCallWindow}]`);
    console.log(`Source: ${newLead.source} | Authenticated: ${Boolean(authUserId)}`);
    console.log(`======================================================\n`);

    const confirmationMsg = determinedLeadType === 'callback_request'
      ? `Thank you, ${newLead.name.split(' ')[0]}! Your callback request has been scheduled for ${newLead.preferredCallDate} (${newLead.preferredCallWindow} window). Our travel specialist will call you directly.`
      : 'Thank you! Your custom trip inquiry has been received. Our concierge team will contact you within 2 hours.';

    res.status(201).json({
      success: true,
      message: confirmationMsg,
      lead: newLead
    });
  } catch (error) {
    console.error('Lead submission error:', error);
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
    if (notes !== undefined) lead.notes = notes;
    if (assignedTo) lead.assignedTo = assignedTo;

    if (isDbConnected() && typeof lead.save === 'function') {
      await lead.save();
    }

    res.json(lead);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error updating lead' });
  }
};

