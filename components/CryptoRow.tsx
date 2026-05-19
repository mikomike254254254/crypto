import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { CryptoAsset } from '@/constants/crypto';
import { CryptoColors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  asset: CryptoAsset;
  onPress?: () => void;
}

export default function CryptoRow({ asset, onPress }: Props) {
  const { theme } = useTheme();
  const isPositive = asset.change24h >= 0;
  const usdValue = asset.balance * asset.price;
  const colorSet = CryptoColors[asset.symbol] ?? { primary: theme.primary[500] };

  return (
    <TouchableOpacity style={[styles.container, { backgroundColor: theme.bg.card, borderColor: theme.bg.border }]} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.iconBg, { backgroundColor: colorSet.primary + '22' }]}>
        <Image source={{ uri: asset.icon }} style={styles.icon} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.symbol, { color: theme.text.primary }]}>{asset.symbol}</Text>
        <Text style={[styles.name, { color: theme.text.secondary }]}>{asset.name}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.balance, { color: theme.text.primary }]}>{formatBalance(asset.balance, asset.symbol)}</Text>
        <View style={[styles.changeBadge, isPositive ? { backgroundColor: theme.success[500] + '22' } : { backgroundColor: theme.error[500] + '22' }]}>
          {isPositive ? (
            <TrendingUp size={10} color={theme.success[400]} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={10} color={theme.error[400]} strokeWidth={2.5} />
          )}
          <Text style={[styles.changeText, isPositive ? { color: theme.success[400] } : { color: theme.error[400] }]}>
            {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
          </Text>
        </View>
      </View>
      <View style={styles.usdWrap}>
        <Text style={[styles.usd, { color: theme.text.primary }]}>
          ${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.price, { color: theme.text.secondary }]}>
          ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function formatBalance(balance: number, symbol: string): string {
  if (balance >= 1000) return balance.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (balance >= 1) return balance.toLocaleString('en-US', { maximumFractionDigits: 3 });
  return balance.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    gap: 12,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  info: {
    flex: 1,
  },
  symbol: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  balance: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  changeText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  usdWrap: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  usd: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  price: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});
