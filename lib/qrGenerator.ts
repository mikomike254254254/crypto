import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import SvgQRCode from 'react-native-qrcode-svg';
import { useTheme } from '@/context/ThemeContext';

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  data: string; // JSON string or address
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ visible, onClose, data }) => {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[styles.modalContent, { backgroundColor: theme.bg.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>Payment QR Code</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.bg.primary }]}>
              <Text style={{ color: theme.text.primary, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrContainer}>
            <SvgQRCode value={data} size={200} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 20, width: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontFamily: 'Inter-SemiBold' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  qrContainer: { alignItems: 'center', marginTop: 10 },
});
