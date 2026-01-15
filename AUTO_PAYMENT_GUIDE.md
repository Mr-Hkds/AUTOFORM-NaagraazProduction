# Automatic Payment Verification & Token Crediting (FREE)

## Problem
Currently: User pays → You manually verify → You approve → Tokens credited
Want: User pays → **Automatic verification** → Tokens credited instantly

## Solution: UPI Payment Gateway with Webhooks (100% FREE)

---

## Option 1: Razorpay (RECOMMENDED - FREE for UPI)

### Why Razorpay?
- ✅ **0% fees on UPI** (completely free!)
- ✅ Instant payment webhooks
- ✅ Automatic verification
- ✅ No manual approval needed
- ✅ 2% fee only on credit/debit cards (optional)

### Setup (30 minutes)

#### Step 1: Create Razorpay Account
1. Go to https://razorpay.com/
2. Sign up (free)
3. Complete KYC (Aadhaar + PAN)
4. Get API keys from Dashboard

#### Step 2: Install Razorpay in Your App

```bash
npm install razorpay
```

#### Step 3: Create Payment Service

Create file: `services/razorpayService.ts`

```typescript
import Razorpay from 'razorpay';

// Initialize Razorpay (use environment variables in production)
const razorpay = new Razorpay({
  key_id: 'YOUR_RAZORPAY_KEY_ID',
  key_secret: 'YOUR_RAZORPAY_KEY_SECRET'
});

export interface PaymentOrder {
  amount: number; // in rupees
  tokens: number;
  userEmail: string;
  userId: string;
}

// Create payment order
export const createPaymentOrder = async (data: PaymentOrder) => {
  try {
    const order = await razorpay.orders.create({
      amount: data.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: data.userId,
        userEmail: data.userEmail,
        tokens: data.tokens
      }
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    throw error;
  }
};

// Verify payment signature (security)
export const verifyPaymentSignature = (
  orderId: string,
  paymentId: string,
  signature: string
): boolean => {
  const crypto = require('crypto');
  const generatedSignature = crypto
    .createHmac('sha256', 'YOUR_RAZORPAY_KEY_SECRET')
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
};
```

#### Step 4: Update Payment Modal

Update `components/PaymentModal.tsx`:

```typescript
import { createPaymentOrder } from '../services/razorpayService';

const handleRazorpayPayment = async (plan: any) => {
  try {
    // Create order
    const order = await createPaymentOrder({
      amount: plan.price,
      tokens: plan.tokens,
      userEmail: user.email,
      userId: user.uid
    });

    // Razorpay checkout options
    const options = {
      key: 'YOUR_RAZORPAY_KEY_ID',
      amount: order.amount,
      currency: order.currency,
      name: 'AutoForm',
      description: `${plan.tokens} Tokens`,
      order_id: order.orderId,
      prefill: {
        email: user.email,
        name: user.displayName
      },
      theme: {
        color: '#F59E0B' // Amber color
      },
      handler: async function (response: any) {
        // Payment successful - verify and credit tokens
        await handlePaymentSuccess(response);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
        }
      }
    };

    // Open Razorpay checkout
    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();

  } catch (error) {
    console.error('Payment initiation failed:', error);
    alert('Failed to initiate payment. Please try again.');
  }
};

const handlePaymentSuccess = async (response: any) => {
  try {
    // Verify payment signature
    const isValid = verifyPaymentSignature(
      response.razorpay_order_id,
      response.razorpay_payment_id,
      response.razorpay_signature
    );

    if (!isValid) {
      throw new Error('Payment verification failed');
    }

    // Credit tokens immediately (no manual approval!)
    await creditTokensAutomatically(
      user.uid,
      selectedPlan.tokens,
      response.razorpay_payment_id
    );

    alert('✅ Payment successful! Tokens credited to your account.');
    onClose();

  } catch (error) {
    console.error('Payment verification failed:', error);
    alert('Payment verification failed. Please contact support.');
  }
};
```

#### Step 5: Auto Credit Tokens Function

Create `services/autoPaymentService.ts`:

```typescript
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export const creditTokensAutomatically = async (
  userId: string,
  tokens: number,
  paymentId: string
) => {
  try {
    // 1. Credit tokens to user
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tokens: increment(tokens),
      isPremium: true,
      lastPayment: serverTimestamp()
    });

    // 2. Record transaction
    await addDoc(collection(db, 'transactions'), {
      userId,
      paymentId,
      tokens,
      status: 'completed',
      method: 'razorpay_upi',
      createdAt: serverTimestamp()
    });

    console.log(`✅ Auto-credited ${tokens} tokens to user ${userId}`);
    return true;

  } catch (error) {
    console.error('Auto credit failed:', error);
    throw error;
  }
};
```

