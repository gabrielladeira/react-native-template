import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/shared/ui/Screen';
import { ErrorView } from '@/shared/ui/ErrorView';
import { theme } from '@/shared/ui/theme';
import { useRealtimeState } from '@/shared/realtime/useRealtimeEvent';
import { useLiveMessages, useMessages, useSendMessage } from '@/features/chat/api/hooks';
import type { Message } from '@/features/chat/model/schemas';

export function ChatScreen({ roomId }: { roomId: string }) {
  const [draft, setDraft] = useState('');
  const query = useMessages(roomId);
  const send = useSendMessage(roomId);
  const connection = useRealtimeState();
  useLiveMessages(roomId);

  if (query.isPending) {
    return (
      <Screen>
        <ActivityIndicator style={styles.centered} color={theme.color.accent} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  const messages = query.data.pages.flatMap((page) => page.items);

  return (
    <Screen>
      {connection !== 'open' ? (
        <View style={styles.banner} accessibilityLiveRegion="polite">
          <Text style={styles.bannerText}>
            {connection === 'reconnecting' ? 'Reconectando…' : 'Offline'}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        inverted
        keyExtractor={(item: Message) => item.id}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <View style={styles.bubble}>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Mensagem"
          placeholderTextColor={theme.color.textMuted}
          accessibilityLabel="Campo de mensagem"
        />
        <Pressable
          accessibilityRole="button"
          disabled={draft.trim().length === 0 || send.isPending}
          onPress={() => {
            send.mutate(draft.trim());
            setDraft('');
          }}
          style={styles.send}
        >
          <Text style={styles.sendLabel}>Enviar</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1 },
  banner: { backgroundColor: theme.color.danger, padding: theme.space.xs, alignItems: 'center' },
  bannerText: { color: theme.color.text, fontSize: theme.font.sm },
  bubble: {
    backgroundColor: theme.color.surface,
    margin: theme.space.xs,
    marginHorizontal: theme.space.md,
    padding: theme.space.sm,
    borderRadius: theme.radius.md,
  },
  body: { color: theme.color.text, fontSize: theme.font.md },
  composer: {
    flexDirection: 'row',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    color: theme.color.text,
  },
  send: {
    justifyContent: 'center',
    paddingHorizontal: theme.space.md,
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.md,
  },
  sendLabel: { color: theme.color.text, fontWeight: '600' },
});
