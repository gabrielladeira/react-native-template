import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError } from '@/shared/api/errors';
import { theme } from '@/shared/ui/theme';

/**
 * Tradução única de erro -> mensagem. O switch é exaustivo: adicionar um
 * ApiErrorKind novo quebra o build até ser tratado aqui.
 */
export function messageForError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Algo deu errado. Tente novamente.';

  switch (error.kind) {
    case 'network':
      return 'Sem conexão. Verifique sua internet.';
    case 'timeout':
      return 'A requisição demorou demais. Tente novamente.';
    case 'unauthorized':
      return 'Sua sessão expirou. Entre novamente.';
    case 'forbidden':
      return 'Você não tem permissão para isso.';
    case 'notFound':
      return 'Não encontramos o que você procura.';
    case 'validation':
      return error.message;
    case 'contract':
      return 'Recebemos uma resposta inesperada do servidor. Já estamos vendo isso.';
    case 'server':
      return 'O servidor está com problemas. Tente em instantes.';
    case 'unknown':
      return 'Algo deu errado. Tente novamente.';
  }
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.root}>
      <Text style={styles.message}>{messageForError(error)}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry} accessibilityRole="button">
          <Text style={styles.buttonLabel}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: theme.space.lg, gap: theme.space.md, alignItems: 'center' },
  message: { color: theme.color.textMuted, fontSize: theme.font.md, textAlign: 'center' },
  button: {
    backgroundColor: theme.color.accent,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
  },
  buttonLabel: { color: theme.color.text, fontSize: theme.font.md, fontWeight: '600' },
});
