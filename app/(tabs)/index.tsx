import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import {
  Settings,
  LogOut,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  ChevronRight,
  X,
  Phone,
  Banknote,
  CheckCircle,
  CircleAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Copy,
} from 'lucide-react-native';
import { useUser } from '@/context/UserContext';
import { shortWallet } from '@/lib/wallet';
import OnboardingScreen from '../onboarding';
import { recordAuditLog, loadWalletBalances, loadUserTransactions, supabase } from '@/lib/supabase';

const PORTFOLIO_CHANGE_PCT = 4.82;

// Inline crypto SVG icons as components
function BtcIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#F7931A', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: size * 0.38, letterSpacing: -0.5 }}>₿</Text>
    </View>
  );
}
function EthIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#627EEA', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: size * 0.44 }}>Ξ</Text>
    </View>
  );
}
function UsdtIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#26A17B', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: size * 0.38 }}>₮</Text>
    </View>
  );
}
function XrpIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: size * 0.32 }}>XRP</Text>
    </View>
  );
}
function SolIcon({ size = 32 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#9945FF', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: 'Inter-Bold', fontSize: size * 0.3 }}>SOL</Text>
    </View>
  );
}

// Tiny sparkline view
function MiniSparkline({ up, color }: { up: boolean; color: string }) {
  const bars = up
    ? [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.9, 1.0]
    : [1.0, 0.8, 0.9, 0.6, 0.7, 0.4, 0.5, 0.3];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 22 }}>
      {bars.map((h, i) => (
        <View
          key={i}
          style={{
            width: 3,
            height: Math.max(4, h * 22),
            backgroundColor: color,
            borderRadius: 2,
            opacity: 0.6 + h * 0.4,
          }}
        />
      ))}
    </View>
  );
}

