# Free Real-Time Payment Notifications Setup

## Solution: Firebase Cloud Functions (100% Free)

Firebase Free Tier includes:
- ✅ 2 million function invocations/month
- ✅ 125,000 GB-seconds compute time
- ✅ 40,000 GB-seconds memory
- ✅ 5GB outbound networking

**Perfect for your payment notifications!**

---

## Step-by-Step Implementation

### 1. Initialize Firebase Functions

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize functions in your project
cd "c:\Users\Black_Phoenix\Downloads\NaaGRaaZ studios\autoform-ai (1)"
firebase init functions

# Choose:
# - Use existing project (your AutoForm project)
# - Language: TypeScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### 2. Create the Cloud Function

Create file: `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Trigger when a new payment request is created
export const onPaymentRequestCreated = functions.firestore
  .document('payment_requests/{requestId}')
  .onCreate(async (snap, context) => {
    const paymentData = snap.data();
    const requestId = context.params.requestId;

    // Only notify for pending requests
    if (paymentData.status !== 'pending') {
      return null;
    }

    console.log('🔔 New Payment Request:', {
      id: requestId,
      email: paymentData.userEmail,
      amount: paymentData.amount,
      tokens: paymentData.tokens,
      utr: paymentData.utr
    });

    // Send notification via multiple channels (all free!)
    await Promise.all([
      sendTelegramNotification(paymentData, requestId),
      sendDiscordNotification(paymentData, requestId),
      sendEmailNotification(paymentData, requestId)
    ]);

    return null;
  });

// Trigger when payment status changes
export const onPaymentStatusChange = functions.firestore
  .document('payment_requests/{requestId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const requestId = context.params.requestId;

    // Check if status changed from pending to approved/rejected
    if (before.status === 'pending' && after.status !== 'pending') {
      console.log('✅ Payment Status Changed:', {
        id: requestId,
        from: before.status,
        to: after.status,
        email: after.userEmail
      });

      // Notify about status change
      await sendStatusChangeNotification(after, requestId);
    }

    return null;
  });

// FREE NOTIFICATION METHODS

// 1. Telegram Bot (FREE & INSTANT)
async function sendTelegramNotification(payment: any, requestId: string) {
  const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN'; // Get from @BotFather
  const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID'; // Your Telegram user ID

  const message = `
🔔 *NEW PAYMENT REQUEST*

💰 Amount: ₹${payment.amount}
🎫 Tokens: ${payment.tokens}
📧 User: ${payment.userEmail}
🔢 UTR: ${payment.utr}
⏰ Time: ${new Date().toLocaleString('en-IN')}

🔗 [Open Admin Dashboard](${payment.adminUrl || 'https://your-app.com/admin'})
  `;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );
    console.log('✅ Telegram notification sent');
  } catch (error) {
    console.error('❌ Telegram error:', error);
  }
}

// 2. Discord Webhook (FREE & INSTANT)
async function sendDiscordNotification(payment: any, requestId: string) {
  const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';

  const embed = {
    title: '🔔 New Payment Request',
    color: 0xFFA500, // Orange
    fields: [
      { name: '💰 Amount', value: `₹${payment.amount}`, inline: true },
      { name: '🎫 Tokens', value: `${payment.tokens}`, inline: true },
      { name: '📧 User Email', value: payment.userEmail, inline: false },
      { name: '🔢 UTR Number', value: payment.utr, inline: false }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'AutoForm Payment System' }
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
    console.log('✅ Discord notification sent');
  } catch (error) {
    console.error('❌ Discord error:', error);
  }
}

// 3. Email via EmailJS (Already set up!)
async function sendEmailNotification(payment: any, requestId: string) {
  // You already have EmailJS set up!
  // This is just a backup/additional notification
  console.log('📧 Email notification already handled by your app');
}

async function sendStatusChangeNotification(payment: any, requestId: string) {
  const message = `
✅ *PAYMENT ${payment.status.toUpperCase()}*

📧 User: ${payment.userEmail}
💰 Amount: ₹${payment.amount}
🎫 Tokens: ${payment.tokens}
  `;

  // Send to Telegram/Discord
  // ... similar to above
}
```

### 3. Deploy the Functions

