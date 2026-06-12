import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, SendHorizonal, MessageSquareText, Users, Car, ShieldCheck } from 'lucide-react';
import {
  fetchAdminBreakdowns,
  fetchMessages,
  sendMessage,
  fetchMechanicAdminConversations,
  fetchMechanicAdminMessages,
  sendMechanicAdminMessage,
} from '../lib/api';

const POLL_INTERVAL_MS = 4000;

// ─── Fil de conversation ───────────────────────────────────────────────────────

const ConversationThread = ({ messages, onSend, senderLabel, isMechanicThread }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const isAtBottomRef = useRef(true);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (el) isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setError('');
    setText('');
    try {
      await onSend(content);
    } catch (e) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  const myType = 'admin';

  const filtered = messages.filter(m => !isMechanicThread || m.sender_type !== 'driver');

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-gray-50"
      >
        <div className="flex flex-col min-h-full p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
              <MessageSquareText size={48} className="opacity-30" />
              <p className="text-sm">Aucun message — démarrez la conversation.</p>
            </div>
          ) : (
            <>
              <div className="flex-1" />
              {filtered.map((msg) => {
                const isMe = msg.sender_type === myType;
                const sentAt = msg.sent_at || msg.created_at;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl relative whitespace-pre-wrap text-sm ${
                      isMe
                        ? 'bg-[#0D2B0D] text-white rounded-br-none'
                        : 'bg-white text-black rounded-bl-none border border-gray-200 shadow-sm'
                    }`}>
                      <p className="text-[10px] font-semibold mb-1 opacity-60">{msg.sender_name}</p>
                      <p>{msg.content}</p>
                      <span className={`text-[9px] absolute bottom-1 right-2 ${isMe ? 'text-green-300' : 'text-gray-400'}`}>
                        {sentAt ? new Date(sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs text-center px-3 pb-1">{error}</p>}
      <div className="bg-white border-t border-gray-200 p-3 flex gap-2 items-end">
        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Répondre à ${senderLabel}… (Ctrl+Entrée)`}
            className="bg-transparent w-full outline-none resize-none text-sm max-h-24 overflow-hidden"
            rows="1"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isSending}
          className="bg-[#0D2B0D] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#608C27] disabled:opacity-50 flex-shrink-0"
        >
          <SendHorizonal size={18} />
        </button>
      </div>
    </div>
  );
};

// ─── Composant principal ───────────────────────────────────────────────────────

