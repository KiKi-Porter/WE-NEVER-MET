"""Score and sound design for 我们从未相遇: A minor → A major, 80 BPM, locked to index.html's bar timeline.

    node export.mjs --cues cues.json     (the page's sound cue sheet)
    python music.py                      -> music.wav, music.mp3

Everything is synthesized: detuned-saw pads, a drawbar organ, a formant choir, strings, an inharmonic piano,
FM bells / celesta, sub bass, kick / taiko / snare / hats, risers and impacts. The picture's sound effects
are placed from the cue sheet so every flash and cut lands on its sound. Stems are mixed with convolution
reverb, a kick sidechain on the pads and a look-ahead limiter; ffmpeg normalizes the mp3 to -14 LUFS.

The recurring motif 呼唤 ("the call") is five rising notes. It is answered only once, at the very end.
"""
import json
import subprocess
import wave
import numpy as np
from scipy.signal import butter, sosfilt, oaconvolve, lfilter
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 44100
CUES = json.load(open('cues.json', encoding='utf8'))
BPM = CUES['bpm']
BEAT = 60 / BPM
BAR = 4 * BEAT
EIGHTH = BEAT / 2
TOTAL = CUES['duration'] + 5.0                                   # room for the last reverb tail
N = int(TOTAL * SR)
F32 = np.float32
TAU = 2 * np.pi
rng = np.random.default_rng(1974)
BUS = {k: np.zeros((2, N), F32) for k in ('pad', 'mus', 'drm', 'sfx', 'hall', 'plate')}
DUCK = np.ones(N, F32)                                          # sidechain gain for the pad bus, carved by kicks
RESPONSE_T = 60 * BAR + BEAT                                    # the one time something answers the call (END scene)


# ================================================================== basics
def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def b(x):
    return x * BAR


def tv(dur):
    return np.arange(max(1, int(dur * SR))) / SR


def noise(n):
    return rng.standard_normal(n).astype(F32)


def sos(kind, f, o=2):
    f = np.clip(f, 20, SR * .45)
    return butter(o, f, kind, fs=SR, output='sos')


def lp(x, f, o=2):
    return sosfilt(sos('low', f, o), x).astype(F32)


def hp(x, f, o=2):
    return sosfilt(sos('high', f, o), x).astype(F32)


def bp(x, lo, hi, o=2):
    return sosfilt(sos('band', [lo, hi], o), x).astype(F32)


def put(sig, t0, bus, gain=1.0, pan=0.0, hall=0.0, plate=0.0):
    """Mix a mono (panned) or stereo signal into a bus at t0 seconds, with reverb sends."""
    if gain == 0:
        return
    sig = np.asarray(sig, F32)
    if sig.ndim == 1:
        a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * 1.4142
    i = int(round(t0 * SR))
    if i < 0:
        sig, i = sig[:, -i:], 0
    n = min(sig.shape[1], N - i)
    if n <= 0:
        return
    seg = sig[:, :n] * gain
    BUS[bus][:, i:i + n] += seg
    if hall:
        BUS['hall'][:, i:i + n] += seg * hall
    if plate:
        BUS['plate'][:, i:i + n] += seg * plate


def env(n, att, rel, hold=None, curve=1.0):
    """Linear attack, sustain, then a release ending at sample n (or after `hold` seconds)."""
    t = np.arange(n) / SR
    end = n / SR if hold is None else hold + rel
    e = np.minimum(t / max(att, 1e-4), 1) * np.clip((end - t) / max(rel, 1e-4), 0, 1)
    return (e ** curve).astype(F32)


def dec(n, k):
    return np.exp(-np.arange(n) / SR * k).astype(F32)


def saw_ph(f, n, vib=0.0, vr=5.2, ph0=None):
    t = np.arange(n) / SR
    fr = f * (1 + vib * np.sin(TAU * vr * t + rng.random() * TAU))
    ph = np.cumsum(fr / SR) + (rng.random() if ph0 is None else ph0)
    return ph


def saw(f, n, vib=0.0, vr=5.2):
    return (2 * (saw_ph(f, n, vib, vr) % 1) - 1).astype(F32)


def sine(f, n, vib=0.0, vr=5.0):
    return np.sin(TAU * saw_ph(f, n, vib, vr, 0)).astype(F32)


def sweep(f0, f1, dur, kind='exp'):
    n = int(dur * SR)
    t = np.arange(n) / n
    f = f0 * (f1 / f0) ** t if kind == 'exp' else f0 + (f1 - f0) * t
    return np.sin(TAU * np.cumsum(f) / SR).astype(F32)


def band_sweep(x, f0, f1, steps=8, width=.9):
    """A band-pass that moves from f0 to f1 over the signal, done as a crossfade of fixed bands."""
    n = len(x)
    out = np.zeros(n, F32)
    fs = f0 * (f1 / f0) ** (np.arange(steps) / (steps - 1))
    t = np.linspace(0, steps - 1, n)
    for k, fc in enumerate(fs):
        w = np.clip(1 - np.abs(t - k), 0, 1).astype(F32)
        out += bp(x, fc / (1 + width), fc * (1 + width)) * w
    return out


