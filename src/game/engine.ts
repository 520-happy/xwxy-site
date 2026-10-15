/* ================= 后院保卫战：接近原版的植物大战僵尸 =================
   由 game.html 移植而来，玩法逻辑保持一致。 */

export interface EndInfo {
  win: boolean;
  title: string;
  desc: string;
}

export interface GameHooks {
  onEnd: (info: EndInfo) => void;
}

export interface GameHandle {
  start: () => void;
  destroy: () => void;
}

type PlantKey = "sunflower" | "peashooter" | "snowpea" | "wallnut" | "cherrybomb" | "repeater";

interface PlantDef {
  name: string;
  cost: number;
  hp: number;
  cd: number;
  color: string;
}

interface ZombieDef {
  name: string;
  hp: number;
  speed: number;
  dps: number;
  color: string;
}

interface Plant {
  key: PlantKey;
  hp: number;
  maxHp: number;
  t: number;
  shoot: number;
  prod: number;
  recoil: number;
  flash: number;
  boomed: boolean;
}

interface Zombie {
  type: string;
  r: number;
  x: number;
  hp: number;
  maxHp: number;
  speed: number;
  dps: number;
  slow: number;
  eatT: number;
  walkT: number;
  flash: number;
}

interface Pea {
  r: number;
  x: number;
  y: number;
  vx: number;
  dmg: number;
  ice: boolean;
}

interface SunToken {
  x: number;
  y: number;
  ty: number;
  v: number;
  t: number;
  value: number;
}

interface Mower {
  r: number;
  x: number;
  used: boolean;
  active: boolean;
}

interface FloatText {
  text: string;
  x: number;
  y: number;
  t: number;
  dur: number;
  big?: boolean;
}

const W = 1000;
const H = 640;

// ---- 棋盘 ----
const COLS = 9;
const ROWS = 5;
const LAWN_X = 70;
const LAWN_Y = 120;
const CELL_W = 96;
const CELL_H = 100;
const lawnW = COLS * CELL_W;
const lawnH = ROWS * CELL_H;
const cellCX = (c: number) => LAWN_X + c * CELL_W + CELL_W / 2;
const cellCY = (r: number) => LAWN_Y + r * CELL_H + CELL_H / 2;

// ---- 植物定义 ----
const PLANTS: Record<PlantKey, PlantDef> = {
  sunflower: { name: "向日葵", cost: 50, hp: 300, cd: 7, color: "#f7b731" },
  peashooter: { name: "豌豆射手", cost: 100, hp: 300, cd: 7, color: "#58cc4a" },
  snowpea: { name: "寒冰射手", cost: 175, hp: 300, cd: 7, color: "#7fd4f7" },
  wallnut: { name: "坚果墙", cost: 50, hp: 4000, cd: 25, color: "#b07a3f" },
  cherrybomb: { name: "樱桃炸弹", cost: 150, hp: 99999, cd: 35, color: "#e63946" },
  repeater: { name: "双发射手", cost: 200, hp: 300, cd: 7, color: "#3fae3a" },
};
const SEED_ORDER: PlantKey[] = ["sunflower", "peashooter", "snowpea", "wallnut", "cherrybomb", "repeater"];

// ---- 僵尸定义 ----
const ZOMBIES: Record<string, ZombieDef> = {
  normal: { name: "普通僵尸", hp: 200, speed: 24, dps: 60, color: "#8a9a5b" },
  conehead: { name: "路障僵尸", hp: 560, speed: 24, dps: 60, color: "#8a9a5b" },
  runner: { name: "报纸僵尸", hp: 340, speed: 46, dps: 60, color: "#8a9a5b" },
  bucket: { name: "铁桶僵尸", hp: 1300, speed: 20, dps: 75, color: "#8a9a5b" },
};

const TOTAL_WAVES = 10;

