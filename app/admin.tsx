import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  BadgeCheck,
  Ban,
  Bell,
  Coins,
  KeyRound,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { WALLEX_BRAND } from '@/constants/brand';

type AdminSummary = {
  userCount: number;
  pendingKyc: number;
  transactions: Array<{
    id: string;
    from_wallet?: string | null;
    to_wallet?: string | null;
    amount: number;
    token?: string;
    type?: string;
    created_at?: string;
  }>;
};

const DEMO_SUMMARY: AdminSummary = {
  userCount: 1284,
  pendingKyc: 12,
  transactions: [
    { id: 'demo-1', from_wallet: 'admin', to_wallet: 'wallex-nairobi', amount: 80, token: 'RXP', type: 'award' },
    { id: 'demo-2', from_wallet: 'wallex-asia', to_wallet: 'wallex-usa', amount: 25, token: 'RXP', type: 'transfer' },
    { id: 'demo-3', from_wallet: 'external', to_wallet: 'wallex-lagos', amount: 150, token: 'RXP', type: 'receive' },
  ],
};

export default function AdminScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [token, setToken] = useState('');
  const [summary, setSummary] = useState<AdminSummary>(DEMO_SUMMARY);
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [kycWallet, setKycWallet] = useState('');
  const [banWallet, setBanWallet] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('Demo mode ready');
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  const adminFetch = async (body?: Record<string, unknown>) => {
    const response = await fetch(`${apiBase}/api/admin`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': token,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Admin request failed');
    return data;
  };

  const loadSummary = async () => {
    if (!token) {
      setStatus('Enter the admin API token to connect live Supabase actions.');
      return;
    }

    setLoading(true);
    try {
      const data = await adminFetch();
      setSummary(data);
      setStatus('Live Supabase admin connected.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Admin backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runAction = async (body: Record<string, unknown>, success: string) => {
    if (!token) {
      setStatus('Demo only. Add the admin token before running live actions.');
      return;
    }

    setLoading(true);
    try {
      await adminFetch(body);
      setStatus(success);
      await loadSummary();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerBrand}>
          <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.logo} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Wallex Admin</Text>
            <Text style={[styles.headerSub, { color: theme.text.secondary }]}>Rewards, KYC, bans, and monitoring</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(360)} style={[styles.tokenCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <KeyRound size={18} color={theme.accent[400]} />
          <TextInput
            style={[styles.tokenInput, { color: theme.text.primary }]}
            placeholder="Admin API token"
            placeholderTextColor={theme.text.muted}
            value={token}
            onChangeText={setToken}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: theme.accent[500] }]} onPress={loadSummary} disabled={loading}>
            <Text style={styles.smallBtnText}>{loading ? '...' : 'Connect'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={[styles.statusText, { color: theme.text.secondary }]}>{status}</Text>

        <View style={styles.metrics}>
          <Metric title="Users" value={summary.userCount.toLocaleString()} icon={<Users size={20} color={theme.accent[400]} />} theme={theme} />
          <Metric title="Pending KYC" value={summary.pendingKyc.toLocaleString()} icon={<ShieldCheck size={20} color={theme.warning[400]} />} theme={theme} />
          <Metric title="RXP Rate" value={`KSh ${WALLEX_BRAND.rxpRateKes}`} icon={<Coins size={20} color={theme.success[400]} />} theme={theme} />
        </View>

        <AdminPanel title="Reward Crypto" icon={<Coins size={18} color={theme.accent[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Wallet address" placeholderTextColor={theme.text.muted} value={wallet} onChangeText={setWallet} autoCapitalize="none" />
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Amount of RXP" placeholderTextColor={theme.text.muted} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <TouchableOpacity style={styles.primaryAction} onPress={() => runAction({ action: 'award', wallet, amount: Number(amount) }, `Awarded ${amount} RXP to ${wallet}`)}>
            <Send size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Award RXP</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="KYC Approval" icon={<BadgeCheck size={18} color={theme.success[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="User wallet" placeholderTextColor={theme.text.muted} value={kycWallet} onChangeText={setKycWallet} autoCapitalize="none" />
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.splitAction, { backgroundColor: theme.success[500] }]} onPress={() => runAction({ action: 'approveKyc', wallet: kycWallet, status: 'approved' }, `Approved KYC for ${kycWallet}`)}>
              <Text style={styles.primaryActionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.splitAction, { backgroundColor: theme.error[500] }]} onPress={() => runAction({ action: 'approveKyc', wallet: kycWallet, status: 'rejected' }, `Rejected KYC for ${kycWallet}`)}>
              <Text style={styles.primaryActionText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </AdminPanel>

        <AdminPanel title="Broadcast Notification" icon={<Bell size={18} color={theme.primary[400]} />} theme={theme}>
          <TextInput style={[styles.input, styles.textArea, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Message to users" placeholderTextColor={theme.text.muted} value={message} onChangeText={setMessage} multiline />
          <TouchableOpacity style={styles.primaryAction} onPress={() => runAction({ action: 'notify', message }, 'Notification sent')}>
            <Bell size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Send Notification</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Ban Wallet" icon={<Ban size={18} color={theme.error[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Wallet to ban" placeholderTextColor={theme.text.muted} value={banWallet} onChangeText={setBanWallet} autoCapitalize="none" />
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme.error[500] }]} onPress={() => runAction({ action: 'ban', wallet: banWallet }, `Banned ${banWallet}`)}>
            <Ban size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Ban Wallet</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Live Transactions" icon={<ShieldCheck size={18} color={theme.accent[400]} />} theme={theme}>
          {summary.transactions.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { borderColor: theme.bg.border }]}>
              <View style={styles.txLeft}>
                <Text style={[styles.txType, { color: theme.text.primary }]}>{tx.type ?? 'transfer'}</Text>
                <Text style={[styles.txWallet, { color: theme.text.secondary }]}>{shortWallet(tx.from_wallet)} to {shortWallet(tx.to_wallet)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: theme.success[400] }]}>{Number(tx.amount).toLocaleString()} {tx.token ?? 'RXP'}</Text>
            </View>
          ))}
        </AdminPanel>

        <Text style={[styles.support, { color: theme.text.secondary }]}>Support: {WALLEX_BRAND.supportEmail}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ title, value, icon, theme }: { title: string; value: string; icon: ReactNode; theme: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
      <View style={styles.metricTop}>
        {icon}
        <Text style={[styles.metricTitle, { color: theme.text.secondary }]}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.text.primary }]}>{value}</Text>
    </View>
  );
}

