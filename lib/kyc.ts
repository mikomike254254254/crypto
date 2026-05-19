import { supabase, isWalletSyncEnabled } from '@/lib/supabase';

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

  const { error } = await supabase.from('kyc_submissions').insert({
    auth_user_id: authUserId ?? null,
    wallet: params.wallet,
    email: params.email,
    full_name: params.fullName,
    id_type: params.idType,
    personal_info: params.personalInfo,
    front_document_url: params.documentUrls.front || null,
    back_document_url: params.documentUrls.back || null,
    selfie_document_url: params.documentUrls.selfie || null,
    status: 'pending',
  });

  if (error) return { ok: false, demo: false, message: error.message };
  return { ok: true, demo: false, message: 'KYC sent to Supabase for review.' };
}