export function createGame(cv: HTMLCanvasElement, hooks: GameHooks): GameHandle {
  const ctx = cv.getContext("2d")!;

  type State = "menu" | "playing" | "paused" | "win" | "lose";
  let state: State = "menu";
  let sun = 150;
  let grid: (Plant | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  let peas: Pea[] = [];
  let zombies: Zombie[] = [];
  let suns: SunToken[] = [];
  let mowers: Mower[] = [];
  let floats: FloatText[] = [];
  let cooldowns: Record<string, number> = {};
  let selected: PlantKey | null = null;
  let shovelMode = false;
  let wave = 0;
  let spawnQueue: { type: string; delay: number }[] = [];
  let waveTimer = 0;
  let skySunTimer = 5;
  let gameTime = 0;
  let hover = { c: -1, r: -1 };
  let shake = 0;
  let raf = 0;
  let last = 0;
  let destroyed = false;

  function resetGame() {
    sun = 150;
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    peas = [];
    zombies = [];
    suns = [];
    floats = [];
    mowers = Array.from({ length: ROWS }, (_, r) => ({ r, x: 18, used: false, active: false }));
    cooldowns = {};
    SEED_ORDER.forEach((k) => (cooldowns[k] = 0));
    selected = null;
    shovelMode = false;
    wave = 0;
    spawnQueue = [];
    waveTimer = 2.5;
    skySunTimer = 5;
    gameTime = 0;
    shake = 0;
  }

  function waveComp(n: number): string[] {
    const pool = ["normal"];
    if (n >= 3) pool.push("conehead");
    if (n >= 5) pool.push("runner");
    if (n >= 7) pool.push("bucket");
    const count = n === 10 ? 22 : 3 + n * 2;
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      let t = pool[(Math.random() * pool.length) | 0];
      if (n === 10 && i % 5 === 4) t = "bucket";
      if (n >= 8 && i % 6 === 5) t = "conehead";
      list.push(t);
    }
    return list;
  }

  function startWave(n: number) {
    wave = n;
    const list = waveComp(n);
    const interval = Math.max(1.6, 4.2 - n * 0.25);
    list.forEach((t, i) => spawnQueue.push({ type: t, delay: i * interval + Math.random() * 1.5 }));
    floats.push({
      text: n === 10 ? "⚠ 一大波僵尸正在接近！ ⚠" : `第 ${n} 波`,
      x: W / 2,
      y: H / 2 - 40,
      t: 0,
      dur: 2.4,
      big: n === 10,
    });
  }

  function spawnZombie(type: string) {
    const r = (Math.random() * ROWS) | 0;
    const z = ZOMBIES[type];
    zombies.push({
      type,
      r,
      x: W + 30 + Math.random() * 60,
      hp: z.hp,
      maxHp: z.hp,
      speed: z.speed * (0.9 + Math.random() * 0.2),
      dps: z.dps,
      slow: 0,
      eatT: 0,
      walkT: Math.random() * 10,
      flash: 0,
    });
  }

  function endGame(win: boolean) {
    state = win ? "win" : "lose";
    const mm = Math.floor(gameTime / 60);
    const ss = Math.floor(gameTime % 60);
    hooks.onEnd({
      win,
      title: win ? "🎉 胜利！" : "🧟 僵尸进屋了…",
      desc: win
        ? `你成功挡住了全部 ${TOTAL_WAVES} 波僵尸进攻，后院安全了！用时 ${mm} 分 ${ss} 秒`
        : `僵尸突破了第 ${wave} 波的防线。调整一下植物阵容，再试一次吧！`,
    });
  }

  // ================= 逻辑更新 =================
  function update(dt: number) {
    gameTime += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 30);

    SEED_ORDER.forEach((k) => {
      if (cooldowns[k] > 0) cooldowns[k] -= dt;
    });

    // 天上掉阳光
    skySunTimer -= dt;
    if (skySunTimer <= 0) {
      skySunTimer = 7 + Math.random() * 3;
      suns.push({
        x: LAWN_X + Math.random() * lawnW,
        y: LAWN_Y - 20,
        ty: LAWN_Y + 40 + Math.random() * (lawnH - 80),
        v: 60,
        t: 0,
        value: 25,
      });
    }

    // 波次推进
    if (wave < TOTAL_WAVES) {
      if (spawnQueue.length === 0 && zombies.length === 0) {
        waveTimer -= dt;
        if (waveTimer <= 0) {
          startWave(wave + 1);
          waveTimer = 6;
        }
      }
    } else if (spawnQueue.length === 0 && zombies.length === 0 && state === "playing") {
      endGame(true);
      return;
    }
    spawnQueue.forEach((s) => (s.delay -= dt));
    while (spawnQueue.length && spawnQueue[0].delay <= 0) {
      spawnZombie(spawnQueue.shift()!.type);
    }

    // 植物行为
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const p = grid[r][c];
        if (!p) continue;
        p.t += dt;
        p.flash = Math.max(0, p.flash - dt * 4);
        if (p.key === "sunflower") {
          p.prod -= dt;
          if (p.prod <= 0) {
            p.prod = 11 + Math.random() * 3;
            suns.push({
              x: cellCX(c) + (Math.random() * 30 - 15),
              y: cellCY(r) - 10,
              ty: cellCY(r) - 10,
              v: 0,
              t: 0,
              value: 25,
            });
            floats.push({ text: "+25 ☀", x: cellCX(c), y: cellCY(r) - 34, t: 0, dur: 0.9 });
          }
        } else if (p.key === "peashooter" || p.key === "snowpea" || p.key === "repeater") {
          p.shoot -= dt;
          const hasTarget = zombies.some(
            (z) => z.r === r && z.x > LAWN_X + c * CELL_W && z.x < W + 40
          );
          if (hasTarget && p.shoot <= 0) {
            const n = p.key === "repeater" ? 2 : 1;
            for (let i = 0; i < n; i++)
              peas.push({
                r,
                x: cellCX(c) + 28 + i * 14,
                y: cellCY(r) - 12,
                vx: 430,
                dmg: 20,
                ice: p.key === "snowpea",
              });
            p.shoot = 1.45;
            p.recoil = 0.18;
          }
          p.recoil = Math.max(0, p.recoil - dt);
        } else if (p.key === "cherrybomb") {
          if (p.t > 1.15 && !p.boomed) {
            p.boomed = true;
            shake = 14;
            floats.push({ text: "💥", x: cellCX(c), y: cellCY(r), t: 0, dur: 0.7, big: true });
            zombies.forEach((z) => {
              if (Math.abs(z.r - r) <= 1 && Math.abs(z.x - cellCX(c)) < CELL_W * 1.7) {
                z.hp -= 1800;
                z.flash = 1;
              }
            });
            grid[r][c] = null;
          }
        }
      }

    // 豌豆
    for (let i = peas.length - 1; i >= 0; i--) {
      const pea = peas[i];
      pea.x += pea.vx * dt;
      let hit = false;
      for (const z of zombies) {
        if (z.r === pea.r && Math.abs(z.x - pea.x) < 34 && z.hp > 0) {
          z.hp -= pea.dmg;
          z.flash = 1;
          hit = true;
          if (pea.ice) z.slow = 4;
          break;
        }
      }
      if (hit || pea.x > W + 20) peas.splice(i, 1);
    }

    // 僵尸
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      z.walkT += dt;
      z.flash = Math.max(0, z.flash - dt * 4);
      if (z.slow > 0) z.slow -= dt;
      if (z.hp <= 0) {
        zombies.splice(i, 1);
        continue;
      }

      let victim: Plant | null = null;
      let vc = -1;
      const zc = Math.floor((z.x - 26 - LAWN_X) / CELL_W);
      for (let c = Math.max(0, zc - 1); c <= Math.min(COLS - 1, zc + 1); c++) {
        const p = grid[z.r][c];
        if (p && Math.abs(cellCX(c) - (z.x - 26)) < CELL_W * 0.62) {
          victim = p;
          vc = c;
          break;
        }
      }
      if (victim) {
        z.eatT += dt;
        victim.hp -= z.dps * dt;
        victim.flash = Math.min(1, victim.flash + dt * 6);
        if (victim.hp <= 0) grid[z.r][vc] = null;
      } else {
        z.eatT = 0;
        const sp = z.speed * (z.slow > 0 ? 0.5 : 1);
        z.x -= sp * dt;
      }

      if (z.x < LAWN_X - 20) {
        const m = mowers[z.r];
        if (m && !m.used) {
          m.used = true;
          m.active = true;
        } else if (state === "playing") {
          endGame(false);
          return;
        }
      }
    }

    // 小推车
    mowers.forEach((m) => {
      if (m.active) {
        m.x += 420 * dt;
        zombies.forEach((z) => {
          if (z.r === m.r && Math.abs(z.x - m.x) < 46 && z.hp > 0) {
            z.hp = -999;
            z.flash = 1;
          }
        });
        if (m.x > W + 60) m.active = false;
      }
    });

    // 阳光掉落 / 停留
    for (let i = suns.length - 1; i >= 0; i--) {
      const s = suns[i];
      s.t += dt;
      if (s.y < s.ty) {
        s.y = Math.min(s.ty, s.y + s.v * dt);
      } else if (s.t > 11) suns.splice(i, 1);
    }
    // 飘字
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      if (f.t > f.dur) floats.splice(i, 1);
    }
  }

  // ================= 绘制 =================
  function rr(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function ellipse(x: number, y: number, rx: number, ry: number, rot: number, fill: string) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawPlant(p: Plant, x: number, y: number) {
    const t = p.t || 0;
    const sway = Math.sin(t * 3) * 2;
    ctx.save();
    ctx.translate(x, y);
    if (p.flash > 0) {
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 40);
    }
    const hurt = p.hp < p.maxHp * 0.5;
    if (p.key === "sunflower") {
      ctx.strokeStyle = "#3e8e2f";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 26);
      ctx.quadraticCurveTo(sway, 6, sway, -8);
      ctx.stroke();
      ellipse(-14, 12, 9, 5, -0.5, "#3e8e2f");
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + t * 0.4;
        ellipse(Math.cos(a) * 20 + sway, -14 + Math.sin(a) * 20, 9, 13, a, "#ffcf3f");
      }
      ctx.beginPath();
      ctx.arc(sway, -14, 15, 0, Math.PI * 2);
      ctx.fillStyle = "#8a5a2b";
      ctx.fill();
      ctx.fillStyle = "#5d3a17";
      ctx.beginPath();
      ctx.arc(sway - 5, -17, 2.4, 0, 7);
      ctx.arc(sway + 5, -17, 2.4, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#5d3a17";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sway, -11, 6, 0.3, Math.PI - 0.3);
      ctx.stroke();
    } else if (p.key === "peashooter" || p.key === "repeater" || p.key === "snowpea") {
      const body = p.key === "snowpea" ? "#8fd8f8" : p.key === "repeater" ? "#46b93e" : "#58cc4a";
      const dark = p.key === "snowpea" ? "#5aa8cc" : "#3e8e2f";
      ctx.strokeStyle = dark;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(-6, 28);
      ctx.quadraticCurveTo(-6 + sway, 8, -2 + sway, -4);
      ctx.stroke();
      ellipse(-20, 16, 10, 5, -0.4, dark);
      const rec = p.recoil || 0;
      const hx = 6 + sway - rec * 40;
      ctx.beginPath();
      ctx.arc(hx, -12, 17, 0, Math.PI * 2);
      ctx.fillStyle = body;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx, -12, 17, Math.PI * 0.15, Math.PI * 1.2);
      ctx.fillStyle = dark;
      ctx.fill();
      rr(hx + 8, -20, 22 - rec * 60, 13, 6);
      ctx.fillStyle = body;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx + 30 - rec * 60, -13.5, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = dark;
      ctx.fill();
      if (p.key === "repeater") {
        ctx.beginPath();
        ctx.arc(hx - 16, -20, 11, 0, Math.PI * 2);
        ctx.fillStyle = body;
        ctx.fill();
      }
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(hx + 4, -18, 2.6, 0, 7);
      ctx.fill();
      if (p.key === "snowpea") {
        ctx.fillStyle = "rgba(255,255,255,.75)";
        for (let i = 0; i < 3; i++) ellipse(hx - 8 + i * 8, -30, 3, 6, 0.4, "rgba(255,255,255,.75)");
      }
    } else if (p.key === "wallnut") {
      const wob = Math.sin(t * 2.2) * 1.5;
      ctx.save();
      ctx.rotate(wob * 0.02);
      rr(-20, -34, 40, 62, 16);
      ctx.fillStyle = hurt ? "#8a5a30" : "#b07a3f";
      ctx.fill();
      ctx.strokeStyle = "#6e4423";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#3a2410";
      ctx.beginPath();
      ctx.arc(-7, -12, 3, 0, 7);
      ctx.arc(7, -12, 3, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#3a2410";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, -2, hurt ? 4 : 7, 0.2, Math.PI - 0.2);
      ctx.stroke();
      if (hurt) {
        ctx.strokeStyle = "#4a2c14";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -28);
        ctx.lineTo(-4, -16);
        ctx.lineTo(-12, -4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, -26);
        ctx.lineTo(6, -14);
        ctx.stroke();
      }
      ctx.restore();
    } else if (p.key === "cherrybomb") {
      const s = 1 + Math.sin(t * 10) * 0.08;
      ctx.save();
      ctx.scale(s, s);
      ctx.strokeStyle = "#2e7d32";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-8, 22);
      ctx.quadraticCurveTo(-10, -6, -14, -16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 22);
      ctx.quadraticCurveTo(10, -6, 14, -16);
      ctx.stroke();
      ellipse(-15, -22, 15, 17, -0.2, "#e63946");
      ellipse(15, -22, 15, 17, 0.2, "#e63946");
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ellipse(-20, -28, 4, 6, -0.3, "rgba(255,255,255,.55)");
      ellipse(10, -28, 4, 6, -0.3, "rgba(255,255,255,.55)");
      ctx.fillStyle = "#7a1f28";
      ctx.beginPath();
      ctx.arc(-19, -22, 2.6, 0, 7);
      ctx.arc(-10, -22, 2.6, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(11, -22, 2.6, 0, 7);
      ctx.arc(20, -22, 2.6, 0, 7);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawZombie(z: Zombie) {
    const bob = Math.sin(z.walkT * 6) * 3;
    const eating = z.eatT > 0;
    ctx.save();
    ctx.translate(z.x, cellCY(z.r));
    if (z.flash > 0) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(z.walkT * 50);
    const skin = "#93a267";
    const cloth = "#6b5b4a";
    const pants = "#4a5a6b";
    ctx.fillStyle = pants;
    const legSwing = eating ? 0 : Math.sin(z.walkT * 6) * 6;
    rr(-13, -2 + bob * 0.3, 11, 30 - bob * 0.3 + legSwing * 0.3, 4);
    ctx.fill();
    rr(3, -2 + bob * 0.3, 11, 30 - bob * 0.3 - legSwing * 0.3, 4);
    ctx.fill();
    ctx.fillStyle = cloth;
    rr(-17, -52 + bob * 0.4, 34, 54, 8);
    ctx.fill();
    ctx.fillStyle = "#5a4c3d";
    ctx.beginPath();
    ctx.moveTo(-17, -30 + bob * 0.4);
    ctx.lineTo(-6, -22 + bob * 0.4);
    ctx.lineTo(-14, -12 + bob * 0.4);
    ctx.lineTo(-17, -18 + bob * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = skin;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    const reach = eating ? -34 - Math.sin(z.eatT * 14) * 5 : -22 + Math.sin(z.walkT * 6) * 4;
    ctx.beginPath();
    ctx.moveTo(-8, -44 + bob * 0.4);
    ctx.lineTo(reach, -34 + bob * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-2, -66 + bob * 0.5, 15, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.fillStyle = "#5c6b3f";
    ctx.beginPath();
    ctx.arc(-8, -70 + bob * 0.5, 3, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#4a5633";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, -58 + bob * 0.5);
    ctx.lineTo(-4, -60 + bob * 0.5 + (eating ? Math.sin(z.eatT * 14) * 3 : 0));
    ctx.stroke();
    if (z.type === "conehead") {
      ctx.beginPath();
      ctx.moveTo(-16, -76 + bob * 0.5);
      ctx.lineTo(12, -76 + bob * 0.5);
      ctx.lineTo(-2, -108 + bob * 0.5);
      ctx.closePath();
      ctx.fillStyle = "#e07b2a";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(-9, -84 + bob * 0.5, 14, 5);
    } else if (z.type === "bucket") {
      rr(-16, -104 + bob * 0.5, 28, 32, 4);
      ctx.fillStyle = "#9aa3ad";
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.fillRect(-12, -98 + bob * 0.5, 20, 6);
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth = 2;
      ctx.strokeRect(-16, -104 + bob * 0.5, 28, 32);
    } else if (z.type === "runner") {
      ctx.save();
      ctx.translate(-30, -40 + bob * 0.4);
      ctx.rotate(-0.25);
      ctx.fillStyle = "#d8d2c4";
      ctx.fillRect(0, -22, 5, 30);
      rr(4, -26, 26, 34, 2);
      ctx.fillStyle = "#e8e2d2";
      ctx.fill();
      ctx.fillStyle = "#b33";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("报纸", 17, -8);
      ctx.restore();
    }
    if (z.slow > 0) {
      ctx.fillStyle = "rgba(160,220,255,.45)";
      ctx.beginPath();
      ctx.arc(-2, -50, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMower(m: Mower) {
    const y = cellCY(m.r);
    ctx.save();
    ctx.translate(m.x, y);
    if (m.used && !m.active) {
      ctx.globalAlpha = 0.25;
    }
    ctx.fillStyle = "#c0392b";
    rr(-22, -16, 44, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#7b241c";
    rr(-22, -4, 44, 10, 5);
    ctx.fill();
    ctx.strokeStyle = "#555";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(14, -14);
    ctx.lineTo(26, -34);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(-13, 8, 8, 0, 7);
    ctx.arc(13, 8, 8, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#888";
    ctx.beginPath();
    ctx.arc(-13, 8, 3, 0, 7);
    ctx.arc(13, 8, 3, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawSun(s: SunToken) {
    const pulse = 1 + Math.sin(s.t * 6) * 0.08;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "#ffd93b";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + s.t;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(5, -24);
      ctx.lineTo(-5, -24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffef9e";
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ================= HUD 与场景 =================
  const SEED_X = 150;
  const SEED_Y = 8;
  const SEED_W = 74;
  const SEED_H = 84;
  const SEED_GAP = 8;

  function seedRect(i: number) {
    return { x: SEED_X + i * (SEED_W + SEED_GAP), y: SEED_Y, w: SEED_W, h: SEED_H };
  }

  function draw() {
    ctx.save();
    if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#4c8a3f");
    g.addColorStop(1, "#3a7030");
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, W + 40, H + 40);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if ((r + c) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,.06)";
          ctx.fillRect(LAWN_X + c * CELL_W, LAWN_Y + r * CELL_H, CELL_W, CELL_H);
        }
      }
    ctx.strokeStyle = "rgba(0,0,0,.18)";
    ctx.lineWidth = 2;
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(LAWN_X + c * CELL_W, LAWN_Y);
      ctx.lineTo(LAWN_X + c * CELL_W, LAWN_Y + lawnH);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(LAWN_X, LAWN_Y + r * CELL_H);
      ctx.lineTo(LAWN_X + lawnW, LAWN_Y + r * CELL_H);
      ctx.stroke();
    }
    // 房子（左侧）
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(0, LAWN_Y - 10, 34, lawnH + 10);
    ctx.fillStyle = "#6d4c41";
    for (let r = 0; r < ROWS; r++) ctx.fillRect(0, LAWN_Y + r * CELL_H + 30, 34, 40);

    // 种植预览
    if (selected && PLANTS[selected] && hover.c >= 0 && !grid[hover.r][hover.c]) {
      ctx.fillStyle = "rgba(255,255,255,.3)";
      rr(LAWN_X + hover.c * CELL_W + 6, LAWN_Y + hover.r * CELL_H + 6, CELL_W - 12, CELL_H - 12, 10);
      ctx.fill();
    }

    mowers.forEach(drawMower);

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const p = grid[r][c];
        if (!p) continue;
        drawPlant(p, cellCX(c), cellCY(r) + 26);
      }
    const zs = [...zombies].sort((a, b) => a.r - b.r || a.x - b.x);
    zs.forEach(drawZombie);
    peas.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.ice ? "#aee6ff" : "#7ddf6a";
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.beginPath();
      ctx.arc(-2.5, -2.5, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    suns.forEach(drawSun);
    floats.forEach((f) => {
      const a = 1 - f.t / f.dur;
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = f.big
        ? 'bold 44px "PingFang SC","Microsoft YaHei",sans-serif'
        : 'bold 20px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = f.big ? "#ff5252" : "#fff59d";
      ctx.strokeStyle = "rgba(0,0,0,.6)";
      ctx.lineWidth = 4;
      const y = f.y - f.t * 30;
      ctx.strokeText(f.text, f.x, y);
      ctx.fillText(f.text, f.x, y);
      ctx.globalAlpha = 1;
    });

    // ---- 顶栏 ----
    ctx.fillStyle = "rgba(20,40,20,.88)";
    rr(8, 4, W - 16, 100, 12);
    ctx.fill();
    ctx.fillStyle = "#2c1f0e";
    rr(16, 12, 118, 84, 10);
    ctx.fill();
    ctx.save();
    ctx.translate(48, 54);
    ctx.fillStyle = "#ffd93b";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + gameTime * 0.8;
      ctx.save();
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(4, -19);
      ctx.lineTo(-4, -19);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#ffe14d";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(sun), 74, 62);

    // 种子卡片
    SEED_ORDER.forEach((key, i) => {
      const R = seedRect(i);
      const P = PLANTS[key];
      const cd = cooldowns[key];
      const afford = sun >= P.cost;
      const usable = cd <= 0 && afford;
      ctx.fillStyle = selected === key ? "#fff3c4" : usable ? "#f5e9c8" : "#c9bd9a";
      rr(R.x, R.y, R.w, R.h, 8);
      ctx.fill();
      ctx.strokeStyle = selected === key ? "#ff9800" : "#8a7a55";
      ctx.lineWidth = selected === key ? 4 : 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(R.x + R.w / 2, R.y + 40);
      ctx.scale(0.62, 0.62);
      drawPlant(
        { key, t: gameTime, hp: P.hp, maxHp: P.hp, shoot: 0, prod: 0, recoil: 0, flash: 0, boomed: false },
        0,
        18
      );
      ctx.restore();
      ctx.fillStyle = "#5d4a1f";
      ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(P.name, R.x + R.w / 2, R.y + 68);
      ctx.fillStyle = afford ? "#2e7d32" : "#b71c1c";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("☀" + P.cost, R.x + R.w / 2, R.y + 80 - 4);
      if (cd > 0) {
        ctx.fillStyle = "rgba(40,40,40,.62)";
        rr(R.x, R.y, R.w, R.h * Math.min(1, cd / P.cd), 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(String(Math.ceil(cd)), R.x + R.w / 2, R.y + R.h / 2 + 8);
      } else if (!afford) {
        ctx.fillStyle = "rgba(60,60,60,.35)";
        rr(R.x, R.y, R.w, R.h, 8);
        ctx.fill();
      }
    });
    // 铲子
    const shX = SEED_X + SEED_ORDER.length * (SEED_W + SEED_GAP) + 6;
    ctx.fillStyle = shovelMode ? "#fff3c4" : "#e8dcc0";
    rr(shX, SEED_Y, 64, SEED_H, 8);
    ctx.fill();
    ctx.strokeStyle = shovelMode ? "#ff9800" : "#8a7a55";
    ctx.lineWidth = shovelMode ? 4 : 2;
    ctx.stroke();
    ctx.save();
    ctx.translate(shX + 32, SEED_Y + 34);
    ctx.rotate(-0.5);
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(-3, -22, 6, 30);
    ctx.fillStyle = "#b0bec5";
    ctx.beginPath();
    ctx.ellipse(0, 16, 11, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#5d4a1f";
    ctx.font = 'bold 13px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("铲子", shX + 32, SEED_Y + 68);

    // 波次进度
    const pbX = shX + 78;
    const pbW = W - pbX - 90;
    ctx.fillStyle = "#2c1f0e";
    rr(pbX, 22, pbW, 26, 13);
    ctx.fill();
    const totalForWave = waveComp(Math.min(Math.max(wave, 1), 10)).length;
    const prog =
      wave === 0
        ? 0
        : (wave - 1 + (spawnQueue.length === 0 && zombies.length === 0 ? 1 : 1 - spawnQueue.length / Math.max(1, totalForWave))) /
          TOTAL_WAVES;
    ctx.fillStyle = "#8fd14f";
    rr(pbX + 3, 25, Math.max(0, (pbW - 6) * Math.min(1, prog)), 20, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = 'bold 15px "PingFang SC","Microsoft YaHei",sans-serif';
    ctx.textAlign = "left";
    ctx.fillText(wave === 0 ? "准备…" : `第 ${wave} / ${TOTAL_WAVES} 波`, pbX + 10, 68);
    // 暂停按钮
    ctx.fillStyle = "rgba(255,255,255,.16)";
    rr(W - 66, 22, 48, 48, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state === "paused" ? "▶" : "⏸", W - 42, 54);

    ctx.restore();
  }

  // ================= 输入 =================
  function canvasPos(e: MouseEvent | TouchEvent) {
    const rect = cv.getBoundingClientRect();
    const t = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as MouseEvent);
    const cx = t.clientX;
    const cy = t.clientY;
    return { x: ((cx - rect.left) * W) / rect.width, y: ((cy - rect.top) * H) / rect.height };
  }

  function togglePause() {
    if (state === "playing") state = "paused";
    else if (state === "paused") state = "playing";
  }

  function onDown(e: MouseEvent | TouchEvent) {
    if (state !== "playing") return;
    e.preventDefault();
    const { x, y } = canvasPos(e);
    for (let i = suns.length - 1; i >= 0; i--) {
      if (Math.hypot(suns[i].x - x, suns[i].y - y) < 34) {
        sun += suns[i].value;
        suns.splice(i, 1);
        floats.push({ text: "+25", x, y: y - 10, t: 0, dur: 0.7 });
        return;
      }
    }
    if (x > W - 66 && x < W - 18 && y > 22 && y < 70) {
      togglePause();
      return;
    }
    for (let i = 0; i < SEED_ORDER.length; i++) {
      const R = seedRect(i);
      const key = SEED_ORDER[i];
      if (x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h) {
        if (cooldowns[key] <= 0 && sun >= PLANTS[key].cost) {
          selected = selected === key ? null : key;
          shovelMode = false;
        }
        return;
      }
    }
    const shX = SEED_X + SEED_ORDER.length * (SEED_W + SEED_GAP) + 6;
    if (x >= shX && x <= shX + 64 && y >= SEED_Y && y <= SEED_Y + SEED_H) {
      shovelMode = !shovelMode;
      selected = null;
      return;
    }
    if (x >= LAWN_X && x < LAWN_X + lawnW && y >= LAWN_Y && y < LAWN_Y + lawnH) {
      const c = Math.floor((x - LAWN_X) / CELL_W);
      const r = Math.floor((y - LAWN_Y) / CELL_H);
      if (shovelMode) {
        if (grid[r][c]) {
          grid[r][c] = null;
          shovelMode = false;
        }
        return;
      }
      if (selected && PLANTS[selected]) {
        const key = selected;
        const P = PLANTS[key];
        if (!grid[r][c] && sun >= P.cost && cooldowns[key] <= 0) {
          sun -= P.cost;
          cooldowns[key] = P.cd;
          grid[r][c] = {
            key,
            hp: P.hp,
            maxHp: P.hp,
            t: 0,
            shoot: 0.6,
            prod: 5 + Math.random() * 2,
            recoil: 0,
            flash: 0,
            boomed: false,
          };
          selected = null;
        }
        return;
      }
    }
    selected = null;
    shovelMode = false;
  }

  function onMove(e: MouseEvent) {
    const { x, y } = canvasPos(e);
    if (x >= LAWN_X && x < LAWN_X + lawnW && y >= LAWN_Y && y < LAWN_Y + lawnH) {
      hover.c = Math.floor((x - LAWN_X) / CELL_W);
      hover.r = Math.floor((y - LAWN_Y) / CELL_H);
    } else {
      hover.c = -1;
      hover.r = -1;
    }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === " " || e.key === "p" || e.key === "P") togglePause();
    if (e.key === "Escape") {
      selected = null;
      shovelMode = false;
    }
  }

  const downHandler = (e: Event) => onDown(e as MouseEvent | TouchEvent);
  const moveHandler = (e: Event) => onMove(e as MouseEvent);
  const keyHandler = (e: Event) => onKey(e as KeyboardEvent);

  cv.addEventListener("mousedown", downHandler);
  cv.addEventListener("mousemove", moveHandler);
  cv.addEventListener("touchstart", downHandler, { passive: false });
  document.addEventListener("keydown", keyHandler);

  // ================= 主循环 =================
  function loop(now: number) {
    if (destroyed) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === "playing") update(dt);
    if (state !== "menu") draw();
    raf = requestAnimationFrame(loop);
  }

  draw();
  last = performance.now();
  raf = requestAnimationFrame(loop);

  return {
    start() {
      resetGame();
      state = "playing";
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      cv.removeEventListener("mousedown", downHandler);
      cv.removeEventListener("mousemove", moveHandler);
      cv.removeEventListener("touchstart", downHandler);
      document.removeEventListener("keydown", keyHandler);
    },
  };
}
