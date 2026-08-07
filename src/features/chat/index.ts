/** API pública da feature chat. */
export { useRooms, useMessages, useSendMessage, useLiveMessages } from '@/features/chat/api/hooks';
export { messageSchema, roomSchema, mergeMessages } from '@/features/chat/model/schemas';
export type { Message, Room, MessagePage } from '@/features/chat/model/schemas';
export { ChatScreen } from '@/features/chat/ui/ChatScreen';
