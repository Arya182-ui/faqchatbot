import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { UserForm } from './UserForm';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [isFloating, setIsFloating] = useState(true);
  const [isHovered, setIsHovered] = useState(false); // New state for hover effect

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsFloating(false);
      } else {
        setIsFloating(true);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleStartChat = async (name: string, email: string, issue: string) => {
    try {
      const existingUser = await supabase.from('chat_users').select('*').eq('email', email).single();
      if (existingUser.data) {
        const { data: requestData, error: requestError } = await supabase
          .from('chat_requests')
          .insert([
            {
              user_id: existingUser.data.id,
              issue,
            },
          ])
          .select()
          .single();

        if (requestError) throw requestError;
        setUserId(existingUser.data.id);
        setRequestId(requestData.id);
        setShowForm(false);
        toast.success('Chat session started!');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('chat_users')
        .insert([
          {
            user_type: 'user',
            name,
            email,
            status: 'online',
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      const { data: requestData, error: requestError } = await supabase
        .from('chat_requests')
        .insert([
          {
            user_id: userData.id,
            issue,
          },
        ])
        .select()
        .single();

      if (requestError) throw requestError;

      setUserId(userData.id);
      setRequestId(requestData.id);
      setShowForm(false);
      toast.success('Chat session started!');
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat session');
    }
  };

  const floatingClass = isFloating
    ? 'fixed bottom-4 right-4 animate-bounce transition-all duration-500'
    : 'fixed bottom-4 right-4 transition-all duration-500';

    const buttonStyle = isHovered
      ? `bg-gradient-to-r from-indigo-700 to-indigo-500 text-white p-5 rounded-full shadow-2xl  hover:rotate-12 transition-transform z-50 hover:scale-110`
      : `bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-5 rounded-full shadow-2xl transition-transform z-50`;
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`${floatingClass} ${buttonStyle}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <MessageCircle
          size={32}
          className="transform transition-all duration-300 "
        />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-full sm:w-96 bg-white rounded-lg shadow-xl z-50 border border-indigo-200">
      <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-t-lg">
        <h3 className="font-semibold text-lg">Live Chat Support</h3>
        <button onClick={() => setIsOpen(false)} className="hover:text-gray-200">
          <X size={20} />
        </button>
      </div>

      {showForm ? (
        <div className="p-4">
          <UserForm onSubmit={handleStartChat} />
        </div>
      ) : (
        <ChatWindow
          isOpen={true}
          onClose={() => {
            setIsOpen(false);
            setShowForm(true);
            setUserId(null);
            setRequestId(null);
          }}
          requestId={requestId!}
          userId={userId!}
        />
      )}
    </div>
  );
}
