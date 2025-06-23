import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface UserFormProps {
  onSubmit: (name: string, email: string, issue: string) => void;
}

export function UserForm({ onSubmit }: UserFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && issue) {
      onSubmit(name, email, issue);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 bg-white rounded-xl shadow-2xl space-y-6 border border-gray-200 transition-all hover:shadow-2xl"
    >
      {/* Name Input */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition duration-300 p-2"
          placeholder="Enter your name"
          required
        />
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition duration-300 p-2"
          placeholder="Enter your email"
          required
        />
      </div>

      {/* Issue Input */}
      <div>
        <label htmlFor="issue" className="block text-sm font-semibold text-gray-700">
          How can we help you?
        </label>
        <textarea
          id="issue"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition duration-300 p-2"
          placeholder="Describe your issue..."
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:scale-105 hover:shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all focus:ring-2 focus:ring-indigo-500"
      >
        Start Chat <Send size={18} />
      </button>
    </form>
  );
}
