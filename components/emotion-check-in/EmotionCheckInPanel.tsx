"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FEELING_COLORS,
  FEELING_GRADIENT_END,
  FEELINGS_MAP,
  FEELING_EMOJIS,
  type PrimaryFeeling,
} from "@/lib/constants/feelings";

const PRIMARY_ORDER: PrimaryFeeling[] = ["Happy", "Sad", "Angry", "Fear"];

/** SVG user-space offset for hub toward selected quadrant */
const HUB_NUDGE: Record<PrimaryFeeling, { x: number; y: number }> = {
  Happy: { x: 8, y: -8 },
  Sad: { x: 8, y: 8 },
  Angry: { x: -8, y: 8 },
  Fear: { x: -8, y: -8 },
};

type EmotionCheckInPanelProps = {
  onSelect: (primary: PrimaryFeeling, secondary?: string) => void;
  selectedPrimary?: PrimaryFeeling | null;
  selectedSecondary?: string | null;
};

export function EmotionCheckInPanel({
  onSelect,
  selectedPrimary,
  selectedSecondary,
}: EmotionCheckInPanelProps) {
  const [hoveredPrimary, setHoveredPrimary] = useState<PrimaryFeeling | null>(
    null
  );

  const activePrimary = selectedPrimary ?? hoveredPrimary;
  const secondaries = activePrimary ? FEELINGS_MAP[activePrimary] : [];

  return (
    <div className="font-inter w-full max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-sm">
          <defs>
            {PRIMARY_ORDER.map((feeling) => {
              const a = FEELING_COLORS[feeling];
              const b = FEELING_GRADIENT_END[feeling];
              return (
                <linearGradient
                  key={feeling}
                  id={`grad-${feeling}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={a} />
                  <stop offset="100%" stopColor={b} />
                </linearGradient>
              );
            })}
          </defs>

          {PRIMARY_ORDER.map((feeling, i) => {
            const startAngle = (i * 90 - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * 90 - 90) * (Math.PI / 180);
            const x1 = 100 + 90 * Math.cos(startAngle);
            const y1 = 100 + 90 * Math.sin(startAngle);
            const x2 = 100 + 90 * Math.cos(endAngle);
            const y2 = 100 + 90 * Math.sin(endAngle);
            const largeArc = 0;
            const pathD = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = 52;
            const labelX = 100 + labelRadius * Math.cos(midAngle);
            const labelY = 100 + labelRadius * Math.sin(midAngle);

            const isSelected = selectedPrimary === feeling;
            const isHovered = hoveredPrimary === feeling;
            const base = FEELING_COLORS[feeling];
            const bloom =
              isSelected || isHovered
                ? `drop-shadow(0 0 14px ${base}) drop-shadow(0 0 28px ${base}88)`
                : undefined;

            return (
              <g key={feeling}>
                <motion.path
                  d={pathD}
                  fill={`url(#grad-${feeling})`}
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth={1}
                  className="cursor-pointer"
                  style={{ filter: bloom }}
                  initial={false}
                  animate={{
                    scale: isSelected ? 1.02 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  onClick={() => onSelect(feeling)}
                  onMouseEnter={() => setHoveredPrimary(feeling)}
                  onMouseLeave={() => setHoveredPrimary(null)}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fill: feeling === "Happy" ? "#3d3420" : "#fff",
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-inter), system-ui, sans-serif",
                    textShadow:
                      feeling === "Happy"
                        ? "0 1px 2px rgba(255,255,255,0.5)"
                        : "0 1px 3px rgba(0,0,0,0.2)",
                  }}
                >
                  {feeling}
                </text>
              </g>
            );
          })}

          <motion.g
            animate={
              selectedPrimary
                ? {
                    x: HUB_NUDGE[selectedPrimary].x,
                    y: HUB_NUDGE[selectedPrimary].y,
                  }
                : { x: 0, y: 0 }
            }
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
          >
            <circle
              cx="100"
              cy="100"
              r="46"
              fill="#ffffff"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth="3"
              style={{
                filter:
                  "drop-shadow(0 0 12px rgba(255,255,255,0.9)) drop-shadow(0 6px 20px rgba(0,0,0,0.08))",
              }}
            />
            <text
              x="100"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none"
              style={{
                fill: "#4a4540",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "var(--font-inter), system-ui, sans-serif",
              }}
            >
              <tspan x="100" dy="-5">
                My Today
              </tspan>
              <tspan x="100" dy="14">
                is...
              </tspan>
            </text>
          </motion.g>
        </svg>
      </motion.div>

      <AnimatePresence mode="wait">
        {selectedPrimary && (
          <motion.div
            key="pill"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-6 flex justify-center"
          >
            <div
              className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium font-inter shadow-emotionBloom"
              style={{
                backgroundColor: FEELING_COLORS[selectedPrimary],
                color: selectedPrimary === "Happy" ? "#3d3420" : "#fff",
                boxShadow: `0 8px 32px -4px ${FEELING_COLORS[selectedPrimary]}66`,
              }}
            >
              You selected {selectedPrimary}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activePrimary && (
          <motion.div
            key={activePrimary}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="mt-8 w-full"
          >
            <h3 className="font-inter text-sm font-medium text-[#5c564e] mb-3 tracking-wide">
              More specifically
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-2.5 max-h-[none] overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {secondaries.map((label) => {
                const isSelected = selectedSecondary === label;
                const isGratefulGold =
                  isSelected && label === "Grateful" && activePrimary === "Happy";
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      onSelect(
                        activePrimary,
                        isSelected ? undefined : label
                      )
                    }
                    className={[
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium font-inter transition-all",
                      isGratefulGold
                        ? "border-amber-500/80 bg-amber-50/90 text-[#3d3420] ring-2 ring-amber-400/40"
                        : isSelected
                          ? "border-[#3d3420]/25 bg-white/90 text-[#2d2a26] shadow-sm"
                          : "border-stone-200/80 bg-white/70 text-[#4a4540] hover:border-stone-300 hover:bg-white",
                    ].join(" ")}
                  >
                    <span className="text-base leading-none">
                      {FEELING_EMOJIS[label] ?? "✨"}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
