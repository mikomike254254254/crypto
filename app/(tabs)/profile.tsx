import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  FlatList,
  Dimensions,
  TextInput,
  Linking,
  Clipboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Shield, Bell, ChevronRight, Lock, Circle as HelpCircle, FileText, LogOut, BadgeCheck, User, Settings, Sun, Moon, Check, Camera, Clock, CircleAlert as AlertCircle, X, Upload } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { AppTheme } from '@/constants/colors';
import { CARTOON_AVATARS, WALLEX_BRAND } from '@/constants/brand';
import { updateSupabasePassword } from '@/lib/auth';

const PROFILE_PICTURES = CARTOON_AVATARS;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { profile, setProfile, setSecurity, signOut } = useUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const kycStatus = profile.kycStatus;
  const kycConfig = {
    unverified: { label: 'Not Verified', colorKey: 'error' as const, icon: <AlertCircle size={14} />, desc: 'Complete KYC to unlock higher limits', action: 'Start Verification' },
    pending: { label: 'Under Review', colorKey: 'warning' as const, icon: <Clock size={14} />, desc: 'Your documents are being reviewed', action: 'View Status' },
    verified: { label: 'Verified', colorKey: 'success' as const, icon: <BadgeCheck size={14} />, desc: 'Full access unlocked', action: '' },
    rejected: { label: 'Needs Update', colorKey: 'error' as const, icon: <AlertCircle size={14} />, desc: 'Update and resubmit your verification', action: 'Resubmit' },
  };
  const kyc = kycConfig[kycStatus];
  const kycColor = theme[kyc.colorKey];

  const copyToClipboard = (text: string) => {
    if (Platform.OS === 'web') {
      if (navigator?.clipboard) {
        navigator.clipboard.writeText(text);
        alert('Referral link copied!');
        return;
      }
    }
    Clipboard.setString(text);
    alert('Referral link copied!');
  };

  const avatarUri = profile.avatarUri ?? CARTOON_AVATARS[0].uri;
  const openSupportEmail = async () => {
    const mailto = `mailto:${WALLEX_BRAND.supportEmail}?subject=Wallex%20support`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (canOpen) {
      Linking.openURL(mailto);
      return;
    }
    Linking.openURL(`https://mail.google.com/mail/?view=cm&fs=1&to=${WALLEX_BRAND.supportEmail}`);
  };

  const saveWalletPin = () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setPinError('Use a 4 to 6 digit PIN.');
      return;
    }
    if (pin !== pinConfirm) {
      setPinError('PIN confirmation does not match.');
      return;
    }
    setSecurity({ pinEnabled: true, pinSetAt: new Date() });
    setPin('');
    setPinConfirm('');
    setPinError('');
    setPinModalVisible(false);
  };

  const savePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    const res = await updateSupabasePassword(newPassword);
    if (!res.ok) {
      setPasswordError(res.message ?? 'Failed to update password.');
    } else {
      setPasswordSuccess('Password updated successfully!');
      setTimeout(() => {
        setPasswordModalVisible(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setPasswordSuccess('');
      }, 1500);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Profile</Text>

        {/* ── User Card ── */}
        <View style={[styles.userCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => setAvatarModalVisible(true)} activeOpacity={0.8}>
            <Image source={{ uri: avatarUri }} style={[styles.avatar, { borderColor: theme.accent[500] }]} />
            <View style={[styles.editAvatarBtn, { backgroundColor: theme.accent[500], borderColor: theme.bg.card }]}>
              <Camera size={11} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text.primary }]}>{profile.name || 'Set up profile'}</Text>
            <Text style={[styles.userEmail, { color: theme.text.secondary }]}>{profile.email || 'No email set'}</Text>
            <Text style={[styles.userEmail, { color: theme.text.secondary }]}>{profile.wallet}</Text>
            <View style={[styles.kycBadge, { backgroundColor: kycColor[500] + '22' }]}>
              {kyc.icon}
              <Text style={[styles.kycBadgeText, { color: kycColor[400] }]}>{kyc.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Referral Card ── */}
        <View style={[styles.referralCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.referralHeader}>
            <View style={[styles.referralIcon, { backgroundColor: theme.accent[500] + '18' }]}>
              <User size={20} color={theme.accent[400]} />
            </View>
            <View style={styles.referralInfo}>
              <Text style={[styles.referralTitle, { color: theme.text.primary }]}>Refer & Earn Crypto</Text>
              <Text style={[styles.referralDesc, { color: theme.text.secondary }]}>
                Get 10 XRP for every friend who joins. They also get a 10.79 XRP ($15) welcome bonus!
              </Text>
            </View>
          </View>
          
          <View style={[styles.linkWrapper, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}>
            <Text style={[styles.linkText, { color: theme.text.primary }]} numberOfLines={1}>
              {`${WALLEX_BRAND.websiteUrl}/signup?ref=${profile.wallet}`}
            </Text>
            <TouchableOpacity 
              style={[styles.copyBtn, { backgroundColor: theme.accent[500] }]}
              onPress={() => copyToClipboard(`${WALLEX_BRAND.websiteUrl}/signup?ref=${profile.wallet}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── KYC Status Card ── */}
        <View style={[styles.kycStatusCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.kycStatusHeader}>
            <View style={[styles.kycStatusIcon, { backgroundColor: kycColor[500] + '22' }]}>
              {kycStatus === 'verified' ? (
                <BadgeCheck size={22} color={kycColor[400]} />
              ) : kycStatus === 'pending' ? (
                <Clock size={22} color={kycColor[400]} />
              ) : (
                <Shield size={22} color={kycColor[400]} />
              )}
            </View>
            <View style={styles.kycStatusInfo}>
              <Text style={[styles.kycStatusTitle, { color: theme.text.primary }]}>Identity Verification</Text>
              <Text style={[styles.kycStatusDesc, { color: theme.text.secondary }]}>{kyc.desc}</Text>
            </View>
          </View>

          {/* Progress bar for KYC */}
          {kycStatus !== 'verified' && (
            <View style={styles.kycProgressSection}>
              <View style={[styles.kycProgressBar, { backgroundColor: theme.bg.border }]}>
                <View style={[
                  styles.kycProgressFill,
                  {
                    backgroundColor: kycStatus === 'pending' ? theme.warning[500] : theme.accent[500],
                    width: kycStatus === 'pending' ? '66%' : '0%',
                  },
                ]} />
              </View>
              <View style={styles.kycStepsRow}>
                {['Personal Info', 'Documents', 'Review'].map((s, i) => {
                  const isDone = kycStatus === 'pending' ? i < 2 : false;
                  const isCurrent = kycStatus === 'pending' && i === 2;
                  return (
                    <View key={s} style={styles.kycStepItem}>
                      <View style={[styles.kycStepDot, isDone && { backgroundColor: theme.warning[500] }, isCurrent && { backgroundColor: theme.accent[500] }, !isDone && !isCurrent && { backgroundColor: theme.bg.border }]}>
                        {isDone && <Check size={8} color="#fff" />}
                      </View>
                      <Text style={[styles.kycStepLabel, { color: isDone || isCurrent ? theme.text.primary : theme.text.muted }]}>{s}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {kycStatus === 'verified' && (
            <View style={[styles.verifiedBanner, { backgroundColor: theme.success[500] + '11', borderColor: theme.success[500] + '33' }]}>
              <Check size={16} color={theme.success[400]} />
              <Text style={[styles.verifiedText, { color: theme.success[400] }]}>All verification steps completed</Text>
            </View>
          )}

          {kycStatus === 'pending' && (
            <View style={[styles.pendingBanner, { backgroundColor: theme.warning[500] + '11', borderColor: theme.warning[500] + '33' }]}>
              <Clock size={16} color={theme.warning[400]} />
              <Text style={[styles.pendingText, { color: theme.warning[400] }]}>Usually takes 1-3 business days</Text>
            </View>
          )}

          {(kycStatus === 'unverified' || kycStatus === 'rejected') && (
            <TouchableOpacity
              style={[styles.kycActionBtn, { backgroundColor: theme.accent[500] }]}
              onPress={() => router.push('/kyc')}
              activeOpacity={0.8}
            >
              <Shield size={16} color="#fff" />
              <Text style={styles.kycActionBtnText}>{kyc.action}</Text>
            </TouchableOpacity>
          )}

          {kycStatus === 'pending' && (
            <TouchableOpacity
              style={[styles.kycActionBtn, { backgroundColor: theme.warning[500] + '22', borderColor: theme.warning[500] + '44', borderWidth: 1 }]}
              onPress={() => router.push('/kyc')}
              activeOpacity={0.8}
            >
              <Clock size={16} color={theme.warning[400]} />
              <Text style={[styles.kycActionBtnText, { color: theme.warning[400] }]}>View Status</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Appearance ── */}
        <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Appearance</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIconWrap, { backgroundColor: theme.accent[500] + '22' }]}>
              {isDark ? <Moon size={18} color={theme.accent[400]} /> : <Sun size={18} color={theme.accent[400]} />}
            </View>
            <View style={styles.themeInfo}>
              <Text style={[styles.menuLabel, { color: theme.text.primary }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={[styles.themeSub, { color: theme.text.secondary }]}>{isDark ? 'Switch to settled light' : 'Switch to dark mode'}</Text>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.bg.border, true: theme.accent[600] }} thumbColor={isDark ? theme.accent[400] : theme.text.muted} />
          </View>
        </View>

        {/* ── Security ── */}
        <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Security</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <MenuRow icon={<Lock size={18} color={theme.primary[400]} />} iconBg={theme.primary[500] + '22'} label={profile.security.pinEnabled ? 'Change Wallet PIN' : 'Set Wallet PIN'} theme={theme} onPress={() => setPinModalVisible(true)} />
          <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
          <MenuRow icon={<Lock size={18} color={theme.accent[400]} />} iconBg={theme.accent[500] + '22'} label="Change Password" theme={theme} onPress={() => setPasswordModalVisible(true)} />
          <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
          <View style={styles.menuRow}>
            <View style={[styles.menuIconWrap, { backgroundColor: theme.success[500] + '22' }]}><Shield size={18} color={theme.success[400]} /></View>
            <View style={styles.themeInfo}>
              <Text style={[styles.menuLabel, { color: theme.text.primary }]}>Two-Factor Auth</Text>
              <Text style={[styles.themeSub, { color: theme.text.secondary }]}>{profile.security.twoFactorEnabled ? 'Enabled for wallet actions' : 'Tap to protect wallet actions'}</Text>
            </View>
            <Switch value={profile.security.twoFactorEnabled} onValueChange={(value) => setSecurity({ twoFactorEnabled: value })} trackColor={{ false: theme.bg.border, true: theme.accent[600] }} thumbColor={profile.security.twoFactorEnabled ? theme.accent[400] : theme.text.muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
          <View style={styles.menuRow}>
            <View style={[styles.menuIconWrap, { backgroundColor: theme.warning[500] + '22' }]}><User size={18} color={theme.warning[400]} /></View>
            <View style={styles.themeInfo}>
              <Text style={[styles.menuLabel, { color: theme.text.primary }]}>Biometric Login</Text>
              <Text style={[styles.themeSub, { color: theme.text.secondary }]}>{profile.security.biometricEnabled ? 'Enabled on this device' : 'Local device setting'}</Text>
            </View>
            <Switch value={profile.security.biometricEnabled} onValueChange={(value) => setSecurity({ biometricEnabled: value })} trackColor={{ false: theme.bg.border, true: theme.accent[600] }} thumbColor={profile.security.biometricEnabled ? theme.accent[400] : theme.text.muted} />
          </View>
        </View>

        {/* ── Preferences ── */}
        <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Preferences</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.menuRow}>
            <View style={[styles.menuIconWrap, { backgroundColor: theme.accent[500] + '22' }]}><Bell size={18} color={theme.accent[400]} /></View>
            <Text style={[styles.menuLabel, { color: theme.text.primary }]}>Push Notifications</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} trackColor={{ false: theme.bg.border, true: theme.accent[600] }} thumbColor={notificationsEnabled ? theme.accent[400] : theme.text.muted} />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
          <MenuRow icon={<Settings size={18} color={theme.text.secondary} />} iconBg={theme.bg.border} label="App Settings" theme={theme} onPress={() => {}} />
        </View>

        {/* ── Support ── */}
        <Text style={[styles.sectionLabel, { color: theme.text.muted }]}>Support</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <MenuRow icon={<HelpCircle size={18} color={theme.primary[400]} />} iconBg={theme.primary[500] + '22'} label={`Email ${WALLEX_BRAND.supportEmail}`} theme={theme} onPress={openSupportEmail} />
          <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
          <MenuRow icon={<FileText size={18} color={theme.text.secondary} />} iconBg={theme.bg.border} label="Terms & Privacy" theme={theme} onPress={() => {}} />
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.error[500] + '18', borderColor: theme.error[500] + '44' }]}
          activeOpacity={0.8}
          onPress={() => void signOut()}
        >
          <LogOut size={18} color={theme.error[400]} />
          <Text style={[styles.logoutText, { color: theme.error[400] }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Avatar Picker Modal ── */}
      <Modal visible={pinModalVisible} transparent animationType="fade" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.pinOverlay}>
          <View style={[styles.pinCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <Text style={[styles.pinTitle, { color: theme.text.primary }]}>Set Wallet PIN</Text>
            <Text style={[styles.pinSub, { color: theme.text.secondary }]}>Use this PIN for future wallet access and send confirmations.</Text>
            <TextInput
              style={[styles.pinInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}
              placeholder="4-6 digit PIN"
              placeholderTextColor={theme.text.muted}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            <TextInput
              style={[styles.pinInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}
              placeholder="Confirm PIN"
              placeholderTextColor={theme.text.muted}
              value={pinConfirm}
              onChangeText={setPinConfirm}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
            {pinError ? <Text style={[styles.pinError, { color: theme.error[400] }]}>{pinError}</Text> : null}
            <TouchableOpacity style={[styles.pinSave, { backgroundColor: theme.accent[500] }]} onPress={saveWalletPin}>
              <Text style={styles.pinSaveText}>Save PIN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinCancel} onPress={() => setPinModalVisible(false)}>
              <Text style={[styles.pinCancelText, { color: theme.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={passwordModalVisible} transparent animationType="fade" onRequestClose={() => setPasswordModalVisible(false)}>
        <View style={styles.pinOverlay}>
          <View style={[styles.pinCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <Text style={[styles.pinTitle, { color: theme.text.primary }]}>Change Password</Text>
            <Text style={[styles.pinSub, { color: theme.text.secondary }]}>Update your account password for secure web and mobile logins.</Text>
            <TextInput
              style={[styles.pinInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}
              placeholder="New Password (Min 8 characters)"
              placeholderTextColor={theme.text.muted}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={[styles.pinInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}
              placeholder="Confirm New Password"
              placeholderTextColor={theme.text.muted}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
            />
            {passwordError ? <Text style={[styles.pinError, { color: theme.error[400] }]}>{passwordError}</Text> : null}
            {passwordSuccess ? <Text style={{ color: theme.success[400], fontSize: 13, fontFamily: 'Inter-SemiBold', textAlign: 'center' }}>{passwordSuccess}</Text> : null}
            
            <TouchableOpacity style={[styles.pinSave, { backgroundColor: theme.accent[500] }]} onPress={savePassword}>
              <Text style={styles.pinSaveText}>Save Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinCancel} onPress={() => setPasswordModalVisible(false)}>
              <Text style={[styles.pinCancelText, { color: theme.text.secondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={avatarModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAvatarModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: theme.bg.primary }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={styles.modalCloseBtn}>
              <X size={22} color={theme.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Choose Profile Picture</Text>
            <View style={{ width: 40 }} />
          </View>

          {profile.avatarUri && (
            <View style={styles.modalCurrentAvatar}>
              <Text style={[styles.modalCurrentLabel, { color: theme.text.secondary }]}>Current</Text>
              <Image source={{ uri: profile.avatarUri }} style={[styles.modalCurrentImg, { borderColor: theme.accent[500] }]} />
            </View>
          )}

          <View style={[styles.uploadBox, { borderColor: theme.bg.border, backgroundColor: theme.bg.card }]}>
            <View style={styles.uploadHeader}>
              <Upload size={17} color={theme.accent[400]} />
              <Text style={[styles.uploadTitle, { color: theme.text.primary }]}>Upload or paste avatar URL</Text>
            </View>
            <TextInput
              style={[styles.uploadInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}
              placeholder="https://example.com/avatar.png"
              placeholderTextColor={theme.text.muted}
              value={customAvatarUrl}
              onChangeText={setCustomAvatarUrl}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: customAvatarUrl.trim() ? theme.accent[500] : theme.bg.border }]}
              onPress={() => {
                const cleanUrl = customAvatarUrl.trim();
                if (!cleanUrl) return;
                setProfile({ avatarUri: cleanUrl });
                setCustomAvatarUrl('');
                setAvatarModalVisible(false);
              }}
              disabled={!customAvatarUrl.trim()}
            >
              <Text style={styles.uploadButtonText}>Use Uploaded Avatar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={PROFILE_PICTURES}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.avatarList}
            columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
            renderItem={({ item }) => {
              const isSelected = profile.avatarUri === item.uri;
              return (
                <TouchableOpacity
                  style={[
                    styles.avatarOption,
                    { borderColor: isSelected ? theme.accent[500] : theme.bg.border, backgroundColor: theme.bg.card },
                  ]}
                  onPress={() => {
                    setProfile({ avatarUri: item.uri });
                    setAvatarModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.uri }} style={styles.avatarOptionImg} />
                  {isSelected && (
                    <View style={[styles.avatarOptionCheck, { backgroundColor: theme.accent[500] }]}>
                      <Check size={12} color="#fff" strokeWidth={3} />
                    </View>
                  )}
                  <Text style={[styles.avatarOptionLabel, { color: isSelected ? theme.accent[400] : theme.text.secondary }]}>{item.label}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function MenuRow({ icon, iconBg, label, theme, onPress }: { icon: ReactNode; iconBg: string; label: string; theme: AppTheme; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.menuLabel, { color: theme.text.primary }]}>{label}</Text>
      <ChevronRight size={16} color={theme.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter-Bold', marginBottom: 20 },
  // User card
  userCard: { flexDirection: 'row', borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, gap: 14, alignItems: 'center' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2.5 },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontFamily: 'Inter-Bold' },
  userEmail: { fontSize: 13, fontFamily: 'Inter-Regular' },
  kycBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 2 },
  kycBadgeText: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  // KYC status card
  kycStatusCard: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, gap: 14 },
  kycStatusHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kycStatusIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kycStatusInfo: { flex: 1 },
  kycStatusTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  kycStatusDesc: { fontSize: 13, fontFamily: 'Inter-Regular' },
  kycProgressSection: { gap: 10 },
  kycProgressBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  kycProgressFill: { height: 4, borderRadius: 2 },
  kycStepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kycStepItem: { alignItems: 'center', gap: 4 },
  kycStepDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kycStepLabel: { fontSize: 10, fontFamily: 'Inter-Medium' },
  verifiedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  verifiedText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  pendingText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  kycActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13 },
  kycActionBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#fff' },
  // Appearance
  sectionLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 20, marginLeft: 4 },
  menuGroup: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter-Medium' },
  themeInfo: { flex: 1 },
  themeSub: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 1 },
  divider: { height: 1, marginHorizontal: 14 },
  // Theme picker
  themePickerSection: { marginTop: 12, marginBottom: 4 },
  pickerLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  themeCard: { width: '47%', borderRadius: 14, padding: 10, borderWidth: 2, position: 'relative', alignItems: 'center' },
  themePreview: { flexDirection: 'row', height: 36, borderRadius: 8, overflow: 'hidden', width: '100%', marginBottom: 8 },
  swatchMain: { flex: 3 },
  swatchCard: { flex: 2 },
  swatchAccent: { width: 6, height: 36 },
  themeCardName: { fontSize: 12, fontFamily: 'Inter-SemiBold', letterSpacing: 0.3 },
  activeCheck: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  pinOverlay: { flex: 1, backgroundColor: '#00000099', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  pinCard: { width: '100%', maxWidth: 390, borderWidth: 1, borderRadius: 22, padding: 20, gap: 10 },
  pinTitle: { fontSize: 22, fontFamily: 'Inter-Bold' },
  pinSub: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 19, marginBottom: 4 },
  pinInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, fontFamily: 'Inter-SemiBold' },
  pinError: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  pinSave: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  pinSaveText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  pinCancel: { alignItems: 'center', paddingVertical: 5 },
  pinCancelText: { fontSize: 13, fontFamily: 'Inter-SemiBold' },
  // Logout
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, paddingVertical: 14, marginTop: 24, borderWidth: 1 },
  logoutText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  bottomPad: { height: 120 },
  // Avatar modal
  modalSafe: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  modalCloseBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { flex: 1, fontSize: 17, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  modalCurrentAvatar: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  modalCurrentLabel: { fontSize: 12, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8 },
  modalCurrentImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3 },
  uploadBox: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 10 },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  uploadInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, fontFamily: 'Inter-Regular' },
  uploadButton: { borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  uploadButtonText: { color: '#fff', fontSize: 13, fontFamily: 'Inter-SemiBold' },
  avatarList: { paddingHorizontal: 16, paddingVertical: 8 },
  avatarOption: { flex: 1, alignItems: 'center', borderRadius: 16, paddingVertical: 14, borderWidth: 2, gap: 6, position: 'relative' },
  avatarOptionImg: { width: 56, height: 56, borderRadius: 28 },
  avatarOptionCheck: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  avatarOptionLabel: { fontSize: 12, fontFamily: 'Inter-Medium' },
  // Referral styles
  referralCard: { borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, gap: 14 },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  referralIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  referralInfo: { flex: 1 },
  referralTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 2 },
  referralDesc: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 18 },
  linkWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingLeft: 12, paddingRight: 4, paddingVertical: 4, justifyContent: 'space-between', marginTop: 4 },
  linkText: { fontSize: 12, fontFamily: 'Inter-Medium', flex: 1, marginRight: 8 },
  copyBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  copyBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter-SemiBold' },
});
