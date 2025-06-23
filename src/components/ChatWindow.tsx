import { useEffect, useState, useRef, useCallback } from "react";
import { Send, Image as ImageIcon, X, CheckCircle2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import debounce from "lodash.debounce";

interface Message {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  sender_id: string;
  user_type: "user" | "agent";
  status: "sending" | "sent" | "read";
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  userId: string;
}

export function ChatWindow({ isOpen, onClose, requestId, userId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [userType, setUserType] = useState<"user" | "agent" | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTypingUser, setIsTypingUser] = useState(false); // Track if the user is typing
  const [isTypingAgent, setIsTypingAgent] = useState(false); // Track if the agent is typing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserType = useCallback(async () => {
    const { data, error } = await supabase.from("chat_users").select("user_type").eq("id", userId).single();
    if (error) {
      toast.error("Failed to fetch user type");
      console.error(error);
      return;
    }
    setUserType(data?.user_type);
  }, [userId]);

  const fetchMessages = useCallback(async (page: number = 1) => {
    const PAGE_SIZE = 20;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }
    setMessages((prev) => {
      const newMessages = data.filter(
        (newMessage) => !prev.some((existingMessage) => existingMessage.id === newMessage.id)
      );
      return [...prev, ...newMessages];
    });
  }, [requestId]);

  const markMessagesAsRead = useCallback(async () => {
    const unreadMessages = messages.filter(
      (msg) => msg.sender_id !== userId && msg.status !== "read"
    );

    if (unreadMessages.length) {
      const ids = unreadMessages.map((msg) => msg.id);
      await supabase.from("chat_messages").update({ status: "read" }).in("id", ids);
      setMessages((prev) =>
        prev.map((msg) => (ids.includes(msg.id) ? { ...msg, status: "read" } : msg))
      );
    }
  }, [messages, userId]);

  const sendMessage = async () => {
    if (!newMessage.trim() && !image) return;

    setIsSending(true);

    let imageUrl = null;

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (image && image.size > maxSize) {
      toast.error("Image file is too large. Maximum size is 5MB.");
      setIsSending(false);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (image && !allowedTypes.includes(image.type)) {
      toast.error("Invalid image format. Only JPEG, PNG, and GIF are allowed.");
      setIsSending(false);
      return;
    }

    if (image) {
      const sanitizedFileName = `${Date.now()}-${image.name.replace(/\s+/g, "_")}`;

      const { data, error } = await supabase.storage.from("chat-images").upload(sanitizedFileName, image);

      if (error) {
        toast.error("Image upload failed");
        console.error(error);
        setIsSending(false);
        return;
      }

      imageUrl = supabase.storage.from("chat-images").getPublicUrl(sanitizedFileName).data?.publicUrl;
    }

    const newMsg: Omit<Message, "status"> = {
      id: crypto.randomUUID(),
      request_id: requestId,
      sender_id: userId,
      content: newMessage.trim(),
      image_url: imageUrl ?? undefined,
      user_type: userType!,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("chat_messages").insert([{ ...newMsg, status: "sent" }]);
      setNewMessage("");
      setImage(null);
    } catch (error) {
      toast.error("Failed to send message");
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const trimmedValue = e.target.value.trim();

    if (!isTypingUser && trimmedValue.length > 0) {
      setIsTypingUser(true);
      sendTypingStatus(true, userType);
    } else if (isTypingUser && trimmedValue.length === 0){
        setIsTypingUser(false);
        sendTypingStatus(false, userType);
    }
     typingTimeoutRef.current = setTimeout(() => {
      setIsTypingUser(false);
      sendTypingStatus(false, userType);
    }, 1500);
  };

  const sendTypingStatus = debounce(async (typing: boolean, user_type: "user" | "agent" | null) => {
     if(!user_type) return
    try {
      await supabase.from("chat_typing_status").upsert(
        {
          request_id: requestId,
          user_id: userId,
          user_type: user_type,
          is_typing: typing,
          timestamp: new Date().toISOString(),
        },
        { onConflict: ["request_id", "user_id"] }
      );
    } catch (error) {
      console.error("Error sending typing status:", error);
    }
  }, 1000);

  useEffect(() => {
    fetchUserType();
    fetchMessages();

    const channel = supabase
      .channel(`chat:${requestId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => {
            return prev.some((msg) => msg.id === payload.new.id) ? prev : [...prev, payload.new];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_typing_status" },
        (payload) => {
          if (payload.new.user_type !== userType) { // Verify if the message is from the other user.
              if(payload.new.user_type === "agent"){
                  setIsTypingAgent(payload.new.is_typing)
              } else if (payload.new.user_type === "user"){
                  setIsTypingUser(payload.new.is_typing)
              }
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchMessages, fetchUserType, requestId,userType]);

  useEffect(() => {
    markMessagesAsRead();
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, markMessagesAsRead]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, markMessagesAsRead]);

  if (!isOpen || !userType) return null;
   const otherUserType = userType === "agent" ? "User" : "Agent";

  return (
    <div className="fixed bottom-4 right-4 w-full sm:w-96 max-w-[95vw] h-[550px] max-h-[90vh] bg-gray-800 text-white rounded-lg shadow-xl flex flex-col transition-all ease-in-out duration-300 z-50">
      {/* Header */}
      <div
        className={`p-4 flex justify-between items-center rounded-t-lg ${
          userType === "agent" ? "bg-teal-600" : "bg-indigo-700"
        } text-white shadow-md`}
      >
        <h3 className="font-semibold text-lg">{userType === "agent" ? "Agent Panel" : "User Chat"}</h3>
        <button onClick={onClose} className="text-white hover:text-gray-300">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === userId ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] sm:max-w-[85%] p-3 rounded-lg shadow-md ${
                msg.user_type === "user"
                  ? "bg-blue-600 bg-opacity-20 text-blue-100"
                  : "bg-teal-600 bg-opacity-20 text-teal-100"
              }`}
            >
              {msg.image_url && <img src={msg.image_url} alt="Shared" className="rounded-lg mb-2 max-h-48" />}
              <p className="break-words">{msg.content}</p>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                {msg.sender_id === userId && (
                  <>
                    {msg.status === "sent" && <CheckCircle2 className="text-teal-400" size={14} />}
                    {msg.status === "read" && <span className="text-teal-300 font-semibold">✓✓ Read</span>}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {userType === "agent" && isTypingUser && (
          <div className="text-gray-400 text-sm">
            User is typing...
          </div>
        )}
        {userType === "user" && isTypingAgent && (
          <div className="text-gray-400 text-sm">
            Agent is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t flex items-center space-x-3">
        {image && (
          <div className="flex items-center">
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="h-10 w-10 rounded-full border-2 border-gray-600"
            />
            <button onClick={() => setImage(null)} className="ml-2 text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        )}
        <input
          type="text"
          value={newMessage}
          onChange={handleTypingChange}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          ref={inputRef}
          className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-teal-500 bg-gray-700 text-white"
        />
        <label htmlFor="imageUpload" className="cursor-pointer hover:text-teal-400">
          <ImageIcon size={20} />
        </label>
        <input id="imageUpload" type="file" hidden onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        <button
          onClick={sendMessage}
          disabled={isSending}
          className="bg-teal-600 text-white p-2 rounded-lg transition-transform hover:scale-105 disabled:bg-gray-400"
        >
          {isSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}
