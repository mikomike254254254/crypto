import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { recordWalletTransfer, loadWalletBalances, supabase } from '@/lib/supabase';
import { CRYPTO_ASSETS } from '@/constants/crypto';

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
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Activity</Text>
          <Text style={[styles.pageSub, { color: theme.text.secondary }]}>Transaction history</Text>
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
  statusText: { fontSize: 10, fontFamily: 'Inter-SemiBold' },
  bottomPad: { height: 120 },
});
