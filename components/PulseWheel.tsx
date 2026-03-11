"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FEELING_COLORS,
  FEELINGS_MAP,
  FEELING_EMOJIS,
  type PrimaryFeeling,
} from "@/lib/constants/feelings";

type PulseWheelProps = {
  onSelect: (primary: PrimaryFeeling, secondary?: string) => void;
  selectedPrimary?: PrimaryFeeling | null;
  selectedSecondary?: string | null;
};

const PRIMARY_ORDER: PrimaryFeeling[] = ["Happy", "Sad", "Angry", "Afraid"];

export function PulseWheel({
  onSelect,
  selectedPrimary,
  selectedSecondary,
}: PulseWheelProps) {
  const [hoveredPrimary, setHoveredPrimary] = useState<PrimaryFeeling | null>(
    null
  );

  const primary = selectedPrimary ?? hoveredPrimary;
  const secondaries = primary ? FEELINGS_MAP[primary] : [];

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular wheel: 4 quadrants */}
      <div className="relative w-64 h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {PRIMARY_ORDER.map((feeling, i) => {
            const startAngle = (i * 90 - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * 90 - 90) * (Math.PI / 180);
            const largeArc = 1;
            const x1 = 100 + 90 * Math.cos(startAngle);
            const y1 = 100 + 90 * Math.sin(startAngle);
            const x2 = 100 + 90 * Math.cos(endAngle);
            const y2 = 100 + 90 * Math.sin(endAngle);
            const pathD = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const midAngle = (startAngle + endAngle) / 2;
            const labelRadius = 55;
            const labelX = 100 + labelRadius * Math.cos(midAngle);
            const labelY = 100 + labelRadius * Math.sin(midAngle);

            const isSelected = selectedPrimary === feeling;
            const isHovered = hoveredPrimary === feeling;

            return (
              <g key={feeling}>
                <motion.path
                  d={pathD}
                  fill={FEELING_COLORS[feeling]}
                  stroke={isSelected || isHovered ? "#2d2a26" : "transparent"}
                  strokeWidth={isSelected ? 3 : 2}
                  className="cursor-pointer transition-opacity"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(feeling)}
                  onMouseEnter={() => setHoveredPrimary(feeling)}
                  onMouseLeave={() => setHoveredPrimary(null)}
                  style={{ transformOrigin: "100px 100px" }}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pointer-events-none select-none"
                  style={{
                    fill: feeling === "Happy" ? "#2d2a26" : "#fff",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {feeling}
                </text>
              </g>
            );
          })}
          {/* Center circle */}
          <circle
            cx="100"
            cy="100"
            r="35"
            fill="#faf9f7"
            stroke="#e5e2de"
            strokeWidth="2"
          />
          <text
            x="100"
            y="100"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-sm font-medium fill-[#6b6560]"
          >
            {primary ? "Select" : "How do you feel?"}
          </text>
        </svg>
      </div>

      {/* Primary labels around the wheel */}
      <div className="flex justify-center gap-4 flex-wrap">
        {PRIMARY_ORDER.map((feeling) => (
          <span
            key={feeling}
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              selectedPrimary === feeling
                ? "ring-2 ring-[#2d2a26] ring-offset-2"
                : ""
            }`}
            style={{
              backgroundColor: FEELING_COLORS[feeling],
              color: feeling === "Happy" ? "#2d2a26" : "#fff",
            }}
          >
            {feeling}
          </span>
        ))}
      </div>

      {/* Secondary feeling picker */}
      <AnimatePresence mode="wait">
        {primary && (
          <motion.div
            key={primary}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="w-full"
          >
            <p className="text-sm font-medium text-[#6b6560] mb-2">
              More specifically
            </p>
            <div className="flex flex-wrap gap-2">
              {secondaries.map((secondary) => {
                const isSelected = selectedSecondary === secondary;
                return (
                  <button
                    key={secondary}
                    type="button"
                    onClick={() =>
                      onSelect(primary, isSelected ? undefined : secondary)
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "ring-2 ring-[#2d2a26] ring-offset-2"
                        : "hover:opacity-90"
                    }`}
                    style={{
                      backgroundColor: FEELING_COLORS[primary],
                      color: primary === "Happy" ? "#2d2a26" : "#fff",
                    }}
                  >
                    <span>{FEELING_EMOJIS[secondary] ?? ""}</span>
                    {secondary}
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
