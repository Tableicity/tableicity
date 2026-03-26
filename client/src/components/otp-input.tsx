import { useState, useRef, useEffect, useCallback } from "react";

interface OtpInputProps {
  onComplete: (code: string) => void;
  disabled?: boolean;
  error?: string;
  reset?: number;
}

export function OtpInput({ onComplete, disabled = false, error, reset }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (reset !== undefined) {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }, [reset]);

  const handleComplete = useCallback((newDigits: string[]) => {
    const code = newDigits.join("");
    if (code.length === 6) {
      onComplete(code);
    }
  }, [onComplete]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      handleComplete(newDigits);
    } else if (newDigits.every(d => d !== "")) {
      handleComplete(newDigits);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Backspace") {
      if (digits[index] === "" && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 0) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || "";
    }
    setDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      handleComplete(newDigits);
    }
  };

  const boxBase = {
    width: "48px",
    height: "56px",
    textAlign: "center" as const,
    fontSize: "1.5rem",
    fontWeight: 700,
    background: "rgba(255,255,255,0.06)",
    border: `1.5px solid ${error ? "#FC8181" : "rgba(99,179,237,0.3)"}`,
    borderRadius: "10px",
    color: "#E2E8F0",
    outline: "none",
    transition: "border-color 200ms, box-shadow 200ms",
    caretColor: "#63B3ED",
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? "not-allowed" : "text",
  };

  return (
    <div data-testid="otp-input-container">
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => {
              e.target.style.borderColor = "#63B3ED";
              e.target.style.boxShadow = "0 0 0 2px rgba(99,179,237,0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? "#FC8181" : "rgba(99,179,237,0.3)";
              e.target.style.boxShadow = "none";
            }}
            disabled={disabled}
            style={boxBase}
            data-testid={`otp-digit-${index}`}
          />
        ))}
      </div>
      {error && (
        <p style={{
          color: "#FC8181",
          fontSize: "0.8rem",
          textAlign: "center",
          marginTop: "8px",
        }} data-testid="otp-error">
          {error}
        </p>
      )}
    </div>
  );
}
