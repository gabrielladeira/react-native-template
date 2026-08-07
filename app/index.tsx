import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';
import { Screen } from '@/shared/ui/Screen';
import { ErrorView } from '@/shared/ui/ErrorView';
import { theme } from '@/shared/ui/theme';
import { useRooms } from '@/features/chat';

export default function RoomsRoute() {
  const query = useRooms();

  if (query.isError) {
    return (
      <Screen>
        <ErrorView error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={styles.title}>Salas</Text>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(room) => room.id}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/room/[id]', params: { id: item.id } }} asChild>
            <Pressable style={styles.row} accessibilityRole="link">
              <Text style={styles.name}>{item.name}</Text>
              {item.unreadCount > 0 ? <Text style={styles.badge}>{item.unreadCount}</Text> : null}
            </Pressable>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: theme.color.text,
    fontSize: theme.font.xl,
    fontWeight: '700',
    padding: theme.space.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  name: { color: theme.color.text, fontSize: theme.font.lg },
  badge: { color: theme.color.accent, fontSize: theme.font.md, fontWeight: '700' },
});
