import { useEffect, useRef, useState } from 'react';
import { SendHorizonal, ArrowLeft, MoreVertical, MessageSquareText, ShieldCheck } from 'lucide-react';
import { fetchMechanicAdminMessages, sendMechanicAdminMessage } from '../lib/api';

const POLL_INTERVAL_MS = 3000;

const DiscussionMeca = ({ onBack, onBackClick, currentUser }) => {
  const handleBack = onBack || onBackClick;
  const mechanicName = currentUser?.full_name || currentUser?.email || 'Mécanicien';

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const pollRef = useRef(null);

  const loadMessages = async () => {
    try {
      const data = await fetchMechanicAdminMessages();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Silently ignore polling errors
    }
  };

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setError('');
    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_type: 'mechanic',
      sender_name: mechanicName,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    try {
      await sendMechanicAdminMessage(text);
      await loadMessages();
    } catch (e) {
      setError(e.message);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-2">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="bg-[#0D2B0D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="hover:bg-[#608C27] p-2 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <div className="w-12 h-12 bg-[#608C27] rounded-full flex items-center justify-center text-white">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Administration</h2>
              <p className="text-xs text-green-300">Support DépannageExpress</p>
            </div>
          </div>
          <button className="hover:bg-[#608C27] p-2 rounded-full"><MoreVertical size={22} /></button>
        </div>

        {/* ZONE DES MESSAGES */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-gray-50"
        >
          <div className="flex flex-col min-h-full p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-4">
                <MessageSquareText size={64} className="opacity-40" />
                <p className="text-xl font-medium">Discussion avec l'administration.</p>
                <p className="text-sm text-gray-400">Posez vos questions sur vos interventions, votre compte ou toute autre demande.</p>
              </div>
            ) : (
              <>
                <div className="flex-1" />
                {messages.map((msg) => {
                  const sentAt = msg.sent_at || msg.created_at;
                  return (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'mechanic' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-4 rounded-2xl relative whitespace-pre-wrap ${
                        msg.sender_type === 'mechanic'
                          ? 'bg-[#608C27] text-white rounded-br-none'
                          : 'bg-[#D9D9D9] text-black rounded-bl-none'
                      }`}>
                        <p className="text-[10px] font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                        <p className="font-medium text-sm md:text-base">{msg.content}</p>
                        <span className={`text-[10px] absolute bottom-1 right-2 ${
                          msg.sender_type === 'mechanic' ? 'text-green-100' : 'text-gray-600'
                        }`}>
                          {sentAt ? new Date(sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error ? (
          <p className="text-center text-sm text-red-600 px-4 pb-1">{error}</p>
        ) : null}

        {/* ZONE DE SAISIE */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-end gap-3">
          <div className="flex-1 flex items-center bg-[#D9D9D9] rounded-2xl px-5 py-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Écrivez à l'administration… (Ctrl+Entrée pour envoyer)"
              className="bg-transparent w-full outline-none text-black font-medium resize-none py-2 max-h-32 overflow-hidden"
              rows="1"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="bg-[#0D2B0D] text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-[#608C27] transition-all flex-shrink-0 disabled:opacity-50"
          >
            <SendHorizonal size={28} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DiscussionMeca;
