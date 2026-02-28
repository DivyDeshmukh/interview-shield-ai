"use client";

import { useSignalling } from "@/hooks/useSignalling";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/lib/db/supabaseClient";
import {
    endInterview,
    getInterviewById,
    startInterview,
} from "@/lib/services/interviews";
import { AIEvent, Interview, PageState } from "@/lib/types";
import { formatEventLabel, formatTime } from "@/lib/utils";
import { AlertTriangle, Mic, MicOff, MonitorCheck, PhoneOff, Shield, Video, VideoOff } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function InterviewPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    // Auth + interview data
    const [userId, setUserId] = useState<string | null>(null);
    const [interview, setInterview] = useState<Interview | null>(null);
    const [myRole, setMyRole] = useState<"recruiter" | "candidate" | null>(null);
    const [pageState, setPageState] = useState<PageState>("loading");

    // Scheduled time gate
    const [isTimeReached, setIsTimeReached] = useState(false);

    // Call controls
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    // AI events (recruiter only)
    const [aiEvents, setAIEvents] = useState<AIEvent[]>([]);

    // Video elements
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    // sendSignal ref - solves the circular dependency between useWebRTC and useSignalling
    const sendSignalRef = useRef<
        | ((
            type: "offer" | "answer" | "ice",
            payload: RTCSessionDescriptionInit | RTCIceCandidateInit,
        ) => Promise<void>)
        | null
    >(null);

    // WebRTC hook
    const {
        localStream,
        remoteStream,
        connectionState,
        initializeAndOffer,
        initializeAndAnswer,
        handleAnswer,
        handleIceCandidate,
        toggleMic,
        toggleCamera,
        endCall,
    } = useWebRTC((candidate) => {
        // When browser finds a local ICE candidate, send it via signaling
        sendSignalRef.current?.("ice", candidate);
    });

    // Signalling hook
    const { sendSignal } = useSignalling(interview?.meeting_room_id ?? null, userId, {
        // Recruiter receives this
        onAnswer: async (answer) => {
            await handleAnswer(answer);
        },
        // Candidate receives this - auto answers
        onOffer: async (offer) => {
            try {
                const answer = await initializeAndAnswer(offer);
                await sendSignalRef.current?.("answer", answer);
                setPageState("calling");
            } catch (error) {
                console.error("Failed to answer offer: ", error);
                toast.error("Failed to connect. Check camera/mic permissions.");
            }
        },
        // Both sides receive each other's ICE candidates
        onIceCandidate: async (candidate) => {
            await handleIceCandidate(candidate);
        },
    });

    // keep sendSignalRef in sync with the latest sendSignal function
    useEffect(() => {
        sendSignalRef.current = sendSignal;
    }, [sendSignal]);

    // Attach streams to video elements
    // pageState is in deps so these re-run when calling UI mounts (video elements appear)
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, pageState]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        } else if (remoteVideoRef.current && !remoteStream) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [remoteStream, pageState]);

    // Call duration timer
    useEffect(() => {
        if (pageState !== "calling") return;
        const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
        return () => clearInterval(interval);
    }, [pageState]);

    // Scheduled time gate — re-checks every 10s until unlocked
    useEffect(() => {
        if (!interview?.scheduled_at) return;

        function check() {
            const reached = new Date() >= new Date(interview!.scheduled_at);
            setIsTimeReached(reached);
            return reached;
        }

        if (check()) return; // already past scheduled time, no need to poll
        const interval = setInterval(() => {
            if (check()) clearInterval(interval);
        }, 10_000);
        return () => clearInterval(interval);
    }, [interview?.scheduled_at]);

    // Auth check + fetch Interview
    useEffect(() => {
        async function init() {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            setUserId(user.id);

            const { data, error } = await getInterviewById(id);
            if (error || !data) {
                toast.error("Interview not found.");
                router.replace("/");
                return;
            }

            setInterview(data as Interview);

            // Determine role for this specific interview
            if (data.recruiter_id === user.id) {
                setMyRole("recruiter");
            } else if (data.candidate_id === user.id) {
                setMyRole("candidate");
            } else {
                toast.error("You are not part of this interview");
                router.replace("/");
                return;
            }

            // If interview is already ongoing when page loads
            if (data.status === "ongoing") {
                if (data.recruiter_id === user.id) {
                    // Recruiter rejoining - go straight to call UI
                    setPageState("calling");
                } else {
                    // candidate: fetch existing offer from signalling_messages (recruiter already sent it)
                    const { data: signals } = await supabase
                        .from("signaling_messages")
                        .select("*")
                        .eq("room_id", data.meeting_room_id!)
                        .eq("type", "offer")
                        .order("created_at", { ascending: false })
                        .limit(1);

                    if (signals && signals.length > 0) {
                        // Offer already exists - process it immediately
                        try {
                            const answer = await initializeAndAnswer(
                                signals[0].payload as unknown as RTCSessionDescriptionInit,
                            );
                            await sendSignalRef.current?.("answer", answer);
                            setPageState("calling");
                        } catch (error) {
                            toast.error("Failed to join. Check camera/mic permissions.");
                        }
                    } else {
                        // Interview ongoing but no offer yet - wait
                        setPageState("pre-call");
                    }
                }
            } else if (data.status === "completed") {
                setPageState("ended");
            } else {
                setPageState("pre-call");
            }
        }

        init();
    }, [id]);

    // Subscribe to interview status changes (candidate watches for start/end) -
    useEffect(() => {
        if (!interview) return;

        const channel = supabase
            .channel(`interview_status_${interview.meeting_room_id}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "interviews",
                    filter: `meeting_room_id=eq.${interview.meeting_room_id}`,
                },
                (payload) => {
                    const updated = payload.new as Interview;
                    setInterview((prev) => (prev ? { ...prev, ...updated } : prev));

                    if (updated.status === "completed") {
                        setPageState("ended");
                        endCall();
                    }
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [interview?.id, interview?.meeting_room_id]);

    // Subscribe to AI events (recruiter only)
    useEffect(() => {
        if (!interview || myRole !== "recruiter") return;

        const channel = supabase
            .channel(`ai_events_${interview.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "ai_events",
                    filter: `interview_id=eq.${interview.id}`,
                },
                (payload) => {
                    const event = payload.new as AIEvent;
                    setAIEvents((prev) => [event, ...prev.slice(0, 19)]); // keep latest 20
                    toast(formatEventLabel(event.event_type), {
                        icon: "⚠️",
                        style: {
                            background: "#1e293b",
                            color: "#f8fafc",
                            border: "1px solid #ef4444",
                        },
                    });
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [interview?.id, myRole]);

    // Recruiter: start Interview
    async function handleStartInterview() {
        if (!interview) return;

        try {
            await startInterview(interview.id);

            const offer = await initializeAndOffer();
            await sendSignalRef.current?.("offer", offer);
            setPageState("calling");
        } catch (error) {
            console.error(error);
            toast.error("Failed to start. Check camera/mic permissions.");
        }
    }

    // End Interview
    async function handleEndInterview() {
        if (!interview) return;

        endCall();

        if (myRole === "recruiter") {
            await endInterview(interview.id);
        }
        setPageState("ended");
    }

    // Mic/Camera toggles
    function handleToggleMic() {
        const next = !isMuted;
        setIsMuted(next);
        toggleMic(!next); // toggleMic(true) = mic ON
    }

    function handleToggleCamera() {
        const next = !isCameraOff;
        setIsCameraOff(next);
        toggleCamera(!next);
    }

    // RENDER
    if (pageState === "loading") {
        return (
            <div className="h-screen bg-[#0d1b2e] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (pageState === "ended") {
        return (
            <div className="h-screen bg-[#0d1b2e] flex flex-col items-center justify-center gap-6 text-white">
                <Shield className="w-16 h-16 text-orange-500" />
                <h1 className="text-3xl font-bold">Interview Ended</h1>
                <p className="text-slate-400">
                    {myRole === "recruiter"
                        ? "The analysis report will be ready shortly."
                        : "Thank you for participating."}
                </p>
                <button
                    onClick={() => router.replace("/")}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Pre-call screen - recruiter sees "Start Interview", candidate sees "Waiting"
    if (pageState === "pre-call") {
        return (
            <div className="h-screen bg-[#0d1b2e] flex flex-col items-center justify-center gap-6 text-white">
                <Toaster position="bottom-right" />
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-orange-500" />
                    <span className="text-xl font-bold">Interview Shield AI</span>
                </div>
                <div className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-5 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-center">{interview?.title}</h2>

                    {!isTimeReached ? (
                        // Time not yet reached — show scheduled time to both roles
                        <div className="flex flex-col items-center gap-2 text-center">
                            <p className="text-slate-400 text-sm">Scheduled for</p>
                            <p className="text-white font-semibold text-base">
                                {new Date(interview!.scheduled_at).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                })}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                                The interview room will unlock at that time.
                            </p>
                        </div>
                    ) : myRole === "recruiter" ? (
                        // Time reached — recruiter can start
                        <>
                            <p className="text-slate-400 text-sm text-center">
                                Start the interview when the candidate is ready.
                            </p>
                            <button
                                onClick={handleStartInterview}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold text-lg transition-colors cursor-pointer"
                            >
                                Start Interview
                            </button>
                        </>
                    ) : (
                        // Time reached — candidate waits for recruiter
                        <>
                            <p className="text-slate-400 text-sm text-center">
                                Waiting for the recruiter to start the interview...
                            </p>
                            <div className="flex items-center gap-3 text-slate-400">
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                <span>Please wait...</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    // Active Call UI
    return (
        <div className="h-screen bg-[#0d1b2e] flex flex-col overflow-hidden">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="flex items-center justify-between px-6 py-4 shrink">
                <div className="flex items-center gap-2">
                    <Shield className="w-6 h-6 text-orange-500" />
                    <span className="text-white font-bold text-lg">Interview Shield AI</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* Timer */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono font-semibold text-sm">
                            {formatTime(callDuration)}
                        </span>
                    </div>
                    {/* AI Monitoring badge */}
                    <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
                        <MonitorCheck className="w-4 h-4 text-green-400" />
                        <span className="text-slate-300 text-sm">AI Monitoring Active</span>
                    </div>
                </div>
            </header>

            {/* ── Main content ────────────────────────────────────────────── */}
            <main className="flex flex-1 gap-4 px-6 pb-2 overflow-hidden">
                {/* Video feeds */}
                <div className="flex flex-1 gap-4">
                    {/* Recruiter video — left box */}
                    <div className="flex-1 bg-slate-800 rounded-2xl relative overflow-hidden">
                        <video
                            ref={myRole === "recruiter" ? localVideoRef : remoteVideoRef}
                            autoPlay
                            muted={myRole === "recruiter"}
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Placeholder shown when no stream yet */}
                        {((myRole === "recruiter" && !localStream) ||
                            (myRole === "candidate" && !remoteStream)) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                                        <Video className="w-7 h-7 text-slate-500" />
                                    </div>
                                    <span className="text-slate-500 text-sm">
                                        {myRole === "candidate" ? "Waiting for recruiter..." : "Camera Feed"}
                                    </span>
                                </div>
                            )}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                            Recruiter
                        </div>
                        {/* Connection state indicator */}
                        {connectionState !== "connected" && connectionState !== "idle" && (
                            <div className="absolute top-3 right-3 bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full border border-yellow-500/30">
                                {connectionState}
                            </div>
                        )}
                    </div>

                    {/* Candidate video — right box */}
                    <div className="flex-1 bg-slate-800 rounded-2xl relative overflow-hidden">
                        <video
                            ref={myRole === "candidate" ? localVideoRef : remoteVideoRef}
                            autoPlay
                            muted={myRole === "candidate"}
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Placeholder */}
                        {((myRole === "candidate" && !localStream) ||
                            (myRole === "recruiter" && !remoteStream)) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                                        <Video className="w-7 h-7 text-slate-500" />
                                    </div>
                                    <span className="text-slate-500 text-sm">
                                        {myRole === "recruiter" ? "Waiting for candidate..." : "Camera Feed"}
                                    </span>
                                </div>
                            )}
                        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                            Candidate
                        </div>
                    </div>
                </div>

                {/* ── AI Events panel (recruiter only) ──────────────────────── */}
                {myRole === "recruiter" && aiEvents.length > 0 && (
                    <div className="w-64 bg-slate-800 rounded-2xl flex flex-col overflow-hidden shrink">
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            <span className="text-white text-sm font-semibold">AI Alerts</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                            {aiEvents.map((event) => (
                                <div
                                    key={event.id}
                                    className="bg-slate-900 rounded-xl p-3 border border-slate-700"
                                >
                                    <p className="text-white text-xs font-medium">
                                        {formatEventLabel(event.event_type)}
                                    </p>
                                    {event.confidence_score !== null && (
                                        <p className="text-orange-400 text-xs mt-1">
                                            {Math.round(event.confidence_score * 100)}% confidence
                                        </p>
                                    )}
                                    <p className="text-slate-500 text-xs mt-1">
                                        {new Date(event.created_at ?? "").toLocaleTimeString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* ── Bottom controls ─────────────────────────────────────────── */}
            <footer className="flex items-center justify-center gap-4 py-5 shrink">
                {/* Mic toggle */}
                <button
                    onClick={handleToggleMic}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white hover:bg-slate-200"
                        }`}
                >
                    {isMuted ? (
                        <MicOff className="w-5 h-5 text-white" />
                    ) : (
                        <Mic className="w-5 h-5 text-slate-800" />
                    )}
                </button>

                {/* Camera toggle */}
                <button
                    onClick={handleToggleCamera}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-white hover:bg-slate-200"
                        }`}
                >
                    {isCameraOff ? (
                        <VideoOff className="w-5 h-5 text-white" />
                    ) : (
                        <Video className="w-5 h-5 text-slate-800" />
                    )}
                </button>

                {/* End call — only recruiter can formally end */}
                {myRole === "recruiter" ? (
                    <button
                        onClick={handleEndInterview}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors"
                    >
                        <PhoneOff className="w-5 h-5" />
                        End Call
                    </button>
                ) : (
                    <button
                        onClick={() => { endCall(); setPageState("ended"); }}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-full transition-colors"
                    >
                        <PhoneOff className="w-5 h-5" />
                        Leave
                    </button>
                )}
            </footer>
        </div>
    )
}
