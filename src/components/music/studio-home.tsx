"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Guitar,
  Piano,
  Check,
  Clock3,
  BookOpen,
} from "lucide-react";
import { StudioArt } from "@/components/studio-art";
import { readPractice, type PracticeRecord } from "@/data/piano-exercises";
export function StudioHome({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const [progress, setProgress] = useState<PracticeRecord>({});
  useEffect(() => {
    const update = () => setProgress(readPractice());
    const frame = requestAnimationFrame(update);
    window.addEventListener("xwxy-practice", update);
    window.addEventListener("storage", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("xwxy-practice", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  const count = Object.keys(progress).length;
  return (
    <div className="studio-stack">
      <section className="studio-welcome">
        <div className="studio-welcome-copy">
          <span className="eyebrow">
            <span className="live-dot" />
            给生活，一点旋律
          </span>
          <h2>
            不赶进度，
            <br />
            只让音乐靠近一点。
          </h2>
          <p>
            每天留十分钟。听一听，试一试，
            <br />
            从第一个音，走向第一首歌。
          </p>
          <button className="btn-primary" onClick={() => onNavigate("piano")}>
            开始今天的练习
            <ArrowRight size={16} />
          </button>
          <div className="welcome-meta">
            <span>
              <Clock3 size={14} />
              建议每天 10 分钟
            </span>
            <span>
              <Check size={14} />
              {count ? `已记录 ${count} 项练习` : "零基础也能开始"}
            </span>
          </div>
        </div>
        <StudioArt />
      </section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">选择你的第一件乐器</span>
          <h3>从喜欢的声音开始</h3>
        </div>
        <span className="quiet-caption">先听 → 再练 → 带到真实乐器上</span>
      </div>
      <div className="instrument-paths">
        <button
          className="instrument-path piano-path"
          onClick={() => onNavigate("piano")}
        >
          <div className="path-top">
            <Piano size={28} />
            <span>01 / 钢琴</span>
            <ArrowRight size={20} />
          </div>
          <h3>指尖上的小小世界</h3>
          <p>认识琴键 · 五指练习 · 跟弹第一句旋律</p>
          <div className="mini-keys" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <i
                key={i}
                className={[0, 1, 3, 4, 5].includes(i % 7) ? "has-black" : ""}
              />
            ))}
          </div>
          <span className="path-bottom">
            4 个入门练习 · 录音音色 · 逐音提示
          </span>
        </button>
        <button
          className="instrument-path guitar-path"
          onClick={() => onNavigate("guitar")}
        >
          <div className="path-top">
            <Guitar size={28} />
            <span>02 / 吉他</span>
            <ArrowRight size={20} />
          </div>
          <h3>让一根弦，回应你</h3>
          <p>认识六根弦 · 看懂指法 · 轻松扫出和弦</p>
          <div className="mini-strings" aria-hidden="true">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <i key={i} style={{ height: i * 0.5 }} />
            ))}
            <span>Em</span>
          </div>
          <span className="path-bottom">
            开放和弦起步 · 真实拨弦 · 节拍练习
          </span>
        </button>
      </div>
      <section className="studio-card daily-plan">
        <div>
          <span className="eyebrow">今天，只做一点点</span>
          <h3>你的十分钟练习单</h3>
          <p>不是一次练很久，而是每天都能轻松回来。</p>
        </div>
        <ol>
          <li>
            <b>
              02<span>分钟</span>
            </b>
            <div>
              <strong>放松，找到声音</strong>
              <p>坐稳、松肩；吉他先调音，钢琴先找中央 C。</p>
            </div>
          </li>
          <li>
            <b>
              05<span>分钟</span>
            </b>
            <div>
              <strong>慢慢练一小句</strong>
              <p>听示范，拆成小段，保持每个音清晰。</p>
            </div>
          </li>
          <li>
            <b>
              03<span>分钟</span>
            </b>
            <div>
              <strong>合起来，再听一遍</strong>
              <p>在真实乐器上试弹，留意自己的一点进步。</p>
            </div>
          </li>
        </ol>
      </section>
      <div className="studio-quick-links">
        <button onClick={() => onNavigate("tuner")}>
          <Guitar size={18} />
          <span>
            <b>先把琴调准</b>
            <small>打开吉他调音器</small>
          </span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate("learn")}>
          <BookOpen size={18} />
          <span>
            <b>需要更详细的讲解？</b>
            <small>从零开始的吉他课程</small>
          </span>
          <ArrowRight size={16} />
        </button>
      </div>
      <p className="studio-footnote">
        钢琴进度来自网页跟弹；吉他记录由你自行确认。进度保存在本机浏览器，清理浏览数据后可能丢失。
      </p>
    </div>
  );
}
