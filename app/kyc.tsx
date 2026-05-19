import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInRight, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Upload, CircleCheck as CheckCircle, User, FileText, Camera, Clock, Shield, CircleAlert as AlertCircle, ChevronRight, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { submitKycSubmission } from '@/lib/kyc';
import { supabase } from '@/lib/supabase';

const STEPS = ['Personal Info', 'ID Document', 'Selfie', 'Review'];

export default function KYCScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile, submitKyc, uploadDocument } = useUser();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    firstName: profile.personalInfo.firstName,
    lastName: profile.personalInfo.lastName,
    dob: profile.personalInfo.dob,
    nationality: profile.personalInfo.nationality,
    address: profile.personalInfo.address,
    city: profile.personalInfo.city,
    zip: profile.personalInfo.zip,
  });
  const [selectedDocType, setSelectedDocType] = useState<string | null>(profile.kycDocuments.idType);
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState('');
  const [docRefs, setDocRefs] = useState({
    front: '',
    back: '',
    selfie: '',
  });

  const canAdvance = step === 0
    ? !!(form.firstName && form.lastName && form.dob && form.nationality)
    : step === 1
    ? !!(selectedDocType && (profile.kycDocuments.frontUploaded || docRefs.front) && (profile.kycDocuments.backUploaded || docRefs.back))
    : step === 2
    ? !!(profile.kycDocuments.selfieUploaded || docRefs.selfie)
    : true;

  const handleUpload = async (doc: 'frontUploaded' | 'backUploaded' | 'selfieUploaded') => {
    if (Platform.OS !== 'web') {
      // Mock for native or other non-web environments
      setUploading(doc);
      setTimeout(() => {
        uploadDocument(doc);
        setUploading(null);
      }, 1200);
      return;
    }

    // Web Platform file input picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/jpeg, application/pdf';
    
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(doc);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.wallet}-${doc}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        if (!supabase) throw new Error('Supabase client is not initialized.');

        const { data, error } = await supabase.storage
          .from('kyc-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) throw error;

        // Get public URL of the uploaded document
        const { data: { publicUrl } } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(filePath);

        const docRefKey = doc === 'frontUploaded' ? 'front' : doc === 'backUploaded' ? 'back' : 'selfie';
        setDocRefs(prev => ({
          ...prev,
          [docRefKey]: publicUrl || filePath,
        }));
        
        uploadDocument(doc);
      } catch (err: any) {
        alert(`Upload failed: ${err.message || err}`);
      } finally {
        setUploading(null);
      }
    };
    
    input.click();
  };

  const handleSubmit = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setSubmitStatus('Sending KYC to Supabase review queue...');
      const result = await submitKycSubmission({
        wallet: profile.wallet,
        email: profile.email,
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        idType: selectedDocType ?? '',
        personalInfo: form,
        documentUrls: docRefs,
      });
      setSubmitStatus(result.message ?? '');
      submitKyc(form, selectedDocType ?? '');
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 0 ? router.back() : setStep(step - 1))} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Identity Verification</Text>
        <View style={[styles.stepBadge, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <Text style={[styles.stepBadgeText, { color: theme.text.secondary }]}>{step + 1}/{STEPS.length}</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              { borderColor: theme.bg.border, backgroundColor: theme.bg.card },
              i < step && { backgroundColor: theme.accent[500], borderColor: theme.accent[500] },
              i === step && { borderColor: theme.accent[500] },
            ]}>
              {i < step ? (
                <CheckCircle size={14} color="#fff" />
              ) : (
                <Text style={[styles.progressNum, i === step && { color: theme.accent[400] }, i > step && { color: theme.text.muted }]}>{i + 1}</Text>
              )}
            </View>
            {i < STEPS.length - 1 && (
              <View style={[styles.progressLine, i < step ? { backgroundColor: theme.accent[500] } : { backgroundColor: theme.bg.border }]} />
            )}
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 && <PersonalInfoStep form={form} setForm={setForm} theme={theme} />}
        {step === 1 && <DocumentStep theme={theme} selectedDocType={selectedDocType} setSelectedDocType={setSelectedDocType} profile={profile} uploading={uploading} onUpload={handleUpload} docRefs={docRefs} setDocRefs={setDocRefs} />}
        {step === 2 && <SelfieStep theme={theme} profile={profile} uploading={uploading} onUpload={handleUpload} docRefs={docRefs} setDocRefs={setDocRefs} />}
        {step === 3 && <ReviewStep form={form} theme={theme} selectedDocType={selectedDocType} profile={profile} docRefs={docRefs} />}

        <View style={styles.actionArea}>
          {submitStatus ? <Text style={[styles.submitStatus, { color: theme.text.secondary }]}>{submitStatus}</Text> : null}
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: canAdvance ? theme.accent[500] : theme.bg.border }]}
            onPress={() => void handleSubmit()}
            disabled={!canAdvance}
            activeOpacity={0.8}
          >
            <Text style={styles.continueBtnText}>
              {step === STEPS.length - 1 ? 'Submit Verification' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PersonalInfoStep({ form, setForm, theme }: any) {
  const [focused, setFocused] = useState<string | null>(null);
  const inputStyle = (key: string) => [
    styles.input,
    { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: focused === key ? theme.accent[500] : theme.bg.border },
  ];

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Personal Information</Text>
      <Text style={[styles.stepSub, { color: theme.text.secondary }]}>We need your details to verify your identity.</Text>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>First Name</Text>
          <TextInput style={inputStyle('firstName')} placeholderTextColor={theme.text.muted} placeholder="Alex" value={form.firstName} onChangeText={(v: string) => setForm({ ...form, firstName: v })} onFocus={() => setFocused('firstName')} onBlur={() => setFocused(null)} />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Last Name</Text>
          <TextInput style={inputStyle('lastName')} placeholderTextColor={theme.text.muted} placeholder="Johnson" value={form.lastName} onChangeText={(v: string) => setForm({ ...form, lastName: v })} onFocus={() => setFocused('lastName')} onBlur={() => setFocused(null)} />
        </View>
      </View>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Date of Birth</Text>
        <TextInput style={inputStyle('dob')} placeholderTextColor={theme.text.muted} placeholder="DD / MM / YYYY" value={form.dob} onChangeText={(v: string) => setForm({ ...form, dob: v })} onFocus={() => setFocused('dob')} onBlur={() => setFocused(null)} />
      </View>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Nationality</Text>
        <TextInput style={inputStyle('nationality')} placeholderTextColor={theme.text.muted} placeholder="e.g. United States" value={form.nationality} onChangeText={(v: string) => setForm({ ...form, nationality: v })} onFocus={() => setFocused('nationality')} onBlur={() => setFocused(null)} />
      </View>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Residential Address</Text>
        <TextInput style={inputStyle('address')} placeholderTextColor={theme.text.muted} placeholder="Street address" value={form.address} onChangeText={(v: string) => setForm({ ...form, address: v })} onFocus={() => setFocused('address')} onBlur={() => setFocused(null)} />
      </View>
      <View style={styles.row}>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>City</Text>
          <TextInput style={inputStyle('city')} placeholderTextColor={theme.text.muted} placeholder="New York" value={form.city} onChangeText={(v: string) => setForm({ ...form, city: v })} onFocus={() => setFocused('city')} onBlur={() => setFocused(null)} />
        </View>
        <View style={styles.halfField}>
          <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>ZIP / Postal Code</Text>
          <TextInput style={inputStyle('zip')} placeholderTextColor={theme.text.muted} placeholder="10001" value={form.zip} onChangeText={(v: string) => setForm({ ...form, zip: v })} onFocus={() => setFocused('zip')} onBlur={() => setFocused(null)} />
        </View>
      </View>
    </Animated.View>
  );
}

