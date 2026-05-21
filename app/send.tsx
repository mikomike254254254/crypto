import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, ChevronDown, ScanLine, ArrowUpRight, CheckCircle, Check, X, Camera } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { QRCodeModal } from '@/lib/qrGenerator';
import { CryptoColors } from '@/constants/colors';
import { CRYPTO_ASSETS } from '@/constants/crypto';
import { recordWalletTransfer, loadWalletBalances } from '@/lib/supabase';
import { logScan } from '@/lib/qrScanner';
import { isRippleWalletAddress } from '@/lib/wallet';
import { useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';

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
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [showPicker, setShowPicker] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const handleBarcodeScanned = async (data: string) => {
    setScanned(true);
    setAddress(data.trim());
    setShowScanModal(false);
    // Log the QR scan event
    await logScan(data.trim(), profile.wallet?.toLowerCase());
  };
    setScanned(true);
    setAddress(data.trim());
    setShowScanModal(false);
  };

  useEffect(() => {
    async function fetchBalances() {
      if (!profile.wallet) return;
      try {
        const bList = await loadWalletBalances(profile.wallet.toLowerCase());
        const bMap: Record<string, number> = {};
        bList.forEach(item => {
          bMap[item.token.toUpperCase()] = item.amount;
        });
        setBalances(bMap);
      } catch (err) {
        console.error('Failed to load wallet balances in send screen:', err);
      }
    }
    fetchBalances();
  }, [profile.wallet]);

  const currentBalance = balances[selectedAsset.symbol.toUpperCase()] ?? 0;
  const usdValue = parseFloat(amount || '0') * selectedAsset.price;
  const cleanAddress = address.trim();
  const amountValue = parseFloat(amount || '0');

  const isValid = selectedAsset.symbol === 'XRP'
    ? isRippleWalletAddress(address.trim()) && amountValue > 0 && amountValue <= currentBalance
    : address.length > 10 && amountValue > 0 && amountValue <= currentBalance;

  const handleSend = async () => {
    if (!isValid) return;
    if (!confirmed) { setConfirmed(true); return; }
    setSubmitting(true);
    setError(null);
    const result = await recordWalletTransfer({
      fromWallet: profile.wallet.toLowerCase(),
      toWallet: cleanAddress.toLowerCase(),
      amount: Number(amount),
      token: selectedAsset.symbol,
      note,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error?.message ?? 'Transfer could not be recorded. Make sure the recipient wallet is registered on Wallex.');
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
          <Text style={[styles.headerTitle, { color: theme.text.primary }]}>{confirmed ? 'Confirm Send' : 'Send XRP'}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {!confirmed ? (
            <>
              <Animated.View entering={FadeInDown.delay(60).duration(400)}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>Asset</Text>
                <TouchableOpacity 
                  style={[styles.assetSelector, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
                  onPress={() => setShowPicker(!showPicker)}
                >
                  <View style={[styles.assetIconBg, { backgroundColor: (CryptoColors[selectedAsset.symbol]?.primary ?? theme.primary[500]) + '22' }]}>
                    <Image source={{ uri: selectedAsset.icon }} style={styles.assetIcon} />
                  </View>
                  <View style={styles.assetSelectorInfo}>
                    <Text style={[styles.assetSelectorSymbol, { color: theme.text.primary }]}>{selectedAsset.symbol}</Text>
                    <Text style={[styles.assetSelectorBalance, { color: theme.text.secondary }]}>
                      Internal Wallex balance: {currentBalance.toLocaleString('en-US', { maximumFractionDigits: 4 })} {selectedAsset.symbol}
                    </Text>
                  </View>
                  <ChevronDown size={18} color={theme.text.secondary} />
                </TouchableOpacity>

                {showPicker && (
                  <View style={[styles.picker, { backgroundColor: theme.bg.elevated || theme.bg.card, borderColor: theme.bg.border }]}>
                    {CRYPTO_ASSETS.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        style={[styles.pickerItem, { borderBottomColor: theme.bg.border }, selectedAsset.id === a.id && { backgroundColor: theme.accent[500] + '11' }]}
                        onPress={() => { setSelectedAsset(a); setShowPicker(false); }}
                      >
                        <Image source={{ uri: a.icon }} style={styles.pickerIcon} />
                        <Text style={[styles.pickerSymbol, { color: theme.text.primary }]}>{a.symbol}</Text>
                        <Text style={[styles.pickerName, { color: theme.text.secondary }]}>{a.name}</Text>
                        {selectedAsset.id === a.id && <Check size={14} color={theme.accent[400]} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <Text style={[styles.label, { color: theme.text.secondary }]}>Recipient Address</Text>
                <View style={[styles.inputWrapper, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text.primary }]}
                    placeholder="rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"
                    placeholderTextColor={theme.text.muted}
                    value={address}
                    onChangeText={setAddress}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity 
                    style={styles.scanBtn}
                    onPress={() => {
                      setScanned(false);
                      setShowScanModal(true);
                    }}
                  >
                    <ScanLine size={18} color={theme.accent[400]} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(140).duration(400)}>
                <View style={styles.amountHeader}>
                  <Text style={[styles.label, { color: theme.text.secondary }]}>Amount</Text>
                  <TouchableOpacity onPress={() => setAmount(currentBalance.toString())} style={[styles.maxBtn, { backgroundColor: theme.accent[500] + '22', borderColor: theme.accent[500] + '44' }]}>
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
                  <Text style={[styles.feeValue, { color: theme.text.primary }]}>Wallex XRP wallet</Text>
                </View>
                <Text style={[styles.feeNote, { color: theme.text.secondary }]}>
                  XRP moves between Wallex XRP wallets first. External settlement can be connected later through the live ledger bridge.
                </Text>
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
                
                {/* Unregistered Wallet Loss Warning */}
                <View style={styles.warningCard}>
                  <Text style={styles.warningTextHeader}>⚠️ Critical Warning</Text>
                  <Text style={styles.warningTextBody}>
                    Ensure the destination address is correct and compatible with the {selectedAsset.symbol} network. Sending crypto to an unregistered or incorrect address will cause funds to be permanently lost.
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.bg.border }]} />
                {[
                  ['To', `${address.slice(0, 12)}...${address.slice(-8)}`],
                  ['Ledger', 'Wallex XRP wallet'],
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

            {!confirmed ? (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!isValid || submitting} activeOpacity={0.85}>
                <LinearGradient
                  colors={isValid ? [theme.accent[500], theme.primary[700]] : [theme.bg.border, theme.bg.border]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtnGradient}
                >
                  <ArrowUpRight size={20} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.sendBtnText}>Review Transaction</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.swipeWrapper}>
                <SwipeConfirmButton
                  onConfirm={handleSend}
                  loading={submitting}
                  theme={theme}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Scan QR Modal ── */}
      <Modal
        visible={showScanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowScanModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: theme.bg.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text.primary }]}>
                Scan Recipient Address QR
              </Text>
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                style={[styles.closeBtn, { backgroundColor: theme.bg.primary }]}
              >
                <X size={18} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <View style={styles.scannerWrapper}>
                {/* Scanner */}
                {permission?.granted ? (
                  <View style={styles.scannerContainer}>
                    <CameraView
                      style={StyleSheet.absoluteFillObject}
                      barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                      }}
                      onBarcodeScanned={({ data }) => handleBarcodeScanned(data)}
                    />
                    <View style={styles.scannerOverlay}>
                      <View style={styles.scannerFocusFrame} />
                      <Text style={styles.scannerTip}>Align QR code within the frame</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.permissionContainer}>
                    <Camera size={36} color={theme.text.muted} style={{ marginBottom: 12 }} />
                    <Text style={[styles.permissionText, { color: theme.text.secondary }]}>
                      Camera permission is required to scan QR codes.
                    </Text>
                    <TouchableOpacity
                      style={[styles.permissionBtn, { backgroundColor: theme.accent[500] }]}
                      onPress={requestPermission}
                    >
                      <Text style={styles.permissionBtnText}>Enable Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Manual Fallback / Instruction */}
                <View style={styles.manualInputWrapper}>
                  <Text style={[styles.manualInputLabel, { color: theme.text.secondary }]}>
                    Or paste/type the recipient address directly into the address input box on the Send screen.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Simple, self-contained SwipeConfirmButton component for React Native (Web + Mobile friendly)
import { PanResponder } from 'react-native';
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function SwipeConfirmButton({ onConfirm, loading, theme }: { onConfirm: () => void; loading: boolean; theme: any }) {
  const transX = useSharedValue(0);
  const sliderWidth = 280; // approximate width of track
  const handleWidth = 54;
  const maxTravel = sliderWidth - handleWidth - 12;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !loading,
    onMoveShouldSetPanResponder: () => !loading,
    onPanResponderMove: (_, gestureState) => {
      const x = Math.max(0, Math.min(gestureState.dx, maxTravel));
      transX.value = x;
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx >= maxTravel - 20) {
        transX.value = maxTravel;
        onConfirm();
      } else {
        transX.value = withSpring(0, { damping: 15 });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: transX.value }],
    };
  });

  return (
    <View style={styles.swipeTrack}>
      <Animated.View {...panResponder.panHandlers} style={[styles.swipeHandle, animatedStyle]}>
        <View style={styles.swipeHandleInner}>
          {loading ? (
            <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter-Bold' }}>...</Text>
          ) : (
            <Check size={20} color="#ffffff" strokeWidth={3} />
          )}
        </View>
      </Animated.View>
      <Text style={styles.swipeTrackText}>
        {loading ? 'Processing...' : 'Swipe to Confirm Send'}
      </Text>
    </View>
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
  feeNote: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 18, marginTop: 4 },
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
  // Picker styles
  picker: { borderRadius: 14, borderWidth: 1, marginTop: 4, overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, gap: 10 },
  pickerIcon: { width: 24, height: 24, borderRadius: 12 },
  pickerSymbol: { fontSize: 14, fontFamily: 'Inter-SemiBold', flex: 1 },
  pickerName: { fontSize: 13, fontFamily: 'Inter-Regular', marginRight: 10 },
  
  // Warning Card
  warningCard: { width: '100%', backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#d97706', marginBottom: 16 },
  warningTextHeader: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#b45309', marginBottom: 4 },
  warningTextBody: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#d97706', lineHeight: 16 },

  // Swipe confirm slider styles
  swipeWrapper: { width: '100%', alignItems: 'center' },
  swipeTrack: { width: '100%', height: 58, backgroundColor: '#111318', borderRadius: 29, position: 'relative', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  swipeHandle: { position: 'absolute', left: 4, width: 50, height: 50, borderRadius: 25, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  swipeHandleInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' },
  swipeTrackText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#ffffff', opacity: 0.65 },

  modalBg: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  modalTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalScroll: { paddingHorizontal: 20, paddingVertical: 16 },
  scannerWrapper: { alignItems: 'center' },
  scannerContainer: { width: 250, height: 250, borderRadius: 24, overflow: 'hidden', position: 'relative', marginBottom: 20 },
  scannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center' },
  scannerFocusFrame: { width: 170, height: 170, borderRadius: 20, borderWidth: 2, borderColor: '#ffffff', backgroundColor: 'transparent' },
  scannerTip: { color: '#ffffff', fontSize: 11, fontFamily: 'Inter-Medium', marginTop: 12 },
  permissionContainer: { width: 250, height: 250, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center', padding: 20, marginBottom: 20 },
  permissionText: { fontSize: 12, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  permissionBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  permissionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter-Bold' },
  manualInputWrapper: { width: '100%', marginTop: 10, alignItems: 'center' },
  manualInputLabel: { fontSize: 12, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 18, color: '#94a3b8' },
});