# ================================================================== instruments (all mono in, panned by put, or stereo)
def pad(t0, notes, dur, gain=.05, cut=1600, att=1.2, rel=1.6, hall=.9, bus='pad'):
    n = int((dur + rel) * SR)
    L = np.zeros(n, F32)
    R = np.zeros(n, F32)
    for m in notes:
        f = midi(m)
        for d, side in ((-.08, 0), (0, 2), (.08, 1)):
            v = saw(f * 2 ** (d / 12), n, .002, 4 + rng.random())
            if side in (0, 2):
                L += v
            if side in (1, 2):
                R += v
    e = env(n, att, rel, dur)
    sig = np.stack([lp(L, cut), lp(R, cut)]) * e / len(notes) ** .5
    put(sig, t0, bus, gain, hall=hall)


def organ(t0, notes, dur, gain=.05, att=.25, rel=1.4, hall=1.0, bus='pad', bright=1.0):
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    sig = np.zeros(n, F32)
    for m in notes:
        f = midi(m)
        for h, w in ((.5, .5), (1, 1), (2, .65), (3, .3 * bright), (4, .3 * bright), (6, .12 * bright), (8, .08 * bright)):
            if f * h < 9000:
                sig += w * np.sin(TAU * f * h * t + rng.random() * TAU).astype(F32)
    trem = 1 + .12 * np.sin(TAU * 5.6 * t)
    sig = sig * trem * env(n, att, rel, dur) / (len(notes) * 2.4)
    put(lp(sig, 5000), t0, bus, gain, pan=0, hall=hall)


FORMANTS = {'a': ((800, 1.0), (1150, .5), (2900, .25)), 'o': ((450, 1.0), (800, .45), (2830, .12)), 'u': ((325, 1.0), (700, .3), (2530, .08))}


def choir(t0, notes, dur, gain=.05, vowel='a', att=1.0, rel=1.8, hall=1.4):
    n = int((dur + rel) * SR)
    L = np.zeros(n, F32)
    R = np.zeros(n, F32)
    for m in notes:
        for k in range(3):                                      # three singers per note, spread left / right
            src = saw(midi(m) * 2 ** ((rng.random() - .5) * .14 / 12), n, .006, 4.6 + rng.random())
            v = sum(w * bp(src, f * .9, f * 1.1) for f, w in FORMANTS[vowel])
            if k == 0:
                L += v
            elif k == 1:
                R += v
            else:
                L += .7 * v
                R += .7 * v
    e = env(n, att, rel, dur)
    put(np.stack([L, R]) * e / len(notes) ** .5, t0, 'pad', gain, hall=hall)


def strings(t0, notes, dur, gain=.04, att=.8, rel=1.2, cut=3800, hall=.9):
    n = int((dur + rel) * SR)
    L = np.zeros(n, F32)
    R = np.zeros(n, F32)
    for m in notes:
        for side in (L, R):
            side += saw(midi(m) * 2 ** ((rng.random() - .5) * .1 / 12), n, .004, 5.5 + rng.random())
    e = env(n, att, rel, dur, 1.5)
    put(np.stack([lp(L, cut), lp(R, cut)]) * e / len(notes) ** .5, t0, 'pad', gain, hall=hall)


