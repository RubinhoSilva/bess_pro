# ConfirmationDialog Component

Um modal genérico de confirmação reutilizável em todo o sistema.

## Recursos

- ✅ **4 variantes visuais**: `destructive`, `warning`, `info`, `default`
- ✅ **Ícones automáticos** baseados na variante
- ✅ **Estado de loading** com feedback visual
- ✅ **Textos personalizáveis** para título, descrição e botões
- ✅ **Hook personalizado** para facilitar o uso
- ✅ **TypeScript** com tipagem completa

## Uso Básico

### Método 1: Componente Direto

```tsx
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Deletar Item
      </Button>
      
      <ConfirmationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Confirmar Deleção"
        description="Esta ação não pode ser desfeita."
        confirmText="Deletar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={() => {
          // Lógica de deleção aqui
        }}
      />
    </>
  );
}
```

### Método 2: Com Hook (Recomendado)

```tsx
import { useConfirmationDialog } from '@/hooks/use-confirmation-dialog';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

function MyComponent() {
  const confirmation = useConfirmationDialog();
  
  const handleDelete = async () => {
    // Lógica async de deleção
    await deleteItem();
  };
  
  return (
    <>
      <Button 
        onClick={() => confirmation.confirm(
          {
            title: 'Excluir Item',
            description: 'Tem certeza? Esta ação é irreversível.',
            confirmText: 'Excluir',
            variant: 'destructive'
          },
          handleDelete
        )}
      >
        Deletar Item
      </Button>
      
      <ConfirmationDialog
        open={confirmation.isOpen}
        onOpenChange={confirmation.setIsOpen}
        title={confirmation.options.title}
        description={confirmation.options.description}
        confirmText={confirmation.options.confirmText}
        cancelText={confirmation.options.cancelText}
        variant={confirmation.options.variant}
        onConfirm={confirmation.onConfirm}
        onCancel={confirmation.cancel}
      />
    </>
  );
}
```

## Variantes

### Destructive (Vermelha)
- **Uso**: Deleções, ações irreversíveis
- **Ícone**: Trash2
- **Cor**: Vermelho

### Warning (Amarela)  
- **Uso**: Ações que podem causar perda de dados
- **Ícone**: AlertTriangle
- **Cor**: Amarelo

### Info (Azul)
- **Uso**: Confirmações informativas
- **Ícone**: Info
- **Cor**: Azul

### Default (Cinza)
- **Uso**: Confirmações gerais
- **Ícone**: HelpCircle
- **Cor**: Cinza

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|---------|-----------|
| `open` | `boolean` | - | Controla se o modal está aberto |
| `onOpenChange` | `(open: boolean) => void` | - | Callback quando o estado muda |
| `title` | `string` | "Confirmar ação" | Título do modal |
| `description` | `string` | "Tem certeza que deseja continuar?" | Descrição/pergunta |
| `confirmText` | `string` | "Confirmar" | Texto do botão de confirmação |
| `cancelText` | `string` | "Cancelar" | Texto do botão de cancelar |
| `onConfirm` | `() => void` | - | Callback de confirmação |
| `onCancel` | `() => void` | - | Callback de cancelamento |
| `variant` | `'destructive' \| 'warning' \| 'info' \| 'default'` | "default" | Estilo visual |
| `loading` | `boolean` | false | Estado de carregamento |

## Exemplos de Uso no Sistema

- ✅ **Deleção de projetos** (implementado)
- 🔄 **Deleção de clientes** (futuro)
- 🔄 **Deleção de leads** (futuro)
- 🔄 **Reset de configurações** (futuro)
- 🔄 **Logout** (futuro)
- 🔄 **Cancelar operações** (futuro)