const AdminMessages = ({ onBack }) => {
  const [tab, setTab] = useState('drivers'); // 'drivers' | 'mechanics'

  // Conducteurs
  const [breakdowns, setBreakdowns] = useState([]);
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);
  const [driverMessages, setDriverMessages] = useState([]);

  // Mécaniciens
  const [mechConversations, setMechConversations] = useState([]);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [mechMessages, setMechMessages] = useState([]);
  const [mechLoadError, setMechLoadError] = useState('');

  const pollRef = useRef(null);
  const mechListPollRef = useRef(null);

  // Charger les demandes de dépannage (conducteurs)
  useEffect(() => {
    fetchAdminBreakdowns()
      .then(data => setBreakdowns(data?.results || data || []))
      .catch(() => {});
  }, []);

  // Charger et poller la liste des conversations mécaniciens
  useEffect(() => {
    clearInterval(mechListPollRef.current);
    if (tab !== 'mechanics' || selectedMechanic) return;
    const load = () => fetchMechanicAdminConversations()
      .then(data => setMechConversations(Array.isArray(data) ? data : []))
      .catch(() => {});
    load();
    mechListPollRef.current = setInterval(load, 8000);
    return () => clearInterval(mechListPollRef.current);
  }, [tab, selectedMechanic]);

  // Poll messages conducteur sélectionné
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectedBreakdown) { setDriverMessages([]); return; }
    const load = () => fetchMessages(selectedBreakdown.id)
      .then(data => setDriverMessages(Array.isArray(data) ? data : []))
      .catch(() => {});
    load();
    pollRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [selectedBreakdown]);

  // Poll messages mécanicien sélectionné
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!selectedMechanic) { setMechMessages([]); setMechLoadError(''); return; }
    setMechLoadError('');
    const load = () => fetchMechanicAdminMessages(selectedMechanic.mechanic_id)
      .then(data => {
        setMechMessages(Array.isArray(data) ? data : (data?.results ?? []));
        setMechLoadError('');
      })
      .catch(err => setMechLoadError(err?.message || 'Erreur de chargement des messages'));
    load();
    pollRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [selectedMechanic]);

  const handleSendToDriver = async (content) => {
    await sendMessage(selectedBreakdown.id, {
      sender_type: 'admin',
      content,
    });
    const data = await fetchMessages(selectedBreakdown.id);
    setDriverMessages(Array.isArray(data) ? data : []);
  };

  const handleSendToMechanic = async (content) => {
    await sendMechanicAdminMessage(content, selectedMechanic.mechanic_id);
    const data = await fetchMechanicAdminMessages(selectedMechanic.mechanic_id);
    setMechMessages(Array.isArray(data) ? data : []);
    // Mettre à jour le compteur
    setMechConversations(prev => prev.map(c =>
      c.mechanic_id === selectedMechanic.mechanic_id
        ? { ...c, msg_count: c.msg_count + 1, last_message_at: new Date().toISOString() }
        : c
    ));
  };

  const handleBack = () => {
    if (selectedBreakdown) { setSelectedBreakdown(null); return; }
    if (selectedMechanic) { setSelectedMechanic(null); return; }
    onBack();
  };

  const title = selectedBreakdown
    ? `Conducteur — ${selectedBreakdown.driver_name || selectedBreakdown.id}`
    : selectedMechanic
    ? `Mécanicien — ${selectedMechanic.name}`
    : 'Messages';

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-full">

      {/* HEADER */}
      <div className="bg-[#0D2B0D] text-white p-4 flex items-center gap-4">
        <button onClick={handleBack} className="hover:bg-[#608C27] p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <ShieldCheck size={22} className="text-[#608C27]" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {/* TABS */}
      {!selectedBreakdown && !selectedMechanic && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('drivers')}
            className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
              tab === 'drivers' ? 'border-b-2 border-[#608C27] text-[#0D2B0D]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Car size={16} /> Conducteurs
          </button>
          <button
            onClick={() => setTab('mechanics')}
            className={`flex-1 py-3 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
              tab === 'mechanics' ? 'border-b-2 border-[#608C27] text-[#0D2B0D]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users size={16} /> Mécaniciens
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden min-h-0">

        {/* Vue liste conducteurs */}
        {!selectedBreakdown && !selectedMechanic && tab === 'drivers' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {breakdowns.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucune demande de dépannage.</p>
            ) : (
              breakdowns.map(bd => (
                <button
                  key={bd.id}
                  onClick={() => setSelectedBreakdown(bd)}
                  className="w-full text-left bg-gray-50 hover:bg-[#f0f7e6] border border-gray-200 rounded-xl p-4 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-sm">{bd.driver_name || 'Conducteur'}</p>
                    <p className="text-xs text-gray-500">{bd.breakdown_type || 'Dépannage'} · {bd.status}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-[#608C27] font-medium">Ouvrir <ArrowRight size={12} /></span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Vue liste mécaniciens */}
        {!selectedBreakdown && !selectedMechanic && tab === 'mechanics' && (
          <div className="h-full overflow-y-auto p-4 space-y-3">
            {mechConversations.length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun mécanicien approuvé.</p>
            ) : (
              mechConversations.map(m => (
                <button
                  key={m.mechanic_id}
                  onClick={() => setSelectedMechanic(m)}
                  className="w-full text-left bg-gray-50 hover:bg-[#f0f7e6] border border-gray-200 rounded-xl p-4 transition-colors flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-sm">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      {m.msg_count > 0 ? `${m.msg_count} message${m.msg_count > 1 ? 's' : ''}` : 'Aucun message'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-[#608C27] font-medium">Ouvrir <ArrowRight size={12} /></span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Conversation conducteur */}
        {selectedBreakdown && (
          <ConversationThread
            messages={driverMessages}
            onSend={handleSendToDriver}
            senderLabel={selectedBreakdown.driver_name || 'conducteur'}
            isMechanicThread={false}
          />
        )}

        {/* Conversation mécanicien */}
        {selectedMechanic && (
          mechLoadError ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-red-500 p-6 text-center">
              <p className="font-semibold">Erreur de chargement</p>
              <p className="text-sm text-gray-500">{mechLoadError}</p>
            </div>
          ) : (
            <ConversationThread
              messages={mechMessages}
              onSend={handleSendToMechanic}
              senderLabel={selectedMechanic.name}
              isMechanicThread={true}
            />
          )
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
