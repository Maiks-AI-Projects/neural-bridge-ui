"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ArrowRight, Delete } from "lucide-react";

type Person = {
  id: number;
  name: string;
  role: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPersons = async () => {
      try {
        const response = await fetch("/api/persons");
        const data = await response.json();
        if (Array.isArray(data)) {
          setPersons(data);
        }
      } catch (err) {
        console.error("Failed to fetch persons:", err);
      }
    };
    fetchPersons();
  }, []);

  const handleKeypadPress = (num: string) => {
    if (code.length < 4) {
      const newCode = code + num;
      setCode(newCode);
      if (newCode.length === 4) {
        setError("");
      }
    }
  };

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
  };

  const handleLogin = async () => {
    if (!selectedPerson || code.length !== 4) return;
    setLoading(true);
    
    try {
      const response = await fetch("/api/auth/pin-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          person_id: selectedPerson.id,
          pin_code: code,
        }),
      });

      if (response.ok) {
        localStorage.setItem("bridge_token", "token_" + selectedPerson.id);
        localStorage.setItem("user_name", selectedPerson.name);
        router.push("/app");
      } else {
        const data = await response.json();
        setError(data.error || "Invalid 4-digit code");
        setLoading(false);
        setCode("");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Unable to connect to login service");
      setLoading(false);
      setCode("");
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col px-6 pt-16">
      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Bridge</h1>
        <p className="text-gray-400">Secure Mobile Entry</p>
      </header>

      {!selectedPerson ? (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Select Your Profile</h2>
          <div className="space-y-3">
            {persons.length > 0 ? (
              persons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPerson(p)}
                  className="w-full bg-[#1a1a1a] p-5 rounded-2xl flex items-center justify-between border border-gray-800 active:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-400 font-bold text-xl">
                      {p.name[0]}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">{p.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-widest">{p.role}</div>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-600" />
                </button>
              ))
            ) : (
              <div className="text-gray-500 italic">Loading profiles...</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <button 
            onClick={() => setSelectedPerson(null)}
            className="text-blue-400 flex items-center gap-1 text-sm mb-4"
          >
            ← Back to profiles
          </button>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
              {selectedPerson.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedPerson.name}</h2>
              <p className="text-gray-400">Enter your 4-digit code</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-16 h-20 border-2 rounded-2xl flex items-center justify-center text-3xl font-bold ${
                  code[i] ? "border-blue-500 bg-blue-500/10" : "border-gray-800"
                }`}
              >
                {code[i] ? "●" : ""}
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-center font-medium">{error}</p>}

          <div className="grid grid-cols-3 gap-4 pb-12">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleKeypadPress(n.toString())}
                className="h-20 bg-[#1a1a1a] rounded-2xl text-2xl font-bold active:bg-gray-800"
              >
                {n}
              </button>
            ))}
            <button 
              onClick={handleBackspace}
              className="h-20 bg-[#1a1a1a] rounded-2xl flex items-center justify-center active:bg-gray-800"
            >
              <Delete size={28} />
            </button>
            <button
              onClick={() => handleKeypadPress("0")}
              className="h-20 bg-[#1a1a1a] rounded-2xl text-2xl font-bold active:bg-gray-800"
            >
              0
            </button>
            <button
              onClick={handleLogin}
              disabled={code.length !== 4 || loading}
              className={`h-20 rounded-2xl flex items-center justify-center ${
                code.length === 4 ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-500"
              }`}
            >
              {loading ? <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" /> : <ArrowRight size={32} />}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
