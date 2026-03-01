"use client";

import { supabase } from "@/lib/db/supabaseClient";
import { Json } from "@/lib/types/database.types";
import { useCallback, useEffect, useRef } from "react";

interface SignallingCallbacks {
    onOffer: (sdp: RTCSessionDescriptionInit) => void;
    onAnswer: (sdp: RTCSessionDescriptionInit) => void;
    onIceCandidate: (candidate: RTCIceCandidateInit) => void;
}

export function useSignalling(
    roomId: string | null,
    myUserId: string | null,
    callbacks: SignallingCallbacks
) {
    // Use refs for callbacks so subscription is never recreated when callbacks change
    const callbacksRef = useRef(callbacks);

    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        if (!roomId || !myUserId) return;

        const channel = supabase
            .channel(`signalling_${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "signaling_messages",
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    const msg = payload.new as {
                        sender_id: string;
                        type: string;
                        payload: RTCSessionDescriptionInit | RTCIceCandidateInit;
                    };

                    // Ignore message I sent myself
                    if (msg.sender_id === myUserId) return;

                    if (msg.type === "offer")
                        callbacksRef.current.onOffer(msg.payload as RTCSessionDescriptionInit);
                    else if (msg.type === "answer")
                        callbacksRef.current.onAnswer(msg.payload as RTCSessionDescriptionInit);
                    else if (msg.type === "ice")
                        callbacksRef.current.onIceCandidate(msg.payload as RTCIceCandidateInit);
                }
            )
            .subscribe();
        
        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, myUserId]);         // only recreate if roomId or userId changes

    const sendSignal = useCallback(
        async (
            type: "offer" | "answer" | "ice",
            payload: RTCSessionDescriptionInit | RTCIceCandidateInit
        ) => {
            if (!roomId || !myUserId) return;

            await supabase.from("signaling_messages").insert({
                room_id: roomId,
                sender_id: myUserId,
                type,
                payload: payload as unknown as Json,
            });
        },
        [roomId, myUserId]
    );

    const clearMessages = useCallback(async () => {
        if (!roomId) return;
        await supabase.from("signaling_messages").delete().eq("room_id", roomId);
    }, [roomId]);

    return { sendSignal, clearMessages };
}
