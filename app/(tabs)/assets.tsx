import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { CryptoColors } from '@/constants/colors';
import { CRYPTO_ASSETS, CryptoAsset } from '@/constants/crypto';

const TOTAL = CRYPTO_ASSETS.reduce((s, a) => s + a.balance * a.price, 0);
const FILTERS = ['All', 'Gainers', 'Losers'];

export default function AssetsScreen() {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('All');

  const filtered = CRYPTO_ASSETS.filter((a) => {
    if (filter === 'Gainers') return a.change24h > 0;
    if (filter === 'Losers') return a.change24h < 0;
    return true;
  });

  const summaryGradient = theme.isDark
    ? ['#0a0a14', '#000000'] as [string, string]
    : ['#f2efe9', '#e8e4dc'] as [string, string];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Portfolio</Text>
          <Text style={[styles.pageSub, { color: theme.text.secondary }]}>All your crypto assets</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
          <LinearGradient colors={summaryGradient} style={[styles.summaryCard, { borderColor: theme.bg.border }]}>
            <View style={[styles.glowSmall, { backgroundColor: theme.accent[500] + (theme.isDark ? '11' : '0a') }]} />
            <Text style={[styles.summaryLabel, { color: theme.text.secondary }]}>Total Value</Text>
            <Text style={[styles.summaryAmount, { color: theme.text.primary }]}>
              ${TOTAL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <View style={styles.summaryStats}>
              {CRYPTO_ASSETS.slice(0, 4).map((a) => {
                const pct = ((a.balance * a.price) / TOTAL) * 100;
                const c = CryptoColors[a.symbol]?.primary ?? theme.primary[500];
                return (
                  <View key={a.id} style={[styles.statItem, { backgroundColor: theme.isDark ? '#ffffff08' : '#00000006' }]}>
                    <View style={[styles.statDot, { backgroundColor: c }]} />
                    <Text style={[styles.statLabel, { color: theme.text.secondary }]}>{a.symbol}</Text>
                    <Text style={[styles.statPct, { color: theme.text.primary }]}>{pct.toFixed(1)}%</Text>
                  </View>
                );
              })}
              <View style={[styles.statItem, { backgroundColor: theme.isDark ? '#ffffff08' : '#00000006' }]}>
                <View style={[styles.statDot, { backgroundColor: theme.text.muted }]} />
                <Text style={[styles.statLabel, { color: theme.text.secondary }]}>Other</Text>
                <Text style={[styles.statPct, { color: theme.text.primary }]}>
                  {(CRYPTO_ASSETS.slice(4).reduce((s, a) => s + (a.balance * a.price) / TOTAL, 0) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.filterRow}>
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

        {filtered.map((asset, i) => (
          <Animated.View key={asset.id} entering={FadeInDown.delay(150 + i * 40).duration(350)}>
            <AssetCard asset={asset} totalPortfolio={TOTAL} theme={theme} />
          </Animated.View>
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AssetCard({ asset, totalPortfolio, theme }: { asset: CryptoAsset; totalPortfolio: number; theme: any }) {
  const isPositive = asset.change24h >= 0;
  const value = asset.balance * asset.price;
  const pct = (value / totalPortfolio) * 100;
  const colors = CryptoColors[asset.symbol] ?? { primary: theme.primary[500], gradient: [theme.primary[500], theme.primary[800]] as [string, string] };

  return (
    <TouchableOpacity style={[styles.assetCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} activeOpacity={0.75}>
      <View style={[styles.assetIconBg, { backgroundColor: colors.primary + '1a' }]}>
        <Image source={{ uri: asset.icon }} style={styles.assetIcon} />
      </View>
      <View style={styles.assetInfo}>
        <View style={styles.assetTopRow}>
          <Text style={[styles.assetSymbol, { color: theme.text.primary }]}>{asset.symbol}</Text>
          <Text style={[styles.assetValue, { color: theme.text.primary }]}>
            ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
        <View style={styles.assetBottomRow}>
          <Text style={[styles.assetName, { color: theme.text.secondary }]}>{asset.name}</Text>
          <View style={styles.assetChangeRow}>
            {isPositive
              ? <TrendingUp size={11} color={theme.success[400]} />
              : <TrendingDown size={11} color={theme.error[400]} />
            }
            <Text style={[styles.assetChange, isPositive ? { color: theme.success[400] } : { color: theme.error[400] }]}>
              {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
            </Text>
          </View>
        </View>
        <View style={[styles.barBg, { backgroundColor: theme.bg.border }]}>
          <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.barLabel, { color: theme.text.muted }]}>{pct.toFixed(1)}% of portfolio</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter-Bold', marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: 'Inter-Regular', marginBottom: 20 },
  summaryCard: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1 },
  glowSmall: { position: 'absolute', width: 150, height: 150, borderRadius: 75, top: -40, right: -20 },
  summaryLabel: { fontSize: 11, fontFamily: 'Inter-Regular', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  summaryAmount: { fontSize: 28, fontFamily: 'Inter-Bold', marginBottom: 16 },
  summaryStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { fontSize: 11, fontFamily: 'Inter-Medium' },
  statPct: { fontSize: 11, fontFamily: 'Inter-SemiBold' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: 'Inter-Medium' },
  assetCard: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12, alignItems: 'flex-start' },
  assetIconBg: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  assetIcon: { width: 28, height: 28, borderRadius: 14 },
  assetInfo: { flex: 1 },
  assetTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  assetSymbol: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  assetValue: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  assetBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  assetName: { fontSize: 12, fontFamily: 'Inter-Regular' },
  assetChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  assetChange: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  barBg: { height: 3, borderRadius: 2, marginBottom: 4, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2 },
  barLabel: { fontSize: 10, fontFamily: 'Inter-Regular' },
  bottomPad: { height: 120 },
});
