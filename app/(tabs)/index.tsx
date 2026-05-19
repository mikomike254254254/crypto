import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, CreditCard, Copy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { CRYPTO_ASSETS } from '@/constants/crypto';
import CryptoRow from '@/components/CryptoRow';
import { CARTOON_AVATARS, WALLEX_BRAND } from '@/constants/brand';
import OnboardingScreen from '../onboarding';

const TOTAL_BALANCE = CRYPTO_ASSETS.reduce((sum, a) => sum + a.balance * a.price, 0);
const TOTAL_CHANGE = 1.86;

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUser();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const primaryAsset = CRYPTO_ASSETS[0];
  const shortAddress = `${profile.wallet.slice(0, 12)}...${profile.wallet.slice(-5)}`;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardGradient = theme.isDark
    ? ['#0a0a14', '#060610', '#000000'] as [string, string, string]
    : ['#f2efe9', '#e8e4dc', '#ddd8cf'] as [string, string, string];

  const glowColor1 = theme.isDark ? theme.accent[500] + '14' : theme.accent[500] + '0a';
  const glowColor2 = theme.isDark ? theme.primary[600] + '18' : theme.primary[600] + '0a';

  if (!profile.isOnboarded) {
    return <OnboardingScreen />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent[400]}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.logoImage} />
            <Text style={[styles.appName, { color: theme.text.primary }]}>wallex</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(tabs)/profile')}>
            <Image
              source={{ uri: profile.avatarUri ?? CARTOON_AVATARS[0].uri }}
              style={[styles.avatar, { borderColor: theme.accent[500] }]}
            />
            <View style={[styles.onlineDot, { borderColor: theme.bg.primary }]} />
          </TouchableOpacity>
        </Animated.View>

        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.greetRow}>
          <Text style={[styles.greeting, { color: theme.text.primary }]}>Good morning, {profile.name.split(' ')[0] || 'there'}</Text>
          <Text style={[styles.greetingSub, { color: theme.text.secondary }]}>Here's your portfolio</Text>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(120).duration(500)}>
          <LinearGradient
            colors={cardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.balanceCard, { borderColor: theme.bg.border }]}
          >
            <View style={[styles.glowCircle1, { backgroundColor: glowColor1 }]} />
            <View style={[styles.glowCircle2, { backgroundColor: glowColor2 }]} />

            <View style={styles.balanceTop}>
              <View>
                <Text style={[styles.balanceLabel, { color: theme.text.secondary }]}>Total Portfolio</Text>
                <View style={styles.balanceRow}>
                  <Text style={[styles.balanceAmount, { color: theme.text.primary }]}>
                    {balanceHidden ? '******' : `$${TOTAL_BALANCE.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </Text>
                  <TouchableOpacity onPress={() => setBalanceHidden(!balanceHidden)} style={styles.eyeBtn}>
                    {balanceHidden
                      ? <EyeOff size={18} color={theme.text.secondary} />
                      : <Eye size={18} color={theme.text.secondary} />
                    }
                  </TouchableOpacity>
                </View>
                <View style={styles.changeRow}>
                  <View style={[styles.changePill, { backgroundColor: theme.success[500] + '33' }]}>
                    <Text style={[styles.changeLabel, { color: theme.success[400] }]}>
                      +{TOTAL_CHANGE}% today
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.xrpBadge}>
                <Image source={{ uri: primaryAsset.icon }} style={styles.xrpIcon} />
                <Text style={[styles.xrpLabel, { color: theme.accent[300] }]}>{primaryAsset.symbol}</Text>
              </View>
            </View>

            <View style={[styles.addressRow, { backgroundColor: theme.isDark ? '#ffffff0a' : '#00000008' }]}>
              <Text style={[styles.addressText, { color: theme.text.secondary }]}>{shortAddress}</Text>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                <Copy size={13} color={copied ? theme.accent[400] : theme.text.secondary} />
                <Text style={[styles.copyText, copied && { color: theme.accent[400] }, { color: copied ? theme.accent[400] : theme.text.secondary }]}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/send')} activeOpacity={0.8}>
                <LinearGradient
                  colors={[theme.accent[500], theme.primary[700]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <ArrowUpRight size={20} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/receive')} activeOpacity={0.8}>
                <LinearGradient
                  colors={[theme.primary[600], theme.primary[900]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <ArrowDownLeft size={20} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/buy')} activeOpacity={0.8}>
                <View style={[styles.actionGradient2, { backgroundColor: theme.bg.border }]}>
                  <CreditCard size={20} color={theme.text.secondary} strokeWidth={2} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text.secondary }]}>Buy</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* RXP spotlight */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.spotlight, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.spotlightLeft}>
            <Text style={[styles.spotlightLabel, { color: theme.text.muted }]}>RXP Balance</Text>
            <Text style={[styles.spotlightAmount, { color: theme.text.primary }]}>
              {balanceHidden ? '******' : `${primaryAsset.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} RXP`}
            </Text>
            <Text style={[styles.spotlightUsd, { color: theme.text.secondary }]}>
              {balanceHidden ? '***' : `~ $${(primaryAsset.balance * primaryAsset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </Text>
          </View>
          <View style={styles.spotlightRight}>
            <Text style={[styles.spotlightPrice, { color: theme.text.primary }]}>${primaryAsset.price.toFixed(4)}</Text>
            <View style={[styles.changePill, { backgroundColor: theme.success[500] + '22' }]}>
              <Text style={[styles.changeLabel, { color: theme.success[400] }]}>+{primaryAsset.change24h}%</Text>
            </View>
          </View>
        </Animated.View>

        {/* Asset List */}
        <Animated.View entering={FadeInUp.delay(280).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Your Assets</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/assets')}>
              <Text style={[styles.seeAll, { color: theme.accent[400] }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {CRYPTO_ASSETS.slice(0, 5).map((asset) => (
            <CryptoRow key={asset.id} asset={asset} />
          ))}
        </Animated.View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoImage: { width: 34, height: 34, borderRadius: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoMarkText: { fontSize: 18, fontFamily: 'Inter-Bold', color: '#fff' },
  appName: { fontSize: 22, fontFamily: 'Inter-Bold', letterSpacing: 0.5 },
  profileBtn: { position: 'relative' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2 },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#4dcb8b', borderWidth: 2 },
  greetRow: { marginBottom: 16 },
  greeting: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  greetingSub: { fontSize: 13, fontFamily: 'Inter-Regular', marginTop: 2 },
  balanceCard: { borderRadius: 24, padding: 22, marginBottom: 12, overflow: 'hidden', borderWidth: 1 },
  glowCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: -60, right: -40 },
  glowCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, bottom: -50, left: -20 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  balanceLabel: { fontSize: 12, fontFamily: 'Inter-Regular', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceAmount: { fontSize: 32, fontFamily: 'Inter-Bold', letterSpacing: -0.5 },
  eyeBtn: { padding: 4 },
  changeRow: { marginTop: 8 },
  changePill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  changeLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  xrpBadge: { alignItems: 'center', gap: 4 },
  xrpIcon: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#1ed4d444' },
  xrpLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold', letterSpacing: 1 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addressText: { flex: 1, fontSize: 12, fontFamily: 'Inter-Regular', letterSpacing: 0.5 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  actionRow: { flexDirection: 'row', gap: 16 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionGradient: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionGradient2: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontFamily: 'Inter-Medium' },
  spotlight: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  spotlightLeft: { gap: 3 },
  spotlightLabel: { fontSize: 11, fontFamily: 'Inter-Regular', textTransform: 'uppercase', letterSpacing: 0.8 },
  spotlightAmount: { fontSize: 20, fontFamily: 'Inter-Bold' },
  spotlightUsd: { fontSize: 13, fontFamily: 'Inter-Regular' },
  spotlightRight: { alignItems: 'flex-end', gap: 8 },
  spotlightPrice: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter-SemiBold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter-Medium' },
  bottomPad: { height: 120 },
});
