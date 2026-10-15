"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { CHORDS, chordSVG } from "@/data/chords";

function Step({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/50 px-4 py-3 text-sm leading-8 text-ink">{children}</div>
  );
}

function H4({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-2 mt-5 text-[15px] font-semibold text-accent-deep">{children}</h4>;
}

export function TutorialsPanel() {
  return (
    <>
      <Card className="mb-[18px]">
        <CardTitle>🎸 吉他新手从零开始</CardTitle>
        <H4>第 1 步：认识你的吉他</H4>
        <Step>
          吉他有 <b>6 根弦</b>，从最粗到最细依次是 ⑥⑤④③②① 弦，标准音分别是 <b>E A D G B E</b>
          （念作“米 拉 来 索 西 米”）。品格是琴颈上的金属条，靠近琴头是第 1 品。
        </Step>
        <H4>第 2 步：调音（每天必做）</H4>
        <Step>
          用本页上方的<b>调音器</b>：先点 ⑥ 弦按钮听标准音，再拨你的 ⑥ 弦对比；或开麦克风实时检测，指针居中变绿就是准了。弦钮顺时针拧
          = 音变低，逆时针 = 音变高，每次只拧一点点。
        </Step>
        <H4>第 3 步：持琴与拨弦</H4>
        <Step>
          坐着弹：琴身凹陷处架在右大腿上，右臂自然搭在琴身上。右手拇指负责 ⑥⑤④ 弦，食指中指无名指负责
          ③②① 弦。先练 <b>53231323</b>（手指拨弦顺序），慢速、均匀，每天 10 分钟。
        </Step>
        <H4>第 4 步：左手按弦</H4>
        <Step>
          用指尖（不是指肚）按在品格<b>靠近品丝的位置</b>，拇指顶在琴颈背面中间。按不响多半是因为没按紧或碰到了旁边的弦——这是正常的，手指长茧就不疼了（约
          2 周）。
        </Step>
        <H4>第 5 步：学会第一个和弦</H4>
        <Step>
          先学 <b>Em</b>（最简单，只用两根手指），再学 <b>Am → C → G → D</b>
          。每个和弦按好后逐根拨弦检查，保证每根都响亮。练“和弦转换”：Em→Am→C→G 循环，每个和弦 4
          拍，目标 1 分钟换 30 次。
        </Step>
        <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {["Em", "Am", "C", "G", "D", "E", "A", "Dm", "F"].map((n) => (
            <div
              key={n}
              className="flex flex-col items-center rounded-xl border border-white/80 bg-white/50 p-2"
            >
              <div dangerouslySetInnerHTML={{ __html: chordSVG(n) }} />
              <div className="text-sm font-bold">{n}</div>
              <div className="text-[11px] text-fog">{CHORDS[n].fg || "新手必学"}</div>
            </div>
          ))}
        </div>
        <H4>第 6 步：弹第一首歌</H4>
        <Step>
          会了 Em、G、D 三个和弦就能弹《小星星》了：<b>G | D | Em | D</b> 循环，右手用 53231323
          指法。新手教程里的“网红谱”标签页有更多流行歌的简化谱。
        </Step>
      </Card>

      <Card>
        <CardTitle>🎹 钢琴新手从零开始</CardTitle>
        <H4>第 1 步：认识键盘</H4>
        <Step>
          钢琴键按 <b>2 黑 3 黑</b> 分组循环。找到“2 个黑键”的那组，它左边的白键就是{" "}
          <b>中央 C（do）</b>。白键从 C 开始依次是 C D E F G A B（do re mi fa sol la si）。
        </Step>
        <H4>第 2 步：手型</H4>
        <Step>
          像手里握着一个鸡蛋——手指自然弯曲，用指尖触键。手腕放平别塌，大拇指不要躺着按。先把右手 5
          根手指依次放在 C D E F G 上。
        </Step>
        <H4>第 3 步：弹《小星星》</H4>
        <Step>简谱（1=do）：跟着下面的谱，在上方钢琴上点对应的键。数字上方没有点 = 中音区。</Step>
        <div className="my-3 rounded-xl bg-[#202124] p-4 text-center font-mono text-[15px] leading-9 text-[#7be0a8]">
          1 1 5 5 6 6 5 — &nbsp; 4 4 3 3 2 2 1 —
          <br />
          <span className="text-xs text-[#9db8a6]">
            do do sol sol la la sol — &nbsp; fa fa mi mi re re do —
          </span>
        </div>
        <Step>
          熟练后试试左手加简单的伴奏：左手弹 <b>C - G - Am - F</b> 每个和弦按 4 拍，和右手一起就是完整的小星星变奏了。
        </Step>
        <H4>第 4 步：每天练什么（15 分钟）</H4>
        <Step>
          5 分钟音阶（C 大调上行下行）→ 5 分钟《小星星》→ 5 分钟自由弹。坚持两周，手指灵活度和识谱会有明显变化。
        </Step>
      </Card>
    </>
  );
}