def piano(t0, m, gain=.12, vel=.8, pan=0.0, dur=4.0, hall=.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    sig = np.zeros(n, F32)
    B = .00035
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > 12000:
            break
        sig += (vel ** (k * .3)) / k ** 1.25 * np.sin(TAU * fk * t).astype(F32) * np.exp(-t * (.9 + .55 * k) * (f / 440) ** .35).astype(F32)
    ham = lp(noise(int(.012 * SR)), 2500) * .25 * vel
    sig[:len(ham)] += ham
    sig *= np.minimum(t / .003, 1) * np.clip((dur - t) / .3, 0, 1)
    put(sig, t0, 'mus', gain * vel, pan, hall=hall)


def bell(t0, m, gain=.05, dk=1.4, pan=0.0, ratio=3.5, index=1.8, hall=.8, plate=0.0, bus='mus', dur=None):
    dur = dur or min(7, 5 / dk + .2)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    I = index * np.exp(-t * dk * 1.6)
    sig = np.sin(TAU * f * t + I * np.sin(TAU * f * ratio * t)) * np.exp(-t * dk)
    sig *= np.minimum(t / .002, 1)
    put(sig.astype(F32), t0, bus, gain, pan, hall=hall, plate=plate)


def celesta(t0, m, gain=.04, pan=0.0):
    bell(t0, m, gain, dk=2.4, pan=pan, ratio=4.0, index=1.1, hall=.7)


def lead(t0, m, dur, gain=.035, pan=0.0, hall=1.0, cut=2600):
    """A soft filtered saw voice for the motif in the drops."""
    n = int((dur + .5) * SR)
    sig = (saw(midi(m), n, .004, 5.3) + .6 * saw(midi(m) * 1.003, n, .004, 5.0)) * env(n, .03, .45, dur)
    put(lp(sig, cut), t0, 'mus', gain, pan, hall=hall, plate=.3)


def sine_voice(t0, m, dur, gain=.06, pan=0.0, hall=1.2):
    """The radio-signal voice: a pure sine with a hint of octave. Used for the call and for the answer."""
    n = int((dur + 1.2) * SR)
    t = np.arange(n) / SR
    sig = (np.sin(TAU * midi(m) * t) + .12 * np.sin(TAU * midi(m) * 2 * t)) * env(n, .02, 1.2, dur)
    put(sig.astype(F32), t0, 'mus', gain, pan, hall=hall)


def sub(t0, m, dur, gain=.16):
    n = int((dur + .3) * SR)
    s = np.tanh(1.5 * sine(midi(m), n)) * env(n, .05, .3, dur) * .6
    put(s, t0, 'mus', gain)


def bass8(t0, m, gain=.09, dur=EIGHTH * .9):
    n = int((dur + .05) * SR)
    s = lp(np.tanh(2.2 * (saw(midi(m), n) + .5 * sine(midi(m) / 2, n))), 900) * env(n, .004, .06, dur)
    put(s, t0, 'mus', gain)


def braam(t0, root, dur, gain=.12):
    n = int((dur + .8) * SR)
    sig = sum(saw(midi(m), n, .003) for m in (root, root + 7, root + 12, root - 12))
    lo, hi = lp(sig, 260), lp(sig, 1500)
    k = np.clip(np.arange(n) / (.5 * SR), 0, 1).astype(F32)
    s = np.tanh(1.4 * (lo * (1 - k) + hi * k)) * env(n, .03, .8, dur) * (.6 + .4 * dec(n, .8))
    put(s, t0, 'mus', gain, hall=.8)


def kick(t0, gain=.42, long=False, duck=.55):
    n = int((1.4 if long else .55) * SR)
    t = np.arange(n) / SR
    f = 44 + 120 * np.exp(-t * 28)
    s = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * (2.4 if long else 7.5))
    s[:int(.004 * SR)] += lp(noise(int(.004 * SR)), 5000) * .5
    put(np.tanh(1.6 * s).astype(F32), t0, 'drm', gain)
    i = int(t0 * SR)
    m = min(N - i, int(.45 * SR))
    if m > 0:
        DUCK[i:i + m] = np.minimum(DUCK[i:i + m], 1 - duck * np.exp(-np.arange(m) / SR / .16))


def taiko(t0, gain=.32, pitch=1.0, pan=0.0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    s = (np.sin(TAU * 64 * pitch * t * (1 - .1 * t)) + .5 * np.sin(TAU * 101 * pitch * t)) * np.exp(-t * 4.2)
    s += lp(noise(n), 500) * np.exp(-t * 22) * .8
    put(s.astype(F32), t0, 'drm', gain, pan, hall=.5)


def snare(t0, gain=.16, pan=0.0, big=False):
    n = int(.45 * SR)
    t = np.arange(n) / SR
    s = bp(noise(n), 1400, 7000) * np.exp(-t * (11 if big else 17)) + .5 * np.sin(TAU * 188 * t) * np.exp(-t * 28)
    put(s.astype(F32), t0, 'drm', gain, pan, hall=.5 if big else .25, plate=.4)


def clap(t0, gain=.11):
    n = int(.3 * SR)
    s = np.zeros(n, F32)
    for d in (0, .011, .022):
        j = int(d * SR)
        s[j:] += bp(noise(n - j), 900, 3500) * dec(n - j, 30)
    put(s, t0, 'drm', gain, hall=.4, plate=.5)


def hat(t0, gain=.03, open_=False, pan=.25):
    n = int((.32 if open_ else .06) * SR)
    put(hp(noise(n), 7500) * dec(n, 9 if open_ else 60), t0, 'drm', gain, pan)


def shaker(t0, gain=.02, pan=-.25):
    n = int(.09 * SR)
    put(bp(noise(n), 4500, 11000) * env(n, .03, .05), t0, 'drm', gain, pan)


def crash(t0, gain=.09, dur=2.8):
    n = int(dur * SR)
    s = hp(noise(n), 3500) * dec(n, 1.7) + .3 * bp(noise(n), 5000, 9000) * dec(n, 3)
    put(np.stack([s, hp(noise(n), 3500) * dec(n, 1.7)]), t0, 'drm', gain, hall=.6)


def tom(t0, m, gain=.2, pan=0.0):
    n = int(.6 * SR)
    t = np.arange(n) / SR
    f = midi(m) * (1 + .5 * np.exp(-t * 20))
    s = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * 6)
    put(s.astype(F32), t0, 'drm', gain, pan, hall=.5)


