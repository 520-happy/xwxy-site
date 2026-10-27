"use client";

/**
 * 家宽学堂 /proxy
 * 住宅代理（家宽节点）知识栏目：详细、通俗、形象。
 * 全部是概念科普，不涉及任何具体购买链接。
 */
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { cn } from "@/lib/utils";

/* ---------- 小组件 ---------- */

function Section({
  no,
  title,
  children,
}: {
  no: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900">
        <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-sky-600 text-[12px] font-bold text-white">
          {no}
        </span>
        {title}
      </h2>
      <div className="space-y-4 text-[15px] leading-7 text-zinc-700">{children}</div>
    </section>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-white p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

/* ---------- 互动 1：直连 vs 走代理 ---------- */

function FlowWidget() {
  const [viaProxy, setViaProxy] = useState(true);
  return (
    <Card>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViaProxy(false)}
          className={cn("btn-pill px-4 py-2 text-sm font-bold", !viaProxy && "active")}
        >
          直接上网
        </button>
        <button
          onClick={() => setViaProxy(true)}
          className={cn("btn-pill px-4 py-2 text-sm font-bold", viaProxy && "active")}
        >
          走家宽代理
        </button>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-xl bg-zinc-50 p-3 text-center">
          <div className="text-2xl">🏠</div>
          <p className="mt-1 text-sm font-bold">你</p>
          <p className="text-xs text-fog">家里宽带 · IP：183.192.×.×</p>
        </div>
        <div className="flex-none text-center text-lg text-fog">⟶</div>
        <div
          className={cn(
            "flex-1 rounded-xl p-3 text-center transition-all",
            viaProxy ? "bg-sky-50 ring-2 ring-sky-500" : "bg-zinc-50 opacity-40"
          )}
        >
          <div className="text-2xl">🏡</div>
          <p className="mt-1 text-sm font-bold">住宅代理</p>
          <p className="text-xs text-fog">别人家的宽带 · IP：45.78.×.×</p>
        </div>
        <div className="flex-none text-center text-lg text-fog">⟶</div>
        <div className="flex-1 rounded-xl bg-zinc-50 p-3 text-center">
          <div className="text-2xl">🌐</div>
          <p className="mt-1 text-sm font-bold">目标网站</p>
          <p className="text-xs text-fog">
            看到的 IP：
            <b className={viaProxy ? "text-sky-700" : "text-zinc-900"}>
              {viaProxy ? "45.78.×.×（代理的）" : "183.192.×.×（你的）"}
            </b>
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-fog">
        {viaProxy
          ? "走代理时，你的请求先去代理那台“别人家的宽带”转一圈再到网站，网站只认得代理的 IP，认不出你。"
          : "直接上网时，网站看到的就是你自己家宽带的 IP。"}
        你的真实 IP 从来没有直接出现在网站面前——这就是代理最基本的作用。
      </p>
    </Card>
  );
}

/* ---------- 互动 2：Clash 分流 ---------- */

const ROUTES = [
  {
    site: "国内视频网站",
    path: "direct",
    why: "国内网站直连最快，没必要绕代理，还省代理流量。",
  },
  {
    site: "国外网站",
    path: "proxy",
    why: "走代理出口，网站看到的是代理所在地的 IP。",
  },
  {
    site: "银行 / 支付 App",
    path: "direct",
    why: "涉及钱的服务一律直连，别让代理碰敏感账号，这是安全习惯。",
  },
];

function RouteWidget() {
  const [i, setI] = useState(1);
  const cur = ROUTES[i];
  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        {ROUTES.map((r, k) => (
          <button
            key={r.site}
            onClick={() => setI(k)}
            className={cn("btn-pill px-4 py-2 text-sm font-bold", i === k && "active")}
          >
            {r.site}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <div className="flex-1 rounded-xl bg-zinc-50 p-3 text-center text-sm font-bold">📱 你的设备</div>
        <div className="flex-none text-center text-lg text-fog">⟶</div>
        <div
          className={cn(
            "flex-1 rounded-xl p-3 text-center text-sm font-bold",
            cur.path === "proxy" ? "bg-sky-50 ring-2 ring-sky-500" : "bg-zinc-50 opacity-40"
          )}
        >
          🏡 代理出口
        </div>
        <div className="flex-none text-center text-lg text-fog">⟶</div>
        <div className="flex-1 rounded-xl bg-zinc-50 p-3 text-center text-sm font-bold">🌐 {cur.site}</div>
      </div>
      <p className="mt-4 text-sm leading-6 text-fog">
        <b className="text-zinc-900">{cur.site}：{cur.path === "proxy" ? "走代理" : "直连"}</b>。{cur.why}
        Clash 这类工具就是“交通指挥”：按你定的规则，决定每个请求走直连还是走代理，不用每次手动开关。
      </p>
    </Card>
  );
}

/* ---------- 互动 3：IP 身份判定 ---------- */

const IP_CASES = [
  {
    ip: "45.132.×.×",
    asn: "某云服务商 · 机房",
    type: "Hosting（托管）",
    verdict: "机房 IP",
    color: "text-red-600",
    desc: "IP 属于数据中心，网站一眼就知道这是服务器，不是真人家里。很多网站对机房 IP 卡得更严。",
  },
  {
    ip: "103.28.×.×",
    asn: "某宽带运营商 · 机房托管",
    type: "ISP（运营商）",
    verdict: "ISP 代理，不是真住宅",
    color: "text-amber-600",
    desc: "IP 名义上属于运营商，但实际放在机房服务器上跑。看着像宽带，骨子里还是机房，介于两者之间。",
  },
  {
    ip: "183.192.×.×",
    asn: "某地家庭宽带",
    type: "Residential（住宅）",
    verdict: "真住宅 IP",
    color: "text-emerald-600",
    desc: "IP 来自真实家庭宽带，网站看到的就是普通家庭用户。这就是“家宽”两个字的含义。",
  },
];

function CheckWidget() {
  const [i, setI] = useState(2);
  const cur = IP_CASES[i];
  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        {IP_CASES.map((c, k) => (
          <button
            key={c.ip}
            onClick={() => setI(k)}
            className={cn("btn-pill px-4 py-2 font-mono text-sm font-bold", i === k && "active")}
          >
            {c.ip}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-zinc-50 p-4 text-sm leading-7">
        <p>
          ASN 归属：<b>{cur.asn}</b>
        </p>
        <p>
          数据库标注类型：<b>{cur.type}</b>
        </p>
        <p>
          结论：<b className={cur.color}>{cur.verdict}</b>
        </p>
        <p className="mt-2 text-fog">{cur.desc}</p>
      </div>
      <p className="mt-3 text-[13px] leading-6 text-fog">
        判断方法就看这两点：IP 的 ASN（归属）是不是家庭宽带运营商，以及数据库把它标成 Hosting、ISP 还是
        Residential。网上有免费的 IP 查询页，输入 IP 就能看到这两项。
      </p>
    </Card>
  );
}

/* ---------- 互动 4：小测验 ---------- */

const QUIZ = [
  {
    q: "网站说你的 IP 是数据中心，这说明什么？",
    options: ["这是真住宅 IP", "这是机房 IP", "这是你家宽带"],
    answer: 1,
    explain: "数据中心 = 机房，网站一眼就能认出来。",
  },
  {
    q: "静态住宅 IP 最适合什么场景？",
    options: ["每次换个身份", "需要长期固定一个身份", "只用一次就扔"],
    answer: 1,
    explain: "静态 = IP 不变，适合需要长期登录同一个账号、保持同一个身份的场景。",
  },
  {
    q: "为什么“永久免费住宅代理”基本是坑？",
    options: [
      "因为没人愿意白送自家宽带",
      "因为技术上做不到",
      "因为法律不允许",
    ],
    answer: 0,
    explain: "住宅 IP 的成本是别人家的宽带和电费，不可能零成本无限供应；免费的往往拿你的流量或数据抵账。",
  },
  {
    q: "银行、支付类 App 应该走代理还是直连？",
    options: ["走代理更安全", "直连", "无所谓"],
    answer: 1,
    explain: "涉及钱的服务一律直连，别让代理碰敏感账号。",
  },
  {
    q: "Clash 在代理里是干嘛的？",
    options: ["提供 IP", "按规则决定流量走直连还是走代理", "给宽带加速"],
    answer: 1,
    explain: "Clash 本身不提供 IP，它是交通指挥：按规则分流，国内直连、国外走代理。",
  },
];

function QuizWidget() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const cur = QUIZ[i];
  const next = () => {
    if (picked === null) return;
    if (picked === cur.answer) setScore((s) => s + 1);
    if (i + 1 >= QUIZ.length) setDone(true);
    else {
      setI(i + 1);
      setPicked(null);
    }
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };
  if (done) {
    return (
      <Card>
        <p className="text-center text-lg font-bold">
          {score} / {QUIZ.length} 分
        </p>
        <p className="mt-2 text-center text-sm leading-6 text-fog">
          {score === QUIZ.length
            ? "全对！家宽的基础概念你已经摸透了。"
            : "错了的题翻上去再看一遍，概念比操作重要。"}
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={restart}
            className="rounded-full bg-sky-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
          >
            再测一次
          </button>
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <p className="mb-1 text-xs text-fog">
        第 {i + 1} / {QUIZ.length} 题 · 当前 {score} 分
      </p>
      <p className="mb-4 text-[15px] font-bold leading-7">{cur.q}</p>
      <div className="space-y-2">
        {cur.options.map((o, k) => (
          <button
            key={o}
            onClick={() => setPicked(k)}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-left text-sm transition-all active:scale-[0.98]",
              picked === k
                ? "border-sky-500 bg-sky-50 font-bold text-sky-700"
                : "border-line bg-white hover:border-sky-300/50"
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && (
        <p
          className={cn(
            "mt-3 text-sm leading-6",
            picked === cur.answer ? "text-emerald-700" : "text-red-600"
          )}
        >
          {picked === cur.answer ? "✓ 答对了。" : "✗ 答错了。"}
          {cur.explain}
        </p>
      )}
      <button
        onClick={next}
        disabled={picked === null}
        className="mt-4 rounded-full bg-sky-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition-transform active:scale-95 disabled:opacity-40"
      >
        {i + 1 === QUIZ.length ? "看成绩" : "下一题"}
      </button>
    </Card>
  );
}

/* ---------- 页面 ---------- */

const FAQS = [
  {
    q: "家宽节点会被网站封吗？",
    a: "任何 IP 用得太狠都会被封。住宅 IP 只是“看起来像真人”，不是免死金牌。别用一个 IP 高频刷同一个网站，悠着点用。",
  },
  {
    q: "静态好还是动态好？",
    a: "看场景。需要长期固定身份（比如一直登录同一个账号）选静态；需要每次换个身份（比如批量采集公开数据）选动态。没有哪个一定更好。",
  },
  {
    q: "家宽会让网速变快吗？",
    a: "不会。多了一次中转，速度只会慢一点。家宽买的是“身份像真人”，不是加速。",
  },
  {
    q: "一个住宅 IP 会不会很多人同时用？",
    a: "看套餐。独享就是只有你用，共享就是几个人轮着用。共享便宜，但前一个人干了什么会影响这个 IP 的“干净程度”。",
  },
  {
    q: "什么是纯净度？",
    a: "这个 IP 过去有没有被用来干过坏事、有没有上过黑名单。越干净的 IP 越不容易一上来就被网站拦截。买之前可以先问商家能不能试用、能不能换 IP。",
  },
  {
    q: "用代理违法吗？",
    a: "代理本身是中性工具，关键看你拿它干什么。遵守当地法律和网站的使用规则，别用代理做欺诈、刷票、盗号这些事。",
  },
];

function FaqWidget() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {FAQS.map((f, i) => (
        <div key={f.q} className="overflow-hidden rounded-2xl border border-line bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[15px] font-bold"
          >
            {f.q}
            <span className="flex-none text-fog">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <p className="border-t border-line px-5 py-4 text-sm leading-7 text-zinc-700">{f.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProxyLearnPage() {
  return (
    <SiteShell>
      {/* 头部 */}
      <section className="mx-auto max-w-2xl pb-10 pt-6 text-center sm:pt-10">
        <h1 className="text-3xl font-extrabold leading-tight text-zinc-900 sm:text-4xl">
          家宽学堂
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-fog">
          住宅代理（家宽节点）到底是什么？为什么它比机房 IP 贵？怎么挑才不踩坑？
          这一页用大白话讲清楚，点一点、测一测就能懂。
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-line bg-white p-3">
            <div className="text-xl">🏠</div>
            <p className="mt-1 text-sm font-bold">住宅 IP</p>
            <p className="text-xs leading-5 text-fog">来自真实家庭宽带</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3">
            <div className="text-xl">🏢</div>
            <p className="mt-1 text-sm font-bold">机房 IP</p>
            <p className="text-xs leading-5 text-fog">来自数据中心服务器</p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-3">
            <div className="text-xl">🪪</div>
            <p className="mt-1 text-sm font-bold">ISP 代理</p>
            <p className="text-xs leading-5 text-fog">运营商名义，机房实质</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl">
        <Section no="1" title="先说 IP：它就是你在网上的门牌号">
          <p>
            每台上网的设备都有一个 IP 地址，相当于<b>门牌号</b>：网站靠它知道把网页寄给谁，也靠它判断你“从哪来”。
            门牌号分两种来源：一种是数据中心批量申请的（机房 IP），一种是宽带运营商分给千家万户的（住宅 IP）。
            网站对这两类门牌的态度完全不同——这就是家宽这个话题的全部起点。
          </p>
          <FlowWidget />
        </Section>

        <Section no="2" title="三种 IP 身份证：机房、住宅、ISP">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <div className="text-xl">🏢</div>
              <p className="mt-2 font-bold">机房 IP</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                服务器托管在数据中心。便宜、量大、速度快，但网站一眼认出是服务器，限制也最严。
              </p>
            </Card>
            <Card className="ring-2 ring-sky-500">
              <div className="text-xl">🏠</div>
              <p className="mt-2 font-bold">住宅 IP（家宽）</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                来自真实家庭宽带。网站看到的就是普通家庭用户，最不容易被区别对待，所以也最贵。
              </p>
            </Card>
            <Card>
              <div className="text-xl">🪪</div>
              <p className="mt-2 font-bold">ISP 代理</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                IP 挂在运营商名下，但实际跑在机房服务器上。名义像宽带，实质像机房，价格介于两者之间。
              </p>
            </Card>
          </div>
          <CheckWidget />
        </Section>

        <Section no="3" title="静态和动态：门牌号换不换">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="font-bold">📌 静态住宅 IP</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                一个 IP 长期归你用，不变。适合需要固定身份的场景：一直登录同一个账号、远程管理设备。
                缺点是贵，而且一旦这个 IP 被封，就得换。
              </p>
            </Card>
            <Card>
              <p className="font-bold">🔄 动态住宅 IP</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                每次连接（或每隔一段时间）换一个 IP。适合需要经常换身份的场景，价格通常按流量算。
                缺点是身份不固定，不适合长期登录同一个账号。
              </p>
            </Card>
          </div>
          <p>
            一句话：<b>要“一直是同一个人”选静态，要“每次都是不同人”选动态。</b>买之前先想清楚自己属于哪种。
          </p>
        </Section>

        <Section no="4" title="代理协议：HTTP 和 SOCKS5 有什么区别">
          <p>
            协议就是你和代理之间“说话的规矩”。常见的就两种，记住一句就够：
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="font-bold">HTTP(S) 代理</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                只管网页流量（浏览器上网）。配置简单，浏览器里填个地址端口就能用，但别的软件管不着。
              </p>
            </Card>
            <Card>
              <p className="font-bold">SOCKS5 代理</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                不挑流量类型，什么软件都能走，还支持账号密码验证。更通用，配 Clash 这类工具时最常用。
              </p>
            </Card>
          </div>
          <p>
            新手不用纠结：<b>能选 SOCKS5 就选 SOCKS5</b>，兼容性最好。商家给你的代理信息通常就是四样：地址（host）、端口、用户名、密码。
          </p>
        </Section>

        <Section no="5" title="Clash 和分流：交通指挥，不用手动开关">
          <p>
            Clash（以及 Mihomo 这类同类工具）本身<b>不提供 IP</b>，它只负责“指挥交通”：你把代理信息填进去，再定几条规则，
            它就按规则决定每个请求走直连还是走代理。点下面的网站看看它会怎么走：
          </p>
          <RouteWidget />
          <p>
            还有一个词叫 <b>TUN 模式</b>：开了它，Clash 会接管整个设备的流量（不只是浏览器），所有软件都按规则走。
            不开 TUN 时，只有支持代理设置的软件才走代理。
          </p>
        </Section>

        <Section no="6" title="为什么免费住宅 IP 不存在：算一笔账">
          <p>
            住宅 IP 的成本是实打实的：宽带月租、电费、设备折旧，都是别人家在掏钱。一个服务商如果说“永久免费、无限量住宅 IP”，
            钱从哪来？常见的答案都不太妙：
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="font-bold">🐌 极不稳定</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                免费池里的 IP 随时下线、随时被封，今天能用明天不一定。
              </p>
            </Card>
            <Card>
              <p className="font-bold">👀 流量被记录</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                免费的代价常常是你的流量被记录、被分析，甚至被转卖。
              </p>
            </Card>
            <Card>
              <p className="font-bold">🎣 钓鱼和植入</p>
              <p className="mt-1 text-sm leading-6 text-fog">
                个别免费代理会篡改网页、插广告。登录、支付这类操作绝对不要走免费代理。
              </p>
            </Card>
          </div>
          <p>
            靠谱的免费形态只有两种：<b>正规服务商的限时试用</b>（比如几天试用、送几十 MB 流量）和<b>自家宽带自建</b>（需要一台 24 小时开机的设备）。
            除此之外的“永久免费”，看到就绕道。
          </p>
        </Section>

        <Section no="7" title="选购看什么：六个指标，按顺序看">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <b>类型先对上</b>：确认是真住宅（Residential），不是 ISP 冒充的。
            </li>
            <li>
              <b>纯净度</b>：IP 有没有上过黑名单，能不能试用、能不能换。
            </li>
            <li>
              <b>国家和城市</b>：能不能选到你要的地区，精确到城市的通常更贵。
            </li>
            <li>
              <b>独享还是共享</b>：独享贵但干净，共享便宜但前人会影响你。
            </li>
            <li>
              <b>计费方式</b>：按流量（用多少算多少）还是按 IP 个数租；流量会不会过期。
            </li>
            <li>
              <b>协议和工具</b>：支不支持 SOCKS5，能不能直接给 Clash 用的配置。
            </li>
          </ol>
          <p>
            记住一个原则：<b>先试用再掏钱</b>。正规服务商都敢给试用，试用时重点测两点——IP 类型是不是住宅、目标网站打不打得开。
          </p>
        </Section>

        <Section no="8" title="常见问题">
          <FaqWidget />
        </Section>

        <Section no="9" title="小测验：看看你掌握了没有">
          <QuizWidget />
        </Section>

        <p className="pb-8 text-center text-[13px] leading-6 text-fog">
          本栏目为概念科普，不含任何购买链接；涉及具体服务时请自行核对官方条款，
          并遵守当地法律与各网站的使用规则。
        </p>
      </div>
    </SiteShell>
  );
}
