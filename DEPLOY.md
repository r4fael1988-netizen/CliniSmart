# Guia de Deploy: CliniSmart CRM na Vercel 🚀

O projeto já foi preparado e os erros de compatibilidade com o Next.js 15/16 foram corrigidos. Agora você pode colocar o sistema online seguindo estes passos:

### 1. Preparação do Git
- Garanta que todas as alterações que fizemos (Dashboard, Agenda, Omnichannel, Fixes) foram salvas no seu repositório (GitHub/GitLab/Bitbucket).

### 2. Configuração na Vercel
- Acesse [vercel.com](https://vercel.com) e clique em **"Add New"** > **"Project"**.
- Importe o seu repositório.

### 3. Variáveis de Ambiente (CRÍTICO) 🔑
Na tela de configuração do projeto na Vercel, clique em **"Environment Variables"** e adicione as seguintes chaves (copie os valores do seu arquivo `.env` local):

| Chave | Valor Sugerido |
| :--- | :--- |
| `DATABASE_URL` | Seu link do Postgres (lostbaskingshark-...) |
| `NEXTAUTH_SECRET` | Uma senha aleatória forte |
| `NEXTAUTH_URL` | A URL que a Vercel te der (ou deixe em branco para auto-detectar) |
| `EVOLUTION_API_URL` | `https://lostbaskingshark-evolution.cloudfy.live` |
| `EVOLUTION_API_KEY` | `ZP2Vfc24UP1BtNZ6QlbISCVz0N9GW9BE` |

### 4. Comando de Inicialização (Install Command)
- Nas configurações de **"Build & Development Settings"**, certifique-se de que o comando de instalação seja:
  `npm install && npx prisma generate`
  *(Isso garante que o banco de dados seja reconhecido na nuvem)*.

### 5. Finalização
- Clique em **"Deploy"**.
- Em cerca de 2 minutos, você terá um link como `clinismart-crm.vercel.app` para acessar de qualquer lugar!

---

> [!TIP]
> **Dica de Pós-Deploy**: Assim que o site estiver online, não esqueça de voltar nas configurações da sua **Evolution API** (no Manager) e atualizar o **URL do Webhook** para o seu novo domínio da Vercel, garantindo que as mensagens do WhatsApp continuem chegando no sistema novo!
