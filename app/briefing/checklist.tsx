'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'stada-neo-tokyo-briefing-checklist-v2';

const ITEMS = [
  'Я знаю название и номер своей команды.',
  'Я проверил время и место следующего этапа в программе.',
  'Я понимаю задание и сигнал начала и завершения.',
  'Я знаю, к кому обратиться с вопросом или проблемой.',
  'Я принимаю fair play и готов участвовать вместе с командой.',
] as const;

export default function BriefingChecklist() {
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as boolean[];
      if (Array.isArray(parsed) && parsed.length === ITEMS.length) {
        setChecked(parsed.map(Boolean));
      }
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
  }, [checked, ready]);

  const allDone = checked.every(Boolean);

  function toggle(index: number) {
    setChecked((current) => current.map((value, i) => (i === index ? !value : value)));
  }

  return (
    <section className="briefing-checklist" aria-labelledby="checklist-title">
      <div className="briefing-checklist-heading">
        <ShieldCheck size={22}/>
        <div>
          <p className="eyebrow">TEAM READINESS · スタート</p>
          <h2 id="checklist-title">Чек-лист участника</h2>
          <p>Проверьте пять пунктов перед первым раундом.</p>
        </div>
      </div>
      <ol className="briefing-checklist-items">
        {ITEMS.map((item, index) => (
          <li key={item}>
            <label className={checked[index] ? 'is-checked' : undefined}>
              <input
                type="checkbox"
                checked={checked[index]}
                onChange={() => toggle(index)}
              />
              <span>{item}</span>
            </label>
          </li>
        ))}
      </ol>
      <div className={`briefing-pass ${allDone ? 'is-granted' : ''}`} role="status">
        {allDone ? <>
          <CheckCircle2 size={22}/>
          <strong>КОМАНДА ГОТОВА. МОЖНО НА СТАРТ.</strong>
        </> : <span>Отметьте все пункты, чтобы подтвердить готовность к участию.</span>}
      </div>
    </section>
  );
}
