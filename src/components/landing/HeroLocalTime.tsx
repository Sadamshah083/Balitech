"use client";

import { useEffect, useState } from "react";

export default function HeroLocalTime() {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Karachi",
          hour12: false,
        })
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p
      className="hero-local-time text-3xl font-bold"
      aria-label={`Rawalpindi local time ${time}`}
    >
      <span className="hero-local-time__city">RAWALPINDI</span>
      <span className="hero-local-time__sep" aria-hidden>
        -
      </span>
      <span className="hero-local-time__clock">{time}</span>
    </p>
  );
}
