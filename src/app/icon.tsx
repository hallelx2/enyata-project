import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Simplified SVG payload tailored specifically for the Satori image generator engine */}
        <circle cx="50" cy="50" r="45" stroke="#0052ff" strokeWidth="10" />
        <path
          d="M50 20 L75 30 V50 C75 70 50 85 50 85 C50 85 25 70 25 50 V30 L50 20 Z"
          fill="#40dbdc"
        />
        <path
          d="M46 40 H54 V46 H60 V54 H54 V60 H46 V54 H40 V46 H46 V40 Z"
          fill="#ffffff"
        />
      </svg>
    </div>,
    {
      ...size,
    },
  );
}