# ================================================================== harmony
CH = {  # pad voicings around middle C, sub-bass root
    'Am': ([57, 60, 64, 69], 33), 'F': ([57, 60, 65, 69], 29), 'C': ([55, 60, 64, 67], 36), 'G': ([55, 59, 62, 67], 31),
    'E': ([56, 59, 64, 68], 28), 'Dm': ([57, 62, 65, 69], 38), 'Esus': ([57, 59, 64, 69], 28),
    'A': ([57, 61, 64, 69], 33), 'F#m': ([57, 61, 66, 69], 30), 'D': ([57, 62, 66, 69], 38), 'Emaj': ([56, 59, 64, 68], 28),
}
MOTIF = [(0, 69, 1), (1, 72, 1), (2, 76, .5), (2.5, 74, .5), (3, 81, 1.6)]          # (beat, midi, beats): A C E D A, rising
MOTIF_MAJ = [(t, m + (1 if m % 12 == 0 else 0), d) for t, m, d in MOTIF]          # C → C# for the A major ending


def motif(t0, voice, transpose=0, major=False, **kw):
    for bt, m, d in (MOTIF_MAJ if major else MOTIF):
        voice(t0 + bt * BEAT, m + transpose, d * BEAT, **kw)


def as_piano(t0, m, dur, gain=.13, pan=0.0):
    piano(t0, m, gain, .85, pan, dur=max(2.5, dur + 2))


def as_bell(t0, m, dur, gain=.05, pan=0.0):
    bell(t0, m, gain, dk=1.1, pan=pan, ratio=3.0, index=1.4, hall=1.0, plate=.3)


def chords(bar0, seq, kind='pad', bars_each=1, **kw):
    for i, name in enumerate(seq):
        notes, _ = CH[name]
        t0, dur = b(bar0 + i * bars_each), b(bars_each)
        if kind == 'pad':
            pad(t0, notes, dur, **kw)
        elif kind == 'organ':
            organ(t0, notes, dur, **kw)
        elif kind == 'choir':
            choir(t0, [m + 12 for m in notes[1:]], dur, **kw)
        elif kind == 'strings':
            strings(t0, [m + 12 for m in notes], dur, **kw)


def subs(bar0, seq, bars_each=1, gain=.15):
    for i, name in enumerate(seq):
        sub(b(bar0 + i * bars_each), CH[name][1], b(bars_each) - .05, gain * .55)


def arps(bar0, seq, div=2, oct_=12, gain=.03, inst=celesta, pat=(0, 1, 2, 3, 2, 1, 2, 3)):
    for i, name in enumerate(seq):
        notes = CH[name][0]
        for k in range(4 * div):
            m = notes[pat[k % len(pat)] % len(notes)] + oct_
            inst(b(bar0 + i) + k * BEAT / div, m, gain, pan=.35 * np.sin(k * 1.3))


def drums(bar0, bars, kick_=(0, 2), snare_=(), clap_=(), hats=0, taikos=(), kg=.42, sg=.15, shak=0, hg=.03):
    for i in range(bars):
        t = b(bar0 + i)
        for k in kick_:
            kick(t + k * BEAT, kg)
        for k in snare_:
            snare(t + k * BEAT, sg)
        for k in clap_:
            clap(t + k * BEAT)
        for k in taikos:
            taiko(t + k * BEAT, pan=.2 * np.sin(k * 2))
        for k in range(hats):
            hat(t + k * BEAT * 4 / hats, hg * (1.2 if k % 2 else .8), pan=.3)
        for k in range(shak):
            shaker(t + k * BEAT * 4 / shak, .016 * (1.3 if k % 4 == 2 else .8))


def roll(t0, dur, g0=.03, g1=.2, d0=4, d1=16):
    """A snare roll that speeds up from d0 to d1 hits per beat and swells."""
    t = 0.0
    while t < dur:
        k = t / dur
        snare(t0 + t, g0 + (g1 - g0) * k ** 2, pan=.15 * np.sin(t * 9))
        t += BEAT / (d0 + (d1 - d0) * k)


def riser(t_end, dur, gain=.12):
    n = int(dur * SR)
    k = (np.arange(n) / n).astype(F32)
    s = band_sweep(noise(n), 300, 7000) * k ** 2 * 1.5 + .25 * sweep(180, 1400, dur) * k ** 3
    put(np.stack([s, np.roll(s, 300)]), t_end - dur, 'sfx', gain, hall=.6)


def impact(t0, lvl=1.0, root=33):
    kick(t0, .55 * lvl, long=True, duck=.85)
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    boom = np.sin(TAU * np.cumsum(midi(root) * (1 + 1.2 * np.exp(-t * 9))) / SR) * np.exp(-t * 1.3)
    put(np.tanh(1.8 * boom).astype(F32), t0, 'drm', .38 * lvl)
    put(lp(noise(n), 1200) * dec(n, 6), t0, 'sfx', .25 * lvl, hall=.9)
    crash(t0, .1 * lvl)
    braam(t0, root + 12, 2.2, .1 * lvl)


