import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

// GET: Buscar conversas
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');

  if (file) {
    const { data } = await supabase.from('conversas').select('mensagens').eq('nome_arquivo', file).single();
    return NextResponse.json(data?.mensagens || [{ role: 'system', content: 'Responda em português.' }]);
  }

  const { data } = await supabase.from('conversas').select('nome_arquivo');
  return NextResponse.json(data?.map(d => d.nome_arquivo) || []);
}

export async function DELETE(request: Request) {
  try {
    // 1. Pega o parâmetro '?file=...' da URL da requisição
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');

    if (!fileName) {
      return NextResponse.json({ error: "Nome do arquivo não fornecido." }, { status: 400 });
    }

    // 2. Executa o delete no Supabase filtrando pela coluna correta
    const { error: supabaseError } = await supabase
      .from('conversas')
      .delete()
      .eq('nome_arquivo', fileName); // Certifique-se de que o nome da coluna é este

    if (supabaseError) {
      console.error("Erro ao deletar no Supabase:", supabaseError);
      throw new Error(supabaseError.message);
    }

    return NextResponse.json({ success: true, message: `Conversa ${fileName} deletada com sucesso.` });
  } catch (error: any) {
    console.error("ERRO NO DELETE BACKEND:", error);
    return NextResponse.json({ error: error.message || "Erro ao deletar conversa" }, { status: 500 });
  }
}

// POST: Enviar mensagem e salvar no SQL
export async function POST(request: Request) {
  try {
    const { file, messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "API Key não encontrada no ambiente." }, { status: 500 });
    }

    const modelName = process.env.NVIDIA_MODEL_NAME

    // Chamada com bypass estrito do TypeScript
    const completion = await (openai.chat.completions as any).create({
      model: modelName,
      messages: messages,
      temperature: 1,
      extra_body: { chat_template_kwargs: { thinking: false } }
    });

    const aiMessage = completion.choices[0]?.message;
    if (!aiMessage) {
      throw new Error("A IA não retornou nenhuma mensagem válida.");
    }

    const updatedMessages = [...messages, aiMessage];

    // Salva ou atualiza no Supabase
    const { error: supabaseError } = await supabase.from('conversas').upsert(
      { nome_arquivo: file, mensagens: updatedMessages },
      { onConflict: 'nome_arquivo' }
    );

    if (supabaseError) {
      console.error("Erro no Banco de Dados (Supabase):", supabaseError);
      throw new Error(`Erro ao salvar no banco: ${supabaseError.message}`);
    }

    return NextResponse.json({ reply: aiMessage, messages: updatedMessages });
  } catch (error: any) {
    console.error("ERRO DETECTADO NO BACKEND:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}