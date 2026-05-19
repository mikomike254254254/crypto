import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Home, PieChart, FileText, User } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useUser } from '@/context/UserContext';

const TAB_ICONS: Record<string, (color: string, size: number) => ReactNode> = {
  index: (color, size) => <Home color={color} size={size} strokeWidth={2.2} />,
  assets: (color, size) => <PieChart color={color} size={size} strokeWidth={2.2} />,
  activity: (color, size) => <FileText color={color} size={size} strokeWidth={2.2} />,
  profile: (color, size) => <User color={color} size={size} strokeWidth={2.2} />,
};


function TabItem({
  route,
  isFocused,
  onPress,
  onLongPress,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSpring(1.15, { damping: 10, stiffness: 200 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }, 100);
    }
  }, [isFocused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = isFocused ? '#18181b' : '#a1a1aa';
  const name = route.name as keyof typeof TAB_ICONS;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[
        styles.iconWrapper, 
        isFocused && styles.activeIconCircle,
        animStyle
      ]}>
        {TAB_ICONS[name]?.(iconColor, 20)}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const { profile } = useUser();

  if (!profile.isOnboarded) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.bar}>
        {state.routes.filter(r => r.name !== 'notifications').map((route) => {
          const isFocused = state.routes[state.index]?.name === route.name;

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
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#18181b',
    borderRadius: 36,
    height: 64,
    width: '100%',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  activeIconCircle: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
});
