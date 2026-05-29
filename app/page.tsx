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
  
  // Cache na memória para transição instantânea
  const [chatCache, setChatCache] = useState<Record<string, Message[]>>({});
  
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
    
    if (chatCache[fileName]) {
      setMessages(chatCache[fileName]);
    } else {
      setMessages([]);
    }

    try {
      const res = await fetch(`/api/chat?file=${fileName}`);
      const data = await res.json();
      setMessages(data);
      setChatCache(prev => ({ ...prev, [fileName]: data }));
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  useEffect(() => {
    loadConversationsList();
    loadChatHistory(currentFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        setChatCache(prev => ({ ...prev, [currentFile]: data.messages }));
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
    setChatCache(prev => ({ ...prev, [currentFile]: cleared }));

    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: currentFile, messages: cleared }),
    });
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!confirm(`Deseja apagar a conversa "${fileName}" permanentemente?`)) return;
    
    await fetch(`/api/chat?file=${fileName}`, { method: 'DELETE' });
    
    setChatCache(prev => {
      const newCache = { ...prev };
      delete newCache[fileName];
      return newCache;
    });

    await loadConversationsList();
    if (currentFile === fileName) {
      loadChatHistory('conversa.json');
    }
  };

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const formattedName = newFileName.endsWith('.json') ? newFileName : `${newFileName}.json`;
    
    const initialMessage: Message[] = [{ role: 'system', content: 'Responda em português.' }];
    
    setCurrentFile(formattedName);
    setMessages(initialMessage);
    setChatCache(prev => ({ ...prev, [formattedName]: initialMessage }));
    setNewFileName('');
    
    if (!conversations.includes(formattedName)) {
      setConversations([...conversations, formattedName]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: '"Inter", system-ui, -apple-system, sans-serif', backgroundColor: '#0b0d12', color: '#f3f4f6' }}>
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div style={{ width: '280px', backgroundColor: '#131722', borderRight: '1px solid #1f293d', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Lateral */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1f293d', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em' }}>CONVERSAS</h3>
        </div>
        
        {/* Lista de Chats */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px 10px' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {conversations.map((file) => {
              const isActive = currentFile === file;
              return (
                <li key={file} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px',
                    backgroundColor: isActive ? '#1e2538' : 'transparent',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    transition: 'all 0.2s ease'
                  }}>
                  <button 
                    onClick={() => loadChatHistory(file)}
                    style={{ 
                      fontWeight: isActive ? '600' : '400', 
                      color: isActive ? '#3b82f6' : '#9ca3af',
                      cursor: 'pointer', border: 'none', background: 'none', textAlign: 'left', flex: 1, fontSize: '14px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                  >
                    <span style={{ opacity: isActive ? 1 : 0.6 }}>💬</span>
                    {file.replace('.json', '')}
                  </button>
                  <button 
                    onClick={() => handleDeleteFile(file)} 
                    style={{ color: '#ef4444', cursor: 'pointer', border: 'none', background: 'none', fontSize: '12px', opacity: isActive ? 0.8 : 0.3, transition: 'opacity 0.2s' }} 
                    title="Apagar conversa"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Input de Criação de Chat */}
        <div style={{ padding: '20px', borderTop: '1px solid #1f293d', backgroundColor: '#0e1118' }}>
          <form onSubmit={handleCreateNewChat} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em' }}>NOVO CHAT</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Nome..." 
                value={newFileName} 
                onChange={(e) => setNewFileName(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #2d3748', backgroundColor: '#131722', color: '#f3f4f6', fontSize: '14px', outline: 'none' }}
              />
              <button type="submit" style={{ padding: '0 12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '18px' }} title="Criar">
                +
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* JANELA PRINCIPAL DO CHAT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#0b0d12' }}>
        
        {/* Cabeçalho Superior */}
        <div style={{ padding: '18px 30px', backgroundColor: '#131722', borderBottom: '1px solid #1f293d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>DeepSeek v4</h2>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{currentFile.replace('.json', '')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '12px', color: '#9ca3af', backgroundColor: '#1e2538', padding: '6px 12px', borderRadius: '20px', border: '1px solid #2d3748' }}>
              {messages.filter(m => m.role !== 'system').length} mensagens
            </span>
            <button onClick={handleClearMemory} style={{ padding: '8px 14px', cursor: 'pointer', background: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', fontWeight: '500', fontSize: '12px', transition: 'all 0.2s' }}>
              Limpar Histórico
            </button>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 10% 20px 10%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.filter(m => m.role !== 'system').length === 0 && (
            <div style={{ textAlign: 'center', color: '#4b5563', marginTop: '15vh' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '15px' }}>⚡</span>
              <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#9ca3af', margin: '0 0 8px 0' }}>Pronto para iniciar</h3>
              <p style={{ fontSize: '14px', margin: 0 }}>Como posso ajudar você hoje?</p>
            </div>
          )}

          {messages.map((msg, index) => {
            if (msg.role === 'system') return null;
            const isUser = msg.role === 'user';
            
            return (
              <div key={index} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                <div style={{ 
                  padding: '14px 20px', 
                  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
                  backgroundColor: isUser ? '#2563eb' : '#131722', 
                  color: '#ffffff',
                  maxWidth: '75%',
                  boxShadow: isUser ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
                  border: isUser ? '1px solid #3b82f6' : '1px solid #1f293d',
                  lineHeight: '1.6',
                  fontSize: '15px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '14px 20px', borderRadius: '20px 20px 20px 4px', backgroundColor: '#131722', color: '#9ca3af', fontSize: '14px', border: '1px solid #1f293d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', display: 'inline-block' }}></span>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#9ca3af', borderRadius: '50%', display: 'inline-block' }}></span>
                </div>
                <span>Processando resposta...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> 
        </div>

        {/* Caixa de Digitação de Mensagem */}
        <div style={{ padding: '24px 10% 40px 10%', backgroundColor: 'transparent' }}>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', backgroundColor: '#131722', padding: '8px 8px 8px 16px', borderRadius: '30px', border: '1px solid #1f293d', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Envie uma mensagem..." 
              disabled={loading}
              style={{ 
                flex: 1, 
                border: 'none',
                outline: 'none',
                fontSize: '15px',
                backgroundColor: 'transparent',
                color: '#ffffff'
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()} 
              style={{ 
                padding: '12px 24px', 
                backgroundColor: loading || !input.trim() ? '#1f293d' : '#2563eb', 
                color: loading || !input.trim() ? '#4b5563' : '#ffffff', 
                border: 'none', 
                borderRadius: '24px', 
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease'
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