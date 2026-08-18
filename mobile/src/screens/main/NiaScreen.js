// FILE: mobile/src/screens/main/NiaScreen.js
// HealthifyMe & ChatGPT Inspired Nia AI Screen — Always Opens as New Chat, Left/Right Bubbles, Responsive Bottom Composer, In-Flow Typing Dots, History Separation, Multi-Language, PDF Export

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Send, Sparkles, Trash2, Mic, Paperclip, Plus, History, X,
  ChevronRight, MessageSquare, Flame, Dumbbell, Apple, Zap, Download,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ChatBubble from '../../components/nia/ChatBubble';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/apiConfig';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const SESSIONS_STORAGE_KEY = 'nutriai_chat_sessions';

const SUGGESTED_PROMPTS = [
  { label: 'Fat Loss Meal Plan', icon: Flame, color: '#EF4444' },
  { label: 'High Protein Guide', icon: Dumbbell, color: '#6366F1' },
  { label: 'Healthy Indian Snacks', icon: Apple, color: '#10B981' },
  { label: 'Calorie Deficit Advice', icon: Zap, color: '#F59E0B' },
];

const INITIAL_MSG = {
  id: 'init_0',
  type: 'ai',
  text: "Hi! I'm Nia AI ✦ Your personal AI nutrition coach. Ask me anything about your diet, calorie goals, macros, or custom meal plans!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  hasMealPlan: false,
};

// Left-aligned in-flow typing animation for incoming AI response
function InFlowTypingBubble({ isDark, colors }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (dot, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 150);
    const a3 = bounce(dot3, 300);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, []);

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.avatar}>
        <Sparkles size={14} color="#ffffff" />
      </View>
      <View style={[typingStyles.bubble, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[typingStyles.thinkingText, { color: colors.textMuted }]}>Nia is thinking</Text>
        <View style={typingStyles.dotsRow}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View key={i} style={[typingStyles.dot, { transform: [{ translateY: d }] }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
    paddingHorizontal: SPACING.base,
    gap: 8,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  thinkingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.primary },
});

