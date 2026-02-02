import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  StatusBar,
  TextInput,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ChatService, AgentInfo } from '../../services/ChatService';
import { processExpenseMarkdown, createMarkdownStyles } from '../../utils/markdownUtils';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface DedicatedChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface DedicatedChatModalRef {
  sendMessage: (messageText: string) => Promise<void>;
}

const { height: screenHeight } = Dimensions.get('window');

// Three dot loader animation component
const ThreeDotLoader = ({ textColor }: { textColor: string }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDots = () => {
      const animateDot = (dot: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.delay(400),
          ])
        );
      };

      animateDot(dot1, 0).start();
      animateDot(dot2, 200).start();
      animateDot(dot3, 400).start();
    };

    animateDots();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDotsContainer}>
      <Animated.View style={[styles.typingDot, { opacity: dot1, backgroundColor: textColor }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot2, backgroundColor: textColor }]} />
      <Animated.View style={[styles.typingDot, { opacity: dot3, backgroundColor: textColor }]} />
    </View>
  );
};

export const DedicatedChatModal = forwardRef<DedicatedChatModalRef, DedicatedChatModalProps>(({
  visible,
  onClose,
}, ref) => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [agentInfoFetched, setAgentInfoFetched] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [agentName, setAgentName] = useState('AI Assistant');
  
  const flatListRef = useRef<FlatList>(null);

  // Chat colors
  const chatColors = useMemo(() => ({
    background: colors.background,
    messageBackground: colors.card,
    userMessageBackground: colors.primary,
    text: colors.foreground,
    textSecondary: colors.mutedForeground,
    border: colors.border,
  }), [colors]);

  // Expose sendMessage function
  useImperativeHandle(ref, () => ({
    sendMessage: async (messageText: string) => {
      await sendMessage(messageText);
    },
  }));

  // Fetch agent info
  const fetchAgentInfo = useCallback(async () => {
    if (agentInfoFetched) return;
    
    try {
      const agentInfo: AgentInfo = await ChatService.getAgentInfo();
      
      // Set the real agent name
      if (agentInfo.agent_config?.agent_name) {
        setAgentName(agentInfo.agent_config.agent_name);
      }
      
      if (agentInfo.agent_config?.agent_welcome_message && messages.length === 0) {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: agentInfo.agent_config.agent_welcome_message,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
      }
      
      setAgentInfoFetched(true);
    } catch (error) {
    }
  }, [agentInfoFetched, messages.length]);

  // Send message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setInputText('');

    try {
      const stream: ReadableStream<Uint8Array> | null = await ChatService.sendMessage(messageText.trim());
      
      if (!stream) {
        throw new Error('No stream received');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      
      // Process streaming response
      let currentContent = '';
      
      await ChatService.parseStreamingResponse(stream, (chunk) => {
        if (chunk.chunk) {
          currentContent += chunk.chunk;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: currentContent }
                : msg
            )
          );
        }
      });
    } catch (error) {
      setIsTyping(false);
    }
  }, []);

  // Auto-scroll to bottom (inverted FlatList handles this automatically)
  const scrollToBottom = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      // With inverted FlatList, new items automatically appear at bottom
      // We can scroll to offset 0 to ensure we're at the "bottom"
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  // Auto-scroll when typing stops
  useEffect(() => {
    if (!isTyping && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [isTyping, messages.length, scrollToBottom]);

  // Fetch agent info when modal opens
  useEffect(() => {
    if (visible && !agentInfoFetched) {
      fetchAgentInfo();
    }
  }, [visible, fetchAgentInfo, agentInfoFetched]);

  // Use utility function for processing markdown content
  const processMarkdownContent = useCallback((content: string) => {
    return processExpenseMarkdown(content);
  }, []);

  // Markdown styles for assistant messages
  const markdownStyles = useMemo(() => 
    createMarkdownStyles(colors, chatColors), 
    [colors, chatColors]
  );

  // Render message
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.type === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.assistantMessageContainer]}>
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isUser ? chatColors.userMessageBackground : chatColors.messageBackground,
          }
        ]}>
          {isUser ? (
            <Text style={[styles.messageText, { color: '#FFFFFF' }]}>
              {item.content}
            </Text>
          ) : (
            <Markdown 
              style={markdownStyles}
              rules={{
                // Custom rule for better list rendering
                bullet_list: (node, children, parent, styles) => (
                  <View key={node.key} style={styles.bullet_list}>
                    {children}
                  </View>
                ),
                ordered_list: (node, children, parent, styles) => (
                  <View key={node.key} style={styles.ordered_list}>
                    {children}
                  </View>
                ),
                // Custom rule for better code block rendering
                code_block: (node, children, parent, styles) => (
                  <View key={node.key} style={styles.code_block}>
                    <Text style={styles.code_block}>{node.content}</Text>
                  </View>
                ),
                fence: (node, children, parent, styles) => (
                  <View key={node.key} style={styles.fence}>
                    <Text style={styles.fence}>{node.content}</Text>
                  </View>
                ),
              }}
            >
              {processMarkdownContent(item.content)}
            </Markdown>
          )}
        </View>
        <Text style={[styles.timestamp, { color: chatColors.textSecondary }]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [chatColors, markdownStyles, processMarkdownContent]);

  // Render typing indicator
  const renderTypingIndicator = useCallback(() => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <View style={[styles.messageBubble, { backgroundColor: chatColors.messageBackground }]}>
          <ThreeDotLoader textColor={chatColors.textSecondary} />
        </View>
      </View>
    );
  }, [chatColors.messageBackground, chatColors.textSecondary, isTyping]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: chatColors.background, height: screenHeight }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: chatColors.messageBackground, borderBottomColor: chatColors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={chatColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: chatColors.text }]}>
            {agentName}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Chat Area */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={[...messages].reverse()} // Reverse for inverted display
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={renderTypingIndicator} // Changed from ListFooterComponent to ListHeaderComponent
            style={styles.flatList}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={true}
            scrollEnabled={true}
            bounces={true}
            inverted={true} // This makes new messages appear at bottom
            onContentSizeChange={(contentWidth, contentHeight) => {
              // With inverted FlatList, we don't need to manually scroll
            }}
            onScroll={(event) => {
              const { contentOffset } = event.nativeEvent;
              // For inverted FlatList, check if we're at the "top" (which is actually bottom)
              const isAtBottom = contentOffset.y <= 20;
              setShowScrollButton(!isAtBottom && messages.length > 3);
            }}
            scrollEventThrottle={16}
          />
        </View>

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <TouchableOpacity
            style={[styles.scrollToBottomButton, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]}
            onPress={() => {
              flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
          >
            <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Input Area */}
        <View style={[styles.inputContainer, { backgroundColor: chatColors.messageBackground, borderTopColor: chatColors.border }]}>
          <View style={[styles.inputWrapper, { backgroundColor: chatColors.background, borderColor: chatColors.border }]}>
            <TextInput
              style={[styles.textInput, { color: chatColors.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={chatColors.textSecondary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isTyping}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    height: screenHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  chatContainer: {
    height: screenHeight * 0.75, // Fixed 70% of screen height for chat
  },
  flatList: {
    height: '100%', // Take full height of container
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // Extra padding to prevent overlap with input
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
