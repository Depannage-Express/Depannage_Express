import { useState } from 'react';
import { SendHorizonal, ArrowLeft, MoreVertical, Phone, MessageSquareText } from 'lucide-react';

const DiscussionCond = ({ onBackClick }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim() === "") return;

    const msg = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    setNewMessage("");
  };

  // Fonction pour gérer les touches dans le textarea
  const handleKeyDown = (e) => {
    // Si on veut envoyer avec Ctrl+Enter (optionnel), décommente la ligne suivante :
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSend(); }
    
    
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-2">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#0D2B0D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBackClick} className="hover:bg-[#608C27] p-2 rounded-full">
              <ArrowLeft size={24} />
            </button>
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center font-bold text-xl text-[#0D2B0D]">J</div>
            <div>
              <h2 className="text-xl font-bold">Client</h2>
              <p className="text-xs text-green-300">En ligne</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hover:bg-[#608C27] p-2 rounded-full"><Phone size={22} /></button>
            <button className="hover:bg-[#608C27] p-2 rounded-full"><MoreVertical size={22} /></button>
          </div>
        </div>

        {/* ZONE DES MESSAGES */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-4">
              <MessageSquareText size={64} className="opacity-40" />
              <p className="text-xl font-medium">Commencez la discussion avec Jean.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-4 rounded-2xl relative whitespace-pre-wrap ${ // whitespace-pre-wrap est crucial pour voir les sauts de ligne
                  msg.sender === 'user' 
                  ? 'bg-[#608C27] text-white rounded-br-none'
                  : 'bg-[#D9D9D9] text-black rounded-bl-none'
                }`}>
                  <p className="font-medium text-sm md:text-base">{msg.text}</p>
                  <span className={`text-[10px] absolute bottom-1 right-2 ${
                    msg.sender === 'user' ? 'text-green-100' : 'text-gray-600'
                  }`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ZONE DE SAISIE */}
        <div className="bg-white p-4 border-t border-gray-200 flex items-end gap-3">
          <div className="flex-1 flex items-center bg-[#D9D9D9] rounded-2xl px-5 py-2">
            <textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..." 
              className="bg-transparent w-full outline-none text-black font-medium resize-none py-2 max-h-32 scrollbar-hide  overflow-hidden "
              rows="1"
            />
          </div>
          <button 
            type="button"
            onClick={handleSend}
            className="bg-[#0D2B0D] text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-[#608C27] transition-all flex-shrink-0"
          >
            <SendHorizonal size={28} />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DiscussionCond;