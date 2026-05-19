import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, CreditCard, CheckCircle, CircleAlert, WalletCards } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { WALLEX_BRAND } from '@/constants/brand';

export default function BuyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUser();
  const [xrpAmount, setXrpAmount] = useState('50');
  const [email, setEmail] = useState(profile.email);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message?: string; reference?: string; checkoutUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fixedLinks] = useState<{ amount: number; label: string; url: string }[]>([
    { amount: 79, label: '$79 Deposit', url: 'https://checkout.pay4.work/pay/5cfbf1a1b071b83954db4032ff23f62fd1ebf6a9ec5007721a4c9340d50a6559' },
    { amount: 45, label: '$45 Deposit', url: 'https://checkout.pay4.work/pay/16b31d3c58a76706c74e070fc13c92b0e35559f96e820a9257e0825d6788f696' },
  ]);

  const units = Number(xrpAmount || 0);
  const totalKes = units * WALLEX_BRAND.xrpRateKes;
  const platformFee = Math.round(totalKes * 0.2);
  const estimatedCardTotal = totalKes + platformFee;
  const isValid = units > 0 && email.includes('@');

  const startCheckout = async () => {
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
      const response = await fetch(`${apiBase}/api/payflee-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          xrpAmount: units,
          email,
          wallet: profile.wallet,
        }),
      });
      const text = await response.text();
      let data: { message?: string; reference?: string; checkoutUrl?: string; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {
          checkoutUrl: `https://www.payflee.com/?amount=${Math.round(totalKes)}&currency=KES&wallet=${encodeURIComponent(profile.wallet)}`,
          message: 'Opening Payflee handoff. Configure the Payflee payment link on Vercel for direct checkout.',
        };
      }

      if (!response.ok && !data.message) {
        setError(data.error ?? 'Unable to start checkout');
        return;
      }

      setResult(data);
      if (data.checkoutUrl) {
        Linking.openURL(data.checkoutUrl);
      }
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Unable to start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <ArrowLeft size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Buy XRP</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.rateCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <View style={[styles.rateIcon, { backgroundColor: theme.accent[500] + '22' }]}>
              <WalletCards size={26} color={theme.accent[400]} />
            </View>
            <Text style={[styles.rateLabel, { color: theme.text.secondary }]}>Fixed Wallex Rate</Text>
            <Text style={[styles.rateValue, { color: theme.text.primary }]}>KSh {WALLEX_BRAND.xrpRateKes} per XRP</Text>
            <Text style={[styles.rateNote, { color: theme.text.secondary }]}>Card checkout is routed through the server so private payment keys stay off the public app.</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400)}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Amount</Text>
            <View style={styles.quickRow}>
              {[10, 25, 50, 100].map((quick) => (
                <TouchableOpacity
                  key={quick}
                  style={[styles.quickChip, { backgroundColor: Number(xrpAmount) === quick ? theme.accent[500] + '22' : theme.bg.card, borderColor: Number(xrpAmount) === quick ? theme.accent[500] + '66' : theme.bg.border }]}
                  onPress={() => setXrpAmount(String(quick))}
                >
                  <Text style={[styles.quickChipText, { color: Number(xrpAmount) === quick ? theme.accent[400] : theme.text.secondary }]}>{quick} XRP</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.inputWrap, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
              <TextInput
                style={[styles.amountInput, { color: theme.text.primary }]}
                value={xrpAmount}
                onChangeText={setXrpAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.text.muted}
              />
              <Text style={[styles.inputSuffix, { color: theme.text.secondary }]}>XRP</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(400)}>
            <Text style={[styles.label, { color: theme.text.secondary }]}>Receipt Email</Text>
            <TextInput
              style={[styles.emailInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@email.com"
              placeholderTextColor={theme.text.muted}
            />
          </Animated.View>

          <View style={[styles.summary, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Wallet</Text>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>{profile.wallet}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Total</Text>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>KSh {totalKes.toLocaleString('en-KE')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Gateway fee estimate</Text>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>KSh {platformFee.toLocaleString('en-KE')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Card checkout estimate</Text>
              <Text style={[styles.summaryValue, { color: theme.text.primary }]}>KSh {estimatedCardTotal.toLocaleString('en-KE')}</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.payBtn, !isValid && { opacity: 0.45 }]} onPress={startCheckout} disabled={!isValid || loading} activeOpacity={0.86}>
            <CreditCard size={20} color="#fff" />
            <Text style={styles.payBtnText}>{loading ? 'Starting Checkout...' : 'Proceed to Card Payment'}</Text>
          </TouchableOpacity>

          <View style={styles.fixedLinksSection}>
            <Text style={[styles.fixedLinksLabel, { color: theme.text.secondary }]}>Quick Deposits</Text>
            {fixedLinks.map((link) => (
              <TouchableOpacity
                key={link.amount}
                style={[styles.fixedLinkBtn, { backgroundColor: theme.accent[500] + '15', borderColor: theme.accent[500] + '33' }]}
                onPress={() => Linking.openURL(link.url)}
              >
                <Text style={[styles.fixedLinkText, { color: theme.accent[400] }]}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {result && (
            <View style={[styles.statusCard, { backgroundColor: theme.success[500] + '12', borderColor: theme.success[500] + '44' }]}>
              <CheckCircle size={18} color={theme.success[400]} />
              <Text style={[styles.statusText, { color: theme.success[400] }]}>
                {result.checkoutUrl ? 'Checkout opened.' : result.message}
                {result.reference ? ` Reference: ${result.reference}` : ''}
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.statusCard, { backgroundColor: theme.error[500] + '12', borderColor: theme.error[500] + '44' }]}>
              <CircleAlert size={18} color={theme.error[400]} />
              <Text style={[styles.statusText, { color: theme.error[400] }]}>{error}</Text>
            </View>
          )}

          <Text style={[styles.support, { color: theme.text.secondary }]}>Support: {WALLEX_BRAND.supportEmail}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 36 },
  rateCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 7, marginTop: 8 },
  rateIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  rateLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  rateValue: { fontSize: 29, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  rateNote: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19 },
  label: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 18 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quickChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  quickChipText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingRight: 16 },
  amountInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 18, fontSize: 28, fontFamily: 'Inter-Bold' },
  inputSuffix: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  emailInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, fontFamily: 'Inter-Regular' },
  summary: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 18, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  summaryLabel: { fontSize: 13, fontFamily: 'Inter-Regular' },
  summaryValue: { flex: 1, textAlign: 'right', fontSize: 13, fontFamily: 'Inter-SemiBold' },
  payBtn: { marginTop: 20, backgroundColor: '#0f172a', borderRadius: 18, paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  payBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
  statusCard: { marginTop: 14, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  statusText: { flex: 1, fontSize: 13, fontFamily: 'Inter-Medium', lineHeight: 18 },
  support: { textAlign: 'center', marginTop: 20, fontSize: 12, fontFamily: 'Inter-Medium' },
  fixedLinksSection: { marginTop: 24, gap: 10 },
  fixedLinksLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  fixedLinkBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  fixedLinkText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
});
