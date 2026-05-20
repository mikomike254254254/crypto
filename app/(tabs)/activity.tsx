import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image, Modal, Platform, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useRef } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  Info,
  ScanLine,
  QrCode,
  Copy,
  Check,
  X,
  Camera,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { recordWalletTransfer, loadWalletBalances, loadUserTransactions, supabase } from '@/lib/supabase';
import { CRYPTO_ASSETS } from '@/constants/crypto';
import { CameraView, useCameraPermissions } from 'expo-camera';

const FILTERS = ['All', 'Received', 'Sent', 'Swaps'];

const COIN_METADATA_PRICES: Record<string, number> = {
  BTC: 67420.10,
  ETH: 3512.40,
  USDT: 1.00,
  XRP: 0.601,
  SOL: 148.22,
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortAddr(addr: string): string {
  if (!addr) return '';
  if (addr === 'Internal Swap' || addr === 'system' || addr === 'external') return addr;
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function ActivityScreen() {
  const { theme } = useTheme();
  const { profile } = useUser();
  const [filter, setFilter] = useState('All');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Quick Converter States
  const [fromAsset, setFromAsset] = useState(CRYPTO_ASSETS[3]); // Default XRP
  const [toAsset, setToAsset] = useState(CRYPTO_ASSETS[2]); // Default USDT
  const [fromAmount, setFromAmount] = useState('');
  const [convStatus, setConvStatus] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [balances, setBalances] = useState<Record<string, number>>({});

  // Scan & Send Modal States
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanModalMode, setScanModalMode] = useState<'select' | 'send' | 'receive'>('select');
  const [scannedAddress, setScannedAddress] = useState('');
  const [sendAsset, setSendAsset] = useState(CRYPTO_ASSETS[0]); // Default to XRP
  const [sendAmount, setSendAmount] = useState('');
  const [showSendAssetPicker, setShowSendAssetPicker] = useState(false);
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copiedReceive, setCopiedReceive] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Camera permissions hook
  const [permission, requestPermission] = useCameraPermissions();

  const fetchBalances = useCallback(async () => {
    if (!profile.wallet) return;
    try {
      const bList = await loadWalletBalances(profile.wallet.toLowerCase());
      const bMap: Record<string, number> = {};
      bList.forEach(item => {
        bMap[item.token.toUpperCase()] = item.amount;
      });
      setBalances(bMap);
    } catch (err) {
      console.error('Failed to load wallet balances in activity screen:', err);
    }
  }, [profile.wallet]);

  const fetchTransactions = useCallback(async () => {
    if (!profile?.wallet) return;
    try {
      const txs = await loadUserTransactions(profile.wallet.toLowerCase());
      setTransactions(txs);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.wallet]);

  useEffect(() => {
    fetchTransactions();
    fetchBalances();
  }, [fetchTransactions, fetchBalances]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchTransactions(), fetchBalances()]);
    setRefreshing(false);
  }, [fetchTransactions, fetchBalances]);

  const sourceBalance = balances[fromAsset.symbol.toUpperCase()] ?? 0;
  const sourceAmountVal = parseFloat(fromAmount || '0');
  
  // Calculate exchange rate
  // rate = fromPrice / toPrice
  const exchangeRate = fromAsset.price / toAsset.price;
  const toAmountEst = sourceAmountVal * exchangeRate;

  const handleConvert = async () => {
    if (!profile.wallet) return;
    if (fromAsset.id === toAsset.id) {
      setConvStatus('Cannot convert an asset to itself.');
      return;
    }
    if (sourceAmountVal <= 0) {
      setConvStatus('Please enter a valid amount.');
      return;
    }
    if (sourceAmountVal > sourceBalance) {
      setConvStatus(`Insufficient ${fromAsset.symbol} balance.`);
      return;
    }

    setConvLoading(true);
    setConvStatus(null);

    try {
      // Step 1: Record Debit of fromAsset (Transferring to 'system')
      const debitRes = await recordWalletTransfer({
        fromWallet: profile.wallet.toLowerCase(),
        toWallet: 'system',
        amount: sourceAmountVal,
        token: fromAsset.symbol,
        note: `Convert ${fromAsset.symbol} to ${toAsset.symbol}`,
      });

      if (!debitRes.ok) {
        throw new Error(debitRes.error?.message ?? 'Conversion debit failed.');
      }

      // Step 2: Record Credit of toAsset (Transferring from 'system')
      const creditRes = await recordWalletTransfer({
        fromWallet: 'system',
        toWallet: profile.wallet.toLowerCase(),
        amount: toAmountEst,
        token: toAsset.symbol,
        note: `Converted from ${fromAsset.symbol}`,
      });

      if (!creditRes.ok) {
        throw new Error(creditRes.error?.message ?? 'Conversion credit failed.');
      }

      setConvStatus(`Successfully converted ${sourceAmountVal.toFixed(4)} ${fromAsset.symbol} to ${toAmountEst.toFixed(4)} ${toAsset.symbol}!`);
      setFromAmount('');
      await Promise.all([fetchTransactions(), fetchBalances()]);
    } catch (err: any) {
      setConvStatus(err?.message ?? 'Conversion failed. Please try again.');
    } finally {
      setConvLoading(false);
    }
  };

  const handleBarcodeScanned = (data: string) => {
    if (scanned) return;
    setScanned(true);
    setScannedAddress(data.trim());
    setScanModalMode('send');
  };

  const handleModalSend = async () => {
    if (!profile.wallet) return;
    const dest = scannedAddress.trim();
    if (!dest) {
      setSendError('Please enter a recipient address.');
      return;
    }
    const val = parseFloat(sendAmount);
    if (isNaN(val) || val <= 0) {
      setSendError('Please enter a valid amount.');
      return;
    }

    const available = balances[sendAsset.symbol.toUpperCase()] ?? 0;
    if (val > available) {
      setSendError(`Insufficient ${sendAsset.symbol} balance.`);
      return;
    }

    setSendSubmitting(true);
    setSendError(null);

    try {
      const res = await recordWalletTransfer({
        fromWallet: profile.wallet.toLowerCase(),
        toWallet: dest.toLowerCase(),
        amount: val,
        token: sendAsset.symbol,
        note: `Sent via QR scanner`,
      });

      if (!res.ok) {
        throw new Error(res.error?.message ?? 'Transfer failed.');
      }

      setSendSuccess(true);
      setSendAmount('');
      await Promise.all([fetchTransactions(), fetchBalances()]);
    } catch (err: any) {
      setSendError(err?.message ?? 'Failed to send transaction.');
    } finally {
      setSendSubmitting(false);
    }
  };

  const handleCopyAddress = (addr: string) => {
    Clipboard.setString(addr);
    setCopiedReceive(true);
    setTimeout(() => setCopiedReceive(false), 2000);
  };

  const filtered = transactions.filter((t) => {
    const isReceive = t.to_wallet.toLowerCase() === profile.wallet.toLowerCase();
    const isSystem = t.from_wallet === 'system' || t.type === 'signup_bonus';
    
    if (filter === 'Received') return isReceive || isSystem;
    if (filter === 'Sent') return !isReceive && !isSystem && t.type !== 'swap';
    if (filter === 'Swaps') return t.type === 'swap';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent[500]} />}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Activity</Text>
            <Text style={[styles.pageSub, { color: theme.text.secondary }]}>Transaction history</Text>
          </View>
          <TouchableOpacity
            style={[styles.scanHeaderBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}
            onPress={() => {
              setScanModalMode('select');
              setSendSuccess(false);
              setSendError(null);
              setScanned(false);
              setScannedAddress('');
              setSendAmount('');
              setShowScanModal(true);
            }}
          >
            <ScanLine size={20} color={theme.accent[400]} />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick Converter Card ── */}
        <Animated.View entering={FadeInDown.delay(40).duration(400)} style={[styles.converterCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <Text style={[styles.converterTitle, { color: theme.text.primary }]}>Quick Converter</Text>
          <Text style={[styles.converterDesc, { color: theme.text.secondary }]}>Convert assets instantly with zero slippage</Text>

          <View style={styles.convRow}>
            {/* FROM ASSET */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.convLabel, { color: theme.text.muted }]}>FROM</Text>
              <TouchableOpacity style={[styles.convSelector, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]} onPress={() => { setShowFromPicker(!showFromPicker); setShowToPicker(false); }}>
                <Image source={{ uri: fromAsset.icon }} style={styles.convIcon} />
                <Text style={[styles.convSymbol, { color: theme.text.primary }]}>{fromAsset.symbol}</Text>
                <ChevronDown size={14} color={theme.text.secondary} />
              </TouchableOpacity>
              {showFromPicker && (
                <View style={[styles.inlinePicker, { backgroundColor: theme.bg.elevated || theme.bg.card, borderColor: theme.bg.border }]}>
                  {CRYPTO_ASSETS.map((a) => (
                    <TouchableOpacity key={a.id} style={styles.inlinePickerItem} onPress={() => { setFromAsset(a); setShowFromPicker(false); }}>
                      <Image source={{ uri: a.icon }} style={styles.inlinePickerIcon} />
                      <Text style={[styles.inlinePickerText, { color: theme.text.primary }]}>{a.symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* SWAP ICON */}
            <View style={styles.swapIconContainer}>
              <RefreshCw size={16} color={theme.accent[400]} />
            </View>

            {/* TO ASSET */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.convLabel, { color: theme.text.muted }]}>TO</Text>
              <TouchableOpacity style={[styles.convSelector, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]} onPress={() => { setShowToPicker(!showToPicker); setShowFromPicker(false); }}>
                <Image source={{ uri: toAsset.icon }} style={styles.convIcon} />
                <Text style={[styles.convSymbol, { color: theme.text.primary }]}>{toAsset.symbol}</Text>
                <ChevronDown size={14} color={theme.text.secondary} />
              </TouchableOpacity>
              {showToPicker && (
                <View style={[styles.inlinePicker, { backgroundColor: theme.bg.elevated || theme.bg.card, borderColor: theme.bg.border }]}>
                  {CRYPTO_ASSETS.map((a) => (
                    <TouchableOpacity key={a.id} style={styles.inlinePickerItem} onPress={() => { setToAsset(a); setShowToPicker(false); }}>
                      <Image source={{ uri: a.icon }} style={styles.inlinePickerIcon} />
                      <Text style={[styles.inlinePickerText, { color: theme.text.primary }]}>{a.symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* INPUT & ESTIMATE */}
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={[styles.convLabel, { color: theme.text.muted }]}>AMOUNT</Text>
              <Text style={styles.balanceHelper} onPress={() => setFromAmount(sourceBalance.toString())}>
                Max: {sourceBalance.toFixed(4)} {fromAsset.symbol}
              </Text>
            </View>
            <View style={[styles.convInputWrapper, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}>
              <TextInput
                style={[styles.convInput, { color: theme.text.primary }]}
                placeholder="0.00"
                placeholderTextColor={theme.text.muted}
                value={fromAmount}
                onChangeText={setFromAmount}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.convInputSymbol, { color: theme.text.secondary }]}>{fromAsset.symbol}</Text>
            </View>
            {sourceAmountVal > 0 && (
              <Text style={[styles.convEstimate, { color: theme.text.secondary }]}>
                ~ Estimated Receive: <Text style={{ fontFamily: 'Inter-Bold', color: theme.text.primary }}>{toAmountEst.toFixed(6)} {toAsset.symbol}</Text>
              </Text>
            )}
          </View>

          {/* Status Message */}
          {convStatus && (
            <View style={[styles.statusBox, convStatus.toLowerCase().includes('success') ? styles.statusSuccess : styles.statusError]}>
              <Info size={14} color={convStatus.toLowerCase().includes('success') ? '#22c55e' : '#ef4444'} />
              <Text style={[styles.statusText, { color: convStatus.toLowerCase().includes('success') ? '#22c55e' : '#ef4444' }]}>{convStatus}</Text>
            </View>
          )}

          {/* BUTTON */}
          <TouchableOpacity style={[styles.convBtn, convLoading && { opacity: 0.7 }]} onPress={handleConvert} disabled={convLoading}>
            <Text style={styles.convBtnText}>{convLoading ? 'Converting...' : 'Convert Instantly'}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Filter Row ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }, filter === f && { backgroundColor: theme.accent[500] + '22', borderColor: theme.accent[500] + '66' }]}
            >
              <Text style={[styles.filterText, { color: theme.text.secondary }, filter === f && { color: theme.accent[400] }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {loading ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.text.muted }]}>Loading transactions...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.text.muted }]}>No transactions found</Text>
          </View>
        ) : (
          filtered.map((tx, i) => (
            <Animated.View key={tx.id || i} entering={FadeInDown.delay(120 + i * 50).duration(350)}>
              <TxCard tx={tx} wallet={profile.wallet} theme={theme} />
            </Animated.View>
          ))
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* ── Scan QR & Send / Receive Modal ── */}
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
                {scanModalMode === 'select' && 'Select Action'}
                {scanModalMode === 'send' && 'Send Crypto (Scan QR)'}
                {scanModalMode === 'receive' && 'Receive Crypto (Show QR)'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowScanModal(false)}
                style={[styles.closeBtn, { backgroundColor: theme.bg.primary }]}
              >
                <X size={18} color={theme.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content Selection */}
            {scanModalMode === 'select' && (
              <View style={styles.selectOptionsContainer}>
                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}
                  onPress={() => {
                    setScanModalMode('send');
                    setScanned(false);
                    setScannedAddress('');
                  }}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: theme.accent[500] + '15' }]}>
                    <ScanLine size={24} color={theme.accent[400]} />
                  </View>
                  <Text style={[styles.optionLabel, { color: theme.text.primary }]}>Send Crypto</Text>
                  <Text style={[styles.optionDesc, { color: theme.text.secondary }]}>Scan a recipient's XRP or crypto wallet address to send funds</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionCard, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}
                  onPress={() => setScanModalMode('receive')}
                >
                  <View style={[styles.optionIconContainer, { backgroundColor: theme.success[500] + '15' }]}>
                    <QrCode size={24} color={theme.success[400]} />
                  </View>
                  <Text style={[styles.optionLabel, { color: theme.text.primary }]}>Receive Crypto</Text>
                  <Text style={[styles.optionDesc, { color: theme.text.secondary }]}>Display your unique XRP address and QR code to receive funds</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mode: Receive */}
            {scanModalMode === 'receive' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={styles.qrContainerWrapper}>
                  {/* Soft Rounded QR Code Grid */}
                  <View style={[styles.modalQrBox, { backgroundColor: theme.isDark ? '#000000' : '#ffffff' }]}>
                    <View style={styles.modalQrInner}>
                      <View style={styles.modalQrGrid}>
                        {Array.from({ length: 64 }).map((_, i) => (
                          <View
                            key={i}
                            style={[
                              styles.modalQrCell,
                              { backgroundColor: getQRCellColor(i, 'XRP', theme.isDark ? theme.bg.primary : '#1f1b16') },
                            ]}
                          />
                        ))}
                      </View>
                      <View style={[styles.modalQrLogo, { borderColor: theme.isDark ? '#111' : '#eee' }]}>
                        <Image source={{ uri: CRYPTO_ASSETS[0].icon }} style={styles.modalQrLogoImg} />
                      </View>
                    </View>
                    {/* Corners */}
                    <View style={[styles.modalQrCorner, styles.modalQrTL, { borderColor: theme.bg.primary }]} />
                    <View style={[styles.modalQrCorner, styles.modalQrTR, { borderColor: theme.bg.primary }]} />
                    <View style={[styles.modalQrCorner, styles.modalQrBL, { borderColor: theme.bg.primary }]} />
                    <View style={[styles.modalQrCorner, styles.modalQrBR, { borderColor: theme.bg.primary }]} />
                  </View>

                  <Text style={[styles.modalQrSubtitle, { color: theme.text.secondary }]}>
                    Your unique XRP address
                  </Text>

                  {/* Ready to copy address card */}
                  <View style={[styles.modalAddrCard, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}>
                    <Text style={[styles.modalAddrText, { color: theme.text.primary }]} selectable>
                      {profile.wallet}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleCopyAddress(profile.wallet)}
                      style={[styles.modalAddrCopyBtn, { backgroundColor: copiedReceive ? theme.success[500] + '22' : theme.bg.card }]}
                    >
                      {copiedReceive ? <Check size={16} color={theme.success[400]} /> : <Copy size={16} color={theme.text.secondary} />}
                    </TouchableOpacity>
                  </View>

                  {/* Notice */}
                  <View style={[styles.modalNoticeCard, { backgroundColor: theme.warning[900] + '15', borderColor: theme.warning[700] + '22' }]}>
                    <Info size={14} color={theme.warning[400]} />
                    <Text style={[styles.modalNoticeText, { color: theme.text.secondary }]}>
                      Share this XRP wallet address with another Wallex user. Only send XRP or compatible assets to this address.
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Mode: Send */}
            {scanModalMode === 'send' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {sendSuccess ? (
                  <View style={styles.successContainer}>
                    <CheckCircle size={48} color={theme.success[400]} style={{ marginBottom: 12 }} />
                    <Text style={[styles.successTitle, { color: theme.text.primary }]}>Sent Successfully!</Text>
                    <Text style={[styles.successDesc, { color: theme.text.secondary }]}>
                      Your transaction has been processed. The funds are on their way.
                    </Text>
                    <TouchableOpacity
                      style={[styles.successBtn, { backgroundColor: theme.accent[500] }]}
                      onPress={() => setShowScanModal(false)}
                    >
                      <Text style={styles.successBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ) : !scannedAddress ? (
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

                    {/* Manual Fallback for Simulator / Web without camera */}
                    <View style={styles.manualInputWrapper}>
                      <Text style={[styles.manualInputLabel, { color: theme.text.secondary }]}>
                        Or enter recipient address manually:
                      </Text>
                      <View style={[styles.manualInputRow, { borderColor: theme.bg.border }]}>
                        <TextInput
                          style={[styles.manualInput, { color: theme.text.primary }]}
                          placeholder="Paste or type address..."
                          placeholderTextColor={theme.text.muted}
                          value={scannedAddress}
                          onChangeText={setScannedAddress}
                        />
                        {scannedAddress.trim().length > 0 && (
                          <TouchableOpacity
                            style={[styles.manualInputGoBtn, { backgroundColor: theme.accent[500] }]}
                            onPress={() => setScanModalMode('send')}
                          >
                            <ArrowUpRight size={16} color="#fff" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.sendFormContainer}>
                    {/* Recipient Details */}
                    <Text style={[styles.sendFormLabel, { color: theme.text.secondary }]}>Recipient Address</Text>
                    <View style={[styles.scannedAddrCard, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}>
                      <Text style={[styles.scannedAddrText, { color: theme.text.primary }]}>{scannedAddress}</Text>
                      <TouchableOpacity
                        style={styles.scannedAddrClearBtn}
                        onPress={() => {
                          setScannedAddress('');
                          setScanned(false);
                        }}
                      >
                        <X size={16} color={theme.text.secondary} />
                      </TouchableOpacity>
                    </View>

                    {/* Asset Selector */}
                    <Text style={[styles.sendFormLabel, { color: theme.text.secondary, marginTop: 12 }]}>Asset</Text>
                    <TouchableOpacity
                      style={[styles.sendAssetSelector, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}
                      onPress={() => setShowSendAssetPicker(!showSendAssetPicker)}
                    >
                      <Image source={{ uri: sendAsset.icon }} style={styles.sendAssetIcon} />
                      <Text style={[styles.sendAssetSymbol, { color: theme.text.primary }]}>{sendAsset.symbol}</Text>
                      <ChevronDown size={14} color={theme.text.secondary} />
                    </TouchableOpacity>

                    {showSendAssetPicker && (
                      <View style={[styles.sendAssetPicker, { backgroundColor: theme.bg.elevated || theme.bg.card, borderColor: theme.bg.border }]}>
                        {CRYPTO_ASSETS.map((a) => (
                          <TouchableOpacity
                            key={a.id}
                            style={styles.sendAssetPickerItem}
                            onPress={() => {
                              setSendAsset(a);
                              setShowSendAssetPicker(false);
                            }}
                          >
                            <Image source={{ uri: a.icon }} style={styles.sendAssetPickerIcon} />
                            <Text style={[styles.sendAssetPickerText, { color: theme.text.primary }]}>{a.symbol}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Amount Input */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 }}>
                      <Text style={[styles.sendFormLabel, { color: theme.text.secondary }]}>Amount</Text>
                      <Text
                        style={styles.sendMaxHelper}
                        onPress={() => setSendAmount((balances[sendAsset.symbol.toUpperCase()] ?? 0).toString())}
                      >
                        Max: {(balances[sendAsset.symbol.toUpperCase()] ?? 0).toFixed(4)} {sendAsset.symbol}
                      </Text>
                    </View>
                    <View style={[styles.sendAmountWrapper, { backgroundColor: theme.bg.primary, borderColor: theme.bg.border }]}>
                      <TextInput
                        style={[styles.sendAmountInput, { color: theme.text.primary }]}
                        placeholder="0.00"
                        placeholderTextColor={theme.text.muted}
                        value={sendAmount}
                        onChangeText={setSendAmount}
                        keyboardType="decimal-pad"
                      />
                      <Text style={[styles.sendAmountSymbol, { color: theme.text.secondary }]}>{sendAsset.symbol}</Text>
                    </View>

                    {/* USD Estimate */}
                    {parseFloat(sendAmount || '0') > 0 && (
                      <Text style={[styles.sendEstimateText, { color: theme.text.muted }]}>
                        ~ ${(parseFloat(sendAmount) * sendAsset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </Text>
                    )}

                    {/* Loss Warning notice */}
                    <View style={[styles.modalWarningCard, { backgroundColor: theme.error[900] + '15', borderColor: theme.error[700] + '22' }]}>
                      <Info size={14} color={theme.error[400]} />
                      <Text style={[styles.modalWarningText, { color: theme.text.secondary }]}>
                        Notice: Wallex only supports transfers to registered Wallex wallets. Sending funds to external or unregistered addresses will result in permanent loss.
                      </Text>
                    </View>

                    {/* Status Box */}
                    {sendError && (
                      <View style={[styles.statusBox, styles.statusError, { marginTop: 14 }]}>
                        <Info size={14} color="#ef4444" />
                        <Text style={[styles.statusText, { color: '#ef4444' }]}>{sendError}</Text>
                      </View>
                    )}

                    {/* Send Button */}
                    <TouchableOpacity
                      style={[styles.modalSendBtn, sendSubmitting && { opacity: 0.7 }]}
                      onPress={handleModalSend}
                      disabled={sendSubmitting}
                    >
                      <Text style={styles.modalSendBtnText}>
                        {sendSubmitting ? 'Sending...' : `Send ${sendAsset.symbol}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TxCard({ tx, wallet, theme }: { tx: any; wallet: string; theme: any }) {
  const isReceive = tx.to_wallet.toLowerCase() === wallet.toLowerCase();
  const isSystem = tx.from_wallet === 'system' || tx.type === 'signup_bonus';
  const isSwap = tx.type === 'swap';

  const iconBg = isSwap
    ? theme.primary[500] + '22'
    : (isReceive || isSystem)
    ? theme.success[500] + '22'
    : theme.error[500] + '22';

  const iconColor = isSwap ? theme.primary[400] : (isReceive || isSystem) ? theme.success[400] : theme.error[400];
  const sign = (isReceive || isSystem) ? '+' : '-';
  const amountColor = (isReceive || isSystem) ? theme.success[400] : theme.text.primary;

  const price = COIN_METADATA_PRICES[tx.token.toUpperCase()] ?? 1.00;
  const amountVal = Number(tx.amount);
  const usdValue = amountVal * price;

  const displayAddr = isSystem
    ? 'Wallex Welcome Bonus'
    : isReceive
    ? `From ${shortAddr(tx.from_wallet || '')}`
    : `To ${shortAddr(tx.to_wallet)}`;

  const label = isSystem ? 'Signup Bonus' : isReceive ? 'Received' : 'Sent';

  return (
    <TouchableOpacity style={[styles.txCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} activeOpacity={0.75}>
      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
        {isSwap ? (
          <RefreshCw size={18} color={iconColor} strokeWidth={2} />
        ) : (isReceive || isSystem) ? (
          <ArrowDownLeft size={18} color={iconColor} strokeWidth={2.5} />
        ) : (
          <ArrowUpRight size={18} color={iconColor} strokeWidth={2.5} />
        )}
      </View>

      <View style={styles.txInfo}>
        <View style={styles.txTopRow}>
          <Text style={[styles.txType, { color: theme.text.primary }]}>
            {isSwap ? 'Swap' : label} {tx.token}
          </Text>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {sign}{amountVal.toLocaleString('en-US', { maximumFractionDigits: 6 })} {tx.token}
          </Text>
        </View>
        <View style={styles.txBottomRow}>
          <Text style={[styles.txAddr, { color: theme.text.secondary }]}>{displayAddr}</Text>
          <Text style={[styles.txUsd, { color: theme.text.secondary }]}>
            ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.txMeta}>
          <Text style={[styles.txTime, { color: theme.text.muted }]}>{timeAgo(new Date(tx.created_at))}</Text>
          <StatusBadge status={tx.status} theme={theme} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatusBadge({ status, theme }: { status: string; theme: any }) {
  if (status === 'confirmed' || status === 'completed') {
    return (
      <View style={[styles.statusBadge, { backgroundColor: theme.success[500] + '22' }]}>
        <CheckCircle size={10} color={theme.success[400]} />
        <Text style={[styles.statusText, { color: theme.success[400] }]}>Confirmed</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View style={[styles.statusBadge, { backgroundColor: theme.warning[500] + '22' }]}>
        <Clock size={10} color={theme.warning[400]} />
        <Text style={[styles.statusText, { color: theme.warning[400] }]}>Pending</Text>
      </View>
    );
  }
  return (
    <View style={[styles.statusBadge, { backgroundColor: theme.error[500] + '22' }]}>
      <XCircle size={10} color={theme.error[400]} />
      <Text style={[styles.statusText, { color: theme.error[400] }]}>Failed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter-Bold', marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: 'Inter-Regular', marginBottom: 20 },
  
  // Quick Converter Card Styles
  converterCard: { borderRadius: 20, padding: 18, borderWidth: 1, marginBottom: 20 },
  converterTitle: { fontSize: 16, fontFamily: 'Inter-Bold', marginBottom: 2 },
  converterDesc: { fontSize: 11, fontFamily: 'Inter-Medium', marginBottom: 16 },
  convRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, position: 'relative' },
  convLabel: { fontSize: 9, fontFamily: 'Inter-Bold', letterSpacing: 0.5, marginBottom: 6 },
  convSelector: { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, gap: 6 },
  convIcon: { width: 18, height: 18, borderRadius: 9 },
  convSymbol: { fontSize: 13, fontFamily: 'Inter-Bold', flex: 1 },
  swapIconContainer: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f3f5', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  inlinePicker: { position: 'absolute', top: 48, left: 0, width: 120, borderRadius: 10, borderWidth: 1, overflow: 'hidden', zIndex: 100 },
  inlinePickerItem: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  inlinePickerIcon: { width: 16, height: 16, borderRadius: 8 },
  inlinePickerText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  
  balanceHelper: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#3b82f6', marginBottom: 6 },
  convInputWrapper: { flexDirection: 'row', alignItems: 'center', height: 48, borderRadius: 10, borderWidth: 1, paddingRight: 12 },
  convInput: { flex: 1, paddingHorizontal: 12, fontSize: 16, fontFamily: 'Inter-Bold', height: '100%' },
  convInputSymbol: { fontSize: 13, fontFamily: 'Inter-Bold' },
  convEstimate: { fontSize: 11, fontFamily: 'Inter-Medium', marginTop: 6, marginLeft: 2 },
  convBtn: { backgroundColor: '#111318', height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  convBtnText: { color: '#ffffff', fontSize: 13, fontFamily: 'Inter-Bold' },

  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, marginTop: 12 },
  statusSuccess: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7' },
  statusError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
  statusText: { fontSize: 11, fontFamily: 'Inter-Bold', flex: 1 },

  // Filters
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Inter-Regular' },
  txCard: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12, alignItems: 'center' },
  txIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txInfo: { flex: 1, gap: 3 },
  txTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txType: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  txAmount: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  txBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txAddr: { fontSize: 12, fontFamily: 'Inter-Regular' },
  txUsd: { fontSize: 12, fontFamily: 'Inter-Regular' },
  txMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  txTime: { fontSize: 11, fontFamily: 'Inter-Regular' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: 'Inter-SemiBold' },
  bottomPad: { height: 120 },

  // New QR & Send Modal Styles
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOptionsContainer: {
    padding: 20,
    gap: 16,
  },
  optionCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  qrContainerWrapper: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalQrBox: {
    width: 220,
    height: 220,
    borderRadius: 20,
    padding: 12,
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  modalQrInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalQrGrid: {
    width: 180,
    height: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalQrCell: {
    width: 180 / 8,
    height: 180 / 8,
    borderRadius: 6, // Soft rounded cell
  },
  modalQrLogo: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  modalQrLogoImg: {
    width: 28,
    height: 28,
    borderRadius: 7,
  },
  modalQrCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  modalQrTL: {
    top: 6,
    left: 6,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  modalQrTR: {
    top: 6,
    right: 6,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  modalQrBL: {
    bottom: 6,
    left: 6,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  modalQrBR: {
    bottom: 6,
    right: 6,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  modalQrSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalAddrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    paddingLeft: 14,
    width: '100%',
    marginBottom: 16,
    gap: 8,
  },
  modalAddrText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  modalAddrCopyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalNoticeCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  modalNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  successTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  successBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  scannerWrapper: {
    alignItems: 'center',
  },
  scannerContainer: {
    width: 250,
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFocusFrame: {
    width: 170,
    height: 170,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
  scannerTip: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginTop: 12,
  },
  permissionContainer: {
    width: 250,
    height: 250,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  permissionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  permissionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  manualInputWrapper: {
    width: '100%',
    marginTop: 10,
  },
  manualInputLabel: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 6,
    height: 48,
  },
  manualInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    height: '100%',
  },
  manualInputGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendFormContainer: {
    width: '100%',
  },
  sendFormLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  scannedAddrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  scannedAddrText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  scannedAddrClearBtn: {
    padding: 4,
  },
  sendAssetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  sendAssetIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sendAssetSymbol: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  sendAssetPicker: {
    position: 'absolute',
    top: 135,
    left: 0,
    right: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 6,
    zIndex: 150,
    gap: 4,
  },
  sendAssetPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
  },
  sendAssetPickerIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sendAssetPickerText: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  sendMaxHelper: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#3b82f6',
  },
  sendAmountWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingRight: 14,
  },
  sendAmountInput: {
    flex: 1,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    height: '100%',
  },
  sendAmountSymbol: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
  sendEstimateText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    marginTop: 6,
    marginLeft: 2,
  },
  modalWarningCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    alignItems: 'flex-start',
    marginTop: 14,
  },
  modalWarningText: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    lineHeight: 15,
  },
  modalSendBtn: {
    backgroundColor: '#111318',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalSendBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Inter-Bold',
  },
});

function getQRCellColor(i: number, symbol: string, cellColor: string): string {
  const seed = (i * 7 + symbol.charCodeAt(0)) % 13;
  return seed < 7 ? cellColor : 'transparent';
}
