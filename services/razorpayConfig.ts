/**
 * Razorpay Configuration
 * 
 * IMPORTANT: Replace these placeholder values with your actual Razorpay API keys
 * 
 * To get your keys:
 * 1. Go to https://razorpay.com/
 * 2. Login to Dashboard
 * 3. Settings → API Keys
 * 4. Generate Test Keys (for development)
 * 5. Copy Key ID and Key Secret here
 */

// RAZORPAY API KEYS - REPLACE WITH YOUR ACTUAL KEYS
export const RAZORPAY_CONFIG = {
    // Test Key ID (starts with rzp_test_)
    keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXXXX',

    // Test Key Secret (NEVER expose in client code - only for backend)
    keySecret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXXXXXXXXXX',

    // Environment
    isTestMode: import.meta.env.VITE_RAZORPAY_TEST_MODE !== 'false',
};

// Razorpay Checkout Options
export const RAZORPAY_THEME = {
    color: '#F59E0B', // Amber color matching app theme
};

// Validate configuration
export const validateRazorpayConfig = (): boolean => {
    if (!RAZORPAY_CONFIG.keyId || RAZORPAY_CONFIG.keyId.includes('XXXX')) {
        console.error('❌ Razorpay Key ID not configured. Please add your API keys.');
        return false;
    }

    if (RAZORPAY_CONFIG.isTestMode) {
        console.warn('⚠️ Razorpay running in TEST mode');
    } else {
        console.log('✅ Razorpay running in PRODUCTION mode');
    }

    return true;
};

// Currency
export const CURRENCY = 'INR';

// Payment methods to enable
export const PAYMENT_METHODS = {
    upi: true,
    card: true,
    netbanking: true,
    wallet: true,
};
