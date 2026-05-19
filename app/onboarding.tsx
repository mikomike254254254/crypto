import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Check, Shield, WalletCards } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { CARTOON_AVATARS, POPULAR_MARKETS, WALLEX_BRAND } from '@/constants/brand';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(CARTOON_AVATARS[0].uri);
  const [focused, setFocused] = useState<string | null>(null);
  const marquee = useSharedValue(0);
  const footerOpacity = useSharedValue(0.82);

  useEffect(() => {
    marquee.value = withRepeat(withTiming(-SCREEN_WIDTH, { duration: 28000 }), -1, false);
    footerOpacity.value = withRepeat(withTiming(1, { duration: 1600 }), -1, true);
  }, []);

  const marqueeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: marquee.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const canProceed = step === 0
    ? true
    : step === 1
    ? name.trim().length > 0 && email.trim().length > 0 && email.includes('@')
    : step === 2
    ? selectedAvatar !== null
    : true;

  const handleNext = () => {
    if (step === 2 && selectedAvatar) {
      completeOnboarding(name.trim(), email.trim(), selectedAvatar);
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const bgGradient = theme.isDark
    ? [theme.bg.primary, '#111827'] as [string, string]
    : ['#f8fafc', '#e0f2fe'] as [string, string];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <LinearGradient colors={bgGradient} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {step === 0 && (
              <Animated.View entering={FadeInDown.duration(500)} style={styles.landing}>
                <View style={styles.nav}>
                  <View style={styles.brandRow}>
                    <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.brandLogo} />
                    <View>
                      <Text style={[styles.brandName, { color: theme.text.primary }]}>wallex</Text>
                      <Text style={[styles.domain, { color: theme.text.secondary }]}>{WALLEX_BRAND.siteName}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.adminPill, { borderColor: theme.bg.border, backgroundColor: theme.bg.card }]} onPress={() => router.push('/admin')}>
                    <Text style={[styles.adminPillText, { color: theme.text.secondary }]}>Admin</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.heroGrid}>
                  <View style={styles.heroCopy}>
                    <Text style={[styles.eyebrow, { color: theme.accent[500] }]}>Crypto wallet for Africa, Asia, Europe, and the USA</Text>
                    <Text style={[styles.heroTitle, { color: theme.text.primary }]}>Your crypto. Simply secure.</Text>
                    <Text style={[styles.heroBody, { color: theme.text.secondary }]}>
                      Trade, hold, reward, verify KYC, and transfer RXP with a cleaner Wallex wallet experience.
                    </Text>

                    <View style={styles.heroActions}>
                      <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep(1)} activeOpacity={0.86}>
                        <Text style={styles.primaryBtnText}>Open Wallet</Text>
                        <ArrowRight size={18} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.bg.border, backgroundColor: theme.bg.card }]} onPress={() => router.push('/admin')} activeOpacity={0.82}>
                        <Shield size={17} color={theme.text.secondary} />
                        <Text style={[styles.secondaryBtnText, { color: theme.text.secondary }]}>Admin Panel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.heroCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                    <Image source={{ uri: WALLEX_BRAND.heroImageUrl }} style={styles.heroImage} />
                    <View style={styles.rxpFloat}>
                      <Text style={styles.rxpFloatLabel}>RXP RATE</Text>
                      <Text style={styles.rxpFloatValue}>KSh {WALLEX_BRAND.rxpRateKes}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.marketMarquee, { borderColor: theme.bg.border, backgroundColor: theme.bg.card }]}>
                  <Animated.View style={[styles.marketTrack, marqueeStyle]}>
                    {[...POPULAR_MARKETS, ...POPULAR_MARKETS, ...POPULAR_MARKETS].map((coin, index) => (
                      <View key={`${coin.symbol}-${index}`} style={[styles.coinBadge, { backgroundColor: theme.isDark ? '#ffffff10' : '#f1f5f9' }]}>
                        <Image source={{ uri: coin.icon }} style={styles.coinIcon} />
                      </View>
                    ))}
                  </Animated.View>
                </View>

                <View style={styles.trustRow}>
                  {[
                    ['Bank-grade security', '2FA and KYC-ready flows'],
                    ['Live market data', 'FreeCryptoAPI-ready monitoring'],
                    ['Support desk', WALLEX_BRAND.supportEmail],
                  ].map(([title, body]) => (
                    <View key={title} style={[styles.trustItem, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                      <WalletCards size={18} color={theme.accent[500]} />
                      <Text style={[styles.trustTitle, { color: theme.text.primary }]}>{title}</Text>
                      <Text style={[styles.trustBody, { color: theme.text.secondary }]}>{body}</Text>
                    </View>
                  ))}
                </View>

                <Animated.View style={[styles.footer, footerStyle]}>
                  <Text style={[styles.footerText, { color: theme.text.secondary }]}>
                    Wallex.online | Markets | Wallet | KYC | Rewards | {WALLEX_BRAND.supportEmail}
                  </Text>
                </Animated.View>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.formContainer}>
                <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Create your Wallex profile</Text>
                <Text style={[styles.stepSub, { color: theme.text.secondary }]}>This demo profile becomes your RXP wallet identity.</Text>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Full Name</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: focused === 'name' ? theme.accent[500] : theme.bg.border },
                    ]}
                    placeholder="e.g. Alex Johnson"
                    placeholderTextColor={theme.text.muted}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Support Email Login</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: focused === 'email' ? theme.accent[500] : theme.bg.border },
                    ]}
                    placeholder="you@email.com"
                    placeholderTextColor={theme.text.muted}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.avatarContainer}>
                <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Choose a cartoon profile</Text>
                <Text style={[styles.stepSub, { color: theme.text.secondary }]}>No real human photos. Pick a female, male, or alternate Wallex character.</Text>

                {selectedAvatar && (
                  <Animated.View entering={FadeInUp.duration(300)} style={styles.selectedPreview}>
                    <Image source={{ uri: selectedAvatar }} style={[styles.selectedAvatar, { borderColor: theme.accent[500] }]} />
                    <Text style={[styles.selectedName, { color: theme.text.primary }]}>{name}</Text>
                  </Animated.View>
                )}

                <View style={styles.avatarGrid}>
                  {CARTOON_AVATARS.map((avatar, index) => {
                    const isSelected = selectedAvatar === avatar.uri;
                    return (
                      <Animated.View key={avatar.id} entering={FadeInDown.delay(60 + index * 50).duration(350)}>
                        <TouchableOpacity
                          style={[
                            styles.avatarOption,
                            { borderColor: isSelected ? theme.accent[500] : theme.bg.border, backgroundColor: theme.bg.card },
                          ]}
                          onPress={() => setSelectedAvatar(avatar.uri)}
                          activeOpacity={0.7}
                        >
                          <Image source={{ uri: avatar.uri }} style={styles.avatarThumb} />
                          {isSelected && (
                            <View style={[styles.avatarCheck, { backgroundColor: theme.accent[500] }]}>
                              <Check size={12} color="#fff" strokeWidth={3} />
                            </View>
                          )}
                          <Text style={[styles.avatarLabel, { color: isSelected ? theme.accent[400] : theme.text.secondary }]}>{avatar.label}</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {step === 3 && (
              <Animated.View entering={FadeInDown.duration(500)} style={styles.doneContainer}>
                <View style={[styles.doneCircle, { backgroundColor: theme.success[500] + '22' }]}>
                  <Check size={48} color={theme.success[400]} strokeWidth={2.5} />
                </View>
                <Text style={[styles.doneTitle, { color: theme.text.primary }]}>You are all set, {name.split(' ')[0]}.</Text>
                <Text style={[styles.doneSub, { color: theme.text.secondary }]}>
                  Your Wallex account is ready for RXP transfers, rewards, and KYC.
                </Text>
              </Animated.View>
            )}

            {step > 0 && (
              <View style={styles.navArea}>
                {step < 3 && (
                  <TouchableOpacity onPress={() => setStep(step - 1)} style={styles.backTextBtn}>
                    <Text style={[styles.backText, { color: theme.text.secondary }]}>Back</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.dots}>
                  {[0, 1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.dot,
                        { backgroundColor: s === step ? theme.accent[500] : s < step ? theme.accent[500] + '66' : theme.bg.border },
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.nextBtn, !canProceed && { opacity: 0.4 }]}
                  onPress={handleNext}
                  disabled={!canProceed}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={canProceed ? [theme.accent[500], theme.primary[700]] : [theme.bg.border, theme.bg.border]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.nextBtnGradient}
                  >
                    <Text style={styles.nextBtnText}>{step === 2 ? 'Complete Wallet' : step === 3 ? 'Enter Wallex' : 'Continue'}</Text>
                    {step < 3 && <ArrowRight size={18} color="#fff" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  gradient: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, justifyContent: 'flex-start' },
  landing: { gap: 20, paddingBottom: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 44, height: 44, borderRadius: 12 },
  brandName: { fontSize: 29, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  domain: { fontSize: 12, fontFamily: 'Inter-Medium', marginTop: -2 },
  adminPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  adminPillText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  heroGrid: { gap: 22 },
  heroCopy: { gap: 14 },
  eyebrow: { fontSize: 12, fontFamily: 'Inter-Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontSize: 48, fontFamily: 'Inter-Bold', lineHeight: 52, letterSpacing: 0 },
  heroBody: { fontSize: 16, fontFamily: 'Inter-Regular', lineHeight: 24, maxWidth: 560 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0f172a', paddingHorizontal: 22, paddingVertical: 15, borderRadius: 18 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  heroCard: { borderRadius: 28, borderWidth: 1, padding: 8, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: Math.min(360, SCREEN_WIDTH * 0.58), borderRadius: 22 },
  rxpFloat: { position: 'absolute', right: 18, bottom: 18, backgroundColor: '#ffffffee', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  rxpFloatLabel: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#64748b', letterSpacing: 0.7 },
  rxpFloatValue: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#0f172a', marginTop: 2 },
  marketMarquee: { overflow: 'hidden', borderWidth: 1, borderRadius: 18, paddingVertical: 12 },
  marketTrack: { flexDirection: 'row', gap: 18, width: SCREEN_WIDTH * 4 },
  coinBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  coinIcon: { width: 27, height: 27, borderRadius: 14, opacity: 0.78 },
  trustRow: { gap: 10 },
  trustItem: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 5 },
  trustTitle: { fontSize: 14, fontFamily: 'Inter-Bold' },
  trustBody: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 17 },
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: { fontSize: 11, fontFamily: 'Inter-Medium', textAlign: 'center', lineHeight: 17 },
  formContainer: { gap: 4, paddingBottom: 40 },
  stepTitle: { fontSize: 28, fontFamily: 'Inter-Bold', marginBottom: 6, letterSpacing: 0 },
  stepSub: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 28, lineHeight: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, fontFamily: 'Inter-Regular', borderWidth: 1.5 },
  avatarContainer: { paddingBottom: 40 },
  selectedPreview: { alignItems: 'center', marginBottom: 24, gap: 8 },
  selectedAvatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3 },
  selectedName: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  avatarOption: { width: (SCREEN_WIDTH - 76) / 2, alignItems: 'center', borderRadius: 18, paddingVertical: 16, borderWidth: 2, gap: 8, position: 'relative' },
  avatarThumb: { width: 68, height: 68, borderRadius: 34 },
  avatarCheck: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarLabel: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  doneContainer: { alignItems: 'center', justifyContent: 'center', gap: 14, paddingBottom: 40, minHeight: 420 },
  doneCircle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  doneTitle: { fontSize: 27, fontFamily: 'Inter-Bold', textAlign: 'center', letterSpacing: 0 },
  doneSub: { fontSize: 15, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 22, maxWidth: 310 },
  navArea: { alignItems: 'center', gap: 18, paddingBottom: 24 },
  backTextBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  backText: { fontSize: 14, fontFamily: 'Inter-Medium' },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nextBtn: { width: '100%', borderRadius: 18, overflow: 'hidden' },
  nextBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  nextBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter-SemiBold' },
});
