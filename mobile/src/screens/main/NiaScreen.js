// FILE: mobile/src/screens/main/NiaScreen.js
// Production-Grade Executive AI Screen — Seamless Header, Minimalist Monochrome Action Cards,
// Floating Pill Composer, In-Flow Typing Dots, History/Export Modal, Haptics & Zero Crash Fallbacks

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
  MoreHorizontal, ArrowUp, FileText, CheckCircle2, Share2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ChatBubble from '../../components/nia/ChatBubble';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { ENDPOINTS } from '../../constants/apiConfig';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { triggerHaptic } from '../../utils/haptics';

const SESSIONS_STORAGE_KEY = 'nutriai_chat_sessions';

const SUGGESTED_PROMPTS = [
  { label: '7-Day Meal Plan', icon: Flame },
  { label: 'High Protein Guide', icon: Dumbbell },
  { label: 'Healthy Snacks', icon: Apple },
  { label: 'Calorie Deficit', icon: Zap },
];

const WELCOME_CARDS = [
  {
    icon: Flame,
    title: 'Personalized Meal Plan',
    desc: 'Get structured breakfast, lunch & dinner tailored to your calorie goal.',
    prompt: 'Create a personalized Indian meal plan based on my calorie target.',
  },
  {
    icon: Dumbbell,
    title: 'Protein Maximizer',
    desc: 'Discover high-protein veg and non-veg food options.',
    prompt: 'Give me a list of top high-protein foods (veg & non-veg) with macros.',
  },
  {
    icon: Zap,
    title: 'Fat Loss Strategy',
    desc: 'Actionable tips for healthy calorie deficit and fat loss.',
    prompt: 'How can I maintain a healthy calorie deficit without losing muscle?',
  },
];

