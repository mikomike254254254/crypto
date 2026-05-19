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
  Database,
  FileCheck,
  Lock,
  Radio,
  Send,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { RIPPLE_LOGO_URL, WALLEX_BRAND } from '@/constants/brand';

type AdminSummary = {
  userCount: number;
  pendingKyc: number;
  banCount?: number;
  xrpAwarded?: number;
  wallets?: WalletRow[];
  transactions: Array<{
    id: string;
    from_wallet?: string | null;
    to_wallet?: string | null;
    amount: number;
    token?: string;
    type?: string;
    created_at?: string;
  }>;
  kycSubmissions?: Array<{
    id: string;
    wallet: string;
    email?: string | null;
    full_name?: string | null;
    id_type?: string | null;
    status?: string | null;
    front_document_url?: string | null;
    back_document_url?: string | null;
    selfie_document_url?: string | null;
  }>;
};

type WalletRow = {
  wallet: string;
  email?: string | null;
  full_name?: string | null;
  kyc_status?: string | null;
  balances?: Array<{ token: string; amount: number }>;
};

const DEMO_SUMMARY: AdminSummary = {
  userCount: 1284,
  pendingKyc: 12,
  banCount: 3,
  xrpAwarded: 24890,
  wallets: [
    { wallet: 'rAmina7KQ3p2s9Lm4XRPn8cW6tY1zB5', email: 'amina@example.com', full_name: 'Amina K', kyc_status: 'pending', balances: [{ token: 'XRP', amount: 120 }] },
    { wallet: 'rMichael9Wv4m6sXRP2q8Lc5Tn1pK7z', email: 'michael@example.com', full_name: 'Michael A', kyc_status: 'approved', balances: [{ token: 'XRP', amount: 340 }, { token: 'BTC', amount: 0.01 }] },
  ],
  transactions: [
    { id: 'demo-1', from_wallet: 'wallex', to_wallet: 'rAmina7KQ3p2s9Lm4XRPn8cW6tY1zB5', amount: 80, token: 'XRP', type: 'award' },
    { id: 'demo-2', from_wallet: 'rMichael9Wv4m6sXRP2q8Lc5Tn1pK7z', to_wallet: 'rAmina7KQ3p2s9Lm4XRPn8cW6tY1zB5', amount: 25, token: 'XRP', type: 'transfer' },
  ],
  kycSubmissions: [
    { id: 'kyc-1', wallet: 'rAmina7KQ3p2s9Lm4XRPn8cW6tY1zB5', email: 'amina@example.com', full_name: 'Amina K', id_type: 'National ID', status: 'pending' },
  ],
};

