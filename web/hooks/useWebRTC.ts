"use client";

import { useEffect, useRef, useState } from "react";
import { iceServers } from './iceServers';

export type ConnectionState =
    | "idle"
    | "connecting"
    | "connected"
    | "disconnected"
    | "failed";

export function useWebRTC(
    onLocalIceCandidate: (candidate: RTCIceCandidateInit) => void
) {
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");

    // ICE candidate buffer - needed if candidates arrive before remote description is set
    const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
    const remoteDescSet = useRef(false);

    // keep the ice callback ref stable to avoid stale closures
    const iceCbRef = useRef(onLocalIceCandidate);
    useEffect(() => {
        iceCbRef.current = onLocalIceCandidate;
    });

    function buildPeerConnection() {
        const pc = new RTCPeerConnection({ iceServers });

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                iceCbRef.current(e.candidate.toJSON());
            }
        };

        pc.ontrack = (e) => {
            if (e.streams?.[0]) {
                setRemoteStream(e.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            const s = pc.connectionState;
            if (s === "connected") setConnectionState("connected");
            else if (s === "connecting") setConnectionState("connecting");
            else if (s === "disconnected") {
                setConnectionState("disconnected");
                setRemoteStream(null); // clear ghost video when other side drops
            }
            else if (s === "failed") {
                setConnectionState("failed");
                setRemoteStream(null);
            }
        };

        pcRef.current = pc;
        return pc;
    }

    async function getMedia() {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });
        setLocalStream(stream);
        return stream;
    }

    // Recruiter flow
    // Call this when recruiter starts the interview
    async function initializeAndOffer(): Promise<RTCSessionDescriptionInit> {
        setConnectionState("connecting");
        const stream = await getMedia();
        const pc = buildPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        return offer;
    }

    // Call this when recruiter receives the answer from candidate
    async function handleAnswer(answer: RTCSessionDescriptionInit) {
        const pc = pcRef.current;
        if (!pc) return;

        await pc.setRemoteDescription(answer);
        remoteDescSet.current = true;
        await drainCandidateBuffer(pc);
    }

    // Candidate flow
    // call this when candidate receives the offer from recruiter
    async function initializeAndAnswer(
        offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit> {
        setConnectionState("connecting");
        const stream = await getMedia();
        const pc = buildPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        await pc.setRemoteDescription(offer);
        remoteDescSet.current = true;
        await drainCandidateBuffer(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        return answer;
    }

    // Shared
    async function handleIceCandidate(candidate: RTCIceCandidateInit) {
        /*
            Because addIceCandidate internally uses the remote ICE credentials (username fragment and password) from the remote SDP to authenticate and validate the candidate.

            Those credentials only exist in your browser after setRemoteDescription is called.

            If you call addIceCandidate before that, the browser has no credentials to match against and throws an error.
        */
        if (remoteDescSet.current && pcRef.current) {
            await pcRef.current.addIceCandidate(candidate).catch(() => { });
        } else {
            // Remote description not set yet - buffer it
            pendingCandidates.current.push(candidate);
        }
    }

    async function drainCandidateBuffer(pc: RTCPeerConnection) {
        for (const c of pendingCandidates.current) {
            await pc.addIceCandidate(c).catch(() => { });
        }

        pendingCandidates.current = [];
    }

    function toggleMic(enabled: boolean) {
        localStream?.getAudioTracks().forEach((t) => {
            t.enabled = enabled;
        });
    }

    function toggleCamera(enabled: boolean) {
        localStream?.getVideoTracks().forEach((t) => {
            t.enabled = enabled;
        });
    }

    function endCall() {
        pcRef?.current?.close();
        pcRef.current = null;
        localStream?.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState("idle");
        remoteDescSet.current = false;
        pendingCandidates.current = [];
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall();
        }
    }, []);

    return {
        localStream,
        remoteStream,
        connectionState,
        initializeAndOffer,
        initializeAndAnswer,
        handleAnswer,
        handleIceCandidate,
        toggleMic,
        toggleCamera,
        endCall
    };
}