# ================================================================== the score
def score():
    # ---- intro (bars 0–6): a single held air note, heartbeats from the cue sheet, teasers, the riser, the title impact
    pad(0.0, [81, 88], b(5), .016, cut=3000, att=3, rel=2, hall=1.4)
    sub(.0, 33, b(5) - .2, .018)
    drums(2, 2, kick_=(0, 1, 2, 3), kg=.22, hats=8, hg=.02)
    riser(b(5), b(1), .1)
    impact(b(5), .85)
    chords(5, ['Am'], 'organ', gain=.045, att=.05, rel=2.2)
    choir(b(5), [64, 69, 72], b(1), .03, 'o', att=.05)
    subs(5, ['Am'], gain=.12)

    # ---- verse 1 (bars 6–12): pads and a sparse piano; the call is heard for the first time, alone
    chords(6, ['Am', 'Am', 'F', 'F', 'C', 'G'], 'pad', gain=.05, cut=1400)
    subs(6, ['Am', 'Am', 'F', 'F', 'C', 'G'], gain=.11)
    motif(b(7), sine_voice, 0, gain=.05)
    for i, name in enumerate(['Am', 'Am', 'F', 'F', 'C', 'G']):
        notes = CH[name][0]
        for k, (bt, j) in enumerate(((0, 0), (1.5, 2), (2, 3), (3, 1))):
            if i == 1 and bt >= 0:                                 # bar 7 belongs to the call
                continue
            piano(b(6 + i) + bt * BEAT, notes[j] + 12, .07, .55 + .1 * (k == 0), pan=.2 * np.sin(k + i))
    drums(8, 4, kick_=(0,), kg=.3)

    # ---- the Drake equation (bars 12–18): celesta arpeggios on every eighth, steady pulse
    seq = ['Am', 'F', 'C', 'G', 'Am', 'E']
    chords(12, seq, 'pad', gain=.05, cut=1700)
    subs(12, seq, gain=.13)
    arps(12, seq, 2, 12, .028)
    drums(12, 6, kick_=(0, 2), kg=.34, shak=16)
    motif(b(16), as_piano, 12, gain=.11)

    # ---- build (bars 18–22): strings swell, the snare roll speeds up, everything leans into bar 22
    seq = ['Am', 'F', 'Dm', 'Esus']
    chords(18, seq, 'pad', gain=.05, cut=1200)
    chords(18, seq, 'strings', gain=.03, att=2.4)
    subs(18, seq, gain=.13)
    drums(18, 2, kick_=(0,), kg=.32)
    drums(20, 2, kick_=(0, 2), kg=.36)
    roll(b(20), b(2) - .05, .02, .2, 2, 16)
    riser(b(22), b(2), .1)
    arps(18, seq, 4, 24, .012, pat=(0, 1, 2, 3))

    # ---- drop 1 (bars 22–28): organ, choir, strings, taiko; the call on bells and choir
    seq = ['Am', 'F', 'C', 'G', 'Am', 'F']
    impact(b(22))
    chords(22, seq, 'organ', gain=.05)
    chords(22, seq, 'choir', gain=.04, vowel='a', att=.4)
    chords(22, seq, 'strings', gain=.03, att=.3)
    subs(22, seq, gain=.16)
    drums(22, 5, kick_=(0, 1.5, 2), snare_=(1, 3), taikos=(0, 2.5), hats=8, kg=.42, sg=.14)
    drums(27, 1, kick_=(0,), taikos=(0,), kg=.34)
    for bb in (22, 24):
        motif(b(bb), as_bell, 12, gain=.06)
        motif(b(bb), lead, 0, gain=.03)
    crash(b(24), .07)

    # ---- verse 2 (bars 28–34): pulled back; typewriter hats
    seq = ['Dm', 'Am', 'F', 'E', 'Dm', 'E']
    chords(28, seq, 'pad', gain=.048, cut=1300)
    subs(28, seq, gain=.12)
    drums(28, 6, kick_=(0,), kg=.3, hats=8, hg=.022)
    motif(b(30), as_piano, 0, gain=.11)
    for i, name in enumerate(seq):
        for bt in (0, 2):
            piano(b(28 + i) + bt * BEAT, CH[name][0][2] + 12, .06, .5, pan=-.2)

    # ---- drop 2 (bars 34–42): the heaviest section; four on the floor, growl bass, the call on lead
    seq = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E']
    impact(b(34), .9)
    chords(34, seq, 'organ', gain=.05)
    chords(34, seq, 'choir', gain=.04, vowel='a', att=.3)
    chords(34, seq, 'strings', gain=.03, att=.2)
    subs(34, seq, gain=.12)
    for i, name in enumerate(seq):
        for k in range(8):
            if k % 2 == 1 or k == 0:
                bass8(b(34 + i) + k * EIGHTH, CH[name][1] + 12, .07)
    drums(34, 7, kick_=(0, 1, 2, 3), snare_=(1, 3), taikos=(0, 2.5), hats=8, kg=.42, sg=.15)
    drums(41, 1, kick_=(0, 1), kg=.4)
    for k, m in enumerate((50, 47, 45, 43, 40, 38)):
        tom(b(41) + 2 * BEAT + k * BEAT / 3, m, .18, pan=.4 - .16 * k)
    crash(b(38), .08)
    for bb in (34, 36, 38):
        motif(b(bb), lead, 12, gain=.032)
        motif(b(bb), as_bell, 12, gain=.04)
    riser(b(42), b(1), .07)

    # ---- bridge (bars 42–49): no drums at all; choir, piano, long reverb
    seq = ['F', 'C', 'G', 'Am', 'F', 'C', 'Esus']
    chords(42, seq, 'choir', gain=.045, vowel='o', att=1.6, rel=2.4)
    chords(42, seq, 'pad', gain=.035, cut=1000, att=2)
    subs(42, seq, gain=.08)
    for bb in (43, 46):
        motif(b(bb), as_piano, 0, gain=.1)
    for i, name in enumerate(seq):
        for k, j in enumerate((0, 2, 3, 1, 2, 3, 1, 2)):
            if (42 + i) in (43, 46):
                continue
            piano(b(42 + i) + k * EIGHTH * 2, CH[name][0][j] + 12, .045, .45, pan=.3 * np.sin(k))
    sub(b(48), 28, b(1), .05)

    # ---- final drop (bars 49–57): A major, everything, brighter choir; the call four times
    seq = ['A', 'F#m', 'D', 'Emaj', 'A', 'F#m', 'D', 'Emaj']
    impact(b(49), 1.1)
    chords(49, seq, 'organ', gain=.055, bright=1.3)
    chords(49, seq, 'choir', gain=.045, vowel='a', att=.3)
    chords(49, seq, 'strings', gain=.035, att=.2)
    for i, name in enumerate(seq):
        strings(b(49 + i), [m + 24 for m in CH[name][0][1:]], b(1), .018, att=.3)
    subs(49, seq, gain=.15)
    drums(49, 5, kick_=(0, 1, 2, 3), snare_=(1, 3), taikos=(0, 1.5, 2.5), hats=8, kg=.44, sg=.15)
    # bar 54 is the breakdown under 又或者——: no drums, one held note, a riser into the last impact
    riser(b(55), b(1), .11)
    impact(b(55), 1.0)
    drums(55, 1, kick_=(0, 1, 2, 3), snare_=(1, 3), taikos=(0, 1.5, 2.5), hats=8, kg=.44, sg=.15)
    drums(56, 1, kick_=(0,), taikos=(0, 2), kg=.38)
    for bb in (49, 51, 55):
        motif(b(bb), lead, 12, major=True, gain=.034)
        motif(b(bb), as_bell, 12, major=True, gain=.05)
    motif(b(53), as_bell, 12, major=True, gain=.05)
    sine_voice(b(54), 81, b(1) - .2, .04, hall=1.6)
    arps(55, seq[6:], 4, 24, .012, pat=(0, 1, 2, 3))

    # ---- outro (bars 57–62): back to the heartbeat and the bare call... and, once, an answer
    pad(b(57), [69, 73, 76, 81], b(5), .04, cut=1800, att=.5, rel=4)
    sub(b(57), 33, b(4), .035)
    for k in (1, 3, 5, 7):
        fx_heart(b(57) + k * BEAT)
    motif(b(58), sine_voice, 0, major=True, gain=.05)
    sine_voice(RESPONSE_T, 88, 2.4, .035, pan=.65, hall=2.2)     # the reply: far away, high, off to one side
    sine_voice(RESPONSE_T + BEAT * 1.5, 93, 2.0, .02, pan=.7, hall=2.4)
    choir(b(60), [64, 69, 73, 76], b(2), .03, 'o', att=2, rel=4)


