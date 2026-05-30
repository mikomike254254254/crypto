import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, WalletCards, ShieldCheck, ChevronRight, ExternalLink } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { WALLEX_BRAND } from '@/constants/brand';

export default function BuyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUser();
  const [loadingAmount, setLoadingAmount] = useState<number | null>(null);

  const DEPOSIT_OPTIONS = [
    {
      amount: 25,
      label: 'Deposit $25',
      desc: 'Credit approx. 18.0 XRP / equivalent',
      url: 'https://checkout.pay4.work/pay/5e15be4fce44e54e56885c6bffe95346620f384e58a96d7898456b21ca3701de'
    },
    {
      amount: 50,
      label: 'Deposit $50',
      desc: 'Credit approx. 36.0 XRP / equivalent',
      url: 'https://checkout.pay4.work/pay/6e6df47d1ae156f9816fee6fbc3849ca866b8874b3ecca871cfdc2e0e7d69b72'
    },
    {
      amount: 75,
      label: 'Deposit $75',
      desc: 'Credit approx. 54.0 XRP / equivalent',
      url: 'https://checkout.pay4.work/pay/45482f13f8e0422efe502ce3d215b9ade96219199a9800ce0020c8146a3121e4'
    },
    {
      amount: 100,
      label: 'Deposit $100',
      desc: 'Credit approx. 72.0 XRP / equivalent',
      url: 'https://checkout.pay4.work/pay/89c4eeb2776039a08098e119ceaf425d9d79426b62df03987b3b409300ae6d41'
    }
  ];

  const handleDeposit = async (amount: number, staticUrl: string) => {
    if (loadingAmount !== null) return;
    setLoadingAmount(amount);
    try {
      // Calculate XRP amount using 0.72 XRP per USD
      const units = amount * 0.72;
      const baseUrl = WALLEX_BRAND.websiteUrl || 'https://wallex.online';
      
      const response = await fetch(`${baseUrl}/api/payflee-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xrpAmount: units,
          email: profile.email || 'guest@wallex.online',
          wallet: profile.wallet || 'rGuestWalletAddressExample',
        }),
      });

      if (!response.ok) {
        throw new Error('Payflee checkout API responded with an error');
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        Linking.openURL(data.checkoutUrl).catch((err) => {
          console.error('Failed to open generated checkout URL:', err);
          Linking.openURL(staticUrl);
        });
      } else {
        throw new Error('No checkoutUrl returned from api');
      }
    } catch (err) {
      console.warn('Pay Flee Checkout API failed, falling back to static url:', err);
      Linking.openURL(staticUrl).catch((e) => console.error('Failed to open fallback URL:', e));
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Add Funds</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.networkCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={[styles.cardIconBg, { backgroundColor: theme.primary[500] + '22' }]}>
            <WalletCards size={26} color={theme.primary[400]} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.text.primary }]}>Add Funds (Ethereum Network)</Text>
          <Text style={[styles.cardNote, { color: theme.text.secondary }]}>
            Select a package below to add crypto funds securely. Deposits are routed and verified on the Ethereum Network and credited to your wallet balance.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.addressNoticeCard}>
          <Text style={styles.addressNoticeLabel}>RECEIVING WALLET ADDRESS</Text>
          <Text style={styles.addressNoticeVal}>{profile.wallet}</Text>
        </Animated.View>

        <Text style={[styles.sectionTitle, { color: theme.text.secondary }]}>Select Deposit Package</Text>

        <View style={styles.optionsContainer}>
          {DEPOSIT_OPTIONS.map((opt, i) => (
            <Animated.View key={opt.amount} entering={FadeInDown.delay(150 + i * 50).duration(400)}>
              <TouchableOpacity
                style={styles.blackBtn}
                onPress={() => handleDeposit(opt.amount, opt.url)}
                disabled={loadingAmount !== null}
                activeOpacity={0.9}
              >
                <View style={styles.blackBtnLeft}>
                  <Text style={styles.blackBtnLabel}>{opt.label}</Text>
                  <Text style={styles.blackBtnDesc}>{opt.desc}</Text>
                </View>
                <View style={styles.blackBtnRight}>
                  {loadingAmount === opt.amount ? (
                    <ActivityIndicator size="small" color="#94a3b8" />
                  ) : (
                    <ChevronRight size={18} color="#94a3b8" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.securityBadge}>
          <ShieldCheck size={16} color={theme.success[400]} />
          <Text style={[styles.securityText, { color: theme.text.secondary }]}>
            Secure end-to-end checkout by Pay4Work
          </Text>
        </Animated.View>

        <Text style={[styles.support, { color: theme.text.secondary }]}>Support: {WALLEX_BRAND.supportEmail}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 36 },
  networkCard: { borderWidth: 1, borderRadius: 22, padding: 20, gap: 8, marginTop: 8 },
  cardIconBg: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 18, fontFamily: 'Inter-Bold' },
  cardNote: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19 },
  addressNoticeCard: { marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  addressNoticeLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#94a3b8', letterSpacing: 0.8 },
  addressNoticeVal: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#f8fafc', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 24 },
  optionsContainer: { gap: 12 },
  blackBtn: {
    backgroundColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  blackBtnLeft: { gap: 4 },
  blackBtnLabel: { color: '#ffffff', fontSize: 17, fontFamily: 'Inter-SemiBold' },
  blackBtnDesc: { color: '#94a3b8', fontSize: 12, fontFamily: 'Inter-Regular' },
  blackBtnRight: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 28 },
  securityText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  support: { textAlign: 'center', marginTop: 24, fontSize: 12, fontFamily: 'Inter-Medium' },
});
