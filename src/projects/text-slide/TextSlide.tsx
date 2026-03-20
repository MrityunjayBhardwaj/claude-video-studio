import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from "remotion";
import { VideoScript } from "../../types";

interface TextSlideProps {
  script: VideoScript;
}

const SlideContent: React.FC<{
  text: string;
  subtitle?: string;
  background: string;
  textColor: string;
  fontSize: number;
  duration: number;
}> = ({ text, subtitle, background, textColor, fontSize, duration }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [duration - 20, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(fadeIn, fadeOut);

  const slideUp = interpolate(frame, [0, 25], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${slideUp}px)`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 700,
            lineHeight: 1.3,
            margin: 0,
            textShadow: "0 2px 20px rgba(0,0,0,0.3)",
          }}
        >
          {text}
        </p>
        {subtitle && (
          <p
            style={{
              color: textColor,
              fontSize: `${fontSize * 0.5}px`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 400,
              opacity: 0.8,
              marginTop: "24px",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const TextSlide: React.FC<TextSlideProps> = ({ script }) => {
  let frameOffset = 0;

  return (
    <AbsoluteFill>
      {script.slides.map((slide) => {
        const from = frameOffset;
        frameOffset += slide.duration;
        return (
          <Sequence key={slide.id} from={from} durationInFrames={slide.duration}>
            <SlideContent
              text={slide.text}
              subtitle={slide.subtitle}
              background={slide.background}
              textColor={slide.textColor}
              fontSize={slide.fontSize}
              duration={slide.duration}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
