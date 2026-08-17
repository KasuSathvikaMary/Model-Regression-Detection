import { useCallback, useEffect, useRef, useState } from "react";

type ClapDetectorOptions = {
  onClapCount?: (count: number) => void;
};

export function useClapDetector({
  onClapCount,
}: ClapDetectorOptions = {}) {
  const [listening, setListening] = useState(false);
  const [clapCount, setClapCount] = useState(0);

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

  const countResetTimerRef =
    useRef<number | null>(null);

  const currentCountRef =
    useRef(0);

  const startListening = useCallback(
    async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            }
          );

        const AudioContextClass =
          window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;

        if (!AudioContextClass) {
          throw new Error(
            "Web Audio API is not supported."
          );
        }

        const audioContext =
          new AudioContextClass();

        const analyser =
          audioContext.createAnalyser();

        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.15;

        const microphone =
          audioContext.createMediaStreamSource(
            stream
          );

        microphone.connect(analyser);

        audioContextRef.current =
          audioContext;

        analyserRef.current =
          analyser;

        streamRef.current =
          stream;

        setListening(true);

        const data =
          new Uint8Array(
            analyser.fftSize
          );

        const detect = () => {
          if (!analyserRef.current) {
            return;
          }

          analyserRef.current.getByteTimeDomainData(
            data
          );

          let sum = 0;

          for (let i = 0; i < data.length; i++) {
            const normalized =
              (data[i] - 128) / 128;

            sum +=
              normalized *
              normalized;
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
           * You can lower this if your
           * claps are not being detected.
           */
          const clapThreshold =
            0.18;

          /*
           * Prevent one clap from being
           * detected multiple times.
           */
          const minimumGap =
            180;

          if (
            rms > clapThreshold &&
            now -
              lastClapTimeRef.current >
              minimumGap
          ) {
            lastClapTimeRef.current =
              now;

            currentCountRef.current += 1;

            const count =
              currentCountRef.current;

            setClapCount(count);

            onClapCount?.(count);

            /*
             * Wait for another clap.
             *
             * If no additional clap arrives,
             * reset the sequence.
             */
            if (
              countResetTimerRef.current
            ) {
              window.clearTimeout(
                countResetTimerRef.current
              );
            }

            countResetTimerRef.current =
              window.setTimeout(() => {
                currentCountRef.current = 0;
                setClapCount(0);
              }, 1200);
          }

          animationRef.current =
            requestAnimationFrame(
              detect
            );
        };

        detect();
      } catch (error) {
        console.error(
          "Unable to access microphone:",
          error
        );

        setListening(false);
      }
    },
    [onClapCount]
  );

  const stopListening =
    useCallback(() => {
      if (animationRef.current) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current =
          null;
      }

      if (
        countResetTimerRef.current
      ) {
        window.clearTimeout(
          countResetTimerRef.current
        );

        countResetTimerRef.current =
          null;
      }

      streamRef.current?.getTracks().forEach(
        (track) => track.stop()
      );

      streamRef.current = null;

      if (audioContextRef.current) {
        audioContextRef.current.close();

        audioContextRef.current =
          null;
      }

      analyserRef.current =
        null;

      currentCountRef.current = 0;

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
    startListening,
    stopListening,
  };
}