export default function AdminScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [sessionToken, setSessionToken] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [summary, setSummary] = useState<AdminSummary>(DEMO_SUMMARY);
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('XRP');
  const [balanceWallet, setBalanceWallet] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [messageWallet, setMessageWallet] = useState('');
  const [banWallet, setBanWallet] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('Demo data loaded');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  const login = async () => {
    setLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${apiBase}/api/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Invalid credentials');
      setSessionToken(data.token);
      setStatus('Operations dashboard connected (Live Supabase Mode).');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const adminFetch = async (body?: Record<string, unknown>) => {
    if (sessionToken === 'demo-local') return body ? { ok: true } : summary;

    const response = await fetch(`${apiBase}/api/admin`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Request failed');
    return data;
  };

  const loadSummary = async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const data = await adminFetch();
      setSummary(data);
      setStatus('Live wallet data updated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Backend unavailable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [sessionToken]);

  const runAction = async (body: Record<string, unknown>, success: string) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      if (sessionToken === 'demo-local') {
        const action = body.action as string;
        setSummary(prev => {
          const next = { ...prev };
          
          if (action === 'setBalance') {
            const walletToEdit = body.wallet as string;
            const tokenToEdit = body.token as string;
            const amtToEdit = Number(body.amount);
            
            if (next.wallets) {
              next.wallets = next.wallets.map(w => {
                if (w.wallet.toLowerCase() === walletToEdit.toLowerCase()) {
                  const hasToken = w.balances?.some(b => b.token === tokenToEdit);
                  let nextBalances = w.balances ?? [];
                  if (hasToken) {
                    nextBalances = nextBalances.map(b => 
                      b.token === tokenToEdit ? { ...b, amount: amtToEdit } : b
                    );
                  } else {
                    nextBalances = [...nextBalances, { token: tokenToEdit, amount: amtToEdit }];
                  }
                  return { ...w, balances: nextBalances };
                }
                return w;
              });
            }
          }
          
          else if (action === 'award') {
            const destWallet = body.wallet as string;
            const awardToken = body.token as string;
            const awardAmt = Number(body.amount);
            
            if (awardToken === 'XRP') {
              next.xrpAwarded = (next.xrpAwarded ?? 0) + awardAmt;
            }
            
            const newTx = {
              id: `demo-${Date.now()}`,
              from_wallet: 'wallex',
              to_wallet: destWallet,
              amount: awardAmt,
              token: awardToken,
              type: 'award',
            };
            next.transactions = [newTx, ...next.transactions];
            
            if (next.wallets) {
              next.wallets = next.wallets.map(w => {
                if (w.wallet.toLowerCase() === destWallet.toLowerCase()) {
                  const hasToken = w.balances?.some(b => b.token === awardToken);
                  let nextBalances = w.balances ?? [];
                  if (hasToken) {
                    nextBalances = nextBalances.map(b => 
                      b.token === awardToken ? { ...b, amount: b.amount + awardAmt } : b
                    );
                  } else {
                    nextBalances = [...nextBalances, { token: awardToken, amount: awardAmt }];
                  }
                  return { ...w, balances: nextBalances };
                }
                return w;
              });
            }
          }
          
          else if (action === 'approveKyc') {
            const kycWallet = body.wallet as string;
            const kycStatus = body.status as string;
            
            if (next.kycSubmissions) {
              next.kycSubmissions = next.kycSubmissions.filter(s => s.wallet.toLowerCase() !== kycWallet.toLowerCase());
            }
            if (next.wallets) {
              next.wallets = next.wallets.map(w => 
                w.wallet.toLowerCase() === kycWallet.toLowerCase() ? { ...w, kyc_status: kycStatus } : w
              );
            }
            next.pendingKyc = Math.max(0, next.pendingKyc - 1);
          }
          
          else if (action === 'ban') {
            const walletToBan = body.wallet as string;
            if (next.wallets) {
              next.wallets = next.wallets.filter(w => w.wallet.toLowerCase() !== walletToBan.toLowerCase());
            }
            next.banCount = (next.banCount ?? 0) + 1;
            if (next.kycSubmissions) {
              next.kycSubmissions = next.kycSubmissions.filter(s => s.wallet.toLowerCase() !== walletToBan.toLowerCase());
            }
          }
          
          else if (action === 'promoteAdmin') {
            next.userCount = Math.max(0, next.userCount + 1);
          }
          
          return next;
        });
        setStatus(success);
      } else {
        await adminFetch(body);
        setStatus(success);
        await loadSummary();
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionToken) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <ArrowLeft size={22} color={theme.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loginWrap}>
          <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.loginLogo} />
          <Text style={[styles.loginTitle, { color: theme.text.primary }]}>Wallex Operations</Text>
          <Text style={[styles.loginSub, { color: theme.text.secondary }]}>Sign in to review wallets, KYC, balances, and notifications.</Text>
          <TextInput style={[styles.loginInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} placeholder="Email" placeholderTextColor={theme.text.muted} value={authEmail} onChangeText={setAuthEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={[styles.loginInput, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} placeholder="Password" placeholderTextColor={theme.text.muted} value={authPassword} onChangeText={setAuthPassword} secureTextEntry />
          {loginError ? <Text style={[styles.loginError, { color: theme.error[400] }]}>{loginError}</Text> : null}
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: theme.accent[500] }]} onPress={login} disabled={loading}>
            <Lock size={17} color="#fff" />
            <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerBrand}>
          <Image source={{ uri: WALLEX_BRAND.logoUrl }} style={styles.logo} />
          <View>
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Wallex Operations</Text>
            <Text style={[styles.headerSub, { color: theme.text.secondary }]}>Wallets, KYC, balances, and messages</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(360)} style={styles.opsHero}>
          <View style={styles.opsHeroTop}>
            <View style={styles.livePill}>
              <Radio size={13} color="#67e8f9" />
              <Text style={styles.livePillText}>Live operations</Text>
            </View>
            <Text style={styles.opsDomain}>Daily value updates</Text>
          </View>
          <Text style={styles.opsTitle}>XRP wallet control center</Text>
          <Text style={styles.opsBody}>Review identities, add crypto balances, award XRP, and send wallet notifications from one clean dashboard.</Text>
        </Animated.View>

        <Text style={[styles.statusText, { color: theme.text.secondary }]}>{status}</Text>

        <View style={styles.metrics}>
          <Metric title="Wallets" value={summary.userCount.toLocaleString()} icon={<Users size={20} color={theme.accent[400]} />} theme={theme} />
          <Metric title="Pending KYC" value={summary.pendingKyc.toLocaleString()} icon={<ShieldCheck size={20} color={theme.warning[400]} />} theme={theme} />
          <Metric title="XRP Rate" value={`KSh ${WALLEX_BRAND.xrpRateKes}`} icon={<Coins size={20} color={theme.success[400]} />} theme={theme} />
          <Metric title="XRP Awarded" value={Number(summary.xrpAwarded ?? 0).toLocaleString()} icon={<WalletCards size={20} color={theme.primary[400]} />} theme={theme} />
        </View>

        <AdminPanel title="Wallets & Balances" icon={<Database size={18} color={theme.accent[400]} />} theme={theme}>
          {(summary.wallets ?? []).map((item) => (
            <View key={item.wallet} style={[styles.walletRow, { borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}>
              <View style={styles.walletHeader}>
                <Image source={{ uri: RIPPLE_LOGO_URL }} style={styles.rippleIcon} />
                <View style={styles.walletInfo}>
                  <Text style={[styles.walletName, { color: theme.text.primary }]}>{item.full_name || item.email || 'Wallet user'}</Text>
                  <Text style={[styles.walletAddress, { color: theme.text.secondary }]}>{shortWallet(item.wallet)}</Text>
                </View>
                <Text style={[styles.kycChip, { color: item.kyc_status === 'approved' ? theme.success[400] : theme.warning[400] }]}>{item.kyc_status || 'unverified'}</Text>
              </View>
              <View style={styles.balanceChips}>
                {(item.balances ?? [{ token: 'XRP', amount: 0 }]).map((balance) => (
                  <Text key={`${item.wallet}-${balance.token}`} style={[styles.balanceChip, { color: theme.text.primary, backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
                    {Number(balance.amount).toLocaleString()} {balance.token}
                  </Text>
                ))}
              </View>
            </View>
          ))}
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Wallet to edit" placeholderTextColor={theme.text.muted} value={balanceWallet} onChangeText={setBalanceWallet} autoCapitalize="none" />
          <View style={styles.inlineInputs}>
            <TextInput style={[styles.input, styles.inlineInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Token" placeholderTextColor={theme.text.muted} value={tokenSymbol} onChangeText={(value) => setTokenSymbol(value.toUpperCase())} autoCapitalize="characters" />
            <TextInput style={[styles.input, styles.inlineInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Balance" placeholderTextColor={theme.text.muted} value={balanceAmount} onChangeText={setBalanceAmount} keyboardType="decimal-pad" />
          </View>
          <TouchableOpacity style={styles.primaryAction} onPress={() => runAction({ action: 'setBalance', wallet: balanceWallet, token: tokenSymbol, amount: Number(balanceAmount) }, `Set ${tokenSymbol} balance for ${balanceWallet}`)}>
            <Database size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Save Balance</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Award XRP or Crypto" icon={<Coins size={18} color={theme.accent[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Ripple wallet address" placeholderTextColor={theme.text.muted} value={wallet} onChangeText={setWallet} autoCapitalize="none" />
          <View style={styles.inlineInputs}>
            <TextInput style={[styles.input, styles.inlineInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Token" placeholderTextColor={theme.text.muted} value={tokenSymbol} onChangeText={(value) => setTokenSymbol(value.toUpperCase())} autoCapitalize="characters" />
            <TextInput style={[styles.input, styles.inlineInput, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Amount" placeholderTextColor={theme.text.muted} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          </View>
          <TouchableOpacity style={styles.primaryAction} onPress={() => runAction({ action: 'award', wallet, token: tokenSymbol, amount: Number(amount) }, `Awarded ${amount} ${tokenSymbol} to ${wallet}`)}>
            <Send size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Award Crypto</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="KYC Review Queue" icon={<FileCheck size={18} color={theme.warning[400]} />} theme={theme}>
          {(summary.kycSubmissions ?? []).length === 0 ? (
            <Text style={[styles.emptyPanelText, { color: theme.text.secondary }]}>No pending KYC submissions.</Text>
          ) : (
            (summary.kycSubmissions ?? []).map((submission) => (
              <View key={submission.id} style={[styles.kycQueueRow, { borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]}>
                <View style={styles.kycQueueInfo}>
                  <Text style={[styles.kycQueueName, { color: theme.text.primary }]}>{submission.full_name || 'Unnamed user'}</Text>
                  <Text style={[styles.kycQueueWallet, { color: theme.text.secondary }]}>{shortWallet(submission.wallet)} - {submission.id_type || 'ID'}</Text>
                  <Text style={[styles.kycQueueDocs, { color: theme.text.muted }]}>
                    Front {submission.front_document_url ? 'link' : 'flag'} / Back {submission.back_document_url ? 'link' : 'flag'} / Selfie {submission.selfie_document_url ? 'link' : 'flag'}
                  </Text>
                </View>
                <View style={styles.kycMiniActions}>
                  <TouchableOpacity style={[styles.kycMiniBtn, { backgroundColor: theme.success[500] }]} onPress={() => runAction({ action: 'approveKyc', wallet: submission.wallet, status: 'approved' }, `Approved KYC for ${submission.wallet}. Email queued.`)}>
                    <Text style={styles.kycMiniText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.kycMiniBtn, { backgroundColor: theme.error[500] }]} onPress={() => runAction({ action: 'approveKyc', wallet: submission.wallet, status: 'rejected' }, `Rejected KYC for ${submission.wallet}. Email queued.`)}>
                    <Text style={styles.kycMiniText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </AdminPanel>

        <AdminPanel title="Notifications & Email" icon={<Bell size={18} color={theme.primary[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Target wallet optional" placeholderTextColor={theme.text.muted} value={messageWallet} onChangeText={setMessageWallet} autoCapitalize="none" />
          <TextInput style={[styles.input, styles.textArea, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Message to wallet users" placeholderTextColor={theme.text.muted} value={message} onChangeText={setMessage} multiline />
          <TouchableOpacity style={styles.primaryAction} onPress={() => runAction({ action: 'notify', wallet: messageWallet || null, message }, 'Notification and email queued')}>
            <Bell size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Send Message</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Security Actions" icon={<Ban size={18} color={theme.error[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Wallet to ban" placeholderTextColor={theme.text.muted} value={banWallet} onChangeText={setBanWallet} autoCapitalize="none" />
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme.error[500] }]} onPress={() => runAction({ action: 'ban', wallet: banWallet }, `Banned ${banWallet}`)}>
            <Ban size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Ban Wallet</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Promote User to Admin" icon={<ShieldCheck size={18} color={theme.success[400]} />} theme={theme}>
          <TextInput style={[styles.input, { color: theme.text.primary, borderColor: theme.bg.border, backgroundColor: theme.bg.primary }]} placeholder="Email address to promote" placeholderTextColor={theme.text.muted} value={promoteEmail} onChangeText={setPromoteEmail} autoCapitalize="none" keyboardType="email-address" />
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme.success[500] }]} onPress={() => {
            if (!promoteEmail.trim()) {
              setStatus('Please enter an email to promote.');
              return;
            }
            runAction({ action: 'promoteAdmin', email: promoteEmail }, `Successfully promoted ${promoteEmail} to Administrator.`);
            setPromoteEmail('');
          }}>
            <ShieldCheck size={17} color="#fff" />
            <Text style={styles.primaryActionText}>Promote to Admin</Text>
          </TouchableOpacity>
        </AdminPanel>

        <AdminPanel title="Live Transactions" icon={<BadgeCheck size={18} color={theme.accent[400]} />} theme={theme}>
          {summary.transactions.map((tx) => {
            const usdValue = estimateUsdValue(Number(tx.amount), tx.token);
            return (
              <View key={tx.id} style={[styles.txRow, { borderColor: theme.bg.border }]}>
                <View style={styles.txLeft}>
                  <Text style={[styles.txType, { color: theme.text.primary }]}>{tx.type ?? 'transfer'}</Text>
                  <Text style={[styles.txWallet, { color: theme.text.secondary }]}>{shortWallet(tx.from_wallet)} to {shortWallet(tx.to_wallet)}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: theme.success[400] }]}>{Number(tx.amount).toLocaleString()} {tx.token ?? 'XRP'}</Text>
                  <Text style={[styles.txKes, { color: theme.text.secondary }]}>${usdValue.toFixed(2)} / KSh {(usdValue * WALLEX_BRAND.usdToKes).toLocaleString('en-KE', { maximumFractionDigits: 0 })}</Text>
                </View>
              </View>
            );
          })}
        </AdminPanel>
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
  if (wallet.length <= 18) return wallet;
  return `${wallet.slice(0, 10)}...${wallet.slice(-6)}`;
}

function estimateUsdValue(amount: number, token?: string) {
  if ((token ?? 'XRP').toUpperCase() === 'XRP') return amount * WALLEX_BRAND.xrpUsdPrice;
  return amount;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerBrand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 10 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter-Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 1 },
  loginWrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, gap: 12 },
  loginLogo: { width: 72, height: 72, borderRadius: 18, alignSelf: 'center', marginBottom: 8 },
  loginTitle: { fontSize: 28, fontFamily: 'Inter-Bold', textAlign: 'center' },
  loginSub: { fontSize: 14, fontFamily: 'Inter-Regular', lineHeight: 20, textAlign: 'center', marginBottom: 10 },
  loginInput: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, fontFamily: 'Inter-Regular' },
  loginBtn: { borderRadius: 16, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  loginBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter-SemiBold' },
  loginError: { fontSize: 13, fontFamily: 'Inter-SemiBold', textAlign: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  opsHero: { borderRadius: 24, padding: 20, marginBottom: 14, backgroundColor: '#020617', overflow: 'hidden' },
  opsHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0e749033', borderWidth: 1, borderColor: '#67e8f955', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  livePillText: { color: '#cffafe', fontSize: 11, fontFamily: 'Inter-SemiBold' },
  opsDomain: { color: '#94a3b8', fontSize: 12, fontFamily: 'Inter-SemiBold' },
  opsTitle: { color: '#ffffff', fontSize: 28, fontFamily: 'Inter-Bold', letterSpacing: 0, marginBottom: 6 },
  opsBody: { color: '#cbd5e1', fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 20 },
  statusText: { fontSize: 12, fontFamily: 'Inter-Medium', lineHeight: 18, marginBottom: 12 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { flexGrow: 1, flexBasis: '45%', borderWidth: 1, borderRadius: 18, padding: 14, minWidth: 136 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  metricTitle: { fontSize: 12, fontFamily: 'Inter-Medium' },
  metricValue: { fontSize: 22, fontFamily: 'Inter-Bold', letterSpacing: 0 },
  panel: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12, gap: 10 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  panelTitle: { fontSize: 16, fontFamily: 'Inter-Bold' },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: 'Inter-Regular' },
  inlineInputs: { flexDirection: 'row', gap: 8 },
  inlineInput: { flex: 1 },
  primaryAction: { backgroundColor: '#0f172a', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  walletRow: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 10 },
  walletHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rippleIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#111827' },
  walletInfo: { flex: 1 },
  walletName: { fontSize: 14, fontFamily: 'Inter-Bold' },
  walletAddress: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  kycChip: { fontSize: 11, fontFamily: 'Inter-SemiBold', textTransform: 'capitalize' },
  balanceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  balanceChip: { borderWidth: 1, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontFamily: 'Inter-SemiBold' },
  emptyPanelText: { fontSize: 13, fontFamily: 'Inter-Medium', paddingVertical: 8 },
  kycQueueRow: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 9, gap: 10 },
  kycQueueInfo: { gap: 3 },
  kycQueueName: { fontSize: 14, fontFamily: 'Inter-Bold' },
  kycQueueWallet: { fontSize: 12, fontFamily: 'Inter-Medium' },
  kycQueueDocs: { fontSize: 11, fontFamily: 'Inter-Regular' },
  kycMiniActions: { flexDirection: 'row', gap: 8 },
  kycMiniBtn: { flex: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  kycMiniText: { color: '#fff', fontSize: 12, fontFamily: 'Inter-SemiBold' },
  textArea: { minHeight: 82, textAlignVertical: 'top' },
  txRow: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  txLeft: { flex: 1 },
  txRight: { alignItems: 'flex-end', gap: 3 },
  txType: { fontSize: 13, fontFamily: 'Inter-SemiBold', textTransform: 'capitalize' },
  txWallet: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  txAmount: { fontSize: 13, fontFamily: 'Inter-Bold' },
  txKes: { fontSize: 11, fontFamily: 'Inter-Regular' },
});