// Live pulse dot
function LiveDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.2, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22c55e' }, animStyle]} />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, signOut } = useUser();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [mpesaVisible, setMpesaVisible] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);

  const [balances, setBalances] = useState<Record<string, number>>({
    BTC: 0,
    ETH: 0,
    USDT: 0,
    XRP: 0,
    SOL: 0,
  });
  const [recentTx, setRecentTx] = useState<any[]>([]);

  const shortAddress = shortWallet(profile.wallet, 6, 4);
  const isKycVerified = profile.kycStatus === 'verified' || String(profile.kycStatus) === 'approved';

  const COIN_METADATA: Record<string, { name: string; price: number; change24h: number; color: string; icon: React.ReactNode }> = {
    BTC: { name: 'Bitcoin', price: 67420.10, change24h: 2.34, color: '#F7931A', icon: <BtcIcon size={42} /> },
    ETH: { name: 'Ethereum', price: 3512.40, change24h: -1.12, color: '#627EEA', icon: <EthIcon size={42} /> },
    USDT: { name: 'Tether', price: 1.00, change24h: 0.01, color: '#26A17B', icon: <UsdtIcon size={42} /> },
    XRP: { name: 'XRP', price: 0.601, change24h: 5.73, color: '#0f0f0f', icon: <XrpIcon size={42} /> },
    SOL: { name: 'Solana', price: 148.22, change24h: 3.11, color: '#9945FF', icon: <SolIcon size={42} /> },
  };

  const DEFAULT_ALLOCATIONS: Record<string, number> = {
    BTC: 0.62,
    ETH: 0.25,
    USDT: 0.09,
    XRP: 0.04,
    SOL: 0.03,
  };

  const dynamicPortfolio = Object.keys(COIN_METADATA).map(symbol => {
    const amount = balances[symbol] ?? 0;
    const meta = COIN_METADATA[symbol];
    const usdValue = amount * meta.price;
    return {
      id: symbol.toLowerCase(),
      name: meta.name,
      symbol,
      amount,
      price: meta.price,
      change24h: meta.change24h,
      usdValue,
      icon: meta.icon,
      color: meta.color,
    };
  });

  const totalPortfolioValue = dynamicPortfolio.reduce((acc, curr) => acc + curr.usdValue, 0);

  const portfolioWithAlloc = dynamicPortfolio.map(item => {
    const alloc = totalPortfolioValue > 0
      ? item.usdValue / totalPortfolioValue
      : (DEFAULT_ALLOCATIONS[item.symbol] ?? 0);
    return { ...item, alloc };
  });

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.wallet) return;
    try {
      const bList = await loadWalletBalances(profile.wallet.toLowerCase());
      const bMap: Record<string, number> = {
        BTC: 0,
        ETH: 0,
        USDT: 0,
        XRP: 0,
        SOL: 0,
      };
      bList.forEach(item => {
        bMap[item.token.toUpperCase()] = item.amount;
      });
      setBalances(bMap);

      const txs = await loadUserTransactions(profile.wallet.toLowerCase());
      setRecentTx(txs.slice(0, 3));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [profile?.wallet]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const animateCounters = useCallback(() => {
    const startedAt = Date.now();
    const duration = 1200;
    setDisplayBalance(0);
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(totalPortfolioValue * eased);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [totalPortfolioValue]);

  useEffect(() => {
    const stop = animateCounters();
    return () => stop();
  }, [animateCounters]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    animateCounters();
    setRefreshing(false);
  }, [fetchDashboardData, animateCounters]);

  const handleCopy = () => {
    Clipboard.setString(profile.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openMpesaWithdraw = () => {
    setMpesaStatus(isKycVerified ? '' : 'Identity verification required before withdrawals.');
    setMpesaVisible(true);
  };

  const submitMpesaWithdraw = async () => {
    const amountKes = Number(mpesaAmount);
    const phone = mpesaPhone.trim();
    if (!isKycVerified) { setMpesaStatus('KYC approval required.'); return; }
    if (!phone || !amountKes || amountKes <= 0) { setMpesaStatus('Enter valid phone and amount.'); return; }
    setMpesaLoading(true);
    setMpesaStatus('');
    try {
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
      const response = await fetch(`${apiBase}/api/mpesa-withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: profile.wallet, phone, amountKes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Request failed');
      await recordAuditLog({
        userId: profile.supabaseId, wallet: profile.wallet,
        email: profile.email, eventType: 'withdrawal_request_initiated',
        metadata: { phone, amountKes, token: 'XRP', provider: 'mpesa' }
      }).catch(() => {});
      setMpesaStatus(data.message ?? 'Withdrawal requested.');
      setMpesaPhone(''); setMpesaAmount('');
    } catch (error) {
      setMpesaStatus(error instanceof Error ? error.message : 'Withdrawal failed');
    } finally { setMpesaLoading(false); }
  };

  if (!profile.isOnboarded) return <OnboardingScreen />;

  const fmtUsd = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const isUp = PORTFOLIO_CHANGE_PCT >= 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
      >
        {/* ── Header ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetText}>Good morning 👋</Text>
            <Text style={styles.welcomeText}>{profile.name.split(' ')[0]}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.push('/profile')}>
              <Settings size={19} color="#1c1e21" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircle} onPress={() => void signOut()}>
              <LogOut size={19} color="#ef4444" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ── Balance Card ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)}>
          <View style={styles.balanceCard}>
            {/* Card top: live badge + address pill */}
            <View style={styles.cardTopRow}>
              <View style={styles.liveBadge}>
                <LiveDot />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <TouchableOpacity onPress={handleCopy} style={styles.addressPill}>
                <Copy size={10} color="rgba(255,255,255,0.6)" />
                <Text style={styles.addressText}>{copied ? 'Copied!' : shortAddress}</Text>
              </TouchableOpacity>
            </View>

            {/* Portfolio total */}
            <Text style={styles.balLabel}>Total Portfolio Value</Text>
            <View style={styles.balRow}>
              <Text style={styles.balValue}>
                {balanceHidden
                  ? '$ ••••••••'
                  : `$${fmtUsd(displayBalance)}`}
              </Text>
              <TouchableOpacity onPress={() => setBalanceHidden(v => !v)} style={styles.eyeBtn}>
                {balanceHidden
                  ? <EyeOff size={18} color="rgba(255,255,255,0.5)" />
                  : <Eye size={18} color="rgba(255,255,255,0.5)" />}
              </TouchableOpacity>
            </View>

            {/* 24h change pill */}
            <View style={styles.changePillRow}>
              <View style={[styles.changePill, { backgroundColor: isUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                {isUp
                  ? <TrendingUp size={12} color="#22c55e" />
                  : <TrendingDown size={12} color="#ef4444" />}
                <Text style={[styles.changePillText, { color: isUp ? '#22c55e' : '#ef4444' }]}>
                  {isUp ? '+' : ''}{PORTFOLIO_CHANGE_PCT.toFixed(2)}% today
                </Text>
              </View>
              <Text style={styles.assetCountText}>{portfolioWithAlloc.length} assets</Text>
            </View>

            {/* Mini portfolio allocation bar */}
            <View style={styles.allocBarWrap}>
              {portfolioWithAlloc.map(a => (
                <View
                  key={a.id}
                  style={[styles.allocSegment, { flex: a.alloc, backgroundColor: a.color }]}
                />
              ))}
            </View>
            <View style={styles.allocLegend}>
              {portfolioWithAlloc.slice(0, 3).map(a => (
                <View key={a.id} style={styles.allocLegendItem}>
                  <View style={[styles.allocDot, { backgroundColor: a.color }]} />
                  <Text style={styles.allocLegendText}>{a.symbol} {Math.round(a.alloc * 100)}%</Text>
                </View>
              ))}
              <Text style={styles.allocLegendText} >+2 more</Text>
            </View>

            {/* Divider */}
            <View style={styles.cardDivider} />

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.actionCircleBtn} onPress={() => router.push('/buy')}>
                  <Plus size={20} color="#1c1e21" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.actionCircleLabel}>Buy</Text>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.actionCircleBtn} onPress={() => router.push('/send')}>
                  <ArrowUpRight size={20} color="#1c1e21" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.actionCircleLabel}>Send</Text>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.actionCircleBtn} onPress={openMpesaWithdraw}>
                  <ArrowDownLeft size={20} color="#1c1e21" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.actionCircleLabel}>Withdraw</Text>
              </View>
              <View style={styles.actionCol}>
                <TouchableOpacity style={styles.actionCircleBtn} onPress={() => router.push('/activity')}>
                  <FileText size={20} color="#1c1e21" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.actionCircleLabel}>History</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Market Pulse Strip ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pulseStrip} contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}>
            {portfolioWithAlloc.map(a => (
              <View key={a.id} style={styles.pulseChip}>
                <View style={{ transform: [{ scale: 0.75 }], marginLeft: -4 }}>{a.icon}</View>
                <View>
                  <Text style={styles.pulseChipSymbol}>{a.symbol}</Text>
                  <Text style={[styles.pulseChipChange, { color: a.change24h >= 0 ? '#22c55e' : '#ef4444' }]}>
                    {a.change24h >= 0 ? '+' : ''}{a.change24h.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── Portfolio Holdings ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Portfolio</Text>
            <TouchableOpacity onPress={() => router.push('/assets')}>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.portfolioCard}>
            {portfolioWithAlloc.map((asset, index) => {
              const up = asset.change24h >= 0;
              const isLast = index === portfolioWithAlloc.length - 1;
              return (
                <Animated.View
                  key={asset.id}
                  entering={FadeInUp.delay(220 + index * 60).duration(400)}
                >
                  <TouchableOpacity
                    style={[styles.assetRow, !isLast && styles.assetRowBorder]}
                    activeOpacity={0.75}
                    onPress={() => router.push('/assets')}
                  >
                    {/* Icon */}
                    <View style={styles.assetIconWrap}>
                      {asset.icon}
                      {/* Small rank badge */}
                      <View style={[styles.rankBadge, { backgroundColor: asset.color + '22', borderColor: asset.color + '44' }]}>
                        <Text style={[styles.rankText, { color: asset.color === '#000000' ? '#666' : asset.color }]}>#{index + 1}</Text>
                      </View>
                    </View>

                    {/* Name + amount */}
                    <View style={styles.assetInfo}>
                      <Text style={styles.assetName}>{asset.name}</Text>
                      <Text style={styles.assetAmount}>
                        {asset.amount < 1
                          ? asset.amount.toFixed(4)
                          : asset.amount >= 1000
                            ? asset.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })
                            : asset.amount.toFixed(3)}{' '}{asset.symbol}
                      </Text>
                    </View>

                    {/* Sparkline */}
                    <View style={styles.sparklineWrap}>
                      <MiniSparkline up={up} color={up ? '#22c55e' : '#ef4444'} />
                    </View>

                    {/* Value + change */}
                    <View style={styles.assetValueCol}>
                      <Text style={styles.assetUsdValue}>${fmtUsd(asset.usdValue)}</Text>
                      <View style={styles.assetChangeRow}>
                        {up
                          ? <TrendingUp size={10} color="#22c55e" />
                          : <TrendingDown size={10} color="#ef4444" />}
                        <Text style={[styles.assetChangePct, { color: up ? '#22c55e' : '#ef4444' }]}>
                          {up ? '+' : ''}{asset.change24h.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Recent Activity Teaser ── */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/activity')}>
              <Text style={styles.viewAllText}>View all →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {recentTx.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: 'Inter-Medium', color: '#94a3b8' }}>No recent activity</Text>
              </View>
            ) : (
              recentTx.map((tx, i) => {
                const isReceive = tx.to_wallet.toLowerCase() === profile.wallet.toLowerCase();
                const isSystem = tx.from_wallet === 'system' || tx.type === 'signup_bonus';
                const label = isSystem ? 'Signup Bonus' : isReceive ? `Received ${tx.token}` : `Sent ${tx.token}`;
                const sub = isSystem ? 'Wallex Welcome Bonus' : isReceive ? `From ${shortWallet(tx.from_wallet || '', 6, 4)}` : `To ${shortWallet(tx.to_wallet, 6, 4)}`;
                const amountVal = Number(tx.amount);
                const amountStr = isReceive ? `+${amountVal.toFixed(4)} ${tx.token}` : `-${amountVal.toFixed(4)} ${tx.token}`;
                const price = COIN_METADATA[tx.token.toUpperCase()]?.price ?? 1.00;
                const usdVal = amountVal * price;
                const usdStr = isReceive ? `+$${fmtUsd(usdVal)}` : `-$${fmtUsd(usdVal)}`;
                const color = isReceive ? '#22c55e' : '#ef4444';
                const icon = isReceive ? <ArrowDownLeft size={16} color="#22c55e" /> : <ArrowUpRight size={16} color="#ef4444" />;

                return (
                  <View key={tx.id || i} style={[styles.txRow, i < recentTx.length - 1 && styles.txRowBorder]}>
                    <View style={[styles.txIconCircle, { backgroundColor: color + '18' }]}>
                      {icon}
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txLabel}>{label}</Text>
                      <Text style={styles.txSub}>{sub}</Text>
                    </View>
                    <View style={styles.txValueCol}>
                      <Text style={[styles.txAmount, { color }]}>{amountStr}</Text>
                      <Text style={styles.txUsd}>{usdStr}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* M-Pesa Withdraw Modal */}
      <Modal visible={mpesaVisible} transparent animationType="slide" onRequestClose={() => setMpesaVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrapper}>
            <View style={styles.modalPanel}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Withdraw to M-Pesa</Text>
                <TouchableOpacity onPress={() => setMpesaVisible(false)} style={styles.closeBtn}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              {!isKycVerified ? (
                <View style={styles.statusError}>
                  <ShieldCheck size={20} color="#ef4444" />
                  <Text style={styles.statusErrorText}>Identity verification required. Complete KYC in Profile.</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.modalDesc}>Instantly convert your crypto and deposit to M-Pesa.</Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>M-PESA PHONE NUMBER</Text>
                    <View style={styles.inputBox}>
                      <Phone size={18} color="#22c55e" />
                      <TextInput style={styles.input} placeholder="e.g. 0712345678" placeholderTextColor="#94a3b8" keyboardType="phone-pad" value={mpesaPhone} onChangeText={setMpesaPhone} />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>AMOUNT (KES)</Text>
                    <View style={styles.inputBox}>
                      <Banknote size={18} color="#22c55e" />
                      <TextInput style={styles.input} placeholder="Minimum 1,000 KES" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" value={mpesaAmount} onChangeText={setMpesaAmount} />
                    </View>
                  </View>

                  {mpesaStatus ? (
                    <View style={[styles.statusBox, mpesaStatus.toLowerCase().includes('request') ? styles.statusBoxSuccess : styles.statusBoxError]}>
                      {mpesaStatus.toLowerCase().includes('request')
                        ? <CheckCircle size={16} color="#22c55e" />
                        : <CircleAlert size={16} color="#ef4444" />}
                      <Text style={[styles.statusText, { color: mpesaStatus.toLowerCase().includes('request') ? '#22c55e' : '#ef4444' }]}>{mpesaStatus}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity style={[styles.submitBtn, mpesaLoading && { opacity: 0.7 }]} onPress={submitMpesaWithdraw} disabled={mpesaLoading}>
                    <Text style={styles.submitBtnText}>{mpesaLoading ? 'Processing...' : 'Execute Withdrawal'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F5F7' },
  scroll: { flex: 1 },
  content: { padding: 20 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 4 },
  headerLeft: { flex: 1 },
  greetText: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#94a3b8', marginBottom: 2 },
  welcomeText: { fontSize: 22, fontFamily: 'Inter-Bold', color: '#1c1e21', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  // Balance Card
  balanceCard: {
    backgroundColor: '#111318',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveText: { fontSize: 10, fontFamily: 'Inter-Bold', color: '#22c55e', letterSpacing: 1 },
  addressPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  addressText: { fontSize: 11, fontFamily: 'Inter-Bold', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.3 },

  balLabel: { fontSize: 12, fontFamily: 'Inter-Medium', color: 'rgba(255,255,255,0.4)', marginBottom: 6 },
  balRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  balValue: { fontSize: 36, fontFamily: 'Inter-Bold', color: '#ffffff', letterSpacing: -1 },
  eyeBtn: { padding: 6 },

  changePillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  changePillText: { fontSize: 12, fontFamily: 'Inter-Bold' },
  assetCountText: { fontSize: 12, fontFamily: 'Inter-Medium', color: 'rgba(255,255,255,0.35)' },

  allocBarWrap: { flexDirection: 'row', height: 5, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: 10 },
  allocSegment: { height: 5, borderRadius: 3 },
  allocLegend: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  allocLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  allocDot: { width: 6, height: 6, borderRadius: 3 },
  allocLegendText: { fontSize: 10, fontFamily: 'Inter-Medium', color: 'rgba(255,255,255,0.35)' },

  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginVertical: 18 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionCol: { alignItems: 'center', flex: 1 },
  actionCircleBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', marginBottom: 7, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  actionCircleLabel: { fontSize: 11, fontFamily: 'Inter-Medium', color: 'rgba(255,255,255,0.6)' },

  // Market Pulse Strip
  pulseStrip: { marginTop: 16, marginBottom: 4 },
  pulseChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, borderWidth: 1, borderColor: '#eaecef' },
  pulseChipSymbol: { fontSize: 12, fontFamily: 'Inter-Bold', color: '#1c1e21' },
  pulseChipChange: { fontSize: 10, fontFamily: 'Inter-Bold' },

  // Sections
  sectionWrap: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter-Bold', color: '#1c1e21' },
  viewAllText: { fontSize: 13, fontFamily: 'Inter-SemiBold', color: '#94a3b8' },

  // Portfolio Card
  portfolioCard: { backgroundColor: '#ffffff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#eaecef', overflow: 'hidden' },
  assetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  assetRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  assetIconWrap: { position: 'relative' },
  rankBadge: { position: 'absolute', bottom: -3, right: -3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 3, paddingVertical: 1 },
  rankText: { fontSize: 7, fontFamily: 'Inter-Bold' },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1c1e21', marginBottom: 2 },
  assetAmount: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#94a3b8' },
  sparklineWrap: { marginHorizontal: 4 },
  assetValueCol: { alignItems: 'flex-end' },
  assetUsdValue: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1c1e21', marginBottom: 3 },
  assetChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  assetChangePct: { fontSize: 11, fontFamily: 'Inter-Bold' },

  // Activity Card
  activityCard: { backgroundColor: '#ffffff', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#eaecef', overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  txRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f3f5' },
  txIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1c1e21', marginBottom: 2 },
  txSub: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#94a3b8' },
  txValueCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontFamily: 'Inter-Bold', marginBottom: 2 },
  txUsd: { fontSize: 10, fontFamily: 'Inter-Medium', color: '#94a3b8' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrapper: { width: '100%' },
  modalPanel: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontFamily: 'Inter-Bold', color: '#1c1e21' },
  closeBtn: { padding: 6, backgroundColor: '#f4f5f7', borderRadius: 20 },
  modalDesc: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#64748b', marginBottom: 24, lineHeight: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 11, fontFamily: 'Inter-Bold', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f5f7', borderRadius: 14, paddingHorizontal: 16, height: 52, gap: 12, borderWidth: 1, borderColor: '#eaecef' },
  input: { flex: 1, fontSize: 15, fontFamily: 'Inter-Bold', color: '#1c1e21', height: '100%' },
  submitBtn: { backgroundColor: '#111318', height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#ffffff' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 16 },
  statusBoxSuccess: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#dcfce7' },
  statusBoxError: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fee2e2' },
  statusText: { fontSize: 13, fontFamily: 'Inter-Bold', flex: 1 },
  statusError: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, gap: 12 },
  statusErrorText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#ef4444', flex: 1, lineHeight: 20 },
});
