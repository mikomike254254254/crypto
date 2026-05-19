import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
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
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { loadUserTransactions } from '@/lib/supabase';

const FILTERS = ['All', 'Received', 'Sent', 'Swaps'];

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
  }, [fetchTransactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

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

        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.filterRow}>
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
            <Animated.View key={tx.id || i} entering={FadeInDown.delay(100 + i * 50).duration(350)}>
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

  const COIN_METADATA_PRICES: Record<string, number> = {
    BTC: 67420.10,
    ETH: 3512.40,
    USDT: 1.00,
    XRP: 0.601,
    SOL: 148.22,
  };
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
