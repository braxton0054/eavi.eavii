'use client';

import dynamic from 'next/dynamic';

const ChatBot = dynamic(() => import('@/components/Chatbot'), { ssr: false });

export default function ChatBotWrapper() {
  // Show chatbot to all visitors — they can ask general questions
  return <ChatBot userId="public" userName="Visitor" userRole="student" />;
}
