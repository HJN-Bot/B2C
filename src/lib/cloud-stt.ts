/**
 * cloud-stt.ts — Deepgram Nova-2 real-time speech-to-text via WebSocket
 *
 * Used as a fallback when the browser Web Speech API is unavailable
 * (mobile Safari, WeChat, iOS WKWebView).
 *
 * Deepgram free tier: 200 h/month (more than enough for validation).
 */

export interface CloudSTT {
  /** Push an audio blob (typically from MediaRecorder ondataavailable). */
  send(audio: Blob): void;
  /** Close the WebSocket and release resources. */
  close(): void;
}

export interface CloudSTTCallbacks {
  /** Called with the latest transcript text and whether it's a final segment. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Optional error callback — the socket is already closed by then. */
  onError?: (err: Error) => void;
}

/**
 * Create a Deepgram streaming STT session.
 *
 * @param apiKey  Deepgram API key (from VITE_DEEPGRAM_API_KEY).
 * @param opts    Callbacks for transcript and error.
 * @returns       { send, close } control surface.
 */
export function createCloudSTT(
  apiKey: string,
  opts: CloudSTTCallbacks,
): CloudSTT {
  if (!apiKey) {
    console.warn(
      "[cloud-stt] VITE_DEEPGRAM_API_KEY is empty — STT will be silent.",
    );
  }

  const { onTranscript, onError } = opts;

  const params = new URLSearchParams({
    model: "nova-2",
    language: "en",
    interim_results: "true",
    endpointing: "300",
    smart_format: "true",
  });

  const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  let socket: WebSocket | null = null;
  let closed = false;

  function connect() {
    if (closed) return;
    try {
      socket = new WebSocket(url, ["token", apiKey]);
    } catch (err) {
      if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    socket.onopen = () => {
      console.log("[cloud-stt] Deepgram WebSocket connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        const transcript =
          msg?.channel?.alternatives?.[0]?.transcript ?? "";
        const isFinal = Boolean(msg?.is_final);

        if (transcript) {
          onTranscript(transcript, isFinal);
        }
      } catch {
        // Ignore unparseable messages (e.g. keepalive / metadata).
      }
    };

    socket.onerror = () => {
      const err = new Error("Deepgram WebSocket error");
      if (onError) onError(err);
    };

    socket.onclose = (event) => {
      if (!closed) {
        console.log("[cloud-stt] Deepgram WebSocket closed:", event.code, event.reason);
      }
      socket = null;
    };
  }

  connect();

  return {
    send(audio: Blob) {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(audio);
    },

    close() {
      closed = true;
      if (socket) {
        // Prevent re-fire from onclose handler after intentional close.
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        try {
          socket.close();
        } catch {
          // Already closed / closing.
        }
        socket = null;
      }
    },
  };
}
