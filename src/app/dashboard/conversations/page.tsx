import { getConversations } from "./actions";
import { OmnichannelView } from "@/components/conversations/OmnichannelView";

export const dynamic = 'force-dynamic';

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Central de Atendimento</h1>
        <p className="text-sm text-muted-foreground">Monitore a IA e assuma conversas do WhatsApp em tempo real.</p>
      </div>

      <OmnichannelView initialConversations={JSON.parse(JSON.stringify(conversations))} />
    </div>
  );
}