function DocumentStep({ theme, selectedDocType, setSelectedDocType, profile, uploading, onUpload, docRefs, setDocRefs }: any) {
  const DOC_TYPES = ['Passport', "Driver's License", 'National ID'];
  const docs = profile.kycDocuments;

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Identity Document</Text>
      <Text style={[styles.stepSub, { color: theme.text.secondary }]}>Select and upload a government-issued ID.</Text>

      <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Document Type</Text>
      <View style={styles.docTypeRow}>
        {DOC_TYPES.map((d: string) => (
          <TouchableOpacity key={d} onPress={() => setSelectedDocType(d)} style={[styles.docTypeBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }, selectedDocType === d && { backgroundColor: theme.accent[500] + '22', borderColor: theme.accent[500] + '66' }]}>
            <Text style={[styles.docTypeText, { color: theme.text.secondary }, selectedDocType === d && { color: theme.accent[400] }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Front */}
      <UploadCard
        title="Front Side"
        subtitle="Photo or scan of the front"
        icon={<FileText size={22} color={theme.accent[400]} />}
        theme={theme}
        uploaded={docs.frontUploaded}
        uploading={uploading === 'frontUploaded'}
        onUpload={() => onUpload('frontUploaded')}
      />
      <TextInput
        style={[styles.input, styles.docUrlInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
        placeholder="Optional front ID image URL for Supabase row"
        placeholderTextColor={theme.text.muted}
        value={docRefs.front}
        onChangeText={(v: string) => setDocRefs({ ...docRefs, front: v })}
        autoCapitalize="none"
      />

      {/* Back */}
      <UploadCard
        title="Back Side"
        subtitle="Photo or scan of the back"
        icon={<FileText size={22} color={theme.primary[400]} />}
        theme={theme}
        uploaded={docs.backUploaded}
        uploading={uploading === 'backUploaded'}
        onUpload={() => onUpload('backUploaded')}
      />
      <TextInput
        style={[styles.input, styles.docUrlInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
        placeholder="Optional back ID image URL for Supabase row"
        placeholderTextColor={theme.text.muted}
        value={docRefs.back}
        onChangeText={(v: string) => setDocRefs({ ...docRefs, back: v })}
        autoCapitalize="none"
      />
    </Animated.View>
  );
}

function UploadCard({ title, subtitle, icon, theme, uploaded, uploading, onUpload }: any) {
  return (
    <TouchableOpacity
      style={[styles.uploadCard, { backgroundColor: theme.bg.card, borderColor: uploaded ? theme.success[500] + '66' : theme.bg.border }, uploaded && { backgroundColor: theme.success[500] + '0a' }]}
      onPress={uploaded ? undefined : onUpload}
      activeOpacity={0.8}
      disabled={uploading}
    >
      <View style={[styles.uploadCardIcon, { backgroundColor: uploaded ? theme.success[500] + '22' : theme.accent[500] + '18' }]}>
        {uploaded ? <CheckCircle size={22} color={theme.success[400]} /> : uploading ? <Clock size={22} color={theme.warning[400]} /> : icon}
      </View>
      <View style={styles.uploadCardInfo}>
        <Text style={[styles.uploadCardTitle, { color: theme.text.primary }]}>{title}</Text>
        <Text style={[styles.uploadCardSub, { color: theme.text.secondary }]}>
          {uploaded ? 'Uploaded successfully' : uploading ? 'Uploading...' : subtitle}
        </Text>
      </View>
      {uploaded ? (
        <CheckCircle size={20} color={theme.success[400]} />
      ) : (
        <ChevronRight size={18} color={theme.text.muted} />
      )}
    </TouchableOpacity>
  );
}

function SelfieStep({ theme, profile, uploading, onUpload, docRefs, setDocRefs }: any) {
  const uploaded = profile.kycDocuments.selfieUploaded;

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Take a Selfie</Text>
      <Text style={[styles.stepSub, { color: theme.text.secondary }]}>Hold your ID next to your face for a clear photo.</Text>

      <TouchableOpacity
        style={[styles.selfieCard, { backgroundColor: theme.bg.card, borderColor: uploaded ? theme.success[500] + '66' : theme.bg.border }, uploaded && { backgroundColor: theme.success[500] + '0a' }]}
        onPress={uploaded ? undefined : () => onUpload('selfieUploaded')}
        activeOpacity={0.8}
        disabled={uploading === 'selfieUploaded'}
      >
        <View style={[styles.selfieIconWrap, { backgroundColor: uploaded ? theme.success[500] + '22' : theme.accent[500] + '18' }]}>
          {uploaded ? <CheckCircle size={40} color={theme.success[400]} /> : uploading === 'selfieUploaded' ? <Clock size={40} color={theme.warning[400]} /> : <Camera size={40} color={theme.accent[400]} />}
        </View>
        <Text style={[styles.selfieTitle, { color: theme.text.primary }]}>
          {uploaded ? 'Selfie Uploaded' : uploading === 'selfieUploaded' ? 'Uploading...' : 'Open Camera'}
        </Text>
        <Text style={[styles.selfieSub, { color: theme.text.secondary }]}>
          {uploaded ? 'Your selfie has been captured successfully' : 'Make sure your face and ID are clearly visible'}
        </Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, styles.docUrlInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
        placeholder="Optional selfie image URL for Supabase row"
        placeholderTextColor={theme.text.muted}
        value={docRefs.selfie}
        onChangeText={(v: string) => setDocRefs({ ...docRefs, selfie: v })}
        autoCapitalize="none"
      />

      <View style={[styles.tipCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
        <Text style={[styles.tipTitle, { color: theme.text.primary }]}>Tips for a good selfie</Text>
        {['Ensure good lighting -- avoid backlighting', 'Keep your face clearly visible', 'Hold your ID next to your face', 'Remove glasses or hats'].map((t) => (
          <View key={t} style={styles.tipRow}>
            <View style={[styles.tipDot, { backgroundColor: theme.accent[400] }]} />
            <Text style={[styles.tipText, { color: theme.text.secondary }]}>{t}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

function ReviewStep({ form, theme, selectedDocType, profile, docRefs }: any) {
  const docs = profile.kycDocuments;

  return (
    <Animated.View entering={FadeInRight.duration(300)}>
      <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Review Submission</Text>
      <Text style={[styles.stepSub, { color: theme.text.secondary }]}>Please review your information before submitting.</Text>

      <View style={[styles.reviewCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
        <Text style={[styles.reviewSection, { color: theme.text.muted }]}>Personal Details</Text>
        {[
          ['Name', `${form.firstName || 'Not provided'} ${form.lastName || ''}`],
          ['Date of Birth', form.dob || 'Not provided'],
          ['Nationality', form.nationality || 'Not provided'],
          ['Address', form.address ? `${form.address}, ${form.city} ${form.zip}` : 'Not provided'],
        ].map(([label, value]) => (
          <View key={label as string} style={[styles.reviewRow, { borderBottomColor: theme.bg.border }]}>
            <Text style={[styles.reviewLabel, { color: theme.text.secondary }]}>{label}</Text>
            <Text style={[styles.reviewValue, { color: theme.text.primary }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.reviewCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
        <Text style={[styles.reviewSection, { color: theme.text.muted }]}>Documents</Text>
        {[
          ['Document Type', selectedDocType ?? 'Not selected'],
          ['Front Side', docs.frontUploaded ? 'Uploaded' : 'Missing'],
          ['Back Side', docs.backUploaded ? 'Uploaded' : 'Missing'],
          ['Selfie', docs.selfieUploaded ? 'Uploaded' : 'Missing'],
          ['Front URL', docRefs.front || 'Not provided'],
          ['Back URL', docRefs.back || 'Not provided'],
          ['Selfie URL', docRefs.selfie || 'Not provided'],
        ].map(([label, value]) => {
          const isUploaded = value === 'Uploaded';
          return (
            <View key={label as string} style={[styles.reviewRow, { borderBottomColor: theme.bg.border }]}>
              <Text style={[styles.reviewLabel, { color: theme.text.secondary }]}>{label}</Text>
              <View style={styles.reviewStatusRow}>
                {isUploaded && <CheckCircle size={12} color={theme.success[400]} />}
                <Text style={[styles.reviewValue, isUploaded ? { color: theme.success[400] } : { color: theme.error[400] }]}>{value}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.consentCard, { backgroundColor: theme.accent[500] + '11', borderColor: theme.accent[500] + '33' }]}>
        <Shield size={18} color={theme.accent[400]} />
        <Text style={[styles.consentText, { color: theme.text.secondary }]}>
          By submitting, you confirm that all information is accurate and consent to Wallex's identity verification process.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter-SemiBold' },
  stepBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  stepBadgeText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  progressItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  progressDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressNum: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  progressLine: { flex: 1, height: 2, marginHorizontal: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontFamily: 'Inter-Bold', marginBottom: 6 },
  stepSub: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 24, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1, marginBottom: 16 },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'Inter-Regular', borderWidth: 1.5 },
  docUrlInput: { marginBottom: 14, fontSize: 13 },
  docTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  docTypeBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  docTypeText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  uploadCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1.5, gap: 12 },
  uploadCardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  uploadCardInfo: { flex: 1 },
  uploadCardTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  uploadCardSub: { fontSize: 12, fontFamily: 'Inter-Regular' },
  selfieCard: { borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1.5, marginBottom: 16, gap: 8 },
  selfieIconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  selfieTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  selfieSub: { fontSize: 13, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 18 },
  tipCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  tipTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 4 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3 },
  tipText: { fontSize: 13, fontFamily: 'Inter-Regular', flex: 1 },
  reviewCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  reviewSection: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1 },
  reviewLabel: { fontSize: 13, fontFamily: 'Inter-Regular' },
  reviewValue: { fontSize: 13, fontFamily: 'Inter-Medium', maxWidth: 200, textAlign: 'right' },
  reviewStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  consentCard: { flexDirection: 'row', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8, gap: 10, alignItems: 'flex-start' },
  consentText: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 18, flex: 1 },
  actionArea: { paddingTop: 24 },
  submitStatus: { fontSize: 12, fontFamily: 'Inter-Medium', textAlign: 'center', marginBottom: 10 },
  continueBtn: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  continueBtnText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
});
