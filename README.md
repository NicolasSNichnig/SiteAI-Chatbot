# SiteAI Chatbot com Supabase

Um chatbot full-stack moderno construído com **Next.js**, que utiliza os modelos de inteligência artificial para processamento de linguagem natural e o **Supabase (PostgreSQL)** para persistência dinâmica do histórico de conversas em formato JSON.

---

## Funcionalidades

- **Interface de Chat Moderna:** UI responsiva e limpa inspirada em aplicativos de mensagens com rolagem automática (*auto-scroll*) para as mensagens mais recentes.
- **Gerenciador de Conversas Lateral:** Permite criar novos arquivos de chat, alternar entre históricos salvos e deletar conversas diretamente da interface.
- **Integração Dinâmica com NVIDIA API:** Chamadas otimizadas ao modelo `deepseek-ai/deepseek-v4-flash` via SDK da OpenAI com bypass estrito de checagem de tipos do TypeScript.
- **Persistência em Banco de Dados:** Armazenamento seguro de mensagens no Supabase utilizando cláusulas estruturadas de `upsert` com base no nome do arquivo.
- **Controle de Memória:** Botão para limpar a memória volátil mantendo apenas as instruções do sistema (*System Prompt*).

---

## Tecnologias Utilizadas

- **Frontend/Backend:** [Next.js (App Router)](https://nextjs.org/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Banco de Dados:** [Supabase / PostgreSQL](https://supabase.com/)
- **Provedor de IA:** [NVIDIA API Catalog](https://build.nvidia.com/) (Modelo DeepSeek-V4)
- **Hospedagem/Deploy:** [Vercel](https://vercel.com/)
