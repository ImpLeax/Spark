import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/services/axios";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const ActivationPage = () => {
  const { uid, token } = useParams();

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Activating your account...");

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const activateAccount = async () => {
      try {
        const response = await api.get(`user/activate/${uid}/${token}/`);

        setStatus("success");
        setMessage(response.data.message || "Your account has been successfully activated!");
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
          "Activation link is invalid or has expired. Please try registering again."
        );
      }
    };

    if (uid && token) {
      activateAccount();
    } else {
      setStatus("error");
      setMessage("Invalid activation link format.");
    }
  }, [uid, token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="bg-card border border-border shadow-2xl rounded-[2.5rem] p-8 md:p-12 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-500">

        <div className="flex justify-center mb-6">
          {status === "loading" && (
            <div className="p-4 bg-primary/10 rounded-full text-primary animate-pulse">
              <Loader2 className="w-12 h-12 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="p-4 bg-green-500/10 rounded-full text-green-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          )}
          {status === "error" && (
            <div className="p-4 bg-destructive/10 rounded-full text-destructive">
              <XCircle className="w-12 h-12" />
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-3">
          {status === "loading" && "Activating Account"}
          {status === "success" && "Account Activated!"}
          {status === "error" && "Activation Failed"}
        </h1>

        <p className="text-muted-foreground text-lg mb-8">
          {message}
        </p>

        {status === "loading" ? (
          <p className="text-sm text-muted-foreground/60 animate-pulse">
            Please wait while we verify your details...
          </p>
        ) : (
          <Button asChild className="w-full h-12 text-lg rounded-xl shadow-lg">
            <Link to="/">
              {status === "success" ? "Go to Login" : "Back to Home"}
            </Link>
          </Button>
        )}

      </div>
    </div>
  );
};

export default ActivationPage;