# ================================================================== sound effects placed from the cue sheet
def fx_heart(t, **o):
    for d, g in ((0, 1), (.2, .55)):
        n = int(.4 * SR)
        tt = np.arange(n) / SR
        s = np.sin(TAU * np.cumsum(52 + 40 * np.exp(-tt * 30)) / SR) * np.exp(-tt * 11)
        put(np.tanh(2 * s).astype(F32), t + d, 'sfx', .4 * g, hall=.3)


def fx_ping(t, midi_=81, **o):
    sine_voice(t, midi_, .1, .06, hall=1.6)


def fx_tick(t, **o):
    n = int(.03 * SR)
    put(hp(noise(n), 3000) * dec(n, 160) + .4 * sine(2400, n) * dec(n, 200), t, 'sfx', .1, pan=.2)


def fx_glitch(t, **o):
    n = int(.22 * SR)
    s = np.sign(sine(130 + rng.random() * 400, n)) * .4 + noise(n) * .5
    gate = (np.floor(np.arange(n) / (SR * .018)) % 2).astype(F32)
    s = np.round(s * 6) / 6 * gate * dec(n, 9)
    put(hp(s.astype(F32), 400), t, 'sfx', .07, pan=(rng.random() - .5))


def fx_riser(t, dur=2.0, **o):
    riser(t + dur, dur, .09)