#### Step 6: Add Razorpay Script to HTML

Update `index.html`:

```html
<!-- Add before closing </body> tag -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Option 2: Cashfree (FREE for UPI)

Similar to Razorpay:
- ✅ 0% fees on UPI
- ✅ Instant webhooks
- ✅ Auto verification

Setup is almost identical to Razorpay.

---

## Option 3: PhonePe Payment Gateway (FREE)

- ✅ 0% MDR on UPI
- ✅ Instant callbacks
- ✅ Easy integration

---

## How It Works (User Flow)

### Before (Manual):
```
User pays ₹99
  ↓
Screenshot upload
  ↓
YOU manually check
  ↓ (wait time: minutes to hours)
YOU click approve
  ↓
Tokens credited
```

### After (Automatic):
```
User clicks "Pay ₹99"
  ↓
Razorpay UPI payment
  ↓
Payment successful
  ↓ (instant - 2 seconds)
Tokens auto-credited ✅
  ↓
User can use immediately!
```

---

## Firebase Cloud Function for Webhook (Optional)

For extra security, use Firebase Functions to handle webhooks:

Create `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

admin.initializeApp();

export const razorpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify webhook signature
    const signature = req.headers['x-razorpay-signature'] as string;
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payment = req.body.payload.payment.entity;

    // Handle payment success
    if (event === 'payment.captured') {
      const userId = payment.notes.userId;
      const tokens = parseInt(payment.notes.tokens);

      // Credit tokens
      await admin.firestore().doc(`users/${userId}`).update({
        tokens: admin.firestore.FieldValue.increment(tokens),
        isPremium: true
      });

      console.log(`✅ Auto-credited ${tokens} tokens to ${userId}`);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});
```

Deploy:
```bash
firebase deploy --only functions:razorpayWebhook
```

---

## Comparison: Payment Gateways

| Gateway | UPI Fee | Setup Time | Auto Credit | KYC Required |
|---------|---------|------------|-------------|--------------|
| **Razorpay** | 0% | 30 min | ✅ Yes | ✅ Yes |
| **Cashfree** | 0% | 30 min | ✅ Yes | ✅ Yes |
| **PhonePe** | 0% | 45 min | ✅ Yes | ✅ Yes |
| **Paytm** | 0% | 30 min | ✅ Yes | ✅ Yes |

**All are FREE for UPI payments!**

---

## Cost Breakdown

### Current (Manual):
- Payment Gateway: ₹0 (manual UPI)
- Your Time: 5-10 min per payment
- User Wait Time: Minutes to hours

### With Razorpay (Auto):
- UPI Payments: **₹0 (0% fee)**
- Credit Card: 2% (optional, users can choose UPI)
- Setup Time: 30 minutes (one-time)
- User Wait Time: **2 seconds** ⚡

---

## Implementation Steps

### Quick Start (1 hour):

1. **Sign up for Razorpay** (10 min)
   - https://razorpay.com/
   - Complete KYC

2. **Get API Keys** (2 min)
   - Dashboard → Settings → API Keys

3. **Add Razorpay to your app** (30 min)
   - Install package
   - Update PaymentModal
   - Add auto-credit function

4. **Test with ₹1** (5 min)
   - Test payment
   - Verify auto-credit works

5. **Go Live!** (5 min)
   - Switch to production keys
   - Enable UPI payments

---

## Security Features

✅ Payment signature verification
✅ Webhook signature validation
✅ Transaction logging
✅ Fraud detection (built-in Razorpay)
✅ PCI DSS compliant

---

## Benefits

### For You:
- ✅ No manual work
- ✅ Instant payment confirmation
- ✅ Automatic token crediting
- ✅ Transaction history
- ✅ No payment gateway fees (UPI)

### For Users:
- ✅ Instant token credit (2 seconds)
- ✅ No screenshot upload
- ✅ No waiting for approval
- ✅ Better user experience
- ✅ Multiple payment options (UPI, cards, wallets)

---

## Next Steps

1. **Choose payment gateway** (Razorpay recommended)
2. **Sign up and complete KYC** (required for live payments)
3. **Get API keys**
4. **Implement the code above**
5. **Test with small amount**
6. **Go live!**

**Want me to create the complete implementation code for you?** I can set up the entire Razorpay integration with auto-crediting! 🚀

---

## Important Notes

- **KYC Required**: You need to complete KYC (Aadhaar + PAN) to receive payments
- **Settlement Time**: Money reaches your bank in 24-48 hours (but tokens credit instantly)
- **Test Mode**: Use test keys for development, production keys for live
- **Backup**: Keep manual approval option for failed auto-credits

---

**This is the BEST solution for your use case - completely free and fully automated!** 🎉
