import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChatWindow } from "./ChatWindow";
import { formatDistanceToNow } from "date-fns";
import { LogOut, Users, Search, MessageSquare } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

interface ChatRequest {
  id: string;
  user_id: string;
  issue: string;
  created_at: string;
  status: string;
  chat_users: {
    name: string;
    email: string;
  };
}

export function AgentDashboard() {
  const [requests, setRequests] = useState<ChatRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [agentId, setAgentId] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      setupAgent();
      loadRequests();
      subscribeToRequests();
    }
  }, [user]);

  const setupAgent = async () => {
    const { data: existingAgent } = await supabase
      .from("chat_users")
      .select("id")
      .eq("email", user?.email)
      .single();

    if (existingAgent) {
      setAgentId(existingAgent.id);
      return;
    }

    const { data, error } = await supabase
      .from("chat_users")
      .insert([
        {
          user_type: "agent",
          name: user?.email?.split("@")[0] || "Support Agent",
          status: "online",
          email: user?.email,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error setting up agent:", error);
      toast.error("Error setting up agent");
    } else {
      setAgentId(data.id);
      toast.success(`Welcome ${data.name}`);
    }
  };

  const subscribeToRequests = () => {
    supabase
      .channel("chat_requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_requests" },
        loadRequests
      )
      .subscribe();
  };

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from("chat_requests")
      .select("*, chat_users (name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading requests:", error);
      toast.error("Error loading requests");
    } else {
      setRequests(data);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await supabase
        .from("chat_requests")
        .update({ status: "active" })
        .eq("id", requestId);
      setSelectedRequest(requestId);
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("Error accepting request");
    }
  };

  const handleResolveChat = async (requestId: string) => {
    try {
      await supabase
        .from("chat_requests")
        .update({ status: "completed" })
        .eq("id", requestId);

      await supabase.from("chat_messages").insert([
        {
          request_id: requestId,
          sender_id: agentId,
          content: "Your issue has been resolved. Thank you for reaching out!",
        },
      ]);

      setSelectedRequest(null);
    } catch (error) {
      console.error("Error resolving chat:", error);
      toast.error("Error resolving chat");
    }
  };

  const filteredRequests = requests.filter((req) =>
    req.chat_users.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Agent Dashboard
          </h1>
          <button
            onClick={signOut}
            className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-700 transition duration-300 flex items-center gap-2"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

        {/* Request Search Bar */}
        <div className="flex items-center bg-white p-4 rounded-lg shadow-md mb-6">
          <Users className="text-indigo-600" size={24} />
          <h2 className="ml-3 text-xl font-semibold text-gray-800">User Requests</h2>
          <div className="ml-auto flex items-center">
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-3 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Request List */}
        <div className="space-y-6">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="p-6 bg-white rounded-lg shadow-lg flex justify-between items-start hover:shadow-xl transition duration-300 ease-in-out transform hover:-translate-y-1"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  {req.chat_users.name} <MessageSquare className="text-indigo-500" size={16} />
                </h3>
                <p className="text-gray-500">{req.chat_users.email}</p>
                <p className="text-gray-700 mt-1">{req.issue}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
              </div>

              <div className="ml-6 flex items-center space-x-3">
                {req.status === "waiting" && (
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 flex items-center gap-2"
                  >
                    <MessageSquare size={16} /> Start Chat
                  </button>
                )}

                {req.status === "active" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRequest(req.id)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition duration-300 flex items-center gap-2"
                    >
                      <MessageSquare size={16} /> Resume Chat
                    </button>
                    <button
                      onClick={() => handleResolveChat(req.id)}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-700 transition duration-300 flex items-center gap-2"
                    >
                      <MessageSquare size={16} /> Resolve Chat
                    </button>
                  </div>
                )}

                {req.status === "completed" && (
                  <span className="text-gray-500">
                    <MessageSquare size={16} className="text-green-500" /> Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      {selectedRequest && agentId && (
        <ChatWindow
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          requestId={selectedRequest}
          userId={agentId}
        />
      )}
    </div>
  );
}
