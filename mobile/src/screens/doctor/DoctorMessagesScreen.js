import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../theme/colors";
import { supabase } from "../../services/supabase";

export default function DoctorMessagesScreen({ navigation }) {
  const [filter, setFilter] = useState("All");
  const [activeChat, setActiveChat] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          sender:sender_id ( full_name )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.warn("Could not fetch messages:", err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    const textToSend = replyText;
    setReplyText("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("messages").insert([
          {
            sender_id: user.id,
            receiver_id: activeChat?.sender_id || user.id,
            content: textToSend,
          },
        ]);
        fetchMessages();
      }
    } catch (err) {
      console.warn("Could not send reply:", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (activeChat) setActiveChat(null);
              else navigation.goBack();
            }}
            accessibilityLabel="Back"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {activeChat ? activeChat.sender?.full_name || "Patient" : "Direct Messages"}
          </Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={fetchMessages}
            accessibilityLabel="Refresh Messages"
          >
            <Text style={styles.backIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {!activeChat ? (
          <>
            {/* Filter Tabs */}
            <View style={styles.tabBar}>
              {["All", "Patient Chats"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabItem,
                    filter === tab && styles.tabItemActive,
                  ]}
                  onPress={() => setFilter(tab)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      filter === tab && styles.tabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Chats List */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Fetching messages...</Text>
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>💬</Text>
                  <Text style={styles.emptyTitle}>No Messages Yet</Text>
                  <Text style={styles.emptyDesc}>
                    When patients send post-op inquiries or checkup follow-ups, their message threads will appear here in real time.
                  </Text>
                </View>
              ) : (
                messages.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    style={styles.chatRow}
                    activeOpacity={0.75}
                    onPress={() => setActiveChat(chat)}
                  >
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientAvatarText}>
                        {(chat.sender?.full_name || "P").slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.chatNameRow}>
                        <Text style={styles.patientName}>
                          {chat.sender?.full_name || "Patient"}
                        </Text>
                        <Text style={styles.chatTime}>
                          {new Date(chat.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {chat.content}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </>
        ) : (
          /* Active Chat Thread View */
          <View style={styles.chatView}>
            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
            >
              <View style={styles.incomingBubble}>
                <Text style={styles.bubbleText}>{activeChat.content}</Text>
                <Text style={styles.bubbleTime}>
                  {new Date(activeChat.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="Type clinical advice or guidance..."
                placeholderTextColor={colors.muted}
                value={replyText}
                onChangeText={setReplyText}
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendReply}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 18,
    color: colors.text,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.muted,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  patientAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
  },
  chatNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  patientName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  chatTime: {
    fontSize: 11,
    color: colors.muted,
  },
  lastMessage: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
  chatView: {
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  incomingBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: "80%",
  },
  bubbleText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  bubbleTime: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputBar: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});