const INITIAL_MSG = {
  id: 'init_0',
  type: 'ai',
  text: "Hello! I'm Nia, your AI nutrition & diet strategist. How can I help optimize your nutrition today?",
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
          Animated.timing(dot, { toValue: -4, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(500),
        ])
      );
    const a1 = bounce(dot1, 0);
    const a2 = bounce(dot2, 140);
    const a3 = bounce(dot3, 280);
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
      <View style={[typingStyles.avatar, { backgroundColor: isDark ? 'rgba(20,184,166,0.2)' : 'rgba(20,184,166,0.12)' }]}>
        <Sparkles size={13} color={COLORS.primary} />
      </View>
      <View style={[typingStyles.bubble, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[typingStyles.thinkingText, { color: colors.textMuted }]}>Nia is writing</Text>
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
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.xl,
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
  const { isDark, colors } = useTheme();

  // Sessions & Active Conversation
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(() => String(Date.now()));
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const listRef = useRef(null);

  // Pick / Attach File or Photo for Nia
  const handleAttachFile = async () => {
    triggerHaptic('light');
    Alert.alert('Attach File or Photo 📎', 'Select a meal photo or nutrition document to analyze with Nia:', [
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
            triggerHaptic('selection');
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission Required', 'Please grant photo library access.');
            return;
          }
          const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
          if (!res.canceled && res.assets[0]?.uri) {
            const asset = res.assets[0];
            const name = asset.fileName || 'attached_photo.jpg';
            setAttachedFile({ uri: asset.uri, name, type: 'image/jpeg' });
            triggerHaptic('selection');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Fresh new chat initialization
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

  // Start New Chat
  const handleNewChat = () => {
    triggerHaptic('medium');
    const newId = String(Date.now());
    setActiveSessionId(newId);
    setMessages([INITIAL_MSG]);
    setAttachedFile(null);
  };

  // Select Past Session from History
  const handleSelectPastSession = (session) => {
    triggerHaptic('selection');
    setActiveSessionId(session.id);
    setMessages(session.messages || [INITIAL_MSG]);
    setShowHistoryModal(false);
    setShowOptionsModal(false);
  };

  // Delete Session from History
  const handleDeleteSession = (sessionIdToDelete) => {
    const targetId = sessionIdToDelete || activeSessionId;
    triggerHaptic('warning');
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
          setShowOptionsModal(false);
          triggerHaptic('light');
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
    triggerHaptic('medium');

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
      triggerHaptic('success');

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
    } catch (err) {
      triggerHaptic('error');
      const fallbackMsg = {
        id: String(Date.now() + 1),
        type: 'ai',
        text: "I couldn't reach the nutrition server right now. Please verify your connection and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasMealPlan: false,
      };
      setMessages([...updatedUserList, fallbackMsg]);
    } finally {
      setSending(false);
      setAttachedFile(null);
    }
  };

  // Export Chat as PDF
  const handleExportChatPdf = async () => {
    setShowOptionsModal(false);
    triggerHaptic('light');
    setExportingPdf(true);
    try {
      const todayDate = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });
      const cleanFileName = `Nia_Diet_Plan_${new Date().toISOString().slice(0, 10)}.pdf`;

      const conversationHtml = messages
        .filter((m) => m.id !== 'init_0')
        .map((m) => {
          const isAi = m.type === 'ai';
          const bg = isAi ? '#F8FAFC' : '#10B98115';
          const border = isAi ? '#E2E8F0' : '#10B98140';
          const sender = isAi ? 'Nia AI Nutritionist' : 'You';
          const senderColor = isAi ? '#0D9488' : '#059669';

          return `
            <div style="margin-bottom: 16px; padding: 12px 16px; background-color: ${bg}; border: 1px solid ${border}; border-radius: 8px; page-break-inside: avoid;">
              <div style="font-size: 11px; font-weight: 800; color: ${senderColor}; margin-bottom: 4px; text-transform: uppercase;">${sender} • <span style="font-weight: 400; color: #94A3B8;">${m.timestamp || ''}</span></div>
              <div style="font-size: 12px; color: #1E293B; line-height: 1.5; white-space: pre-wrap;">${m.text}</div>
            </div>
          `;
        })
        .join('');

      const formattedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${cleanFileName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0F172A; background: #FFFFFF; font-size: 12px; }
              .header { border-bottom: 2px solid #0D9488; padding-bottom: 12px; margin-bottom: 20px; }
              .title { font-size: 20px; font-weight: 800; color: #0D9488; }
              .meta { font-size: 10px; color: #64748B; margin-top: 4px; }
              .footer { text-align: center; margin-top: 24px; font-size: 10px; color: #94A3B8; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">NutriAI ✦ Personalized Nutrition Consultation</div>
              <div class="meta">Exported on: ${todayDate} | Assistant: Nia AI Nutrition Coach</div>
            </div>
            ${conversationHtml || '<p style="color: #94A3B8;">No conversation messages to export.</p>'}
            <div class="footer">NutriAI • Healthy Living & Macro Tracking</div>
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
      triggerHaptic('success');
    } catch (err) {
      console.warn('PDF export error:', err);
      Alert.alert('Export Notice', 'Could not export PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const isOnlyInitial = messages.length === 1 && messages[0].id === 'init_0';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {/* Seamless Minimalist Header Bar */}
      <View style={[styles.topBar, { backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={styles.coachInfo}>
          <View style={styles.coachHeaderRow}>
            <Text style={[styles.coachName, { color: colors.text }]}>Nia AI</Text>
            <View style={[styles.activePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.10)' }]}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Coach</Text>
            </View>
          </View>
          <Text style={[styles.niaSubtitle, { color: colors.textMuted }]}>AI Nutritionist & Meal Strategist</Text>
        </View>

        {/* Clean Header Action Group */}
        <View style={styles.actionHeaderGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.headerPillBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
            ]}
            onPress={handleNewChat}
            hitSlop={8}
          >
            <Plus size={15} color={colors.text} />
            <Text style={[styles.headerPillText, { color: colors.text }]}>New</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.headerIconBtn,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
              pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
            ]}
            onPress={() => {
              triggerHaptic('light');
              setShowOptionsModal(true);
            }}
            hitSlop={8}
          >
            <MoreHorizontal size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
      >
        {/* Chat Messages / Welcome State */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => String(item.id || item.timestamp || Math.random())}
          renderItem={({ item }) => (
            <ChatBubble
              message={item}
              isUser={item.type === 'user'}
            />
          )}
          ListHeaderComponent={
            isOnlyInitial ? (
              <View style={styles.welcomeHero}>
                <View style={[styles.welcomeIconWrap, { backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.08)' }]}>
                  <Sparkles size={26} color={COLORS.primary} />
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>How can I assist your nutrition?</Text>
                <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>
                  Ask custom diet plans, protein sources, calorie deficit targets, or meal ideas.
                </Text>

                {/* Quick Action Cards */}
                <View style={styles.welcomeCardsWrap}>
                  {WELCOME_CARDS.map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <Pressable
                        key={idx}
                        style={({ pressed }) => [
                          styles.welcomeCard,
                          { backgroundColor: colors.bgCard, borderColor: colors.border },
                          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                        ]}
                        onPress={() => sendMessage(card.prompt)}
                      >
                        <View style={[styles.welcomeCardIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }]}>
                          <CardIcon size={16} color={COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.welcomeCardTitle, { color: colors.text }]}>{card.title}</Text>
                          <Text style={[styles.welcomeCardDesc, { color: colors.textMuted }]}>{card.desc}</Text>
                        </View>
                        <ChevronRight size={16} color={colors.textMuted} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={sending ? <InFlowTypingBubble isDark={isDark} colors={colors} /> : null}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* Floating Minimalist Capsule Composer */}
        <View style={styles.floatingComposerWrap}>
          {/* Quick Capsule Prompt Chips (Visible only when conversation is active) */}
          {!isOnlyInitial && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptListContent}>
              {SUGGESTED_PROMPTS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Pressable
                    key={idx}
                    style={({ pressed }) => [
                      styles.promptChip,
                      { backgroundColor: colors.bgCard, borderColor: colors.border },
                      pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
                    ]}
                    onPress={() => sendMessage(item.label)}
                  >
                    <Icon size={12} color={colors.textMuted} />
                    <Text style={[styles.promptChipText, { color: colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Attached File Preview */}
          {attachedFile && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1E293B' : '#EFFDF8',
                borderRadius: RADIUS.lg,
                paddingHorizontal: 12,
                paddingVertical: 6,
                marginBottom: 6,
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Paperclip size={13} color={COLORS.primary} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text, flex: 1 }} numberOfLines={1}>
                {attachedFile.name}
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setAttachedFile(null);
                }}
                hitSlop={6}
              >
                <X size={14} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {/* Island Capsule Input Bar */}
          <View style={[styles.floatingPillBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.attachIconBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleAttachFile}
              hitSlop={6}
            >
              <Paperclip size={16} color={attachedFile ? COLORS.primary : colors.textMuted} />
            </Pressable>

            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder={attachedFile ? 'Add a message with attachment...' : 'Ask Nia anything...'}
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />

            <Pressable
              style={({ pressed }) => [
                styles.sendCircleBtn,
                (!input.trim() && !attachedFile || sending)
                  ? [styles.sendCircleBtnDisabled, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]
                  : { backgroundColor: COLORS.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.94 }] },
              ]}
              onPress={() => sendMessage()}
              disabled={(!input.trim() && !attachedFile) || sending}
            >
              <ArrowUp size={17} color={(input.trim() || attachedFile) && !sending ? '#FFFFFF' : colors.textMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Options Menu Modal */}
      <Modal visible={showOptionsModal} animationType="fade" transparent onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsSheet, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.sheetHandle} />

            <Text style={[styles.sheetTitle, { color: colors.text }]}>Conversation Options</Text>

            <Pressable
              style={styles.sheetOptionRow}
              onPress={() => {
                setShowOptionsModal(false);
                setTimeout(() => setShowHistoryModal(true), 150);
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }]}>
                <History size={17} color={colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: colors.text }]}>Chat History</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.textMuted }]}>View or resume past conversations</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              style={styles.sheetOptionRow}
              onPress={handleExportChatPdf}
              disabled={exportingPdf}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }]}>
                <Download size={17} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: colors.text }]}>Export as PDF</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.textMuted }]}>Download full diet plan document</Text>
              </View>
              {exportingPdf ? <ActivityIndicator size="small" color={COLORS.primary} /> : <ChevronRight size={16} color={colors.textMuted} />}
            </Pressable>

            <Pressable
              style={[styles.sheetOptionRow, { borderBottomWidth: 0 }]}
              onPress={() => handleDeleteSession()}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                <Trash2 size={17} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetOptionText, { color: '#EF4444' }]}>Clear Conversation</Text>
                <Text style={[styles.sheetOptionSub, { color: colors.textMuted }]}>Delete current chat messages</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* History Sessions Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleGroup}>
                <History size={18} color={COLORS.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Past Chat Sessions</Text>
              </View>
              <Pressable
                onPress={() => setShowHistoryModal(false)}
                hitSlop={8}
              >
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {sessions.length === 0 ? (
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginVertical: 24, fontSize: 13 }}>No past sessions saved yet</Text>
              ) : (
                sessions.map((s) => (
                  <Pressable
                    key={s.id}
                    style={[
                      styles.sessionRow,
                      { borderColor: colors.border },
                      activeSessionId === s.id && { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)' },
                    ]}
                    onPress={() => handleSelectPastSession(s)}
                  >
                    <MessageSquare size={16} color={COLORS.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionTitle, { color: colors.text }]} numberOfLines={1}>{s.title}</Text>
                      <Text style={[styles.sessionSub, { color: colors.textMuted }]}>{s.timestamp}</Text>
                    </View>

                    <Pressable onPress={() => handleDeleteSession(s.id)} hitSlop={8}>
                      <Trash2 size={15} color="#EF4444" />
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
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  coachInfo: { flex: 1 },
  coachHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coachName: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' },
  activeText: { fontSize: 10, fontWeight: '800', color: '#10B981' },
  niaSubtitle: { fontSize: 11, fontWeight: '500', marginTop: 1 },

  actionHeaderGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  headerPillText: { fontSize: 12, fontWeight: '800' },
  headerIconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  welcomeHero: { paddingHorizontal: SPACING.base, paddingVertical: SPACING.lg, alignItems: 'center' },
  welcomeIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  welcomeTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center', marginBottom: 4 },
  welcomeSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16, marginBottom: SPACING.lg },
  welcomeCardsWrap: { width: '100%', gap: 10 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: RADIUS.xl, borderWidth: 1, gap: 12, ...SHADOWS.sm },
  welcomeCardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  welcomeCardTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  welcomeCardDesc: { fontSize: 11, lineHeight: 15 },

  promptListContent: { paddingHorizontal: SPACING.base, gap: 6, marginBottom: 8 },
  promptChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  promptChipText: { fontSize: 11, fontWeight: '700' },

  messageContent: { padding: SPACING.base, paddingBottom: 20 },

  floatingComposerWrap: {
    paddingHorizontal: SPACING.base,
    paddingBottom: Platform.OS === 'ios' ? 10 : 12,
    paddingTop: 4,
  },
  floatingPillBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...SHADOWS.sm,
  },
  attachIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  input: { flex: 1, fontSize: 14, maxHeight: 90, paddingVertical: 6, paddingHorizontal: 4 },
  sendCircleBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  sendCircleBtnDisabled: {},

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(3,7,18,0.70)', justifyContent: 'flex-end' },
  optionsSheet: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], padding: SPACING.lg, borderWidth: 1 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#94A3B8', alignSelf: 'center', marginBottom: 16, opacity: 0.5 },
  sheetTitle: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, marginBottom: 14 },
  sheetOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(15,23,42,0.06)' },
  sheetOptionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheetOptionText: { fontSize: 14, fontWeight: '800' },
  sheetOptionSub: { fontSize: 11, marginTop: 1 },

  modalCard: { borderTopLeftRadius: RADIUS['2xl'], borderTopRightRadius: RADIUS['2xl'], maxHeight: '75%', padding: SPACING.lg, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  modalTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8, borderRadius: RADIUS.lg, borderBottomWidth: 1 },
  sessionTitle: { fontSize: 13, fontWeight: '700' },
  sessionSub: { fontSize: 11, marginTop: 2 },
});
