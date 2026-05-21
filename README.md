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

```sql
create table conversas (
  id bigint generated always as identity primary key,
  nome_arquivo text not null constraint unique_nome_arquivo unique,
  mensagens jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar ou configurar políticas de RLS para acesso da API local/produção
ALTER TABLE conversas DISABLE ROW LEVEL SECURITY;
```

## Variáveis de Ambiente (`.env.local`)

Crie um arquivo `.env.local` na raiz do seu projeto e preencha com as suas credenciais secretas:

```env
OPENAI_API_KEY=nvapi-sua-chave-secreta-da-nvidia
NVIDIA_MODEL_NAME=deepseek-ai/deepseek-v4-flash

NEXT_PUBLIC_SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-do-supabase
```

# Como Executar o Projeto Localmente
1. Clone o repositório:

```
Bash
   git clone [https://github.com/NicolasSNichnig/SiteAI-Chatbot.git](https://github.com/NicolasSNichnig/SiteAI-Chatbot.git)
   cd SiteAI-Chatbot
```

2. Instale as dependências:

```
Bash
   npm install
```

3. Inicie o servidor de desenvolvimento:

```
Bash
   npm run dev
```

4. Acesse o projeto:
Abra http://localhost:3000 no seu navegador.

# Desafios Técnicos Superados (Lições Aprendidas)
Durante o desenvolvimento deste projeto, enfrentamos e resolvemos desafios complexos de arquitetura que enriqueceram a robustez do código:

- Bypass de Tipagem estrita da OpenAI (TypeScript/Turbopack): Contornamos limitações de validação em tempo de compilação aplicando um cast explícito (openai.chat.completions as any).create() para suportar parâmetros customizados do ecossistema NVIDIA (extra_body).

- Unique Constraints no Postgres: Corrigimos o erro 42P10 adicionando uma restrição UNIQUE à coluna nome_arquivo no banco de dados, permitindo a execução perfeita de operações de upsert.

- Tratamento de Submódulos no Git: Identificamos e corrigimos o erro 160000 provocado por uma pasta .git oculta aninhada na rota de API, garantindo que todo o código do backend fosse mapeado e enviado corretamente para o build da Vercel.

# Licença
Este projeto é de uso livre para fins de estudo e portfólio.

Desenvolvido com 💻 por Nicolas S. Nichnig.