function AdminPanel({ title, icon, theme, children }: { title: string; icon: ReactNode; theme: any; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(360)} style={[styles.panel, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
      <View style={styles.panelHeader}>
        {icon}
        <Text style={[styles.panelTitle, { color: theme.text.primary }]}>{title}</Text>
      </View>
      {children}
    </Animated.View>
  );
}

function shortWallet(wallet?: string | null) {
  if (!wallet) return 'system';
  if (wallet.length <= 16) return wallet;
  return `${wallet.slice(0, 9)}...${wallet.slice(-5)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 10 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  tokenCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tokenInput: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', paddingVertical: 8 },
  smallBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  smallBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter-SemiBold' },
  statusText: { fontSize: 12, fontFamily: 'Inter-Medium', lineHeight: 18, marginVertical: 12 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { flexGrow: 1, flexBasis: '30%', borderWidth: 1, borderRadius: 18, padding: 14, minWidth: 108 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  metricTitle: { fontSize: 12, fontFamily: 'Inter-Medium' },
  metricValue: { fontSize: 22, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  panel: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, gap: 10 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  panelTitle: { fontSize: 16, fontFamily: 'Inter-Bold' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: 'Inter-Regular' },
  textArea: { minHeight: 82, textAlignVertical: 'top' },
  primaryAction: { backgroundColor: '#0f172a', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  actionRow: { flexDirection: 'row', gap: 10 },
  splitAction: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  txRow: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  txLeft: { flex: 1 },
  txType: { fontSize: 13, fontFamily: 'Inter-SemiBold', textTransform: 'capitalize' },
  txWallet: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  txAmount: { fontSize: 13, fontFamily: 'Inter-Bold' },
  support: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter-Medium', marginTop: 10 },
});
