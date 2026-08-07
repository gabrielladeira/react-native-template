import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '@/features/chat';

export default function RoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen roomId={id} />;
}
