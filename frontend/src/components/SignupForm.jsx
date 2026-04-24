import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DatePicker } from '@/components/index';
import { ImageCropperModal } from "@/components/ui/ImageCropperModal";
import api from '@/services/axios';
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Loader2, MapPin, CheckCircle2, Plus, X, ChevronRight } from "lucide-react";
import { Turnstile } from '@marsidev/react-turnstile';
import { useTranslation } from "react-i18next";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({ className, ...props }) {
  const location = useLocation();
  const googleData = location.state?.googleData;

  const [firstName, setFirstName] = useState(googleData?.first_name || "");
  const [lastName, setLastName] = useState(googleData?.last_name || "");
  const [email, setEmail] = useState(googleData?.email || "");
  const [surname, setSurname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState();

  const [gender, setGender] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [intention, setIntention] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);

  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);
  const [isIntentionModalOpen, setIsIntentionModalOpen] = useState(false);

  const [photoSlots, setPhotoSlots] = useState([null, null, null, null]);
  const [photoPreviews, setPhotoPreviews] = useState([null, null, null, null]);

  const activeSlotIndex = useRef(null);
  const fileInputRef = useRef(null);

  const turnstileRef = useRef(null);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error429, setError429] = useState(false);
  const [formError, setFormError] = useState("");

  const [intentionsList, setIntentionsList] = useState([]);
  const [gendersList, setGendersList] = useState([]);
  const [interestsList, setInterestsList] = useState([]);
  const [cropState, setCropState] = useState({ isOpen: false, imageSrc: null, slotIndex: null });

  const { t } = useTranslation();

  useEffect(() => {
    getGenders();
    getIntentions();
    getInterests();

    return () => {
      photoPreviews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const getGenders = async () => {
    try {
      const response = await api.get("user/genders/");
      setGendersList(response.data);
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  }

  const getIntentions = async () => {
    try {
      const response = await api.get("user/intentions/");
      setIntentionsList(response.data);
    } catch (error) {
      console.error("Error fetching intentions:", error);
    }
  }

  const getInterests = async () => {
    try {
      const response = await api.get("user/interests/?page=1&page_size=50");
      setInterestsList(response.data.results || []);
    } catch (error) {
      console.error("Error fetching interests:", error);
    }
  }

  const getLocation = () => {
    setIsLocating(true);
    setFormError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
        },
        error => {
          console.error("Location error:", error);
          setFormError(t('signup_form.errors.location'));
          setIsLocating(false);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const handleInterestToggle = (id) => {
    setSelectedInterests(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 10) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSlotClick = (index) => {
    if (photoSlots[index]) return;
    activeSlotIndex.current = index;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropState({
        isOpen: true,
        imageSrc: reader.result,
        slotIndex: activeSlotIndex.current
      });
    };
    reader.readAsDataURL(file);

    e.target.value = "";
    setFormError("");
  };

  const handleCropComplete = (croppedBlob) => {
    const index = cropState.slotIndex;
    const file = new File([croppedBlob], `photo-${index}.jpg`, { type: "image/jpeg" });

    const newSlots = [...photoSlots];
    newSlots[index] = file;
    setPhotoSlots(newSlots);

    const newPreviews = [...photoPreviews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = URL.createObjectURL(file);
    setPhotoPreviews(newPreviews);

    setCropState({ isOpen: false, imageSrc: null, slotIndex: null });
  };

  const handleRemovePhoto = (index, e) => {
    e.stopPropagation();

    const newSlots = [...photoSlots];
    newSlots[index] = null;
    setPhotoSlots(newSlots);

    const newPreviews = [...photoPreviews];
    if (newPreviews[index]) URL.revokeObjectURL(newPreviews[index]);
    newPreviews[index] = null;
    setPhotoPreviews(newPreviews);
  };

  const register = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!turnstileToken) {
      setFormError(t('signup_form.errors.captcha'));
      return;
    }

    const validPhotos = photoSlots.filter(photo => photo !== null);

    if (validPhotos.length < 2) {
      setFormError(t('signup_form.errors.photos'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('signup_form.errors.passwords_match'));
      return;
    }
    if (!dateOfBirth) {
      setFormError(t('signup_form.errors.dob'));
      return;
    }
    if (selectedInterests.length < 2) {
      setFormError(t('signup_form.errors.interests'));
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();

    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("surname", surname);
    formData.append("birth_date", format(dateOfBirth, "yyyy-MM-dd"));

    formData.append("cf_turnstile_response", turnstileToken);

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

    validPhotos.forEach(file => {
      formData.append("photos", file);
    });

    try {
      const response = await api.post("user/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Registration Error:", error.response?.data);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);

      if (error.response?.status === 429) {
        setError429(true);
        window.setTimeout(() => setError429(false), 60 * 1000);
      } else {
        let errorKey = 'signup_form.errors.general';
        if (error.response?.data) {
          const firstVal = Object.values(error.response.data)[0];
          if (Array.isArray(firstVal)) {
            errorKey = firstVal[0];
          } else if (typeof firstVal === 'string') {
            errorKey = firstVal;
          }
        }
        setFormError(t(errorKey));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedIntentionObj = intentionsList.find(i => i.id.toString() === intention);

  return (
    <div className="w-full max-w-6xl mx-auto relative p-4 lg:p-8">

      <div className="flex flex-col p-6 sm:p-10 lg:p-12 shadow-2xl rounded-[2.5rem] bg-card/95 backdrop-blur-sm border border-border">

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t('signup_form.title')}</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t('signup_form.subtitle')}
          </p>
        </div>

        <form onSubmit={register}>

          <div className="flex flex-col lg:flex-row gap-12 items-start">

            <div className="flex-1 w-full flex flex-col">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-10">

                <div className="flex flex-col h-full">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b pb-2">{t('signup_form.sections.personal')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="firstName">{t('signup_form.labels.first_name')}</FieldLabel>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="lastName">{t('signup_form.labels.last_name')}</FieldLabel>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="surname">{t('signup_form.labels.surname')}</FieldLabel>
                      <Input id="surname" value={surname} onChange={(e) => setSurname(e.target.value)} placeholder="Smith" required />
                    </Field>

                    <Field>
                      <FieldLabel>{t('signup_form.labels.dob')}</FieldLabel>
                      <DatePicker selected={dateOfBirth} onSelect={setDateOfBirth} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="username">{t('signup_form.labels.username')}</FieldLabel>
                      <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe123" required />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="email">{t('signup_form.labels.email')}</FieldLabel>
                      <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="m@example.com"
                          required
                          readOnly={!!googleData?.email}
                          className={googleData?.email ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                      />
                    </Field>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="password">{t('signup_form.labels.password')}</FieldLabel>
                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirm-password">{t('signup_form.labels.confirm_password')}</FieldLabel>
                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col h-full">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b pb-2">{t('signup_form.sections.dating')}</h3>

                    <Field>
                      <FieldLabel className="mb-2">{t('signup_form.labels.gender')}</FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {gendersList.length > 0 ? gendersList.map((el) => {
                          const isSelected = gender === el.id.toString();
                          return (
                            <Button
                              key={`gender-${el.id}`}
                              type="button"
                              variant={isSelected ? "default" : "secondary"}
                              onClick={() => setGender(el.id.toString())}
                              className={cn("w-full transition-all", !isSelected && "bg-muted text-foreground hover:bg-muted/80")}
                            >
                              {t(`genders.${el.name}`)}
                            </Button>
                          );
                        }) : <p className="text-sm text-muted-foreground">{t('signup_form.modals.loading')}</p>}
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel className="mb-2">{t('signup_form.labels.looking_for')}</FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {gendersList.length > 0 ? gendersList.map((el) => {
                          const isSelected = lookingFor === el.id.toString();
                          return (
                            <Button
                              key={`looking-${el.id}`}
                              type="button"
                              variant={isSelected ? "default" : "secondary"}
                              onClick={() => setLookingFor(el.id.toString())}
                              className={cn("w-full transition-all", !isSelected && "bg-muted text-foreground hover:bg-muted/80")}
                            >
                              {t(`genders.${el.name}`)}
                            </Button>
                          );
                        }) : <p className="text-sm text-muted-foreground">{t('signup_form.modals.loading')}</p>}
                      </div>
                    </Field>
                  <Field>
                    <FieldLabel className="mb-2">{t('signup_form.labels.intention')}</FieldLabel>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsIntentionModalOpen(true)}
                      className="w-full flex justify-between items-center bg-secondary/20 hover:bg-secondary/40 border-dashed"
                    >
                      <span className={intention ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {selectedIntentionObj ? t(`intentions.${selectedIntentionObj.name}`) : t('signup_form.placeholders.intention')}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </Field>

                    <Field>
                      <FieldLabel className="mb-2">{t('signup_form.labels.interests')}</FieldLabel>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsInterestsModalOpen(true)}
                        className="w-full flex justify-between items-center bg-secondary/20 hover:bg-secondary/40 border-dashed"
                      >
                        <span className={selectedInterests.length > 0 ? "text-foreground font-medium" : "text-muted-foreground"}>
                          {selectedInterests.length > 0
                            ? `${selectedInterests.length} ${t('signup_form.placeholders.selected')}`
                            : t('signup_form.placeholders.interests')}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Button>

                      <FieldDescription className="mt-2">
                        {t('signup_form.placeholders.select_min_2')} ({selectedInterests.length}/10)
                      </FieldDescription>
                    </Field>
                  </div>

                  <div className="mt-auto pt-6">
                    <Field>
                      <FieldLabel>{t('signup_form.labels.location')}</FieldLabel>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant={latitude ? "secondary" : "outline"}
                          onClick={getLocation}
                          disabled={isLocating || latitude}
                          className="w-full flex gap-2"
                        >
                          {isLocating && <Loader2 className="w-4 h-4 animate-spin" />}
                          {!isLocating && !latitude && <MapPin className="w-4 h-4" />}
                          {!isLocating && latitude && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                          {isLocating ? t('signup_form.location.locating') : (latitude ? t('signup_form.location.saved') : t('signup_form.location.get'))}
                        </Button>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[350px] shrink-0">
              <div className="mb-4">
                <h3 className="text-xl font-semibold border-b pb-2">{t('signup_form.sections.photos')}</h3>
                <p className="text-sm text-muted-foreground mt-3">{t('signup_form.sections.photos_desc')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    onClick={() => handleSlotClick(index)}
                    className={cn(
                      "relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col items-center justify-center transition-all",
                      photoPreviews[index]
                        ? "border border-border shadow-sm"
                        : "border-2 border-dashed border-muted-foreground/30 bg-secondary/20 cursor-pointer hover:bg-secondary/40"
                    )}
                  >
                    {photoPreviews[index] ? (
                      <>
                        <img src={photoPreviews[index]} alt={`Upload ${index + 1}`} className="object-cover w-full h-full" />

                        <button
                          type="button"
                          onClick={(e) => handleRemovePhoto(index, e)}
                          className="absolute top-2 right-2 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shadow-sm text-muted-foreground">
                        <Plus className="w-5 h-5 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

          </div>

          <div className="mt-12 pt-8 flex flex-col items-center max-w-xl mx-auto space-y-4">
            <div className="w-full flex justify-center py-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onError={() => setFormError(t('signup_form.errors.captcha_error'))}
                />
            </div>

            {error429 && <p className="text-sm text-destructive font-medium text-center">{t('signup_form.errors.429')}</p>}
            {formError && <p className="text-sm text-destructive font-medium text-center bg-destructive/10 p-3 rounded-md w-full">{formError}</p>}

            <Button type="submit" className="w-full text-lg h-14 rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t('signup_form.buttons.creating')}
                </span>
              ) : t('signup_form.buttons.create')}
            </Button>
            <div className="flex flex-col items-center space-y-3">
              <p className="text-muted-foreground font-medium">
                {t('signup_form.links.already_have')}{" "}
                <Link
                  to="/"
                  className="text-primary hover:underline underline-offset-4 transition-all font-bold"
                >
                  {t('signup_form.links.login')}
                </Link>
              </p>

              <Link
                to="/"
                className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors flex items-center gap-1 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                {t('signup_form.links.back')}
              </Link>
            </div>
          </div>
        </form>
      </div>

      {isIntentionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold">{t('signup_form.modals.intention_title')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('signup_form.modals.intention_desc')}
                </p>
              </div>
              <button
                onClick={() => setIsIntentionModalOpen(false)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col gap-3">
                {intentionsList.length > 0 ? intentionsList.map((el) => {
                  const isSelected = intention === el.id.toString();
                  return (
                    <Button
                      key={`modal-intent-${el.id}`}
                      type="button"
                      variant={isSelected ? "default" : "secondary"}
                      onClick={() => setIntention(el.id.toString())}
                      className={cn(
                        "w-full transition-all justify-start text-left px-5 py-4 h-auto text-base rounded-xl",
                        !isSelected && "bg-secondary/50 text-foreground hover:bg-secondary"
                      )}
                    >
                      {t(`intentions.${el.name}`)}
                    </Button>
                  );
                }) : (
                  <div className="flex items-center justify-center w-full py-10 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    {t('signup_form.modals.loading')}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card/50 rounded-b-3xl">
              <Button
                onClick={() => setIsIntentionModalOpen(false)}
                className="w-full h-12 text-lg rounded-xl"
              >
                {t('signup_form.modals.done')}
              </Button>
            </div>
          </div>
        </div>
      )}


      {isInterestsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-bold">{t('signup_form.modals.interests_title')}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('signup_form.modals.interests_desc')} ({selectedInterests.length}/10)
                </p>
              </div>
              <button
                onClick={() => setIsInterestsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-3">
                {interestsList.length > 0 ? interestsList.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <Button
                      key={`modal-interest-${interest.id}`}
                      type="button"
                      variant={isSelected ? "default" : "secondary"}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={cn(
                        "rounded-full transition-all py-2 px-4 h-auto text-sm",
                        !isSelected && "bg-secondary/50 text-foreground hover:bg-secondary"
                      )}
                    >
                      {t(`interests.${interest.name}`)}
                    </Button>
                  );
                }) : (
                  <div className="flex items-center justify-center w-full py-10 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    {t('signup_form.modals.loading_interests')}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border bg-card/50 rounded-b-3xl">
              <Button
                onClick={() => setIsInterestsModalOpen(false)}
                className="w-full h-12 text-lg rounded-xl"
              >
                {t('signup_form.modals.done')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {cropState.isOpen && (
        <ImageCropperModal
          imageSrc={cropState.imageSrc}
          aspect={3/4}
          onComplete={handleCropComplete}
          onClose={() => setCropState({ isOpen: false, imageSrc: null, slotIndex: null })}
        />
      )}
    </div>
  );
}

export default SignupForm;