export default function NiaScreen() {
  const { userData, userMetrics } = useAuth();
  const { isDark, colors } = useTheme();

  // Sessions & Active Conversation
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => String(Date.now()));
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const listRef = useRef(null);

  // Pick / Attach File or Photo for Nia
  const handleAttachFile = async () => {
    Alert.alert('Attach File or Photo 📎', 'Select a meal photo, lab report, or diet document to share with Nia:', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Required', 'Please grant camera access to take a photo.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
          if (!res.canceled && res.assets[0]?.uri) {
            const asset = res.assets[0];
            setAttachedFile({ uri: asset.uri, name: 'meal_photo.jpg', type: 'image/jpeg' });
          }
        },
      },
      {
        text: 'Choose from Gallery / Files',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Required', 'Please grant photo library access.');
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
          if (!res.canceled && res.assets[0]?.uri) {
            const asset = res.assets[0];
            const name = asset.fileName || 'attached_document.jpg';
            setAttachedFile({ uri: asset.uri, name, type: 'image/jpeg' });
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // 1. ALWAYS OPEN AS A FRESH NEW CHAT:
  // Load saved session list into memory for History modal, but keep active view fresh!
  useEffect(() => {
    AsyncStorage.getItem(SESSIONS_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSessions(parsed);
          }
        }
      })
      .catch((e) => console.warn('Could not load sessions:', e));

    // Fresh chat initialization
    const freshId = String(Date.now());
    setActiveSessionId(freshId);
    setMessages([INITIAL_MSG]);
  }, []);

  const saveSessions = (updatedSessions) => {
    setSessions(updatedSessions);
    AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updatedSessions)).catch((e) =>
      console.warn('Could not save sessions:', e)
    );
  };

  // Start New Chat (+ Button)
  const handleNewChat = () => {
    const newId = String(Date.now());
    setActiveSessionId(newId);
    setMessages([INITIAL_MSG]);
  };

  // Select Past Session from History Modal
  const handleSelectPastSession = (session) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || [INITIAL_MSG]);
    setShowHistoryModal(false);
  };

  // Delete Session from History
  const handleDeleteSession = (sessionIdToDelete) => {
    const targetId = sessionIdToDelete || activeSessionId;
    Alert.alert('Delete Session 🗑️', 'Are you sure you want to delete this chat session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const next = sessions.filter((s) => s.id !== targetId);
          saveSessions(next);
          if (targetId === activeSessionId) {
            handleNewChat();
          }
          setShowHistoryModal(false);
        },
      },
    ]);
  };

  const scrollToEnd = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages, sending]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    setInput('');

    const userMsg = {
      id: String(Date.now()),
      type: 'user',
      text: msg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedUserList = [...messages, userMsg];
    setMessages(updatedUserList);
    setSending(true);

    try {
      const res = await api.post(ENDPOINTS.niaChat, {
        message: msg,
        profile: userData,
      });

      const aiText = res.data.ai_response || res.data.response || res.data.message;
      const lower = msg.toLowerCase();
      const isExplicitMealPlan = lower.includes('meal plan') || lower.includes('diet plan') || lower.includes('7-day') || lower.includes('diet');

      const aiMsg = {
        id: String(Date.now() + 1),
        type: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasMealPlan: isExplicitMealPlan,
      };

      const finalMsgs = [...updatedUserList, aiMsg];
      setMessages(finalMsgs);

      // Save to sessions history with proper snippet
      const titleSnippet = msg.length > 32 ? `${msg.substring(0, 30)}...` : msg;
      const existingIdx = sessions.findIndex((s) => s.id === activeSessionId);
      let nextSessions;
      if (existingIdx >= 0) {
        nextSessions = [...sessions];
        nextSessions[existingIdx] = {
          ...nextSessions[existingIdx],
          messages: finalMsgs,
        };
      } else {
        nextSessions = [
          {
            id: activeSessionId,
            title: titleSnippet,
            timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
            messages: finalMsgs,
          },
          ...sessions,
        ];
      }
      saveSessions(nextSessions);
    } catch (e) {
      // Show a real error message — do NOT fall back to local canned replies
      const errMsg = {
        id: String(Date.now() + 1),
        type: 'ai',
        text: e?.normalizedMessage || 'Unable to reach Nia right now. Please check your connection and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasMealPlan: false,
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  // Export & Download Chat / Diet Plan as PDF
  const handleExportChatPdf = async () => {
    if (messages.length <= 1) {
      Alert.alert('No Content', 'Ask Nia to create a diet plan or chat first to generate and download your personalized report.');
      return;
    }

    setExportingPdf(true);
    try {
      const userName = (userData?.firstName || userData?.name || 'Member').replace(/[^a-zA-Z0-9_-]/g, '_');
      const todayDate = new Date().toISOString().slice(0, 10);
      const cleanFileName = `NutriAI_Diet_Plan_${userName}_${todayDate}.pdf`;

      const formattedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${cleanFileName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 28px; color: #0f172a; line-height: 1.6; }
              .header { border-bottom: 2px solid #14b8a6; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
              .logo { font-size: 22px; font-weight: 900; color: #14b8a6; }
              .doc-title { font-size: 14px; font-weight: 800; color: #6366f1; text-transform: uppercase; }
              .user-info { font-size: 11px; color: #64748b; margin-top: 4px; }
              .msg-box { margin-bottom: 14px; padding: 12px 16px; border-radius: 8px; font-size: 12px; }
              .msg-user { background: #f1f5f9; border-left: 4px solid #6366f1; text-align: right; }
              .msg-ai { background: #ecfdf5; border-left: 4px solid #10b981; }
              .sender { font-weight: 800; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; color: #475569; }
              .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 24px; font-size: 9px; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="logo">NutriAI • Nia AI Coach</div>
                <div class="user-info">Member: <strong>${userData?.name || 'Member'}</strong> • Goal: ${userData?.mainGoal || 'Nutrition & Wellness'}</div>
              </div>
              <div style="text-align: right;">
                <div class="doc-title">Diet Consultation</div>
                <div class="user-info">${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            ${messages
              .filter((m) => m.id !== 'init_0')
              .map(
                (m) => `
                <div class="msg-box ${m.type === 'user' ? 'msg-user' : 'msg-ai'}">
                  <div class="sender">${m.type === 'user' ? 'You' : 'Nia AI ✦'} (${m.timestamp || ''})</div>
                  <div style="white-space: pre-wrap;">${m.text}</div>
                </div>
              `
              )
              .join('')}

            <div class="footer">
              Generated by NutriAI Clinical AI Coach • For personal dietary reference
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: formattedHtml });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download ${cleanFileName}`,
        });
      } else {
        Alert.alert('Diet Plan Generated', `Saved as ${cleanFileName}`);
      }
    } catch (err) {
      console.warn('PDF export error:', err);
      Alert.alert('Export Notice', 'Could not export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.coachInfo}>
          <View style={styles.coachHeaderRow}>
            <Text style={styles.coachName}>Nia AI ✦</Text>
            <View style={styles.onlinePulseBadge}>
              <View style={styles.greenDot} />
              <Text style={styles.onlinePulseText}>Active Coach</Text>
            </View>
          </View>
          <Text style={styles.niaTitle}>Multi-language AI Nutrition Assistant</Text>
        </View>

        {/* Action Header Group */}
        <View style={styles.actionHeaderGroup}>
          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
            onPress={handleExportChatPdf}
            disabled={exportingPdf}
            hitSlop={6}
          >
            {exportingPdf ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Download size={16} color="#ffffff" />
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
            onPress={handleNewChat}
            hitSlop={6}
          >
            <Plus size={16} color="#ffffff" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
            onPress={() => setShowHistoryModal(true)}
            hitSlop={6}
          >
            <History size={16} color="#ffffff" />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.8 }]}
            onPress={() => handleDeleteSession()}
            hitSlop={6}
          >
            <Trash2 size={15} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* Suggested Category Chips */}
        <View style={[styles.promptScrollWrap, { backgroundColor: isDark ? '#0f172a' : '#F1F5F9' }]}>
          <FlatList
            horizontal
            data={SUGGESTED_PROMPTS}
            keyExtractor={(item) => item.label}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const Icon = item.icon;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.promptChip,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => sendMessage(item.label)}
                >
                  <Icon size={13} color={item.color} />
                  <Text style={[styles.promptChipText, { color: colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.promptListContent}
          />
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isUser={item.type === 'user'}
            />
          )}
          style={styles.messageList}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={sending ? <InFlowTypingBubble isDark={isDark} colors={colors} /> : null}
          onContentSizeChange={scrollToEnd}
        />

        {/* ChatGPT Style Floating Bottom Composer */}
        <View style={styles.floatingComposerWrap}>
          {/* Attachment Preview Chip */}
          {attachedFile && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.bgCard,
                borderColor: COLORS.primary,
                borderWidth: 1.5,
                borderRadius: RADIUS.lg,
                paddingHorizontal: 10,
                paddingVertical: 6,
                marginBottom: 6,
                alignSelf: 'flex-start',
                maxWidth: '90%',
                gap: 8,
              }}
            >
              <Paperclip size={14} color={COLORS.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }} numberOfLines={1}>
                {attachedFile.name}
              </Text>
              <Pressable onPress={() => setAttachedFile(null)} hitSlop={6}>
                <X size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          <View style={[styles.floatingPillBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {/* File / Photo Upload Action */}
            <Pressable
              style={({ pressed }) => [
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  marginRight: 6,
                },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleAttachFile}
              hitSlop={4}
            >
              <Paperclip size={16} color={attachedFile ? COLORS.primary : colors.textSecondary} />
            </Pressable>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={attachedFile ? 'Add a question about this attachment...' : 'Ask Nia in English, বাংলা, or हिंदी...'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />

            <Pressable
              style={[
                styles.sendCircleBtn,
                (!input.trim() && !attachedFile || sending) && styles.sendCircleBtnDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={(!input.trim() && !attachedFile) || sending}
            >
              <Send size={15} color={(input.trim() || attachedFile) && !sending ? '#ffffff' : COLORS.textMuted} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* History Sessions Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <History size={18} color={COLORS.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Chat History Sessions</Text>
              </View>
              <Pressable onPress={() => setShowHistoryModal(false)} hitSlop={8}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {sessions.length === 0 ? (
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 20 }}>No saved chat history</Text>
              ) : (
                sessions.map((s) => (
                  <Pressable
                    key={s.id}
                    style={[
                      styles.sessionRow,
                      { borderColor: colors.border },
                      activeSessionId === s.id && { backgroundColor: 'rgba(16,185,129,0.1)' },
                    ]}
                    onPress={() => handleSelectPastSession(s)}
                  >
                    <MessageSquare size={16} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{s.title}</Text>
                      <Text style={[styles.sessionSub, { color: colors.textMuted }]}>{s.timestamp}</Text>
                    </View>

                    <Pressable onPress={() => handleDeleteSession(s.id)} hitSlop={8}>
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coachInfo: { flex: 1 },
  coachHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coachName: { fontSize: 18, fontWeight: '900', color: '#ffffff', letterSpacing: -0.3 },
  onlinePulseBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.18)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  onlinePulseText: { fontSize: 10, fontWeight: '800', color: '#34D399' },
  niaTitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  actionHeaderGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerIconBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  promptScrollWrap: { paddingVertical: 8 },
  promptListContent: { paddingHorizontal: SPACING.base, gap: 8 },
  promptChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1 },
  promptChipText: { fontSize: 12, fontWeight: '700' },

  messageList: { flex: 1 },
  messageContent: { padding: SPACING.base, paddingBottom: 90 },

  floatingComposerWrap: {
    paddingHorizontal: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    paddingTop: 4,
  },
  floatingPillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...SHADOWS.md,
  },
  input: { flex: 1, fontSize: 14, maxHeight: 100, paddingVertical: 8 },
  sendCircleBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  sendCircleBtnDisabled: { backgroundColor: '#E2E8F0' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,7,18,0.75)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '80%', padding: SPACING.lg, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '700' },
  sessionSub: { fontSize: 11, marginTop: 2 },
});
