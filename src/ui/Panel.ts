import type { WeatherKind } from '../audio/AudioEngine';

export interface PanelCallbacks {
  onFlow: (v: number) => void;
  onLevel: (v: number) => void;
  onWeather: (w: WeatherKind) => void;
  onMic: () => void;
  onMute: (muted: boolean) => void;
  onAnyGesture: () => void;
}

/** 家长面板（HTML 覆盖层）：流速、水位、天气、录音、静音 */
export class Panel {
  private toastTimer: number | null = null;
  private muted = false;
  private micBtn: HTMLButtonElement;

  constructor(cb: PanelCallbacks) {
    const el = <T extends HTMLElement>(id: string): T => {
      const n = document.getElementById(id);
      if (!n) throw new Error(`#${id} missing`);
      return n as T;
    };

    const flow = el<HTMLInputElement>('flow');
    const level = el<HTMLInputElement>('level');
    flow.addEventListener('input', () => cb.onFlow(flow.valueAsNumber / 100));
    level.addEventListener('input', () => cb.onLevel(level.valueAsNumber / 100));

    document.querySelectorAll<HTMLButtonElement>('[data-weather]').forEach((b) =>
      b.addEventListener('click', () => cb.onWeather(b.dataset.weather as WeatherKind))
    );

    this.micBtn = el<HTMLButtonElement>('mic');
    this.micBtn.addEventListener('click', () => cb.onMic());

    const mute = el<HTMLButtonElement>('mute');
    mute.addEventListener('click', () => {
      this.muted = !this.muted;
      mute.textContent = this.muted ? '🔇' : '🔊';
      cb.onMute(this.muted);
    });

    const panel = el('panel');
    el<HTMLButtonElement>('panelToggle').addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });

    // 第一次触摸/点击时解锁 AudioContext（移动端要求）
    document.addEventListener('pointerdown', () => cb.onAnyGesture(), { once: true });
  }

  setMicRecording(on: boolean): void {
    this.micBtn.classList.toggle('recording', on);
    this.micBtn.textContent = on ? '⏺️ 停止录音' : '🎙️ 录一段声音';
  }

  setWeatherActive(w: WeatherKind): void {
    document
      .querySelectorAll<HTMLButtonElement>('[data-weather]')
      .forEach((b) => b.classList.toggle('active', b.dataset.weather === w));
  }

  setNotes(n: number, total: number): void {
    document.getElementById('noteCount')!.textContent = String(n);
    document.getElementById('noteTotal')!.textContent = String(total);
  }

  toast(msg: string): void {
    const t = document.getElementById('toast')!;
    t.textContent = msg;
    t.classList.add('show');
    if (this.toastTimer !== null) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('show'), 2600);
  }
}
