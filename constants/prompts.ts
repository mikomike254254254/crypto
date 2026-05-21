export const PROMPTS = {
  REFERRAL_LINK_COPIED: 'Referral link copied!',
  UPLOAD_FAILED: (msg: string) => `Upload failed: ${msg}`,
  ONBOARDING_RESULT: (msg: string) => msg,
  WALLET_READY_TITLE: 'Wallex is ready',
  WALLET_READY_MESSAGE: 'Your Wallex wallet has loaded. You can send, receive, buy, and manage XRP securely.',
  SCAN_SUCCESS: 'QR code scanned successfully.',
  SCAN_ERROR: (msg: string) => `QR scan error: ${msg}`,
  QR_GENERATED: 'QR code generated for your address.',
  QR_SCAN_LOGGED: 'QR scan logged for analytics.',
};
