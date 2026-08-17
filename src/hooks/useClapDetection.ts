import { useCallback, useEffect, useRef, useState } from "react";

type ClapDetectionOptions = {
  onClap?: (clapCount: number) => void;
};

export function useClapDetection({
  onClap,
}: ClapDetectionOptions = {}) {
  const [listening, setListening] =
    useState(false);

  const [clapCount, setClapCount] =
    useState(0);

  const [error, setError] =
    useState("");

  const audioContextRef =
    useRef<AudioContext | null>(null);

  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const streamRef =
    useRef<MediaStream | null>(null);

  const animationRef =
    useRef<number | null>(null);

  const lastClapTimeRef =
    useRef(0);

  const clapWindowRef =
    useRef<number | null>(null);

  const currentCountRef =
    useRef(0);

  const startListening =
    useCallback(async () => {
      try {
        setError("");

        if (listening) return;

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        streamRef.current = stream;

        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextClass) {
          setError(
            "Web Audio API is not supported in this browser."
          );
          return;
        }

        const audioContext =
          new AudioContextClass();

        audioContextRef.current =
          audioContext;

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant =
          0.15;

        analyserRef.current =
          analyser;

        const source =
          audioContext.createMediaStreamSource(
            stream
          );

        source.connect(analyser);

        setListening(true);

        const data =
          new Uint8Array(
            analyser.fftSize
          );

        const detectClap =
          () => {
            if (
              !analyserRef.current
            ) {
              return;
            }

            analyserRef.current.getByteTimeDomainData(
              data
            );

            let sum = 0;

            for (
              let i = 0;
              i < data.length;
              i++
            ) {
              const value =
                (data[i] - 128) /
                128;

              sum +=
                value * value;
            }

            const rms =
              Math.sqrt(
                sum / data.length
              );

            const now =
              performance.now();

            /*
             * Clap threshold.
             *
             * Increase this if normal
             * talking triggers nodes.
             */
            const clapThreshold =
              0.32;

            /*
             * Prevent one clap from
             * triggering multiple times.
             */
            const cooldown =
              220;

            if (
              rms >
                clapThreshold &&
              now -
                lastClapTimeRef.current >
                cooldown
            ) {
              lastClapTimeRef.current =
                now;

              currentCountRef.current +=
                1;

              const count =
                currentCountRef.current;

              setClapCount(count);

              onClap?.(count);

              /*
               * Reset the count after
               * 1.2 seconds.
               *
               * Example:
               *
               * clap
               * clap
               *
               * within 1.2 sec = 2 claps
               */
              if (
                clapWindowRef.current
              ) {
                window.clearTimeout(
                  clapWindowRef.current
                );
              }

              clapWindowRef.current =
                window.setTimeout(() => {
                  currentCountRef.current =
                    0;

                  setClapCount(0);
                }, 1200);
            }

            animationRef.current =
              requestAnimationFrame(
                detectClap
              );
          };

        detectClap();
      } catch (err) {
        console.error(
          "Microphone error:",
          err
        );

        setError(
          "Microphone permission is required for clap control."
        );

        setListening(false);
      }
    }, [listening, onClap]);

  const stopListening =
    useCallback(() => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }

      if (
        clapWindowRef.current !==
        null
      ) {
        window.clearTimeout(
          clapWindowRef.current
        );

        clapWindowRef.current =
          null;
      }

      streamRef.current?.getTracks().forEach(
        (track) => {
          track.stop();
        }
      );

      streamRef.current = null;

      if (
        audioContextRef.current
      ) {
        void audioContextRef.current.close();

        audioContextRef.current =
          null;
      }

      analyserRef.current =
        null;

      currentCountRef.current =
        0;

      setClapCount(0);
      setListening(false);
    }, []);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    listening,
    clapCount,
    error,
    startListening,
    stopListening,
  };
}