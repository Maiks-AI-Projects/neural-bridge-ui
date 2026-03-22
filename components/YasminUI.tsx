"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Loader2, Volume2, MicOff, XCircle } from "lucide-react";

type YasminState = "idle" | "listening" | "processing" | "speaking";

export default function YasminUI() {
  const [state, setState] = useState<YasminState>("idle");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const recordingContextRef = useRef<AudioContext | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const currentSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  
  // Visualizer ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  
  // Audio playback queue
  const audioQueueRef = useRef<Float32Array[]>([]);

  // --- Audio Context setup ---
  const initAudioContext = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        nextPlayTimeRef.current = audioContextRef.current.currentTime;
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    } catch (err) {
      console.error("Audio Context init failed:", err);
      setError("Audio system unavailable.");
    }
  };

  // --- WebSocket Setup ---
  const connectWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket("wss://neural-bridge-intelligence.mmc.onl/yasmin");
      ws.binaryType = "blob";
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setError(null);
        // Start heartbeat
        const interval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send("ping");
          }
        }, 30000); // 30s interval
        (ws as any)._heartbeat = interval;
      };

      ws.onmessage = async (event) => {
        if (event.data === "pong") return;
        
        setState("speaking");
        
        try {
          if (event.data instanceof Blob) {
            const buffer = await event.data.arrayBuffer();
            const int16Array = new Int16Array(buffer);
            const chunk = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
              chunk[i] = int16Array[i] / 32768.0;
            }
            
            audioQueueRef.current.push(chunk);
            playNextChunk();
          }
        } catch (err) {
          console.error("Error processing audio chunk:", err);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error:", e);
        setError("Network error. Try again.");
        stopSession();
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        stopSession();
      };

      wsRef.current = ws;
    } catch (err) {
      setError("Could not establish connection.");
    }
  }, []);

  // --- Playback logic ---
  const playNextChunk = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;
    
    const context = audioContextRef.current;
    
    if (nextPlayTimeRef.current < context.currentTime) {
      nextPlayTimeRef.current = context.currentTime + 0.05;
    }

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!;
      const audioBuffer = context.createBuffer(1, chunk.length, context.sampleRate);
      audioBuffer.getChannelData(0).set(chunk);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
      
      currentSourcesRef.current.push(source);
      
      source.onended = () => {
        currentSourcesRef.current = currentSourcesRef.current.filter(s => s !== source);
        if (audioQueueRef.current.length === 0 && currentSourcesRef.current.length === 0) {
          setState(wsRef.current && wsRef.current.readyState === WebSocket.OPEN ? "listening" : "idle");
        }
      };
    }
  };

  const stopAudio = () => {
    currentSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    currentSourcesRef.current = [];
    audioQueueRef.current = [];
    if (state === "speaking") {
      setState(wsRef.current && wsRef.current.readyState === WebSocket.OPEN ? "listening" : "idle");
    }
  };

  // --- Microphone Capture ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      recordingStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass({ sampleRate: 16000 });
      recordingContextRef.current = context;

      const source = context.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      // 4096 buffer size, 1 input channel, 1 output channel
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const sampleRate = context.sampleRate;
          
          let downsampledData = inputData;
          if (sampleRate !== 16000) {
            const ratio = sampleRate / 16000;
            const newLength = Math.round(inputData.length / ratio);
            downsampledData = new Float32Array(newLength);
            let offsetResult = 0;
            let offsetBuffer = 0;
            while (offsetResult < newLength) {
              const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
              let accum = 0;
              let count = 0;
              for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputData.length; i++) {
                accum += inputData[i];
                count++;
              }
              downsampledData[offsetResult] = accum / (count || 1);
              offsetResult++;
              offsetBuffer = nextOffsetBuffer;
            }
          }

          const pcm16 = new Int16Array(downsampledData.length);
          for (let i = 0; i < downsampledData.length; i++) {
            let s = Math.max(-1, Math.min(1, downsampledData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          wsRef.current.send(pcm16.buffer);
        }
      };

      source.connect(processor);
      
      const gainNode = context.createGain();
      gainNode.gain.value = 0;
      processor.connect(gainNode);
      gainNode.connect(context.destination);

      setState("listening");
    } catch (err) {
      console.error("Error accessing mic:", err);
      setError("Mic access denied.");
      stopSession();
    }
  };

  const stopSession = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (recordingContextRef.current) {
      recordingContextRef.current.close().catch(console.error);
      recordingContextRef.current = null;
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    stopAudio();
    setState("idle");
  };

  const handleStart = () => {
    initAudioContext();
    connectWebSocket();
    startRecording();
  };

  const handleEnd = () => {
    stopSession();
  };

  // --- Mock Visualizer ---
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    const draw = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const isListening = state === "listening";
      const isSpeaking = state === "speaking";
      const isProcessing = state === "processing";
      
      if (state === "idle") {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          let amplitude = 15;
          if (isSpeaking) amplitude = 40;
          if (isListening) amplitude = 25;
          if (isProcessing) amplitude = 10;
          
          const y = Math.sin(i * 0.04 + time) * amplitude * Math.sin(time * 0.4) + canvas.height / 2;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        
        if (isListening) ctx.strokeStyle = "#3b82f6";
        else if (isSpeaking) ctx.strokeStyle = "#10b981";
        else ctx.strokeStyle = "#f59e0b";
        
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, [state]);

  useEffect(() => {
    drawVisualizer();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawVisualizer]);

  useEffect(() => {
    return () => {
      if (processorRef.current) processorRef.current.disconnect();
      if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
      if (recordingContextRef.current) recordingContextRef.current.close().catch(() => {});
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      currentSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-between h-full py-10">
      <div className="w-full text-center space-y-2">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
          {state === "idle" && "Standby"}
          {state === "listening" && "Yasmin is listening"}
          {state === "processing" && "Yasmin is thinking"}
          {state === "speaking" && "Yasmin is speaking"}
        </h2>
        {error ? (
           <p className="text-red-500 font-bold bg-red-500/10 py-1 px-4 rounded-full inline-block">{error}</p>
        ) : (
           <div className="flex justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${state !== "idle" ? "bg-green-500 animate-pulse" : "bg-zinc-700"}`} />
              <div className={`w-2 h-2 rounded-full ${state === "processing" ? "bg-yellow-500 animate-pulse" : "bg-zinc-700"}`} />
              <div className={`w-2 h-2 rounded-full ${state === "speaking" ? "bg-blue-500 animate-pulse" : "bg-zinc-700"}`} />
           </div>
        )}
      </div>

      <div className="relative w-full aspect-square flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
          state === "listening" ? "bg-blue-500/5" : 
          state === "speaking" ? "bg-green-500/5" : "bg-transparent"
        }`} />
        <canvas ref={canvasRef} width={350} height={350} className="w-full max-w-[350px] z-0" />
        
        <div className="absolute z-10">
          {state === "idle" ? (
            <button
              onClick={handleStart}
              className="w-48 h-48 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] active:scale-90 transition-all border-8 border-black ring-4 ring-blue-600/20"
            >
              <Mic size={80} strokeWidth={2.5} />
            </button>
          ) : (
            <button
              onClick={handleEnd}
              className="w-48 h-48 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)] active:scale-90 transition-all border-8 border-black ring-4 ring-red-600/20"
            >
              <Square size={80} fill="currentColor" strokeWidth={1} />
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex gap-4 px-6">
        {state === "speaking" && (
          <button
            onClick={stopAudio}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-zinc-700 shadow-xl"
          >
            <XCircle size={28} className="text-red-500" />
            STFU / STOP AI
          </button>
        )}
        
        {state !== "idle" && state !== "speaking" && (
          <button
            onClick={handleEnd}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-3 active:scale-95 transition-all border border-zinc-700 shadow-xl"
          >
            <MicOff size={28} />
            CANCEL
          </button>
        )}
      </div>
    </div>
  );
}
