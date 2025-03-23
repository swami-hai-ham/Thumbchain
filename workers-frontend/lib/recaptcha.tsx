import axios from "axios";
import { createContext, useContext, useRef, ReactNode } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export const recaptcha_func = async (
  recaptchaRef: React.RefObject<ReCAPTCHA>
): Promise<boolean> => {
  console.log(recaptchaRef);
  const retoken = await recaptchaRef.current?.executeAsync();
  recaptchaRef.current?.reset();

  if (!retoken) {
    console.log("Captcha validation failed.");
    return false; // Indicate failure
  }

  try {
    const response = await axios.post("/api/verify-recaptcha", {
      token: retoken,
    });
    if (response.status === 200) {
      console.log("Captcha verified");
      return true; // Indicate success
    } else {
      console.log("Captcha verification failed. Please try again.");
      return false; // Indicate failure
    }
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return false; // Indicate failure
  }
};

// Define the type for the context value
interface ReCAPTCHAContextType {
  recaptchaRef: React.RefObject<ReCAPTCHA>;
}

// Create the context with a default value of undefined
const ReCAPTCHAContext = createContext<ReCAPTCHAContextType | undefined>(
  undefined
);

// Provider component
export function ReCAPTCHAProvider({ children }: { children: ReactNode }) {
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  return (
    <ReCAPTCHAContext.Provider value={{ recaptchaRef }}>
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_KEY!}
        size="invisible"
      />
      {children}
    </ReCAPTCHAContext.Provider>
  );
}

// Hook to use the context
export function useReCAPTCHA(): ReCAPTCHAContextType {
  const context = useContext(ReCAPTCHAContext);
  if (!context) {
    throw new Error("useReCAPTCHA must be used within a ReCAPTCHAProvider");
  }
  return context;
}
