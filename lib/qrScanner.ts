// lib/qrScanner.ts
import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Logs a QR code scan event to the Supabase `qr_scans` table.
 *
 * @param scannedData - The raw data extracted from the QR code.
 * @param wallet - Optional wallet address associated with the scan.
 */
export async function logScan(scannedData: string, wallet?: string): Promise<void> {
  // If Supabase is not configured or wallet sync is disabled, silently ignore.
  if (!supabase || !isSupabaseConfigured) {
    return;
  }

  try {
    // Retrieve current authenticated user ID if available.
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id ?? null;

    await supabase.from('qr_scans').insert({
      user_id: userId,
      wallet: wallet ?? null,
      scanned_data: scannedData,
    });
  } catch (error) {
    // Log to console for debugging; do not disrupt the UI flow.
    console.error('Failed to log QR scan:', error);
  }
}
