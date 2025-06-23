import React, { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { ChatButton } from "./components/ChatButton";
import { AgentDashboard } from "./components/AgentDashboard";
import { LoginForm } from "./components/LoginForm";
import { useAuth } from "./hooks/useAuth";
import { Router, Route, Switch, Redirect } from "wouter";

function App() {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router base="/faqchatbot">
      <Toaster position="top-right" />
      <Switch>
        {/* Public Chat Window (No Login Required) */}
        <Route path="/">
          <ChatButton />
        </Route>

        {/* Login Page for Agents */}
        <Route path="/login">
          {!user ? <LoginForm /> : <Redirect to="/Agent" />}
        </Route>

        {/* Protected Agent Dashboard (Login Required) */}
        <Route path="/Agent">
          {user ? <AgentDashboard /> : <Redirect to="/login" />}
        </Route>
        {/*Default route to redirect to root path*/}
        <Route>
          <Redirect to='/' />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
