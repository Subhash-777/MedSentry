import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import Animated, {
  FadeIn, FadeInDown, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pill, FileText, Sparkles, Zap, ZapOff } from 'lucide-react-native';
import { ScanStackParamList } from '../../navigation/AppNavigator';
import {
  recognizeTextFromImage, findDrugFromOcrText,
  parsePrescriptionFromOcrText, parseMedicineStripFromOcrText,
  extractPrescriptionWithGeminiVision, parseGS1DataMatrix,
} from '../../lib/ocr';
import { supabase } from '../../lib/supabase';
import * as T from '../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STRIP_W = SCREEN_WIDTH * 0.75;
const STRIP_H = 140;
const PRESC_W = SCREEN_WIDTH * 0.82;
const PRESC_H = 360;
const CORNER = 22;
const CORNER_LEN = 28;
const CORNER_THICK = 3;

type ScanMode = 'medicine' | 'prescription';
type NavigationProp = NativeStackNavigationProp<ScanStackParamList, 'Scan'>;

/** Animated scan-line overlay */
const ScanLine = ({ height }: { height: number }) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withTiming(height - 4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [height]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[styles.scanLine, animStyle]} />
  );
};

/** Bracket corner widget */
const Corner = ({ style }: { style: any }) => (
  <View style={[styles.corner, style]}>
    <View style={[styles.cornerH, { width: CORNER_LEN, height: CORNER_THICK }]} />
    <View style={[styles.cornerV, { width: CORNER_THICK, height: CORNER_LEN }]} />
  </View>
);

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [torchActive, setTorchActive] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('medicine');
  const [useAiVision, setUseAiVision] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Analyzing image with OCR...');
  const lastBarcodeRef = useRef<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setCameraActive(true);
      lastBarcodeRef.current = null;
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setTorchActive(false);
    });
    return () => {
      unsub();
      unsubBlur();
    };
  }, [navigation]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={T.background} />
        <View style={styles.permIconWrap}>
          <Text style={styles.permIcon}>📷</Text>
        </View>
        <Text style={styles.permTitle}>Camera access required</Text>
        <Text style={styles.permSub}>Grant camera permission to scan medications and prescriptions</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2D Barcode (GS1 DataMatrix / EAN-13) Auto-Scanner
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isScanning || !cameraActive || scanMode !== 'medicine') return;
    if (lastBarcodeRef.current === data) return;
    lastBarcodeRef.current = data;

    const gs1 = parseGS1DataMatrix(data);
    if (gs1.expiryDate && gs1.expiryDate < new Date()) {
      setCameraActive(false);
      Alert.alert(
        '⛔ Expired Medicine',
        `This medicine expired on ${gs1.expiryDate.toLocaleDateString()}. Please dispose of it safely.`,
        [{ text: 'OK', onPress: () => setCameraActive(true) }]
      );
      return;
    }

    // Attempt GTIN / code catalog lookup
    if (gs1.gtin) {
      try {
        const { data: drugMatch } = await (supabase
          .from('drugs')
          .select('id, name')
          .or(`name.ilike.%${gs1.gtin}%`)
          .limit(1) as any);

        if (drugMatch && drugMatch.length > 0) {
          setCameraActive(false);
          navigation.navigate('MedicineDetail', {
            drugId: drugMatch[0].id,
            stripData: {
              expiryDate: gs1.expiryDate ? gs1.expiryDate.toISOString().split('T')[0] : null,
              batchNumber: gs1.batchNumber,
              pillCount: null,
            },
          });
        }
      } catch (err) {
        console.warn('Barcode lookup error:', err);
      }
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);
    setStatusMessage('Capturing & running on-device OCR...');
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: true });
      if (!photo?.uri) throw new Error('No photo URI returned');
      setCameraActive(false);

      if (scanMode === 'prescription') {
        const ocrResult = await recognizeTextFromImage(photo.uri);
        let extracted = parsePrescriptionFromOcrText(ocrResult.lines);

        // Fallback / AI Vision mode: If user opted into AI Vision OR local OCR found 0 medicines
        const shouldRunAi = useAiVision || extracted.medicines.length === 0;

        if (shouldRunAi && photo.base64) {
          try {
            setStatusMessage('Deciphering clinical handwriting with Gemini AI...');
            const aiExtracted = await extractPrescriptionWithGeminiVision(photo.base64);
            if (aiExtracted.medicines.length > 0 || aiExtracted.patientName) {
              extracted = {
                ...extracted,
                ...aiExtracted,
                patientName: aiExtracted.patientName || extracted.patientName,
                doctorReg: aiExtracted.doctorReg || extracted.doctorReg,
                prescriptionDate: aiExtracted.prescriptionDate || extracted.prescriptionDate,
                medicines: aiExtracted.medicines.length > 0 ? aiExtracted.medicines : extracted.medicines,
                conditions: aiExtracted.conditions.length > 0 ? aiExtracted.conditions : extracted.conditions,
              };
            }
          } catch (aiErr) {
            console.warn('Gemini vision fallback failed, proceeding with ML Kit extraction:', aiErr);
          }
        }

        navigation.navigate('VerifyPrescription', {
          extractedData: extracted,
          rawText: ocrResult.text,
          photoUri: photo.uri,
        });
      } else {
        setStatusMessage('Matching medication against catalog...');
        const ocrResult = await recognizeTextFromImage(photo.uri);
        const [drugResult, stripData] = await Promise.all([
          findDrugFromOcrText(ocrResult.lines),
          Promise.resolve(parseMedicineStripFromOcrText(ocrResult.lines)),
        ]);

        if (stripData.expiryDate && stripData.expiryDate < new Date()) {
          Alert.alert(
            '⛔ Expired Medicine',
            `This medicine expired on ${stripData.expiryDate.toLocaleDateString()}. Please dispose of it safely.`,
            [{ text: 'OK', onPress: () => setCameraActive(true) }]
          );
          return;
        }

        if (drugResult.id) {
          navigation.navigate('MedicineDetail', {
            drugId: drugResult.id,
            stripData: {
              expiryDate: stripData.expiryDate ? stripData.expiryDate.toISOString().split('T')[0] : null,
              batchNumber: stripData.batchNumber,
              pillCount: stripData.pillCount,
            },
          });
        } else {
          Alert.alert(
            'No Match Found',
            `Could not find a medication matching:\n\n"${drugResult.searchTerms}"\n\nTry scanning again with better lighting, or scan the 2D DataMatrix code.`,
            [{ text: 'OK', onPress: () => setCameraActive(true) }]
          );
        }
      }
    } catch (err: any) {
      Alert.alert('Scan Failed', err.message || 'Unknown error occurred.');
      setCameraActive(true);
    } finally {
      setIsScanning(false);
      setStatusMessage('Analyzing image with OCR...');
    }
  };

  const frameW = scanMode === 'medicine' ? STRIP_W : PRESC_W;
  const frameH = scanMode === 'medicine' ? STRIP_H : PRESC_H;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Mode toggle bar ── */}
      <Animated.View entering={FadeInDown.duration(300)} style={styles.toggleBar}>
        <View style={styles.toggleTrack}>
          {(['medicine', 'prescription'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.toggleTab, scanMode === mode && styles.toggleTabActive]}
              onPress={() => setScanMode(mode)}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {mode === 'medicine' ? (
                  <Pill color={scanMode === mode ? '#FFF' : T.caption} size={16} />
                ) : (
                  <FileText color={scanMode === mode ? '#FFF' : T.caption} size={16} />
                )}
                <Text style={[styles.toggleText, scanMode === mode && styles.toggleTextActive]}>
                  {mode === 'medicine' ? 'Medicine Strip' : 'Prescription'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {scanMode === 'prescription' && (
          <TouchableOpacity
            style={[styles.aiToggleBtn, useAiVision && styles.aiToggleBtnActive]}
            onPress={() => setUseAiVision(!useAiVision)}
            accessibilityRole="button"
          >
            <Sparkles size={13} color={useAiVision ? '#FFF' : T.sageGreen} />
            <Text style={[styles.aiToggleText, useAiVision && styles.aiToggleTextActive]}>
              {useAiVision ? 'AI Handwriting: ON' : 'AI Handwriting Mode'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── Camera / processing view ── */}
      {cameraActive ? (
        <View style={styles.camera}>
          <CameraView 
            style={StyleSheet.absoluteFill} 
            ref={cameraRef} 
            facing="back"
            enableTorch={torchActive}
            barcodeScannerSettings={scanMode === 'medicine' ? {
              barcodeTypes: ['datamatrix', 'qr', 'ean13', 'code128', 'upc_a'],
            } : undefined}
            onBarcodeScanned={scanMode === 'medicine' ? handleBarcodeScanned : undefined}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Dim overlay */}
            <View style={styles.dimOverlay} />

            {/* Flash / Torch Toggle Control (User-controllable, manual) */}
            <Animated.View entering={FadeIn.duration(300)} style={styles.flashButtonWrap}>
              <TouchableOpacity
                style={[styles.flashToggleBtn, torchActive && styles.flashToggleBtnActive]}
                onPress={() => setTorchActive((prev) => !prev)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={torchActive ? 'Turn off camera flash' : 'Turn on camera flash'}
              >
                {torchActive ? (
                  <Zap size={16} color="#F59E0B" fill="#F59E0B" />
                ) : (
                  <ZapOff size={16} color="rgba(255,255,255,0.85)" />
                )}
                <Text style={[styles.flashToggleText, torchActive && styles.flashToggleTextActive]}>
                  {torchActive ? 'Flash ON' : 'Flash'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Bright scan frame cutout */}
            <View style={styles.frameContainer}>
              <View style={[styles.frameWindow, { width: frameW, height: frameH }]}>
                {/* Corner brackets */}
                <Corner style={styles.cornerTL} />
                <Corner style={[styles.cornerTR, { transform: [{ scaleX: -1 }] }]} />
                <Corner style={[styles.cornerBL, { transform: [{ scaleY: -1 }] }]} />
                <Corner style={[styles.cornerBR, { transform: [{ scaleX: -1 }, { scaleY: -1 }] }]} />

                {/* Animated scan line */}
                {!isScanning && <ScanLine height={frameH} />}
              </View>
            </View>

            {/* Instruction text */}
            <Animated.View entering={FadeIn.duration(400)} style={styles.instructionWrap}>
              <Text style={styles.instructionText}>
                {scanMode === 'medicine'
                  ? 'Align medicine strip or 2D barcode in frame'
                  : useAiVision
                  ? 'Position handwritten prescription for AI analysis'
                  : 'Position prescription document in frame'}
              </Text>
            </Animated.View>
          </View>
        </View>
      ) : (
        <View style={styles.processingView}>
          <ActivityIndicator color={T.sageGreen} size="large" />
          <Text style={styles.processingTitle}>Processing…</Text>
          <Text style={styles.processingSubtitle}>{statusMessage}</Text>
        </View>
      )}

      {/* ── Bottom capture bar ── */}
      <Animated.View entering={FadeInDown.duration(350)} style={styles.bottomBar}>
        <View style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>
            {scanMode === 'medicine' ? 'Medicine strip' : 'Prescription document'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.captureRing, isScanning && styles.captureRingDisabled]}
          onPress={handleCapture}
          disabled={isScanning || !cameraActive}
          accessibilityRole="button"
        >
          <View style={[styles.captureBtn, isScanning && { opacity: 0.6 }]}>
            {isScanning ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.captureBtnText}>SCAN</Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: T.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  permIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: T.sageGreen + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: T.sageGreen + '44',
  },
  permIcon: { fontSize: 44 },
  permTitle: { fontSize: 22, fontWeight: '700', color: T.textColor, marginBottom: 10, textAlign: 'center' },
  permSub: { fontSize: T.fontSize.caption, color: T.caption, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  permBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: T.radius.large,
    ...T.subtleShadow,
  },
  permBtnText: { color: '#FFF', fontWeight: '700', fontSize: T.fontSize.body },

  // Toggle
  toggleBar: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: T.radius.pill,
    padding: 3,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: T.radius.pill,
    alignItems: 'center',
  },
  toggleTabActive: { backgroundColor: T.sageGreenSolid },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: T.fontSize.caption },
  toggleTextActive: { color: '#FFF', fontWeight: '700' },
  aiToggleBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: T.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: T.sageGreen + '55',
    alignSelf: 'center',
  },
  aiToggleBtnActive: {
    backgroundColor: T.sageGreenSolid,
    borderColor: T.sageGreen,
  },
  aiToggleText: {
    color: T.sageGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  aiToggleTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },

  // Camera
  camera: { flex: 1 },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  flashButtonWrap: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 20,
  },
  flashToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  flashToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderColor: '#F59E0B',
  },
  flashToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  flashToggleTextActive: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  frameContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameWindow: {
    backgroundColor: 'transparent',
    borderRadius: CORNER,
    overflow: 'hidden',
  },

  // Corner brackets
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
  },
  cornerH: { position: 'absolute', top: 0, left: 0, backgroundColor: T.sageGreen },
  cornerV: { position: 'absolute', top: 0, left: 0, backgroundColor: T.sageGreen },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },

  // Scan line
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: T.sageGreen,
    opacity: 0.8,
    shadowColor: T.sageGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Instruction
  instructionWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFF',
    fontSize: T.fontSize.caption,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: T.radius.pill,
    fontWeight: '500',
    overflow: 'hidden',
  },

  // Processing view
  processingView: {
    flex: 1,
    backgroundColor: T.cameraOverlayDark,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  processingTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 8 },
  processingSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: T.fontSize.caption },

  // Bottom bar
  bottomBar: {
    backgroundColor: 'rgba(15, 15, 15, 0.92)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  bottomHint: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: T.radius.pill,
  },
  bottomHintText: { color: 'rgba(255,255,255,0.55)', fontSize: T.fontSize.caption, fontWeight: '500' },
  captureRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: T.sageGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureRingDisabled: { opacity: 0.4 },
  captureBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: T.sageGreenSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
});
