import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown, ScanLine, ArrowUpRight, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { CryptoColors } from '@/constants/colors';
import { CRYPTO_ASSETS } from '@/constants/crypto';
import { recordWalletTransfer } from '@/lib/supabase';

export default function SendScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUser();
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usdValue = parseFloat(amount || '0') * selectedAsset.price;
  const isValid = address.length > 10 && parseFloat(amount) > 0;

  const handleSend = async () => {
    if (!isValid) return;
    if (!confirmed) { setConfirmed(true); return; }
    setSubmitting(true);
    setError(null);
    const result = await recordWalletTransfer({
      fromWallet: profile.wallet,
      toWallet: address.trim(),
      amount: Number(amount),
      token: selectedAsset.symbol,
      note,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error?.message ?? 'Transfer could not be recorded');
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top', 'bottom']}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.success[500] + '18' }]}>
            <CheckCircle size={56} color={theme.success[400]} />
          </View>
          <Text style={[styles.successTitle, { color: theme.text.primary }]}>Sent Successfully</Text>
          <Text style={[styles.successSub, { color: theme.text.secondary }]}>
            {parseFloat(amount).toLocaleString('en-US', { maximumFractionDigits: 4 })} {selectedAsset.symbol} sent
          </Text>
          <Text style={[styles.successAddr, { color: theme.text.muted }]}>{address.slice(0, 12)}...{address.slice(-8)}</Text>
          <TouchableOpacity style={[styles.successBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} onPress={() => router.back()}>
            <Text style={[styles.successBtnText, { color: theme.text.primary }]}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (confirmed ? setConfirmed(false) : router.back())} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <ArrowLeft size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{confirmed ? 'Confirm Send' : 'Send RXP'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!confirmed ? (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>Asset</Text>
                <TouchableOpacity style={[styles.assetSelector, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                  <View style={[styles.assetIconBg, { backgroundColor: (CryptoColors[selectedAsset.symbol]?.primary ?? theme.primary[500]) + '22' }]}>
                    <Image source={{ uri: selectedAsset.icon }} style={styles.assetIcon} />
                  </View>
                  <View style={styles.assetSelectorInfo}>
                    <Text style={[styles.assetSelectorSymbol, { color: theme.text.primary }]}>{selectedAsset.symbol}</Text>
                    <Text style={[styles.assetSelectorBalance, { color: theme.text.secondary }]}>
                      Internal Wallex balance: {selectedAsset.balance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {selectedAsset.symbol}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={theme.text.secondary} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>Recipient Address</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text.primary }]}
                    placeholder="wallex-recipient-wallet"
                    placeholderTextColor={theme.text.muted}
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity style={styles.scanBtn}>
                    <ScanLine size={18} color={theme.accent[400]} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).duration(400)}>
                <View style={styles.amountHeader}>
                  <Text style={[styles.label, { color: theme.text.secondary }]}>Amount</Text>
                  <TouchableOpacity onPress={() => setAmount(selectedAsset.balance.toString())} style={[styles.maxBtn, { backgroundColor: theme.accent[500] + '22', borderColor: theme.accent[500] + '44' }]}>
                    <Text style={[styles.maxBtnText, { color: theme.accent[400] }]}>MAX</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.amountWrapper, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text.primary }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.text.muted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                  <Text style={[styles.amountSymbol, { color: theme.text.secondary }]}>{selectedAsset.symbol}</Text>
                </View>
                {parseFloat(amount) > 0 && (
                  <Text style={[styles.usdEquiv, { color: theme.text.secondary }]}>
                    ~ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </Text>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(180).duration(400)}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>Note (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.noteInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
                  placeholder="Add a note..."
                  placeholderTextColor={theme.text.muted}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(220).duration(400)} style={[styles.feeCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: theme.text.secondary }]}>Internal Fee</Text>
                  <Text style={[styles.feeValue, { color: theme.text.primary }]}>0.00 {selectedAsset.symbol}</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={[styles.feeLabel, { color: theme.text.secondary }]}>Ledger</Text>
                  <Text style={[styles.feeValue, { color: theme.text.primary }]}>Wallex internal RXP</Text>
                </View>
              </Animated.View>
            </>
          ) : (
            <Animated.View entering={FadeInDown.duration(300)}>
              <View style={[styles.confirmCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                <Text style={[styles.confirmTitle, { color: theme.text.secondary }]}>Review Transaction</Text>
                <View style={styles.confirmAmountRow}>
                  <Image source={{ uri: selectedAsset.icon }} style={styles.confirmIcon} />
                  <Text style={[styles.confirmAmount, { color: theme.text.primary }]}>
                    {parseFloat(amount).toLocaleString('en-US', { maximumFractionDigits: 6 })} {selectedAsset.symbol}
                  </Text>
                </View>
                <Text style={[styles.confirmUsd, { color: theme.text.secondary }]}>
                  ~ ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </Text>
                <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
                {[
                  ['To', `${address.slice(0, 10)}...${address.slice(-8)}`],
                  ['Ledger', 'Wallex internal RXP'],
                  ['Fee', `0.00 ${selectedAsset.symbol}`],
                  ['Note', note || '-'],
                ].map(([k, v]) => (
                  <View key={k} style={[styles.confirmRow, { borderBottomColor: theme.bg.border }]}>
                    <Text style={[styles.confirmLabel, { color: theme.text.secondary }]}>{k}</Text>
                    <Text style={[styles.confirmValue, { color: theme.text.primary }]}>{v}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          <View style={{ paddingTop: 24, paddingBottom: 40 }}>
            {error && (
              <View style={[styles.errorCard, { backgroundColor: theme.error[500] + '12', borderColor: theme.error[500] + '44' }]}>
                <Text style={[styles.errorText, { color: theme.error[400] }]}>{error}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!isValid || submitting} activeOpacity={0.85}>
              <LinearGradient
                colors={isValid ? [theme.accent[500], theme.primary[700]] : [theme.bg.border, theme.bg.border]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtnGradient}
              >
                <ArrowUpRight size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.sendBtnText}>{submitting ? 'Sending...' : confirmed ? 'Confirm & Send' : 'Review Transaction'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  content: { paddingHorizontal: 16 },
  label: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  assetSelector: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 12, borderWidth: 1, gap: 10 },
  assetIconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  assetIcon: { width: 26, height: 26, borderRadius: 13 },
  assetSelectorInfo: { flex: 1 },
  assetSelectorSymbol: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  assetSelectorBalance: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  inputWrapper: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, fontFamily: 'Inter-Regular', borderRadius: 14, borderWidth: 1 },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  scanBtn: { padding: 12 },
  amountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 16 },
  maxBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  maxBtnText: { fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 0.5 },
  amountWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingRight: 14 },
  amountInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 16, fontSize: 22, fontFamily: 'Inter-Bold' },
  amountSymbol: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  usdEquiv: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 6, marginLeft: 4 },
  feeCard: { borderRadius: 14, padding: 14, marginTop: 20, borderWidth: 1, gap: 8 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13, fontFamily: 'Inter-Regular' },
  feeValue: { fontSize: 13, fontFamily: 'Inter-Medium' },
  confirmCard: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', marginTop: 8 },
  confirmTitle: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  confirmAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  confirmIcon: { width: 32, height: 32, borderRadius: 16 },
  confirmAmount: { fontSize: 28, fontFamily: 'Inter-Bold' },
  confirmUsd: { fontSize: 15, fontFamily: 'Inter-Regular', marginBottom: 20 },
  divider: { width: '100%', height: 1, marginBottom: 16 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1 },
  confirmLabel: { fontSize: 13, fontFamily: 'Inter-Regular' },
  confirmValue: { fontSize: 13, fontFamily: 'Inter-Medium', maxWidth: 200, textAlign: 'right' },
  errorCard: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  sendBtn: { borderRadius: 16, overflow: 'hidden' },
  sendBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, gap: 10 },
  sendBtnText: { fontSize: 16, fontFamily: 'Inter-SemiBold', color: '#fff' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  successIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successTitle: { fontSize: 26, fontFamily: 'Inter-Bold' },
  successSub: { fontSize: 15, fontFamily: 'Inter-Regular', textAlign: 'center' },
  successAddr: { fontSize: 13, fontFamily: 'Inter-Regular' },
  successBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16, borderWidth: 1 },
  successBtnText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
});
