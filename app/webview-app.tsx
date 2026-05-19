import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { WALLEX_BRAND } from '@/constants/brand';

const WEBSITE_URL = process.env.EXPO_PUBLIC_WALLEX_WEBSITE_URL || WALLEX_BRAND.websiteUrl;

export default function WallexWebViewAppScreen() {
  const webViewRef = useRef<WebViewType>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  useEffect(() => () => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
  }, []);

  const scheduleLoadedMessage = () => {
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => {
      Alert.alert('Wallex is ready', 'Your Wallex wallet has loaded. You can send, receive, buy, and manage XRP securely.');
    }, 5000);
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webFallback}>
        <Text style={styles.webTitle}>Wallex Android App Shell</Text>
        <Text style={styles.webText}>This route is for the Android/iOS WebView build. Open the live website directly on web.</Text>
        <TouchableOpacity style={styles.webButton} onPress={() => Linking.openURL(WEBSITE_URL)}>
          <ExternalLink size={18} color="#fff" />
          <Text style={styles.webButtonText}>Open {WALLEX_BRAND.siteName}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.nativeHeader}>
        <TouchableOpacity
          style={[styles.headerButton, !canGoBack && styles.headerButtonDisabled]}
          disabled={!canGoBack}
          onPress={() => webViewRef.current?.goBack()}
        >
          <ArrowLeft size={20} color={canGoBack ? '#0f172a' : '#94a3b8'} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Wallex</Text>
          <Text style={styles.headerUrl}>{WEBSITE_URL.replace(/^https?:\/\//, '')}</Text>
        </View>
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: WEBSITE_URL }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onLoadEnd={scheduleLoadedMessage}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  nativeHeader: { height: 58, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 12, backgroundColor: '#ffffff' },
  headerButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  headerButtonDisabled: { opacity: 0.55 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter-Bold', color: '#0f172a' },
  headerUrl: { fontSize: 11, fontFamily: 'Inter-Medium', color: '#64748b', marginTop: 1 },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#f8fafc' },
  webTitle: { fontSize: 24, fontFamily: 'Inter-Bold', color: '#0f172a', textAlign: 'center' },
  webText: { fontSize: 14, fontFamily: 'Inter-Regular', color: '#64748b', textAlign: 'center', lineHeight: 20 },
  webButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 18, paddingVertical: 13, marginTop: 8 },
  webButtonText: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: '#ffffff' },
});
