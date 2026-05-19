import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Hop as Home, ChartBar as BarChart3, ArrowLeftRight, Bell, User } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUser } from '@/context/UserContext';

const TAB_ICONS: Record<string, (color: string, size: number) => ReactNode> = {
  index: (color, size) => <Home color={color} size={size} strokeWidth={2} />,
  assets: (color, size) => <BarChart3 color={color} size={size} strokeWidth={2} />,
  activity: (color, size) => <ArrowLeftRight color={color} size={size} strokeWidth={2} />,
  notifications: (color, size) => <Bell color={color} size={size} strokeWidth={2} />,
  profile: (color, size) => <User color={color} size={size} strokeWidth={2} />,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  assets: 'Assets',
  activity: 'Activity',
  notifications: 'Alerts',
  profile: 'Profile',
};

function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
  theme,
  index,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  theme: any;
  index: number;
}) {
  const scale = useSharedValue(1);
  const focusProgress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 250 });
    if (isFocused) {
      scale.value = withSpring(1.2, { damping: 10, stiffness: 200 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }, 120);
    }
  }, [isFocused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pillAnimStyle = useAnimatedStyle(() => ({
    width: interpolate(focusProgress.value, [0, 1], [0, 24], Extrapolation.CLAMP),
    opacity: focusProgress.value,
  }));

  const iconColor = isFocused ? theme.accent[400] : theme.text.muted;
  const name = route.name as keyof typeof TAB_ICONS;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.6}
    >
      <Animated.View style={[styles.iconWrapper, iconAnimStyle]}>
        {TAB_ICONS[name]?.(iconColor, 22)}
      </Animated.View>
      <Text style={[styles.label, isFocused && { color: theme.accent[400] }]} numberOfLines={1}>
        {TAB_LABELS[name] ?? route.name}
      </Text>
      <Animated.View style={[styles.activePill, { backgroundColor: theme.accent[500] }, pillAnimStyle]} />
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { profile } = useUser();

  if (!profile.isOnboarded) return null;

  const barGradient = theme.isDark
    ? [theme.bg.elevated, theme.bg.card] as [string, string]
    : [theme.bg.elevated, theme.bg.card] as [string, string];

  const glowColor = theme.isDark ? theme.accent[500] + '0a' : 'transparent';

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Subtle glow above the bar */}
      {theme.isDark && (
        <View style={[styles.glowStrip, { backgroundColor: glowColor }]} />
      )}
      <View style={[styles.barWrapper, { borderColor: theme.bg.border }]}>
        <LinearGradient
          colors={barGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.bar, { borderColor: theme.bg.border }]}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabItem
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
                theme={theme}
                index={index}
              />
            );
          })}
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  glowStrip: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 12,
    left: 12,
    right: 12,
    height: 1,
  },
  barWrapper: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  bar: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 24,
    borderWidth: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  activePill: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 2,
  },
});
