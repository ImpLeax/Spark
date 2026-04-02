import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DatePicker } from '@/components/index';
import api from '@/services/axios'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react";
import { format } from "date-fns";

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

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  

  const [dateOfBirth, setDateOfBirth] = useState();
  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [intention, setIntention] = useState("");  
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const [photos, setPhotos] = useState([]);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [error409, setError429] = useState(false);

  const [intentionsList, setIntentionsList] = useState([]);
  const [gendersList, setGendersList] = useState([]);
  const [interestsList, setInterestsList] = useState([]);

  useEffect(() => {
    getGenders();
    getIntentions();
    getInterests();
  }, []);

  const getGenders = async () => {
    try {
      const response = await api.get("user/genders/");
      setGendersList(response.data);
    } catch (error) {
      console.error("Error:", error.response?.data);
    }
  }

  const getIntentions = async () => {
    try {
      const response = await api.get("user/intentions/");
      setIntentionsList(response.data);
    } catch (error) {
      console.error("Error:", error.response?.data);
    }
  }

  const getInterests = async () => {
    try {
      const response = await api.get("user/interests/?page=1&page_size=50");
      setInterestsList(response.data.results || []);
    } catch (error) {
      console.error("Error:", error.response?.data);
    }
  }

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
        },
        error => {
          console.error("Location error:", error);
          alert("Could not get location. Please allow access.");
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleInterestToggle = (id) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 4) {
      alert("You can upload a maximum of 4 photos.");
      e.target.value = "";
      return;
    }
    setPhotos(files);
  };

  const register = async (e) => {
    e.preventDefault();

    if (photos.length < 2) {
      alert("Please upload at least 2 photos.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!dateOfBirth) {
      alert("Please select your date of birth.");
      return;
    }

    const formData = new FormData();

    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("first_name", firstName); 
    formData.append("last_name", lastName);   
    formData.append("surname", surname);      


    formData.append("birth_date", format(dateOfBirth, "yyyy-MM-dd"));

    if (longitude && latitude) {
      formData.append("longitude", longitude);
      formData.append("latitude", latitude);
    }

    if (gender) formData.append("gender", gender);
    if (lookingFor) formData.append("looking_for", lookingFor);
    if (intention) formData.append("intention", intention);

    selectedInterests.forEach(interestId => {
      formData.append("interests", interestId);
    });

    photos.forEach(file => {
      formData.append("photos", file);
    });

    console.log("--- DATA TO SEND ---");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log("--------------------");

    try {
      const response = await api.post("user/register/", formData, {
        headers: { 
          "Content-Type": "multipart/form-data" 
        }
      });
      console.log("Успіх:", response.data);
      alert("Registration successful!");
      
    } catch (error) {
      console.error("Помилка:", error.response?.data);
      if (error.response?.status === 429) {
        setError429(true);
        window.setTimeout(() => {
          setError429(false);
        }, 60 * 1000);
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-66px)] flex items-center justify-center p-4 py-8">
      <form onSubmit={register} className={cn("flex flex-col gap-6 shadow-md border border-border p-8 rounded-2xl bg-card w-full max-w-md mx-auto my-auto", className)} {...props}>
        <FieldGroup className="align-middle">
          
          <div className="flex flex-col items-center gap-1 text-center mb-4">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-balance text-muted-foreground">
              Fill in the form below to create your account
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="surname">Surname</FieldLabel>
            <Input id="surname" type="text" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Smith" required />
          </Field>

          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe123" required />
          </Field>

          <Field>
            <FieldLabel>Gender</FieldLabel> 
            <RadioGroup value={gender} onValueChange={setGender} className="flex flex-wrap gap-4 mt-2">
              {gendersList.length > 0 ? (
                gendersList.map((element) => (
                  <div key={`gender-${element.id}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={element.id.toString()} id={`gender-${element.id}`} />
                    <Label htmlFor={`gender-${element.id}`} className="font-normal cursor-pointer">
                      {element.name}
                    </Label>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Looking For</FieldLabel> 
            <RadioGroup value={lookingFor} onValueChange={setLookingFor} className="flex flex-wrap gap-4 mt-2">
              {gendersList.length > 0 ? (
                gendersList.map((element) => (
                  <div key={`looking-${element.id}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={element.id.toString()} id={`looking-${element.id}`} />
                    <Label htmlFor={`looking-${element.id}`} className="font-normal cursor-pointer">
                      {element.name}
                    </Label>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Intention</FieldLabel> 
            <RadioGroup value={intention} onValueChange={setIntention} className="flex flex-wrap gap-4 mt-2">
              {intentionsList.length > 0 ? (
                intentionsList.map((element) => (
                  <div key={`intent-${element.id}`} className="flex items-center space-x-2">
                    <RadioGroupItem value={element.id.toString()} id={`intent-${element.id}`} />
                    <Label htmlFor={`intent-${element.id}`} className="font-normal cursor-pointer">
                      {element.name}
                    </Label>
                  </div>
                ))
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel>Interests</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {interestsList.length > 0 ? (
                interestsList.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <Button
                      key={`interest-${interest.id}`}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleInterestToggle(interest.id)}
                      className="rounded-full"
                    >
                      {interest.name}
                    </Button>
                  );
                })
              ) : <p className="text-sm text-muted-foreground">Loading...</p>}
            </div>
          </Field>

          <Field>
            <FieldLabel>Photos (Min: 2, Max: 4)</FieldLabel>
            <Input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handlePhotoUpload} 
              className="cursor-pointer"
            />
            <FieldDescription>
              {photos.length} photo(s) selected.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel>Date of Birth</FieldLabel>
            <DatePicker selected={dateOfBirth} onSelect={(newDate) => {
                                                                        setDateOfBirth(newDate);
                                                                        console.log("Date of Birth:", newDate);
                                                                      }} />
          </Field>

          <Field>
            <FieldLabel>Location</FieldLabel>
            <div className="flex items-center gap-4 mt-2">
              <Button type="button" variant="outline" onClick={getLocation} disabled={isLocating || latitude}>
                {isLocating ? "Locating..." : (latitude ? "Location Saved" : "Get Location")}
              </Button>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>

          <FieldLabel className={`text-red-500 ${!error409 && 'hidden'}`}>Too many attempts, try again in a minute</FieldLabel>
          
          <Field className="mt-2">
            <Button type="submit" className="w-full">Create Account</Button>
          </Field>
          
        </FieldGroup>
      </form>
    </div>
  );
}