"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Square, Loader2, Volume2, MicOff } from "lucide-react";

type YasminState = "idle" | "listening" | "processing" | "speaking";

export default function YasminUI() {
  const [state, setState] = useState<YasminState>("idle");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  
  // Visualizer ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(null);
  
  // Audio playback queue
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // --- Audio Context setup ---
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
  };

  // --- WebSocket Setup ---
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://192.168.187.12:8080/yasmin");
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setError(null);
    };

    ws.onmessage = async (event) => {
      // Expecting binary data containing audio (PCM or base64 JSON in actual implementation)
      // This is a placeholder for receiving chunks and putting them into queue
      if (state !== "speaking") {
        setState("speaking");
      }
      
      try {
        let chunk: Float32Array;
        // In reality, decode event.data to Float32Array depending on server format
        // e.g., if arrayBuffer:
        if (event.data instanceof Blob) {
           const buffer = await event.data.arrayBuffer();
           // Example of decoding - assuming Int16 PCM:
           const int16Array = new Int16Array(buffer);
           chunk = new Float32Array(int16Array.length);
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
      setError("Failed to connect to orchestrator.");
      stopSession();
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      stopSession();
    };

    wsRef.current = ws;
  }, [state]);

  // --- Playback logic ---
  const playNextChunk = () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) return;
    
    const context = audioContextRef.current;
    
    // Ensure we aren't lagging behind current time
    if (nextPlayTimeRef.current < context.currentTime) {
      nextPlayTimeRef.current = context.currentTime + 0.05; // small buffer
    }

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift()!;
      const audioBuffer = context.createBuffer(1, chunk.length, context.sampleRate);
      audioBuffer.copyToChannel(chunk, 0);

      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
      
      source.onended = () => {
        if (audioQueueRef.current.length === 0 && context.currentTime >= nextPlayTimeRef.current - 0.1) {
          setState("idle");
        }
      };
    }
  };

  // --- Microphone Capture ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }); // Simplification for capture

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send to server
          wsRef.current.send(e.data);
        }
      };

      recorder.start(250); // Capture chunks every 250ms
      mediaRecorderRef.current = recorder;
      
      // Visualizer logic (mocked visually below)
      drawVisualizer();
      setState("listening");
    } catch (err) {
      console.error("Error accessing mic:", err);
      setError("Microphone access denied.");
      stopSession();
    }
  };

  const stopSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setState("idle");
  };

  const handleStart = () => {
    initAudioContext();
    connectWebSocket();
    startRecording();
  };

  const handleStop = () => {
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
      
      if (state === "idle" || state === "processing") {
        ctx.fillStyle = "#333";
        ctx.fillRect(0, canvas.height / 2 - 2, canvas.width, 4);
      } else {
        ctx.beginPath();
        for (let i = 0; i < canvas.width; i++) {
          const y = Math.sin(i * 0.05 + time) * (isSpeaking ? 30 : 15) * Math.sin(time * 0.5) + canvas.height / 2;
          if (i === 0) ctx.moveTo(i, y);
          else ctx.lineTo(i, y);
        }
        ctx.strokeStyle = isListening ? "#3b82f6" : "#10b981"; // blue for listening, green for speaking
        ctx.lineWidth = 4;
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
      stopSession();
    };
  }, [drawVisualizer]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-3xl shadow-xl w-full max-w-md mx-auto">
      <div className="mb-8 relative w-48 h-48 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner overflow-hidden border-4 border-zinc-700">
        <canvas ref={canvasRef} width={192} height={192} className="absolute inset-0 z-0" />
        <div className="z-10 bg-zinc-900 rounded-full p-4 shadow-lg flex items-center justify-center">
          {state === "idle" && <MicOff className="w-12 h-12 text-zinc-500" />}
          {state === "listening" && <Mic className="w-12 h-12 text-blue-500 animate-pulse" />}
          {state === "processing" && <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />}
          {state === "speaking" && <Volume2 className="w-12 h-12 text-green-500 animate-pulse" />}
        </div>
      </div>

      <div className="text-center mb-8 h-12">
        <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
          {state === "idle" && "Yasmin is Offline"}
          {state === "listening" && "Listening..."}
          {state === "processing" && "Thinking..."}
          {state === "speaking" && "Yasmin is Speaking"}
        </h2>
        {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
      </div>

      <div className="flex gap-4 w-full">
        {state === "idle" ? (
          <button
            onClick={handleStart}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95"
          >
            <Mic className="w-6 h-6" />
            Start Session
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-colors active:scale-95"
          >
            <Square className="w-6 h-6" />
            End Session
          </button>
        )}
      </div>
    </div>
  );
}
