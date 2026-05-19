import { supabase, isWalletSyncEnabled, recordAuditLog } from '@/lib/supabase';

type KycSubmissionParams = {
  wallet: string;
  email: string;
  fullName: string;
  idType: string;
  personalInfo: Record<string, string>;
  documentUrls: {
    front: string;
    back: string;
    selfie: string;
  };
};

export async function submitKycSubmission(params: KycSubmissionParams) {
  if (!supabase || !isWalletSyncEnabled) {
    return { ok: true, demo: true, message: 'KYC saved locally. Enable Supabase sync to send rows live.' };
  }

  const { data: auth } = await supabase.auth.getUser();
  const authUserId = auth.user?.id;

  // Insert submission details
  const { error: insertError } = await supabase.from('kyc_submissions').insert({
    auth_user_id: authUserId ?? null,
    wallet: params.wallet.toLowerCase(),
    email: params.email,
    full_name: params.fullName,
    id_type: params.idType,
    personal_info: params.personalInfo,
    front_document_url: params.documentUrls.front || null,
    back_document_url: params.documentUrls.back || null,
    selfie_document_url: params.documentUrls.selfie || null,
    status: 'pending',
  });

  if (insertError) return { ok: false, demo: false, message: insertError.message };

  // Also update user's profile status in DB
  const { error: updateError } = await supabase
    .from('users')
    .update({ kyc_status: 'pending' })
    .eq('wallet', params.wallet.toLowerCase());

  if (updateError) {
    console.error('Failed to update kyc_status in users table:', updateError);
  }

  // Record audit log
  await recordAuditLog({
    userId: authUserId ?? null,
    wallet: params.wallet.toLowerCase(),
    email: params.email,
    eventType: 'kyc_submission_completed',
    metadata: { idType: params.idType },
  });

  return { ok: true, demo: false, message: 'KYC sent to Supabase for review.' };
}

