import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from '@/components/index';
import api from '@/services/axios'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState } from "react";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function SignupForm({
  className,
  ...props
}) {

  const [firstName,setFirstName] = useState("");
  const [lastName,setLastName] = useState("");
  const [username,setUsername] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [confirmPassword,setConfirmPassword] = useState("");
  const [dateOfBirth,setDateOfBirth] = useState("");
  const [gender, setGender] = useState("male");
  const [lookingFor, setLookingFor] = useState("women");
  const [intention, setIntention] = useState("serious");  
  const [error409,setError429] = useState(false);

  const intentions = getIntentions();
  const interests = getInterests();
  const getIntentions = () =>{
    try{
      const response = api.get("user/genders/");
      return response.data;
    }catch (error) {
      console.error("Error:", error.response?.data);
    }
  }


  const register = async () => {
    try{
    const response = await api.post("user/register/", {
      
    });
    }catch (error) {
      console.error("Error:", error.response?.data);
      if(error.response?.status === 429){
        setError429(true);
        var timeout = window.setTimeout(()=>{
          setError429(false);
        },60*1000)
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-66px)] flex items-center justify-center p-4 py-8">
      <form className={cn("flex flex-col gap-6 shadow-md border border-border p-8 rounded-2xl bg-card w-full max-w-md mx-auto my-auto", className)} {...props}>
        <FieldGroup className="align-middle">
          
          <div className="flex flex-col items-center gap-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Fill in the form below to create your account
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
              required
              className="bg-background" 
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              required
              className="bg-background" 
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe123"
              required
              className="bg-background" 
            />
          </Field>

          <Field>
            <FieldLabel>Gender</FieldLabel> 
            <RadioGroup value={gender} onValueChange={setGender} className="flex flex-row gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male" className="font-normal cursor-pointer">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female" className="font-normal cursor-pointer">Female</Label>
              </div>
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Looking For</FieldLabel> 
            <RadioGroup value={lookingFor} onValueChange={setLookingFor} className="flex flex-row gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="women" id="look-women" />
                <Label htmlFor="look-women" className="font-normal cursor-pointer">Women</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="men" id="look-men" />
                <Label htmlFor="look-men" className="font-normal cursor-pointer">Men</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone" id="look-everyone" />
                <Label htmlFor="look-everyone" className="font-normal cursor-pointer">Everyone</Label>
              </div>
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Intention</FieldLabel> 
            <RadioGroup value={intention} onValueChange={setIntention} className="flex flex-row gap-6 mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="serious" id="intent-serious" />
                <Label htmlFor="intent-serious" className="font-normal cursor-pointer">Serious</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="intent-casual" />
                <Label htmlFor="intent-casual" className="font-normal cursor-pointer">Casual</Label>
              </div>
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Date of Birth</FieldLabel>
            <DatePicker />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              required
              className="bg-background" 
            />
            <FieldDescription>
              We'll use this to contact you. We will not share your email with anyone else.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" required className="bg-background" value={password} onChange={(e) => setPassword(e.target.value)} />
            <FieldDescription>
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input id="confirm-password" type="password" required className="bg-background" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <FieldDescription>Please confirm your password.</FieldDescription>
          </Field>
          <FieldLabel className={`text-red-500 ${!error409 && 'hidden'}`}>Too many attempts, try again in a minute</FieldLabel>
          <Field className="mt-2">
            <Button type="submit" className="w-full">Create Account</Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>
          
          <Field>
            <Button variant="outline" type="button" className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor" 
                />
              </svg>
              Sign up with GitHub
            </Button>
            <FieldDescription className="px-6 text-center mt-4">
              Already have an account? <a href="#" className="underline hover:text-primary">Sign in</a>
            </FieldDescription>
          </Field>
          
        </FieldGroup>
      </form>
    </div>
  );
}