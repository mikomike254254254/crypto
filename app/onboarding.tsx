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
  Modal,
  Linking,
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
import { ArrowRight, Check, Chrome, KeyRound, Mail, Shield, WalletCards } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { CARTOON_AVATARS, POPULAR_MARKETS, WALLEX_BRAND } from '@/constants/brand';
import { createRxpWalletAddress, shortWallet } from '@/lib/wallet';
import { signInWithGoogle, signUpWithEmailPassword } from '@/lib/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(CARTOON_AVATARS[0].uri);
  const [focused, setFocused] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [authNotice, setAuthNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
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
    ? name.trim().length > 0
      && email.trim().length > 0
      && email.includes('@')
      && password.length >= 8
      && password === confirmPassword
    : step === 2
    ? selectedAvatar !== null
    : true;

  const previewWallet = createRxpWalletAddress(email || 'member@wallex.online', name || 'Wallex Member');

  const handleNext = async () => {
    if (step === 2 && selectedAvatar) {
      const wallet = createRxpWalletAddress(email.trim(), name.trim());
      await signUpWithEmailPassword({
        name: name.trim(),
        email: email.trim(),
        password,
        wallet,
        avatarUri: selectedAvatar,
      });
      completeOnboarding(name.trim(), email.trim(), selectedAvatar, password, 'email');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const openSupportEmail = () => {
    Linking.openURL(`mailto:${WALLEX_BRAND.supportEmail}?subject=Wallex%20support`);
  };

  const handleGoogleSignup = async () => {
    setAuthBusy(true);
    setAuthNotice('');
    const result = await signInWithGoogle();
    setAuthBusy(false);
    setAuthNotice(result.message ?? '');
    if (result.mode === 'local') {
      setAuthMode(null);
      setStep(1);
    }
  };

  const bgGradient = theme.isDark
    ? [theme.bg.primary, '#111827'] as [string, string]
    : ['#f8fafc', '#e0f2fe'] as [string, string];

  const tickerItems = ['BTC $68,420', 'ETH $2,650', 'XRP $2.45', 'SOL $148.90', 'BNB $612', 'ADA $0.42', 'RXP KSh 180'];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]}>
      <LinearGradient colors={bgGradient} style={styles.gradient}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {step === 0 && (
              <Animated.View entering={FadeInDown.duration(500)} style={styles.landing}>
                <View style={[styles.topNav, { backgroundColor: '#ffffffdd', borderColor: '#e2e8f0' }]}>
                  <View style={styles.brandRow}>
                    <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.brandLogo} />
                    <Text style={styles.brandName}>wallex</Text>
                  </View>

                  {SCREEN_WIDTH > 760 && (
                    <View style={styles.navLinks}>
                      {['Markets', 'Trade', 'Earn', 'Security'].map((item) => (
                        <Text key={item} style={styles.navLink}>{item}</Text>
                      ))}
                    </View>
                  )}

                  <View style={styles.navActions}>
                    <TouchableOpacity style={styles.loginBtn} onPress={() => setAuthMode('login')}>
                      <Text style={styles.loginBtnText}>Log in</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.openBtn} onPress={() => setAuthMode('signup')}>
                      <Text style={styles.openBtnText}>Open Wallet</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <LinearGradient colors={['#f8fafc', '#e0f2fe']} style={styles.heroSection}>
                  <View style={styles.heroGrid}>
                    <View style={styles.heroCopy}>
                      <Text style={styles.heroTitle}>
                        Your crypto.{'\n'}
                        <Text style={styles.titleAccent}>Simply secure.</Text>
                      </Text>
                      <Text style={styles.heroBody}>
                        Trade, hold, and earn with confidence. Institutional-grade security with a beautiful interface.
                      </Text>

                      <TouchableOpacity style={styles.primaryBtn} onPress={() => setAuthMode('signup')} activeOpacity={0.86}>
                        <Text style={styles.primaryBtnText}>Open Wallet</Text>
                        <ArrowRight size={18} color="#fff" />
                      </TouchableOpacity>

                      <View style={styles.securityBadges}>
                        <View style={styles.securityBadge}>
                          <Shield size={15} color="#10b981" />
                          <Text style={styles.securityBadgeText}>Bank-grade security</Text>
                        </View>
                        <View style={styles.securityBadge}>
                          <Shield size={15} color="#10b981" />
                          <Text style={styles.securityBadgeText}>2FA + MPC</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.phoneWrap}>
                      <Image source={{ uri: WALLEX_BRAND.heroImageUrl }} style={styles.phoneImage} />
                      <View style={styles.priceCard}>
                        <Text style={styles.priceLabel}>XRP PRICE</Text>
                        <Text style={styles.priceValue}>$2.45</Text>
                        <Text style={styles.priceChange}>+2.8%</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>

                <View style={styles.tickerWrap}>
                  <Animated.View style={[styles.tickerTrack, marqueeStyle]}>
                    {[...tickerItems, ...tickerItems, ...tickerItems].map((coin, index) => (
                      <Text key={`${coin}-${index}`} style={styles.tickerText}>{coin}</Text>
                    ))}
                  </Animated.View>
                </View>

                <View style={styles.featuresSection}>
                  {[
                    ['Lightning Fast', 'Instant Wallex RXP transfers and trading workflows.'],
                    ['Institutional Security', 'KYC-ready controls, admin review, and wallet monitoring.'],
                    ['Earn Rewards', 'Admin can reward users with internal RXP balances.'],
                  ].map(([title, body]) => (
                    <View key={title} style={styles.featureCard}>
                      <View style={styles.featureIcon}>
                        <WalletCards size={24} color="#0284c7" />
                      </View>
                      <Text style={styles.featureTitle}>{title}</Text>
                      <Text style={styles.featureBody}>{body}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.finalCta}>
                  <Text style={styles.finalTitle}>Start trading securely today</Text>
                  <TouchableOpacity style={styles.finalButton} onPress={() => setAuthMode('signup')}>
                    <Text style={styles.finalButtonText}>Open Wallet - It's Free</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openSupportEmail}>
                    <Text style={styles.finalSupport}>{WALLEX_BRAND.supportEmail}</Text>
                  </TouchableOpacity>
                </View>

                <Animated.View style={[styles.landingFooter, footerStyle]}>
                  <View style={styles.brandRow}>
                    <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.footerLogo} />
                    <Text style={styles.footerBrand}>wallex</Text>
                  </View>
                  <TouchableOpacity onPress={openSupportEmail}>
                    <Text style={styles.footerText}>
                      (c) 2026 Wallex. All rights reserved. Support: {WALLEX_BRAND.supportEmail}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            {step === 1 && (
              <Animated.View entering={FadeInDown.duration(400)} style={styles.formContainer}>
                <Text style={[styles.stepTitle, { color: theme.text.primary }]}>Create your Wallex profile</Text>
                <Text style={[styles.stepSub, { color: theme.text.secondary }]}>Set your login, password, and internal RXP wallet identity.</Text>

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
                  <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Email Login</Text>
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

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: focused === 'password' ? theme.accent[500] : theme.bg.border },
                    ]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={theme.text.muted}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.text.secondary }]}>Confirm Password</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: focused === 'confirmPassword' ? theme.accent[500] : theme.bg.border },
                    ]}
                    placeholder="Repeat password"
                    placeholderTextColor={theme.text.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocused('confirmPassword')}
                    onBlur={() => setFocused(null)}
                    secureTextEntry
                  />
                </View>

                <View style={[styles.walletPreview, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                  <View style={styles.walletPreviewHeader}>
                    <WalletCards size={18} color={theme.accent[400]} />
                    <Text style={[styles.walletPreviewTitle, { color: theme.text.primary }]}>Your RXP wallet address</Text>
                  </View>
                  <Text style={[styles.walletPreviewAddress, { color: theme.text.primary }]}>{shortWallet(previewWallet, 18, 7)}</Text>
                  <Text style={[styles.walletPreviewBody, { color: theme.text.secondary }]}>
                    New accounts start with zero external coins and receive a ${WALLEX_BRAND.signupBonusUsd} welcome bonus in RXP activity.
                  </Text>
                </View>

                {password && password.length < 8 && (
                  <Text style={[styles.validationText, { color: theme.error[400] }]}>Password must be at least 8 characters.</Text>
                )}
                {confirmPassword && password !== confirmPassword && (
                  <Text style={[styles.validationText, { color: theme.error[400] }]}>Passwords do not match yet.</Text>
                )}
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
                  onPress={() => void handleNext()}
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

      <Modal visible={authMode !== null} transparent animationType="fade" onRequestClose={() => setAuthMode(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.authModal}>
            <Text style={styles.authTitle}>{authMode === 'login' ? 'Log in' : 'Create account'}</Text>
            <TextInput
              style={styles.authInput}
              placeholder={authMode === 'login' ? 'Email or wallet' : 'Email address'}
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {authMode === 'login' && (
              <TextInput
                style={styles.authInput}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
              />
            )}
            <TouchableOpacity
              style={styles.authSubmit}
              onPress={() => {
                setAuthMode(null);
                setStep(1);
              }}
            >
              <Text style={styles.authSubmitText}>{authMode === 'login' ? 'Log in' : 'Open Wallet'}</Text>
            </TouchableOpacity>
            {authMode === 'signup' && (
              <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignup} disabled={authBusy}>
                <Chrome size={16} color="#0f172a" />
                <Text style={styles.googleButtonText}>{authBusy ? 'Opening Google...' : 'Continue with Google'}</Text>
              </TouchableOpacity>
            )}
            {authMode === 'signup' && (
              <View style={styles.authHint}>
                <KeyRound size={14} color="#64748b" />
                <Text style={styles.authHintText}>After Google signup you can set or change your password from security settings.</Text>
              </View>
            )}
            {authNotice ? (
              <View style={styles.authHint}>
                <Mail size={14} color="#0284c7" />
                <Text style={[styles.authHintText, { color: '#0284c7' }]}>{authNotice}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.authClose} onPress={() => setAuthMode(null)}>
              <Text style={styles.authCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  gradient: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, justifyContent: 'flex-start' },
  landing: { gap: 0, paddingBottom: 0, backgroundColor: '#ffffff' },
  topNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 0, paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 36, height: 36, borderRadius: 10 },
  brandName: { fontSize: 29, fontFamily: 'Inter-Bold', letterSpacing: 0, color: '#0f172a' },
  domain: { fontSize: 12, fontFamily: 'Inter-Medium', marginTop: -2 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  navLink: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#475569' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtn: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#ffffff' },
  loginBtnText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#334155' },
  openBtn: { borderRadius: 22, paddingHorizontal: 20, paddingVertical: 11, backgroundColor: '#0f172a' },
  openBtnText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
  adminPill: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  adminPillText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  heroSection: { paddingHorizontal: 22, paddingTop: 42, paddingBottom: 42 },
  heroGrid: { gap: 28 },
  heroCopy: { gap: 18, alignItems: 'flex-start' },
  eyebrow: { fontSize: 12, fontFamily: 'Inter-Bold', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontSize: 56, fontFamily: 'Inter-Bold', lineHeight: 60, letterSpacing: 0, color: '#0f172a' },
  titleAccent: { color: '#0284c7' },
  heroBody: { fontSize: 18, fontFamily: 'Inter-Regular', lineHeight: 28, maxWidth: 520, color: '#475569' },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 16, borderRadius: 28, alignSelf: 'flex-start' },
  primaryBtnText: { color: '#fff', fontSize: 17, fontFamily: 'Inter-SemiBold' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  securityBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 22, marginTop: 8 },
  securityBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  securityBadgeText: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#64748b' },
  phoneWrap: { alignItems: 'center', justifyContent: 'center', position: 'relative', paddingTop: 20 },
  phoneImage: { width: Math.min(320, SCREEN_WIDTH - 80), height: 390, borderRadius: 48, borderWidth: 8, borderColor: '#ffffff' },
  priceCard: { position: 'absolute', top: 0, right: 18, backgroundColor: '#ffffff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  priceLabel: { fontSize: 10, fontFamily: 'Inter-SemiBold', color: '#64748b', textAlign: 'center' },
  priceValue: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#059669', textAlign: 'center', marginTop: 2 },
  priceChange: { fontSize: 12, fontFamily: 'Inter-SemiBold', color: '#10b981', textAlign: 'center', marginTop: 2 },
  heroCard: { borderRadius: 28, borderWidth: 1, padding: 8, position: 'relative', overflow: 'hidden' },
  heroImage: { width: '100%', height: Math.min(360, SCREEN_WIDTH * 0.58), borderRadius: 22 },
  rxpFloat: { position: 'absolute', right: 18, bottom: 18, backgroundColor: '#ffffffee', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 },
  rxpFloatLabel: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#64748b', letterSpacing: 0.7 },
  rxpFloatValue: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#0f172a', marginTop: 2 },
  tickerWrap: { overflow: 'hidden', backgroundColor: '#f8fafc', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0', paddingVertical: 14 },
  tickerTrack: { flexDirection: 'row', gap: 44, width: SCREEN_WIDTH * 4 },
  tickerText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#64748b' },
  featuresSection: { paddingHorizontal: 22, paddingVertical: 42, gap: 14 },
  featureCard: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 24, padding: 24, backgroundColor: '#ffffff', gap: 10 },
  featureIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  featureTitle: { fontSize: 22, fontFamily: 'Inter-Bold', color: '#0f172a' },
  featureBody: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#64748b', lineHeight: 20 },
  finalCta: { backgroundColor: '#0f172a', alignItems: 'center', paddingHorizontal: 22, paddingVertical: 54, gap: 18 },
  finalTitle: { fontSize: 38, fontFamily: 'Inter-Bold', color: '#ffffff', textAlign: 'center', lineHeight: 44 },
  finalButton: { backgroundColor: '#ffffff', borderRadius: 30, paddingHorizontal: 32, paddingVertical: 17 },
  finalButtonText: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#0f172a' },
  finalSupport: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#94a3b8' },
  landingFooter: { backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 22, paddingVertical: 30, gap: 14, alignItems: 'center' },
  footerLogo: { width: 32, height: 32, borderRadius: 9 },
  footerBrand: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#0f172a' },
  marketMarquee: { overflow: 'hidden', borderWidth: 1, borderRadius: 18, paddingVertical: 12 },
  marketTrack: { flexDirection: 'row', gap: 18, width: SCREEN_WIDTH * 4 },
  coinBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  coinIcon: { width: 27, height: 27, borderRadius: 14, opacity: 0.78 },
  trustRow: { gap: 10 },
  trustItem: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 5 },
  trustTitle: { fontSize: 14, fontFamily: 'Inter-Bold' },
  trustBody: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 17 },
  footer: { alignItems: 'center', paddingVertical: 8 },
  footerText: { fontSize: 11, fontFamily: 'Inter-Medium', textAlign: 'center', lineHeight: 17, color: '#64748b' },
  formContainer: { gap: 4, paddingBottom: 40 },
  stepTitle: { fontSize: 28, fontFamily: 'Inter-Bold', marginBottom: 6, letterSpacing: 0 },
  stepSub: { fontSize: 14, fontFamily: 'Inter-Regular', marginBottom: 28, lineHeight: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  input: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16, fontFamily: 'Inter-Regular', borderWidth: 1.5 },
  walletPreview: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 8, marginBottom: 12 },
  walletPreviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletPreviewTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  walletPreviewAddress: { fontSize: 16, fontFamily: 'Inter-Bold', letterSpacing: 0.2 },
  walletPreviewBody: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 18 },
  validationText: { fontSize: 12, fontFamily: 'Inter-SemiBold', marginTop: -4, marginBottom: 10 },
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
  modalOverlay: { flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  authModal: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', gap: 14 },
  authTitle: { fontSize: 28, fontFamily: 'Inter-Bold', color: '#0f172a', marginBottom: 6 },
  authInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, fontFamily: 'Inter-Regular', color: '#0f172a' },
  authSubmit: { backgroundColor: '#0f172a', borderRadius: 18, alignItems: 'center', paddingVertical: 15, marginTop: 4 },
  authSubmitText: { color: '#ffffff', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  googleButton: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, flexDirection: 'row', gap: 8, backgroundColor: '#ffffff' },
  googleButtonText: { color: '#0f172a', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  authHint: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#f8fafc', borderRadius: 14, padding: 11 },
  authHintText: { flex: 1, color: '#64748b', fontSize: 12, fontFamily: 'Inter-Medium', lineHeight: 17 },
  authClose: { alignItems: 'center', paddingVertical: 4 },
  authCloseText: { color: '#64748b', fontSize: 13, fontFamily: 'Inter-SemiBold' },
});
