"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buildAutoLesson, type Lesson } from "@/data/lessons";

const LS_KEY = "xwxy_my_tabs";

interface SavedTab {
  title: string;
  text: string;
  time: number;
}

function getTabs(): SavedTab[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function ImportPanel({ onAutoLesson }: { onAutoLesson: (lesson: Lesson) => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tabs, setTabs] = useState<SavedTab[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeLink, setNoticeLink] = useState(false);
  const [openView, setOpenView] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingLesson = useRef<Lesson | null>(null);

  useEffect(() => {
    setTabs(getTabs());
  }, []);

  const saveTabs = (t: SavedTab[]) => {
    setTabs(t);
    localStorage.setItem(LS_KEY, JSON.stringify(t));
  };

  const handleSave = () => {
    const t = title.trim() || "未命名谱子";
    if (!text.trim()) {
      alert("请先粘贴谱子内容");
      return;
    }
    const nt: SavedTab = { title: t, text, time: Date.now() };
    saveTabs([nt, ...getTabs()]);
    setTitle("");
    setText("");
    // 同步到后端，后台会制作精修跟学课程
    fetch("/api/tab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, text }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.ok) {
          const al = buildAutoLesson(t, text, d.id);
          if (al) {
            pendingLesson.current = al;
            setNotice("✅ 已同步到后台，我会为它制作精修跟学课程，做好后通知你。");
            setNoticeLink(true);
            return;
          }
        }
        setNotice("✅ 已保存到本机。谱子里没识别出常见和弦，我会人工看一遍并制作跟学课程，做好后通知你。");
        setNoticeLink(false);
      })
      .catch(() => {
        setNotice("已保存到本机（后端同步失败，谱子仍在本地可查看）。");
        setNoticeLink(false);
      });
    alert("已保存 ✅");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      setText(String(r.result));
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
    };
    r.readAsText(f);
    e.target.value = "";
  };

  return (
    <Card>
      <CardTitle>📥 导入 / 保存谱子</CardTitle>
      <p className="mt-2 text-[13px] leading-7 text-fog">
        从网上复制吉他谱、尤克里里谱或简谱，粘贴到下面，起个名字保存。保存在本机浏览器里，随时查看（换设备会丢失，重要的谱子建议另存备份）。也支持上传
        .txt 文本文件。
      </p>
      <div className="my-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="谱子标题，如：晴天 - 周杰伦"
          className="w-full rounded-[10px] border border-white/75 bg-white/60 px-3.5 py-2.5 text-sm backdrop-blur-[10px] outline-none placeholder:text-fog-light focus:border-accent"
        />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"把谱子粘贴在这里…\n\n例如：\nC          G\n故事的小黄花 从出生那年就飘着"}
        rows={10}
        className="w-full rounded-[14px] border border-white/75 bg-white/60 p-3.5 font-mono text-sm leading-7 backdrop-blur-[10px] outline-none placeholder:text-fog-light focus:border-accent"
      />
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button onClick={handleSave}>💾 保存谱子</Button>
        <Button variant="pill" onClick={() => fileRef.current?.click()}>
          📄 从文件导入
        </Button>
        <input ref={fileRef} type="file" accept=".txt,.text,.md" className="hidden" onChange={handleFile} />
      </div>

      {notice && (
        <p className="mt-2.5 text-[13px] leading-7 text-fog">
          {notice}
          {noticeLink && (
            <>
              {" "}
              <a
                href="#"
                className="font-semibold text-accent"
                onClick={(e) => {
                  e.preventDefault();
                  if (pendingLesson.current) onAutoLesson(pendingLesson.current);
                }}
              >
                现在就去初版跟学 →
              </a>
            </>
          )}
        </p>
      )}

      <div className="mt-4 space-y-2.5">
        {!tabs.length && <p className="text-[13px] text-fog">还没有保存的谱子。从网上复制谱子粘贴到上面保存吧。</p>}
        {tabs.map((tb, idx) => (
          <div key={tb.time + idx} className="glass rounded-2xl p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[15px] font-semibold">📄 {tb.title}</div>
              <div className="flex gap-2">
                <button
                  className="btn-pill px-3.5 py-1.5 text-[13px]"
                  onClick={() => {
                    const al = buildAutoLesson(tb.title, tb.text, "local-" + idx);
                    if (!al) {
                      alert("这份谱子里没识别出常见和弦，换一份带和弦标记（如 C G Am F）的谱子试试");
                      return;
                    }
                    onAutoLesson(al);
                  }}
                >
                  🎯 跟学
                </button>
                <button
                  className="btn-pill px-3.5 py-1.5 text-[13px]"
                  onClick={() => setOpenView((v) => (v === idx ? null : idx))}
                >
                  查看
                </button>
                <button
                  className="btn-pill px-3.5 py-1.5 text-[13px]"
                  onClick={() => {
                    if (confirm(`删除「${tb.title}」？`)) {
                      const t2 = getTabs();
                      t2.splice(idx, 1);
                      saveTabs(t2);
                    }
                  }}
                >
                  删除
                </button>
              </div>
            </div>
            {openView === idx && (
              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap rounded-xl bg-black/[0.04] p-3.5 font-mono text-[13px] leading-7">
                {tb.text}
              </pre>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