```bash
# Deploy to Firebase (FREE!)
firebase deploy --only functions

# Output:
# ✔ functions[onPaymentRequestCreated]: Successful create operation.
# ✔ functions[onPaymentStatusChange]: Successful create operation.
```

---

## Free Notification Channels

### 🤖 Telegram Bot (BEST - FREE & INSTANT)

**Setup (5 minutes):**

1. **Create Bot:**
   - Open Telegram, search for `@BotFather`
   - Send `/newbot`
   - Name it: "AutoForm Payments"
   - Username: "autoform_payments_bot"
   - Copy the bot token

2. **Get Your Chat ID:**
   - Search for `@userinfobot` in Telegram
   - Start chat, it will show your chat ID
   - Copy the number

3. **Add to Function:**
   ```typescript
   const TELEGRAM_BOT_TOKEN = 'your_bot_token_here';
   const TELEGRAM_CHAT_ID = 'your_chat_id_here';
   ```

4. **Done!** You'll get instant notifications on your phone! 📱

---

### 💬 Discord Webhook (FREE & INSTANT)

**Setup (2 minutes):**

1. **Create Discord Server** (if you don't have one)
2. **Create Channel** (e.g., "payment-notifications")
3. **Create Webhook:**
   - Right-click channel → Edit Channel
   - Integrations → Webhooks → New Webhook
   - Copy webhook URL
4. **Add to Function:**
   ```typescript
   const DISCORD_WEBHOOK_URL = 'your_webhook_url_here';
   ```

---

### 📧 Email (Already Working!)

You already have EmailJS set up, so this is automatic!

---

## Alternative: Firestore Realtime Listeners (No Functions Needed!)

If you want even simpler (but requires app to be open):

### Browser Extension / Desktop App

Create a simple Chrome extension or Electron app:

```typescript
// background.js (Chrome Extension)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where } from 'firebase/firestore';

const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Listen for new pending payments
const q = query(
  collection(db, 'payment_requests'),
  where('status', '==', 'pending')
);

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      const payment = change.doc.data();
      
      // Show browser notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: '🔔 New Payment Request!',
        message: `₹${payment.amount} from ${payment.userEmail}`,
        priority: 2
      });
      
      // Play sound
      new Audio('notification.mp3').play();
    }
  });
});
```

---

## Comparison: Which to Use?

| Method | Setup Time | Reliability | Mobile | Cost |
|--------|------------|-------------|--------|------|
| **Telegram Bot** | 5 min | ⭐⭐⭐⭐⭐ | ✅ Yes | FREE |
| **Discord Webhook** | 2 min | ⭐⭐⭐⭐⭐ | ✅ Yes (app) | FREE |
| **Firebase Functions** | 10 min | ⭐⭐⭐⭐⭐ | ✅ Yes | FREE |
| **Browser Extension** | 30 min | ⭐⭐⭐ | ❌ No | FREE |
| **Email (EmailJS)** | 0 min | ⭐⭐⭐⭐ | ✅ Yes | FREE |

**Recommendation:** Use **Telegram Bot + Firebase Functions** for best results!

---

## Quick Start (Fastest Setup)

### Option A: Telegram Only (5 minutes)

1. Create Telegram bot with @BotFather
2. Get your chat ID from @userinfobot
3. Deploy the Cloud Function above
4. Done! Get instant notifications on your phone 📱

### Option B: Multiple Channels (15 minutes)

1. Set up Telegram bot (5 min)
2. Set up Discord webhook (2 min)
3. Deploy Cloud Function with all channels (8 min)
4. Get notifications everywhere! 🎉

---

## Cost Breakdown

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| Firebase Functions | 2M invocations/month | ~1000/month | **$0** |
| Telegram Bot | Unlimited | Unlimited | **$0** |
| Discord Webhook | Unlimited | Unlimited | **$0** |
| EmailJS | 200/month | ~50/month | **$0** |
| **TOTAL** | | | **$0/month** |

---

## Next Steps

1. **Choose your notification method** (Telegram recommended)
2. **Set up the bot/webhook** (5 minutes)
3. **Deploy Firebase Function** (10 minutes)
4. **Test with a payment** (1 minute)
5. **Enjoy real-time notifications!** 🎉

Would you like me to help you set this up? I can create the complete Firebase Functions code for you!