def fx_impact(t, **o):
    pass                                                         # impacts are part of the score (they need the harmony)


def fx_sparkle(t, dur=2.0, **o):
    for k in range(int(dur * 7)):
        celesta(t + k / 7 + rng.random() * .05, int(rng.choice([81, 83, 85, 88, 90, 93])), .018, pan=rng.random() * 1.4 - .7)


def fx_swell(t, dur=2.0, **o):
    n = int(dur * SR)
    k = (np.arange(n) / n).astype(F32)
    s = band_sweep(noise(n), 200, 2500, 6) * k ** 2.2 * (1 - np.clip((k - .96) / .04, 0, 1))
    put(np.stack([s, np.roll(s, 500)]), t, 'sfx', .08, hall=.9)


def fx_data(t, dur=4.0, **o):
    k = 0.0
    while k < dur:
        n = int(.012 * SR)
        f = 900 + rng.random() * 2600
        put(sine(f, n) * env(n, .001, .008), t + k, 'sfx', .03 * (.5 + .5 * k / dur), pan=rng.random() * 1.6 - .8, plate=.3)
        k += 1 / (25 + 45 * k / dur)


def fx_ding(t, midi_=76, **o):
    bell(t, midi_, .06, dk=1.6, ratio=2.0, index=1.2, plate=.4)


def fx_chime(t, midi_=81, **o):
    bell(t, midi_, .05, dk=1.0, ratio=3.5, index=1.6, hall=1.0, plate=.3)
    bell(t + .01, midi_ + 12, .015, dk=1.8, ratio=3.5, index=.8, hall=1.0)


def fx_snap(t, **o):
    n = int(.08 * SR)
    put(hp(noise(n), 1500) * dec(n, 80), t, 'sfx', .18, plate=.3)


def fx_whoosh(t, dur=1.2, **o):
    n = int(dur * SR)
    k = (np.arange(n) / n).astype(F32)
    s = band_sweep(noise(n), 250, 4000, 6) * np.sin(np.pi * k) ** 1.5
    put(np.stack([s * (1 - k), s * k]) * 2, t, 'sfx', .09, hall=.6)


def click(t, f=3200, gain=.06, pan=0.0, k=180):
    n = int(.025 * SR)
    put(bp(noise(n), f * .6, f * 1.6) * dec(n, k), t, 'sfx', gain, pan, plate=.15)


def fx_type(t, dur=1.0, **o):                                   # typewriter keys
    k = 0.0
    while k < dur:
        click(t + k, 2600 + rng.random() * 1400, .07, pan=rng.random() * .6 - .3)
        k += .07 + rng.random() * .06


def fx_printer(t, dur=2.0, **o):                                # a 1970s line printer: a fast, rhythmic chatter
    k = 0.0
    while k < dur:
        click(t + k, 1800 + 600 * np.sin(k * 40), .05 * (.7 + .3 * np.sin(k * 7)), pan=.15)
        k += 1 / 38
    n = int(dur * SR)
    put(bp(noise(n), 300, 900) * env(n, .05, .2) * .3, t, 'sfx', .05)


def fx_pen(t, dur=.8, **o):                                     # felt pen on paper
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = bp(noise(n), 2500, 7000) * (.5 + .5 * np.abs(np.sin(TAU * 3.2 * tt))) * env(n, .02, .1)
    put(s, t, 'sfx', .06)


def fx_chalk(t, dur=1.5, **o):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    s = bp(noise(n), 1800, 6000) * (.4 + .6 * (np.sin(TAU * 4.5 * tt) > 0)) * env(n, .02, .1)
    put(s, t, 'sfx', .05, plate=.2)


def fx_blip(t, midi_=76, **o):
    n = int(.12 * SR)
    put(sine(midi(midi_), n) * dec(n, 30), t, 'sfx', .05, plate=.3)


def fx_spike(t, **o):                                           # the receiver squeals for a moment
    n = int(.5 * SR)
    s = sweep(900, 2600, .5) * env(n, .005, .3) + .3 * noise(n) * dec(n, 10)
    put(s.astype(F32), t, 'sfx', .06, hall=.4)


def fx_twang(t, **o):                                           # a steel cable letting go
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f = 160 * (1 + .6 * np.exp(-tt * 6))
    s = np.sign(np.sin(TAU * np.cumsum(f) / SR)) * .3 + np.sin(TAU * np.cumsum(f * 2.01) / SR) * .5
    s = lp(s.astype(F32), 2400) * dec(n, 2.4)
    s[:int(.02 * SR)] += hp(noise(int(.02 * SR)), 2000) * .8
    put(s, t, 'sfx', .1, pan=rng.random() - .5, hall=.7)


