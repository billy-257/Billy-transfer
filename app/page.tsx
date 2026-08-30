"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowRightLeft, 
  Clock, 
  ShieldCheck, 
  PhoneCall, 
  MessageSquare, 
  Users, 
  Building2, 
  Smartphone,
  CheckCircle2,
  Share2,
  Trash2,
  Send,
  Check,
  CheckCheck,
  X
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
  read: boolean;
}

export default function HomePage() {
  const [aedAmount, setAedAmount] = useState<number | "">(100);
  const [bifAmount, setBifAmount] = useState<number | "">(1628);
  const [transferType, setTransferType] = useState<"mobile" | "bank">("mobile");

  const [inputBifAmount, setInputBifAmount] = useState<number | "">(1168200);
  const [outputAedAmount, setOutputAedAmount] = useState<number | "">(700);

  const [countryAmounts, setCountryAmounts] = useState<Record<string, number | "">>({
    UGX: 10170,
    TSH: 7026,
    KSH: 341,
    RWF: 3935,
    CDF: 6716,
  });

  const editableRate = 16.28; 
  const burundiToDubaiRate = 1668.86; 
  const whatsappNumber = "+971 55 225 6963";
  const whatsappRaw = "971552256963";

  // Messaging Panel States
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Muraho! Twiteguye kubafasha kohereza cyangwa gutora amafaranga yanyu.', sender: 'admin', timestamp: '10:00 AM', read: true }
  ]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const handleAedChange = (val: number | "") => {
    setAedAmount(val);
    if (val === "" || isNaN(val)) {
      setBifAmount("");
    } else {
      setBifAmount(Math.round(val * (editableRate * 100) * 0.99)); 
    }
  };

  const handleBifChange = (val: number | "") => {
    setBifAmount(val);
    if (val === "" || isNaN(val) || editableRate === 0) {
      setAedAmount("");
    } else {
      const effectiveRate = editableRate * 0.99;
      const calculatedAed = val / (effectiveRate * 100);
      setAedAmount(Number(calculatedAed.toFixed(2)));
    }
  };

  const handleInputBifChange = (val: number | "") => {
    setInputBifAmount(val);
    if (val === "" || isNaN(val) || burundiToDubaiRate === 0) {
      setOutputAedAmount("");
    } else {
      const effectiveRate = burundiToDubaiRate * 1.01; 
      const calculatedAed = val / effectiveRate;
      setOutputAedAmount(Number(calculatedAed.toFixed(2)));
    }
  };

  const handleCountryAmountChange = (currency: string, val: number | "") => {
    setCountryAmounts(prev => ({ ...prev, [currency]: val }));
  };

  const getCountryPayout = (currency: string, inputVal: number | "") => {
    if (inputVal === "" || isNaN(inputVal)) return 0;
    const baseRates: Record<string, number> = {
      UGX: 10170,
      TSH: 7026,
      KSH: 341,
      RWF: 3935,
      CDF: 6716,
    };
    const rate10AED = baseRates[currency] || 1000;
    const ratePerAED = rate10AED / 10;
    return Math.round(inputVal * ratePerAED * 0.99).toLocaleString();
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RUNGIKA NA BILLY',
          text: 'Uburyo bwiza bwo kohereza amafaranga hagati ya Dubai n’Afurika!',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link y'app yanduwe muri clipboard!");
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setMessages(prev => [...prev, userMsg]);
    setNewMessage("");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, read: true } : m));
      
      const adminReply: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Murakaza neza! Ubutumwa bwanyu bwakiriwe, turaza kubitaho mu kanya gato.',
        sender: 'admin',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: true
      };
      setMessages(prev => [...prev, adminReply]);
    }, 2500);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const mobilePaymentMethods = ["Lumicash", "Bancobu Enoti"];
  const burundiBanks = [
    "Bancobu Courant", "BCB Bank", "CRDB Bank", 
    "Ecobank", "IBB Bank", "BBCI", "BGF", "KCB", "FinBank"
  ];
  const otherCountries = [
    { name: "Uganda", code: "UGX", flag: "🇺🇬" },
    { name: "Tanzania", code: "TSH", flag: "🇹🇿" },
    { name: "Kenya", code: "KSH", flag: "🇰🇪" },
    { name: "Rwanda", code: "RWF", flag: "🇷🇼" },
    { name: "DR Congo", code: "CDF", flag: "🇨🇩" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-24">
      {/* Marquee Banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2.5 overflow-hidden shadow-lg border-b border-red-700">
        <div className="whitespace-nowrap animate-marquee flex items-center space-x-8 text-sm md:text-base font-black tracking-wide">
          <span>⚡ ERURUKANA OHA! RUNGUZA AMAFARANGA YAWEYA INTAGUZA (1 - 10 MIN) ⚡</span>
          <span>•</span>
          <span>OHEREZA AMAFARANGA MURI AFRIKA N'I DUBAI CUMPANGA!</span>
        </div>
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full border-2 border-red-500 overflow-hidden shadow-md bg-slate-800 flex-shrink-0">
            <img src="/1000107113.jpg" alt="Uwurungika" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">RUNGIKA NA BILLY</h1>
            <p className="text-xs text-slate-400">Uburyo ushobora kuvugana n'uwurungika</p>
          </div>
        </div>

        <button 
          onClick={handleShareApp}
          className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-full text-xs text-slate-300 transition shadow"
        >
          <Share2 className="w-3.5 h-3.5 text-green-400" />
          <span>Share App</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-8">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-slate-400">Botim / DuPay / Direct:</p>
                <p className="text-sm font-bold text-white">0552256963</p>
              </div>
            </div>
          </div>

          <a 
            href={`https://wa.me/${whatsappRaw}`}
            target="_blank" 
            rel="noreferrer"
            className="bg-green-600 hover:bg-green-500 transition rounded-2xl p-4 flex items-center justify-center space-x-2 text-white font-bold shadow-lg"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Ushaka kuvugana n'uwurungika</span>
          </a>
        </div>

        {/* First Calculator: AED to Burundi */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base md:text-lg font-black text-red-400 tracking-wide uppercase mb-1">
            USHAKA KURUNGIKA AMAHERA AVA DUBAI AJA MU BURUNDI
          </h3>
          <p className="text-xs text-slate-400 mb-4">Leta amafaranga yawe uyohereze Burundi ubwo nyene.</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Andika muri AED</label>
              <input
                type="number"
                value={aedAmount}
                onChange={(e) => handleAedChange(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Muri BIF</label>
              <input
                type="number"
                value={bifAmount}
                onChange={(e) => handleBifChange(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-red-400 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </section>

        {/* Second Calculator: Burundi to Dubai */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-base md:text-lg font-black text-green-400 tracking-wide uppercase mb-1">
            USHAKA GUTORA AMAFERANGA AVA MU BURUNDI AZA DUBAI
          </h3>
          <p className="text-xs text-slate-400 mb-4">Example: 1,168,200 BIF = 700 AED</p>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">BIF Amount</label>
              <input
                type="number"
                value={inputBifAmount}
                onChange={(e) => handleInputBifChange(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">AED Amount</label>
              <input
                type="text"
                readOnly
                value={outputAedAmount !== "" ? Number(outputAedAmount).toLocaleString() : "0"}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg font-bold text-green-400"
              />
            </div>
          </div>
        </section>

        {/* Other Countries Calculators */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wide">Ibindi Bihugu (Other Countries)</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherCountries.map((c) => {
              const currentVal = countryAmounts[c.code] ?? "";
              const payout = getCountryPayout(c.code, currentVal === "" ? "" : Number(currentVal));
              return (
                <div key={c.code} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-sm font-bold text-white">
                    <span>{c.flag} {c.name}</span>
                    <span className="text-red-400 text-xs">{c.code}</span>
                  </div>
                  <input
                    type="number"
                    value={currentVal}
                    onChange={(e) => handleCountryAmountChange(c.code, e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="AED"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <div className="text-xs text-green-400 font-bold">Azabona: {payout} {c.code}</div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Floating Kurungika Message Drawer */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-red-600 hover:bg-red-500 text-white font-black px-6 py-4 rounded-full shadow-2xl flex items-center space-x-3 transition"
          >
            <MessageSquare className="w-6 h-6 animate-bounce" />
            <span className="text-sm">Kurungika Message</span>
          </button>
        ) : (
          <div className="bg-slate-900 border border-slate-700 w-80 md:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[480px]">
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xs">BH</div>
                <div>
                  <h4 className="text-xs font-bold text-white">Billy Happy Transfer</h4>
                  <p className="text-[10px] text-green-400">{isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50 text-xs">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 relative group ${
                    msg.sender === 'user' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-100 border border-slate-700'
                  }`}>
                    <p>{msg.text}</p>
                    <div className="flex justify-end space-x-1 mt-1 text-[9px] opacity-75">
                      <span>{msg.timestamp}</span>
                      {msg.sender === 'user' && (
                        <span>{msg.read ? <CheckCheck className="w-3 h-3 text-blue-300 inline" /> : <Check className="w-3 h-3 inline" />}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 bg-slate-950 border border-slate-700 text-slate-400 hover:text-red-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-slate-400 text-xs italic">Billy is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Andika ubutumwa..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
              <button type="submit" className="bg-red-600 text-white p-2.5 rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
    }
