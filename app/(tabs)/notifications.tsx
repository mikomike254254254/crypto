import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TrendingUp, ArrowDownLeft, Shield, TriangleAlert } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

const NOTIFICATIONS = [
  { id: '1', type: 'price', title: 'XRP updated', body: 'Daily XRP value refresh is active in your Wallex wallet.', time: '2m ago', read: false },
  { id: '2', type: 'receive', title: 'You received XRP', body: 'Wallet credit confirmed inside Wallex.', time: '2h ago', read: false },
  { id: '3', type: 'security', title: 'New device login', body: 'A new device signed into your Wallex account.', time: '5h ago', read: true },
  { id: '4', type: 'alert', title: 'Price alert triggered', body: 'BTC crossed $67,000 threshold you set.', time: '1d ago', read: true },
  { id: '5', type: 'price', title: 'SOL up 5.11%', body: 'Solana is up 5.11% today.', time: '1d ago', read: true },
];

export default function NotificationsScreen() {
  const { theme } = useTheme();

  const getIcon = (type: string) => {
    switch (type) {
      case 'price': return <TrendingUp size={18} color={theme.success[400]} strokeWidth={2} />;
      case 'receive': return <ArrowDownLeft size={18} color={theme.accent[400]} strokeWidth={2.5} />;
      case 'security': return <Shield size={18} color={theme.warning[400]} strokeWidth={2} />;
      case 'alert': return <TriangleAlert size={18} color={theme.warning[400]} strokeWidth={2} />;
      default: return <Shield size={18} color={theme.primary[400]} strokeWidth={2} />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'price': return theme.success[500] + '22';
      case 'receive': return theme.accent[500] + '22';
      case 'security': return theme.warning[500] + '22';
      case 'alert': return theme.warning[500] + '22';
      default: return theme.primary[500] + '22';
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: theme.text.primary }]}>Notifications</Text>
            <Text style={[styles.pageSub, { color: theme.text.secondary }]}>Stay updated on your assets</Text>
          </View>
          <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <Text style={[styles.markAllText, { color: theme.accent[400] }]}>Mark all read</Text>
          </TouchableOpacity>
        </Animated.View>

        {NOTIFICATIONS.map((n, i) => (
          <Animated.View key={n.id} entering={FadeInDown.delay(60 + i * 50).duration(350)}>
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: theme.bg.card, borderColor: theme.bg.border },
                !n.read && { borderColor: theme.accent[700] + '88', backgroundColor: theme.bg.elevated },
              ]}
              activeOpacity={0.75}
            >
              {!n.read && <View style={[styles.unreadDot, { backgroundColor: theme.accent[400] }]} />}
              <View style={[styles.iconWrap, { backgroundColor: getIconBg(n.type) }]}>
                {getIcon(n.type)}
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: theme.text.primary }]}>{n.title}</Text>
                <Text style={[styles.cardBody, { color: theme.text.secondary }]}>{n.body}</Text>
                <Text style={[styles.cardTime, { color: theme.text.muted }]}>{n.time}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle: { fontSize: 26, fontFamily: 'Inter-Bold', marginBottom: 4 },
  pageSub: { fontSize: 13, fontFamily: 'Inter-Regular' },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  markAllText: { fontSize: 12, fontFamily: 'Inter-Medium' },
  card: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, gap: 12, alignItems: 'flex-start', position: 'relative' },
  unreadDot: { position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: 4 },
  iconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardInfo: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  cardBody: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 18 },
  cardTime: { fontSize: 11, fontFamily: 'Inter-Regular', marginTop: 2 },
  bottomPad: { height: 120 },
});
