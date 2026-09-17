/**
 * WanderLuxe WhatsApp E-Ticket & Receipt Notification Service
 * Sends through Twilio when explicitly configured and otherwise fails closed.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const formatWhatsAppMessage = (booking, frontendUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in') => {
  const customerName = booking.customer?.name || 'Valued Traveler';
  const bookingId = booking.bookingId || 'WLX-CONFIRMED';
  const tripTitle = booking.tripSnapshot?.title || 'WanderLuxe Expedition';
  const destination = booking.tripSnapshot?.destination || booking.tripSnapshot?.location || 'India';
  const batchDate = booking.tripSnapshot?.batchDate || 'Upcoming Batch';
  const pickupPoint = booking.tripSnapshot?.pickupPoint || 'Main Meeting Hub';
  const travelersCount = booking.numberOfTravelers || 1;
  const occupancy = booking.occupancy || 'Double Sharing';
  
  const subtotal = booking.pricing?.subtotal || 0;
  const discount = booking.pricing?.discount || 0;
  const finalAmount = booking.pricing?.finalAmount || 0;
  const paymentId = booking.payment?.razorpayPaymentId || 'PAID_ONLINE';
  const verificationUrl = `${frontendUrl}/booking/confirmation/${bookingId}`;

  const message = `🎟️ *WANDERLUXE E-TICKET & PAYMENT RECEIPT* 🎟️

Hello *${customerName}*, your journey is confirmed! Here are your official booking credentials & payment receipt:

📌 *BOOKING DETAILS*
• *Booking ID:* ${bookingId}
• *Expedition:* ${tripTitle}
• *Destination:* ${destination}
• *Batch Dates:* ${batchDate}
• *Pickup Point:* ${pickupPoint}
• *Travelers:* ${travelersCount} Person(s) (${occupancy})

💳 *PAYMENT RECEIPT*
• *Subtotal:* ₹${subtotal.toLocaleString()}
${discount > 0 ? `• *Discount Applied:* -₹${discount.toLocaleString()} (${booking.pricing?.couponCode || 'PROMO'})\n` : ''}• *Total Paid:* *₹${finalAmount.toLocaleString()}*
• *Payment Status:* PAID ✅
• *Transaction Reference:* ${paymentId}

📲 *DIGITAL PASS & VERIFICATION QR*
View your printable E-Ticket & QR code online:
${verificationUrl}

Thank you for choosing WanderLuxe! Have an unforgettable experience! 🌟🚀`;

  return message;
};

/**
 * Generate a WhatsApp Web / App deep link for client-side direct messaging
 */
export const generateWhatsAppWebLink = (phone, textMessage) => {
  let cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
  }
  const encodedText = encodeURIComponent(textMessage);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

/**
 * Send WhatsApp E-Ticket & Receipt via Twilio or Fallback Simulation
 */
export const sendWhatsAppTicketAndReceipt = async (booking) => {
  const phone = booking.customer?.phone || '';
  const frontendUrl = process.env.FRONTEND_URL || 'https://wanderluxe.in';
  const messageBody = formatWhatsAppMessage(booking, frontendUrl);

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  let recipientPhone = String(phone).replace(/\D/g, '');
  if (recipientPhone.length === 10) {
    recipientPhone = '91' + recipientPhone;
  }
  const formattedTo = `whatsapp:+${recipientPhone}`;

  // Check if Twilio API credentials exist
  if (twilioAccountSid && twilioAuthToken && twilioWhatsAppNumber) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('From', twilioWhatsAppNumber);
      params.append('To', formattedTo);
      params.append('Body', messageBody);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || `Twilio Error ${resData.code || response.status}`);
      }

      return {
        sent: true,
        sentAt: new Date(),
        status: 'SENT',
        messageSid: resData.sid,
        phone: recipientPhone
      };
    } catch (error) {
      console.error(`❌ Twilio WhatsApp Dispatch Error:`, error.message);
      return {
        sent: false,
        sentAt: new Date(),
        status: 'FAILED',
        error: isProduction ? 'WhatsApp delivery failed.' : error.message,
        phone: recipientPhone
      };
    }
  }

  return {
    sent: false,
    sentAt: null,
    status: 'NOT_CONFIGURED',
    messageSid: null,
    phone: recipientPhone,
    error: 'WhatsApp delivery is not configured.'
  };
};
