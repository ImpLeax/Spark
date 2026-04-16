import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { useState } from "react";

import { useGoogleLogin } from "@react-oauth/google";

import { useNavigate } from "react-router-dom";

import api, { setAccessToken } from "@/services/axios";

export function LoginForm({ className,loadData ,...props }) {
  

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const  [error409,setError429] = useState(false);
  const navigate = useNavigate();

  const handle_login = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post('user/login/', {
        username: email,
        password: password
      });

      setAccessToken(response.data.access);
      navigate("/main");
      try {
        const response = await api.get("user/profile/");
        loadData(response.data);
      } catch (error) {
        console.error("Error during loading profile", error);
      }


    } catch (error) {
      console.error("Error:", error.response?.data);
      if(error.response?.status === 429){
        setError429(true);
        window.setTimeout(()=>{
          setError429(false);
        },60*1000);
      }
    }
  };

  const login = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      const access_token = credentialResponse.access_token;

      const response = await api.post("user/auth/google/", { "access_token": access_token });

      if(response.data.status === "login"){
        setAccessToken(response.data.tokens.access);
        navigate("/main");
      }
      else if(response.data.status === "needs_registration"){
        navigate("/signup", { state: { googleData: response.data.google_data } });
      }

    },
    onError: (error) => {
      console.error("Google login error:", error);
    }
  });


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="max-h-95 flex flex-col p-6">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <form onSubmit={handle_login}>
            <FieldGroup>
              <Field className="">
                <FieldLabel htmlFor="email" value={email} >Email</FieldLabel>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  value={email} 
                  onChange={(e) => {
                    setEmail(e.target.value);
                    console.log(e.target.value);}
                  }
                />
              </Field>
              <Field className="py-1">
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  value={password} 
                  onChange={(e) => {
                    setPassword(e.target.value);
                    console.log(e.target.value);
                  }}
                />
              </Field>
              <FieldLabel className={`text-red-500 ${!error409 && 'hidden'}`}>Too many attempts, try again in a minute</FieldLabel>
              <Field className="py-1">
                <Button type="submit">Login</Button>
                <Button variant="outline" type="button" onClick={() => login()}>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link to="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}