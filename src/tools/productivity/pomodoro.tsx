'use client';

import {
  Bell,
  Coffee,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { cn } from '@/utils/cn';

type Phase = 'focus' | 'break';

const clampMinutes = (value: number) =>
  Math.min(180, Math.max(1, Number.isFinite(value) ? Math.round(value) : 1));

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(remainder)}`
    : `${pad(minutes)}:${pad(remainder)}`;
};

const playBeep = () => {
  try {
    const AudioConstructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioConstructor) {
      return;
    }
    const context = new AudioConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.6);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.65);
    window.setTimeout(() => {
      void context.close();
    }, 900);
  } catch {
    // Audio is a nice-to-have; ignore browsers that block it.
  }
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Pomodoro() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState<Phase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [notifyOn, setNotifyOn] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const totalSeconds = (phase === 'focus' ? focusMinutes : breakMinutes) * 60;
  const progress = useMemo(
    () =>
      totalSeconds > 0
        ? Math.min(1, Math.max(0, (totalSeconds - secondsLeft) / totalSeconds))
        : 0,
    [totalSeconds, secondsLeft]
  );

  useEffect(() => {
    if (!running) {
      return;
    }
    const interval = window.setInterval(() => {
      setSecondsLeft((previous) => Math.max(0, previous - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) {
      return;
    }

    const finishedPhase = phase;
    if (finishedPhase === 'focus') {
      setSessions((previous) => previous + 1);
      setPhase('break');
      setSecondsLeft(breakMinutes * 60);
      setNotice(
        `Focus session complete — take a ${breakMinutes}-minute break.`
      );
    } else {
      setPhase('focus');
      setSecondsLeft(focusMinutes * 60);
      setNotice(
        `Break complete — ready for a ${focusMinutes}-minute focus session?`
      );
    }

    if (soundOn) {
      playBeep();
    }

    if (
      notifyOn &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(
          finishedPhase === 'focus'
            ? 'Focus session complete'
            : 'Break complete',
          {
            body:
              finishedPhase === 'focus'
                ? `Time for a ${breakMinutes}-minute break.`
                : `Time for a ${focusMinutes}-minute focus session.`,
          }
        );
      } catch {
        // Notification failures should never interrupt the timer.
      }
    }
  }, [
    running,
    secondsLeft,
    phase,
    focusMinutes,
    breakMinutes,
    soundOn,
    notifyOn,
  ]);

  const updateFocusMinutes = (value: number) => {
    const next = clampMinutes(value);
    setFocusMinutes(next);
    if (!running && phase === 'focus') {
      setSecondsLeft(next * 60);
    }
  };

  const updateBreakMinutes = (value: number) => {
    const next = clampMinutes(value);
    setBreakMinutes(next);
    if (!running && phase === 'break') {
      setSecondsLeft(next * 60);
    }
  };

  const reset = () => {
    setRunning(false);
    setPhase('focus');
    setSecondsLeft(focusMinutes * 60);
    setNotice(null);
  };

  const toggleNotifications = async (checked: boolean) => {
    if (!checked) {
      setNotifyOn(false);
      return;
    }
    if (typeof Notification === 'undefined') {
      setNotifyOn(false);
      setNotice('This browser does not support desktop notifications.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotifyOn(permission === 'granted');
      if (permission !== 'granted') {
        setNotice('Notification permission was not granted.');
      }
    } catch {
      setNotifyOn(false);
      setNotice('Desktop notifications could not be enabled.');
    }
  };

  const isFocus = phase === 'focus';

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Work in focused intervals, then take a short break. The timer keeps running while this tab is open."
          title="Timer"
        >
          <div className="flex flex-col items-center py-4">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <Badge variant={isFocus ? 'success' : 'accent'}>
                {isFocus ? 'Focus session' : 'Break time'}
              </Badge>
              <Badge>
                {sessions} session{sessions === 1 ? '' : 's'} completed
              </Badge>
            </div>

            <div className="relative h-64 w-64">
              <svg
                aria-hidden
                className="h-full w-full -rotate-90"
                viewBox="0 0 120 120"
              >
                <circle
                  className="text-border"
                  cx="60"
                  cy="60"
                  fill="none"
                  r={RADIUS}
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className={cn(
                    'transition-[stroke-dashoffset] duration-500',
                    isFocus ? 'text-success' : 'text-accent'
                  )}
                  cx="60"
                  cy="60"
                  fill="none"
                  r={RADIUS}
                  stroke="currentColor"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  aria-live="polite"
                  className="font-mono text-5xl font-bold tracking-tight text-fg"
                >
                  {formatTime(secondsLeft)}
                </span>
                <span className="mt-1 text-xs uppercase tracking-wide text-fg-muted">
                  {running ? (isFocus ? 'focusing' : 'resting') : 'paused'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  setRunning((previous) => !previous);
                  setNotice(null);
                }}
                variant="primary"
              >
                {running ? (
                  <>
                    <Pause aria-hidden className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play aria-hidden className="h-4 w-4" />
                    Start
                  </>
                )}
              </Button>
              <Button onClick={reset} variant="default">
                <RotateCcw aria-hidden className="h-4 w-4" />
                Reset
              </Button>
            </div>

            {notice && (
              <Callout className="mt-5 w-full" variant="success">
                {notice}
              </Callout>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
            <div>
              <p className="text-xs text-fg-muted">Focus</p>
              <p className="mt-1 text-sm font-semibold text-fg">
                {focusMinutes} min
              </p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Break</p>
              <p className="mt-1 text-sm font-semibold text-fg">
                {breakMinutes} min
              </p>
            </div>
            <div>
              <p className="text-xs text-fg-muted">Sessions</p>
              <p className="mt-1 text-sm font-semibold text-fg">{sessions}</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Settings">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                hint="1–180 minutes"
                htmlFor="pomodoro-focus"
                label="Focus duration"
              >
                <Input
                  disabled={running}
                  id="pomodoro-focus"
                  max={180}
                  min={1}
                  onChange={(event) =>
                    updateFocusMinutes(Number(event.target.value))
                  }
                  type="number"
                  value={focusMinutes}
                />
              </Field>
              <Field
                hint="1–180 minutes"
                htmlFor="pomodoro-break"
                label="Break duration"
              >
                <Input
                  disabled={running}
                  id="pomodoro-break"
                  max={180}
                  min={1}
                  onChange={(event) =>
                    updateBreakMinutes(Number(event.target.value))
                  }
                  type="number"
                  value={breakMinutes}
                />
              </Field>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                <input
                  checked={soundOn}
                  className="accent-[var(--accent)]"
                  onChange={(event) => setSoundOn(event.target.checked)}
                  type="checkbox"
                />
                <Volume2 aria-hidden className="h-4 w-4 text-fg-muted" />
                Play a chime when a phase ends
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                <input
                  checked={notifyOn}
                  className="accent-[var(--accent)]"
                  onChange={(event) =>
                    void toggleNotifications(event.target.checked)
                  }
                  type="checkbox"
                />
                <Bell aria-hidden className="h-4 w-4 text-fg-muted" />
                Show a desktop notification
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={reset} size="sm" variant="ghost">
                <Timer aria-hidden className="h-3.5 w-3.5" />
                Reset timer
              </Button>
              <Button
                disabled={sessions === 0}
                onClick={() => setSessions(0)}
                size="sm"
                variant="ghost"
              >
                Clear session count
              </Button>
            </div>
          </Panel>

          <Panel title="How it works">
            <div className="flex items-start gap-3">
              <Coffee
                aria-hidden
                className="mt-0.5 h-5 w-5 shrink-0 text-accent"
              />
              <div className="space-y-2 text-xs leading-5 text-fg-muted">
                <p>
                  Focus for {focusMinutes} minutes, then take a {breakMinutes}
                  -minute break. The timer cycles automatically and counts
                  completed focus sessions.
                </p>
                <p>
                  Keep the tab open while the timer runs. Audio and
                  notifications are optional and stay on this device.
                </p>
                <p>
                  Changing a duration while paused resets the current interval
                  to the new length.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
