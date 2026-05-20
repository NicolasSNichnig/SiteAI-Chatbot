'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function ChatApp() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('conversa.json');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  // Referência para o scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversationsList = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setConversations(data);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  const loadChatHistory = async (fileName: string) => {
    setCurrentFile(fileName);
    try {
      const res = await fetch(`/api/chat?file=${fileName}`);
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  useEffect(() => {
    loadConversationsList();
    loadChatHistory(currentFile);
  }, []);

  // Rola para a última mensagem automaticamente
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: currentFile, messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar mensagem.');
    } finally {
      setLoading(false);
      loadConversationsList();
    }
  };

  const handleClearMemory = async () => {
    if (!confirm('Tem certeza que deseja limpar a memória desta conversa?')) return;
    
    const systemPrompt = messages.find(m => m.role === 'system') || { role: 'system', content: 'Responda em português.' };
    const cleared = [systemPrompt];
    setMessages(cleared);

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: currentFile, messages: cleared }),
    });
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Deseja apagar a conversa "${fileName}" permanentemente?`)) return;
    
    await fetch(`/api/chat?file=${fileName}`, { method: 'DELETE' });
    await loadConversationsList();
    if (currentFile === fileName) {
      loadChatHistory('conversa.json');
    }
  };

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const formattedName = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`;
    setCurrentFile(formattedName);
    setMessages([{ role: 'system', content: 'Responda em português.' }]);
    setNewFileName('');
    if (!conversations.includes(formattedName)) {
      setConversations([...conversations, formattedName]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', color: '#1e293b' }}>
      
      {/* BARRA LATERAL */}
      <div style={{ width: '300px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Meus Chats</h3>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((file) => (
              <li key={file} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px',
                  backgroundColor: currentFile === file ? '#eff6ff' : 'transparent',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  transition: 'background-color 0.2s'
                }}>
                <button 
                  onClick={() => loadChatHistory(file)}
                  style={{ 
                    fontWeight: currentFile === file ? '600' : '400', 
                    color: currentFile === file ? '#2563eb' : '#475569',
                    cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left', flex: 1, fontSize: '14px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}
                >
                  💬 {file.replace('.json', '')}
                </button>
                <button onClick={() => handleDeleteFile(file)} style={{ color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', fontSize: '14px' }} title="Apagar">
                  ✖
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <form onSubmit={handleCreateNewChat} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>NOVA CONVERSA</span>
            <input 
              type="text" 
              placeholder="Ex: projeto_x" 
              value={newFileName} 
              onChange={(e) => setNewFileName(e.target.value)}
              style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              + Criar Chat
            </button>
          </form>
        </div>
      </div>

      {/* JANELA PRINCIPAL DO CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* Cabeçalho */}
        <div style={{ padding: '15px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>Assistente DeepSeek</h2>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Arquivo ativo: {currentFile}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '12px' }}>
              {messages.filter(m => m.role !== 'system').length} mensagens na memória
            </span>
            <button onClick={handleClearMemory} style={{ padding: '8px 15px', cursor: 'pointer', background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
              🧹 Limpar Memória
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '10vh' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '10px' }}>👋 Olá!</h3>
              <p>Envie uma mensagem para começar a conversar.</p>
            </div>
          )}

          {messages.map((msg, index) => {
            if (msg.role === 'system') return null;
            const isUser = msg.role === 'user';
            
            return (
              <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  padding: '12px 18px', 
                  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                  backgroundColor: isUser ? '#2563eb' : '#ffffff', 
                  color: isUser ? '#ffffff' : '#1e293b',
                  maxWidth: '75%',
                  boxShadow: isUser ? '0 4px 6px rgba(37, 99, 235, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
                  border: isUser ? 'none' : '1px solid #e2e8f0',
                  lineHeight: '1.6',
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap' // Mantém as quebras de linha que a IA enviar
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '14px', border: '1px solid #e2e8f0' }}>
                <span className="dot-pulse">Digitando...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Div invisível para o auto-scroll */}
        </div>

        {/* Barra de Digitação */}
        <div style={{ padding: '20px 30px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '15px' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Digite sua mensagem para a IA..." 
              disabled={loading}
              style={{ 
                flex: 1, 
                padding: '15px 20px', 
                borderRadius: '24px', 
                border: '1px solid #cbd5e1', 
                outline: 'none',
                fontSize: '15px',
                backgroundColor: '#f8fafc',
                transition: 'border-color 0.2s'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              style={{ 
                padding: '0 25px', 
                backgroundColor: loading || !input.trim() ? '#93c5fd' : '#2563eb', 
                color: 'white', 
                border: 'none', 
                borderRadius: '24px', 
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
                boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)'
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}