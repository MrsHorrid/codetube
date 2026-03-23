"use strict";
/**
 * Voice Synthesis Pipeline
 *
 * Integrates with Fish Audio API to generate narration from lesson text.
 * Supports multiple voice personas and returns audio URLs to sync
 * with code playback via AUDIO events in the recording format.
 *
 * Fish Audio API: https://fish.audio/api
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FishAudioClient = exports.VOICE_PERSONA_DESCRIPTIONS = void 0;
exports.synthesizeNarration = synthesizeNarration;
exports.buildAudioEvents = buildAudioEvents;
exports.syncAudioWithCode = syncAudioWithCode;
// ─── Fish Audio Voice IDs ────────────────────────────────────
// Map our persona names to Fish Audio model/voice IDs
// These should be configured via environment variables in production
const FISH_AUDIO_VOICE_MAP = {
    chill: process.env.FISH_VOICE_CHILL || 'default-chill',
    energetic: process.env.FISH_VOICE_ENERGETIC || 'default-energetic',
    british: process.env.FISH_VOICE_BRITISH || 'default-british',
    'sarcastic-australian': process.env.FISH_VOICE_SARCASTIC_AU || 'default-sarcastic-au',
    'calm-mentor': process.env.FISH_VOICE_CALM_MENTOR || 'default-calm-mentor',
    'enthusiastic-teacher': process.env.FISH_VOICE_ENTHUSIASTIC || 'default-enthusiastic',
    'no-nonsense': process.env.FISH_VOICE_NO_NONSENSE || 'default-no-nonsense',
};
// ─── Fish Audio Client ────────────────────────────────────────
class FishAudioClient {
    apiKey;
    baseUrl;
    storageDir;
    constructor() {
        this.apiKey = process.env.FISH_AUDIO_API_KEY || '';
        this.baseUrl = process.env.FISH_AUDIO_BASE_URL || 'https://api.fish.audio/v1';
        this.storageDir = process.env.AUDIO_STORAGE_DIR || '/tmp/codetube-audio';
    }
    get isEnabled() {
        return Boolean(this.apiKey);
    }
    async synthesize(text, persona, outputPath) {
        if (!this.isEnabled) {
            // Return mock URL for development
            return this.mockSynthesize(text, persona, outputPath);
        }
        const voiceId = FISH_AUDIO_VOICE_MAP[persona];
        const payload = {
            text,
            reference_id: voiceId,
            format: 'mp3',
            mp3_bitrate: 128,
            normalize: true,
            latency: 'normal',
        };
        const res = await fetch(`${this.baseUrl}/tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Fish Audio API error ${res.status}: ${errText}`);
        }
        // Fish Audio returns binary MP3 audio
        const audioBuffer = await res.arrayBuffer();
        const audioBytes = Buffer.from(audioBuffer);
        // Save to storage
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, audioBytes);
        // Estimate duration: ~150 words/min, MP3 at 128kbps
        const wordCount = text.split(/\s+/).length;
        const estimatedDurationMs = (wordCount / 150) * 60 * 1000;
        // Return a URL that can be served by the backend
        const relativePath = outputPath.replace(this.storageDir, '');
        return {
            url: `/api/audio${relativePath}`,
            durationMs: Math.max(estimatedDurationMs, 1000),
        };
    }
    mockSynthesize(text, persona, _outputPath) {
        // Estimate duration based on word count (~150 words/min average speaking rate)
        const wordCount = text.split(/\s+/).length;
        const durationMs = Math.max((wordCount / 150) * 60 * 1000, 1000);
        // Return a placeholder URL
        const hash = Buffer.from(text.slice(0, 32)).toString('base64url').slice(0, 8);
        return {
            url: `/api/audio/mock/${persona}/${hash}.mp3`,
            durationMs,
        };
    }
}
exports.FishAudioClient = FishAudioClient;
// Singleton client
const fishClient = new FishAudioClient();
// ─── Narration Synthesizer ────────────────────────────────────
/**
 * Synthesize all narration segments for a lesson.
 * Returns a map of segment index → { url, durationMs }
 */
async function synthesizeNarration(segments, persona, lessonId) {
    const results = [];
    // Use the same storage dir the client is configured with
    const storageDir = process.env.AUDIO_STORAGE_DIR || '/tmp/codetube-audio';
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const outputPath = `${storageDir}/${lessonId}/segment-${i}.mp3`;
        try {
            const { url, durationMs } = await fishClient.synthesize(seg.text, persona, outputPath);
            results.push({
                url,
                durationMs,
                text: seg.text,
                persona,
                segmentIndex: i,
            });
        }
        catch (err) {
            console.error(`Failed to synthesize segment ${i} for lesson ${lessonId}:`, err);
            // Fallback: return a mock-style URL with duration estimate so playback can continue
            const wordCount = seg.text.split(/\s+/).length;
            const durationMs = Math.max((wordCount / 150) * 60 * 1000, 1000);
            const hash = Buffer.from(seg.text.slice(0, 32)).toString('base64url').slice(0, 8);
            results.push({
                url: `/api/audio/mock/${persona}/${hash}-fallback.mp3`,
                durationMs,
                text: seg.text,
                persona,
                segmentIndex: i,
            });
        }
    }
    return results;
}
/**
 * Convert synthesized audio into AUDIO recording events.
 * Timestamps are adjusted to interleave with code typing events.
 */
function buildAudioEvents(synthesized, startOffset = 0) {
    const events = [];
    let cursor = startOffset;
    for (const audio of synthesized) {
        events.push({
            type: 'AUDIO',
            timestamp: cursor,
            data: {
                url: audio.url,
                text: audio.text,
                persona: audio.persona,
                durationMs: audio.durationMs,
            },
        });
        cursor += audio.durationMs + 500; // 500ms gap between segments
    }
    return events;
}
/**
 * Sync audio events with code events.
 * Inserts AUDIO events at appropriate timestamps relative to code playback.
 */
function syncAudioWithCode(audioEvents, codeEvents) {
    // Merge and sort all events by timestamp
    const allEvents = [
        ...audioEvents,
        ...codeEvents,
    ];
    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
}
// ─── Voice Persona Descriptions (for prompts) ─────────────────
exports.VOICE_PERSONA_DESCRIPTIONS = {
    chill: 'Relaxed and approachable. Uses casual language, "hey", "cool", "nice". Never rushed.',
    energetic: 'High-energy and enthusiastic. Uses exclamation points, "BOOM!", "let\'s GO!". Keeps momentum up.',
    british: 'Formal British academic style. Measured pace, uses "quite", "rather", "indeed".',
    'sarcastic-australian': 'Dry wit with Australian humour. Light sarcasm, uses "mate", "no worries", "crikey". Self-aware.',
    'calm-mentor': 'Patient and mentoring. Takes time to explain, very reassuring, never makes the learner feel rushed.',
    'enthusiastic-teacher': 'Passionate about teaching. Lots of encouragement, celebrates small wins.',
    'no-nonsense': 'Direct and concise. No filler words. Gets straight to the point.',
};
//# sourceMappingURL=voiceSynthesis.js.map