def fx_fall(t, dur=1.0, **o):
    n = int(dur * SR)
    s = band_sweep(noise(n), 2500, 250, 6) * (np.arange(n) / n) ** 1.2
    put(np.stack([s, np.roll(s, 400)]), t, 'sfx', .1, hall=.5)


def fx_rumble(t, dur=2.0, **o):
    n = int(dur * SR)
    put(lp(noise(n), 220) * dec(n, 1.6) * 2.2, t, 'sfx', .2, hall=.6)
    put(bp(noise(n), 400, 2500) * dec(n, 4), t, 'sfx', .06, hall=.8)


def fx_scan(t, dur=4.0, **o):                                   # a soft rising tone under the star sweep, with ticks
    n = int(dur * SR)
    s = sweep(330, 660, dur) * env(n, .3, .4) * .5
    put(s, t, 'sfx', .03, hall=.8)
    for k in np.arange(0, dur, BEAT / 2):
        click(t + k, 4200, .025, pan=-.6 + 1.2 * k / dur, k=260)


def fx_shutter(t, **o):
    for d, f in ((0, 2600), (.07, 1700)):
        click(t + d, f, .1, k=120)


def fx_stamp(t, **o):                                           # the tally settling on 0: a soft thud and a high tick
    n = int(.35 * SR)
    tt = np.arange(n) / SR
    put((np.sin(TAU * np.cumsum(90 + 60 * np.exp(-tt * 40)) / SR) * np.exp(-tt * 14)).astype(F32), t + .55, 'sfx', .14, hall=.3)
    for k in range(6):
        click(t + k * .09, 3800, .02, pan=.6, k=300)


def place_sfx():
    for c in CUES['sfx']:
        fn = globals().get('fx_' + c['name'])
        if not fn:
            print('no sound for cue', c['name'])
            continue
        o = {('midi_' if k == 'midi' else k): v for k, v in c.items() if k not in ('t', 'name')}
        fn(c['t'], **o)


# ================================================================== mix + master
def ir(dur, decays=(2.6, 1.8, 1.0), pre=.02, seed=0):
    """A stereo reverb impulse: noise split into low / mid / high bands, each with its own decay time."""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = []
    for ch in range(2):
        x = r.standard_normal(n).astype(F32)
        lo, mid, hi = lp(x, 400), bp(x, 400, 3000), hp(x, 3000)
        y = sum(band * np.exp(-t * 6.9 / d) for band, d in zip((lo, mid, hi), decays))
        y[:int(pre * SR)] = 0
        out.append(y / np.sqrt(np.sum(y ** 2)))
    return np.stack(out).astype(F32)


def conv(x, h):
    return np.stack([oaconvolve(x[c], h[c])[:N] for c in range(2)]).astype(F32)


def limiter(x, ceil=.93, look=.004, rel=.12):
    a = np.max(np.abs(x), axis=0)
    w = int(look * SR)
    pk = maximum_filter1d(a, size=2 * w + 1)
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    g = uniform_filter1d(g, size=w)                              # smooth the attack inside the look-ahead window
    k = np.exp(-1 / (rel * SR))                                   # slow release: a one-pole on the gain reduction
    g2 = 1 - lfilter([1 - k], [1, -k], 1 - g)
    g = np.minimum(g, g2)
    return (x * g).astype(F32)


def master():
    hall = conv(BUS['hall'], ir(3.6, (3.4, 2.4, 1.3), seed=1)) * .5
    plate = conv(BUS['plate'], ir(1.4, (1.3, 1.1, .8), .005, seed=2)) * .4
    padb = BUS['pad'] * DUCK
    drm = BUS['drm'] - .45 * np.stack([lp(BUS['drm'][0], 70), lp(BUS['drm'][1], 70)])     # keep the kick's click, tame its boom
    mix = padb * 2.2 + BUS['mus'] * 1.0 + drm * .5 + BUS['sfx'] * 1.3 + hall * 1.4 + plate
    mix = np.stack([hp(mix[0], 28), hp(mix[1], 28)])
    mix = mix - .3 * np.stack([lp(mix[0], 90), lp(mix[1], 90)])     # low shelf, about -3 dB under 90 Hz
    mix = np.tanh(mix * 1.15) / 1.15                             # gentle glue / saturation
    mix /= max(1e-6, np.max(np.abs(mix))) / .8
    mix = limiter(mix)
    fade = np.clip((TOTAL - np.arange(N) / SR) / 3.0, 0, 1)
    return (mix * fade).astype(F32)


if __name__ == '__main__':
    score()
    place_sfx()
    out = master()
    with wave.open('music.wav', 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(out.T, -1, 1) * 32767).astype('<i2').tobytes())
    import imageio_ffmpeg
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-loglevel', 'error', '-i', 'music.wav', '-af', 'loudnorm=I=-14:TP=-1.2:LRA=11',
                    '-ar', '44100', '-b:a', '256k', 'music.mp3'], check=True)
    print(f'music.wav / music.mp3  {TOTAL:.1f}s  peak {np.max(np.abs(out)):.2f}')
