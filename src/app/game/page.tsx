"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createGame, type EndInfo, type GameHandle } from "@/game/engine";

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [screen, setScreen] = useState<"menu" | "playing" | "end">("menu");
  const [endInfo, setEndInfo] = useState<EndInfo | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const game = createGame(canvasRef.current, {
      onEnd: (info) => {
        setEndInfo(info);
        setScreen("end");
      },
    });
    gameRef.current = game;
    return () => game.destroy();
  }, []);

  const startGame = () => {
    setScreen("playing");
    gameRef.current?.start();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 select-none">
      <div className="relative w-[1000px] max-w-full">
        <Link
          href="/"
          className="btn-pill absolute bottom-2.5 right-3 z-[6] px-[18px] py-[7px] text-sm text-accent-deep"
        >
          🏠 首页
        </Link>
        <canvas
          ref={canvasRef}
          width={1000}
          height={640}
          className="block h-auto w-full cursor-pointer rounded-xl bg-[#3f7a34] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        />

        <AnimatePresence>
          {screen === "menu" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[18px] rounded-xl border border-white/20 bg-[rgba(16,48,28,0.72)] p-6 text-center text-white backdrop-blur-[14px] backdrop-saturate-[1.3]"
            >
              <h1
                className="text-[56px] tracking-[6px] text-[#ffe14d]"
                style={{ textShadow: "0 4px 0 #7a4d00, 0 8px 24px rgba(0,0,0,.6)" }}
              >
                🌻 后院保卫战 🧟
              </h1>
              <p className="max-w-[640px] text-[17px] leading-[1.9] text-[#e8f5e9]">
                点上方的植物卡片，再点草地种下。
                <br />
                向日葵生产阳光，豌豆射手攻击僵尸，坚果挡路，樱桃炸弹清场！
                <br />
                点掉落的太阳收集阳光。别让僵尸走到最左边——小推车是最后防线！
                <br />
                撑过 <b className="text-[#ffe14d]">10 波</b> 进攻就赢了。
              </p>
              <button
                onClick={startGame}
                className="cursor-pointer rounded-full border-0 bg-gradient-to-b from-[#8fd14f] to-[#5aa32c] px-[54px] py-[14px] text-[22px] font-bold tracking-[4px] text-white shadow-[0_6px_0_#3c7a1c,0_10px_24px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_2px_0_#3c7a1c]"
              >
                开始游戏
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {screen === "end" && endInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[18px] rounded-xl border border-white/20 bg-[rgba(16,48,28,0.72)] p-6 text-center text-white backdrop-blur-[14px] backdrop-saturate-[1.3]"
            >
              <h1
                className="text-[56px] tracking-[6px] text-[#ffe14d]"
                style={{ textShadow: "0 4px 0 #7a4d00, 0 8px 24px rgba(0,0,0,.6)" }}
              >
                {endInfo.title}
              </h1>
              <p className="max-w-[640px] text-[17px] leading-[1.9] text-[#e8f5e9]">{endInfo.desc}</p>
              <button
                onClick={startGame}
                className="cursor-pointer rounded-full border-0 bg-gradient-to-b from-[#8fd14f] to-[#5aa32c] px-[54px] py-[14px] text-[22px] font-bold tracking-[4px] text-white shadow-[0_6px_0_#3c7a1c,0_10px_24px_rgba(0,0,0,0.4)] transition-all hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-[0_2px_0_#3c7a1c]"
              >
                再来一局
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
