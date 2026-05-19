import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Copy, Share2, ChevronDown, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { CryptoColors } from '@/constants/colors';
import { CRYPTO_ASSETS } from '@/constants/crypto';

export default function ReceiveScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { profile } = useUser();
  const [selectedAsset, setSelectedAsset] = useState(CRYPTO_ASSETS[0]);
  const [copied, setCopied] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrBg = theme.isDark ? '#000000' : '#ffffff';
  const qrCellColor = theme.isDark ? theme.bg.primary : '#1f1b16';
  const receiveAddress = selectedAsset.id === 'rxp' ? profile.wallet : selectedAsset.address;
  const receiveNote = selectedAsset.id === 'rxp'
    ? 'RXP is an internal Wallex wallet balance. Share this rxp_ address with another Wallex user.'
    : `Only send ${selectedAsset.symbol} to this address.`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg.primary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <ArrowLeft size={22} color={theme.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Receive Crypto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(40).duration(400)}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Select Asset</Text>
          <TouchableOpacity style={[styles.assetSelector, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} onPress={() => setShowPicker(!showPicker)}>
            <View style={[styles.assetIconBg, { backgroundColor: (CryptoColors[selectedAsset.symbol]?.primary ?? theme.primary[500]) + '22' }]}>
              <Image source={{ uri: selectedAsset.icon }} style={styles.assetIcon} />
            </View>
            <View style={styles.assetInfo}>
              <Text style={[styles.assetSymbol, { color: theme.text.primary }]}>{selectedAsset.symbol}</Text>
              <Text style={[styles.assetName, { color: theme.text.secondary }]}>{selectedAsset.name}</Text>
            </View>
            <ChevronDown size={18} color={theme.text.secondary} />
          </TouchableOpacity>

          {showPicker && (
            <View style={[styles.picker, { backgroundColor: theme.bg.elevated, borderColor: theme.bg.border }]}>
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

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={[styles.qrCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
          <View style={styles.qrHeader}>
            <Image source={{ uri: selectedAsset.icon }} style={styles.qrAssetIcon} />
            <Text style={[styles.qrTitle, { color: theme.text.secondary }]}>Scan to send {selectedAsset.symbol}</Text>
          </View>

          <View style={[styles.qrBox, { backgroundColor: qrBg }]}>
            <View style={styles.qrInner}>
              <View style={styles.qrGrid}>
                {Array.from({ length: 64 }).map((_, i) => (
                  <View key={i} style={[styles.qrCell, { backgroundColor: getQRCellColor(i, selectedAsset.symbol, qrCellColor) }]} />
                ))}
              </View>
              <View style={[styles.qrLogo, { borderColor: theme.isDark ? '#111' : '#eee' }]}>
                <Image source={{ uri: selectedAsset.icon }} style={styles.qrLogoImg} />
              </View>
            </View>
            <View style={[styles.qrCorner, styles.qrTL, { borderColor: theme.bg.primary }]} />
            <View style={[styles.qrCorner, styles.qrTR, { borderColor: theme.bg.primary }]} />
            <View style={[styles.qrCorner, styles.qrBL, { borderColor: theme.bg.primary }]} />
            <View style={[styles.qrCorner, styles.qrBR, { borderColor: theme.bg.primary }]} />
          </View>

          <Text style={[styles.qrNote, { color: theme.text.secondary }]}>
            Only send {selectedAsset.symbol} to this address.{'\n'}Sending other assets may result in permanent loss.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400)}>
          <Text style={[styles.label, { color: theme.text.secondary }]}>Your {selectedAsset.symbol} Address</Text>
          <View style={[styles.addressCard, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]}>
            <Text style={[styles.addressText, { color: theme.text.primary }]} selectable>
              {receiveAddress}
            </Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }, copied && { borderColor: theme.success[500] + '66', backgroundColor: theme.success[500] + '11' }]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              {copied ? <Check size={18} color={theme.success[400]} /> : <Copy size={18} color={theme.text.secondary} />}
              <Text style={[styles.actionBtnText, { color: copied ? theme.success[400] : theme.text.secondary }]}>{copied ? 'Copied!' : 'Copy Address'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} activeOpacity={0.8}>
              <Share2 size={18} color={theme.text.secondary} />
              <Text style={[styles.actionBtnText, { color: theme.text.secondary }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={[styles.warningCard, { backgroundColor: theme.warning[900] + '33', borderColor: theme.warning[700] + '44' }]}>
          <Text style={[styles.warningTitle, { color: theme.warning[400] }]}>Important</Text>
          <Text style={[styles.warningText, { color: theme.text.secondary }]}>
            {receiveNote} Make sure the sender uses the correct network or internal Wallex transfer flow to avoid loss of funds.
          </Text>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getQRCellColor(i: number, symbol: string, cellColor: string): string {
  const seed = (i * 7 + symbol.charCodeAt(0)) % 13;
  return seed < 7 ? cellColor : 'transparent';
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
  assetInfo: { flex: 1 },
  assetSymbol: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  assetName: { fontSize: 12, fontFamily: 'Inter-Regular', marginTop: 2 },
  picker: { borderRadius: 14, marginTop: 4, borderWidth: 1, overflow: 'hidden', maxHeight: 280 },
  pickerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 10, borderBottomWidth: 1 },
  pickerIcon: { width: 28, height: 28, borderRadius: 14 },
  pickerSymbol: { fontSize: 14, fontFamily: 'Inter-SemiBold', width: 48 },
  pickerName: { flex: 1, fontSize: 13, fontFamily: 'Inter-Regular' },
  qrCard: { borderRadius: 20, padding: 20, marginTop: 20, borderWidth: 1, alignItems: 'center' },
  qrHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  qrAssetIcon: { width: 24, height: 24, borderRadius: 12 },
  qrTitle: { fontSize: 14, fontFamily: 'Inter-Medium' },
  qrBox: { width: 220, height: 220, borderRadius: 16, padding: 12, position: 'relative', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  qrInner: { width: '100%', height: '100%', position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrGrid: { width: 180, height: 180, flexDirection: 'row', flexWrap: 'wrap' },
  qrCell: { width: 180 / 8, height: 180 / 8, borderRadius: 1 },
  qrLogo: { position: 'absolute', width: 40, height: 40, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  qrLogoImg: { width: 28, height: 28, borderRadius: 6 },
  qrCorner: { position: 'absolute', width: 28, height: 28, borderRadius: 6 },
  qrTL: { top: 6, left: 6, borderTopWidth: 4, borderLeftWidth: 4, borderBottomWidth: 0, borderRightWidth: 0 },
  qrTR: { top: 6, right: 6, borderTopWidth: 4, borderRightWidth: 4, borderBottomWidth: 0, borderLeftWidth: 0 },
  qrBL: { bottom: 6, left: 6, borderBottomWidth: 4, borderLeftWidth: 4, borderTopWidth: 0, borderRightWidth: 0 },
  qrBR: { bottom: 6, right: 6, borderBottomWidth: 4, borderRightWidth: 4, borderTopWidth: 0, borderLeftWidth: 0 },
  qrNote: { fontSize: 12, fontFamily: 'Inter-Regular', textAlign: 'center', lineHeight: 18 },
  addressCard: { borderRadius: 14, padding: 14, borderWidth: 1 },
  addressText: { fontSize: 13, fontFamily: 'Inter-Regular', lineHeight: 20, letterSpacing: 0.4 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter-Medium' },
  warningCard: { borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1 },
  warningTitle: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 5 },
  warningText: { fontSize: 12, fontFamily: 'Inter-Regular', lineHeight: 18 },
});
