import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sliders,
  ShieldCheck,
  Mail,
  KeyRound,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  User,
  MapPin,
  CheckCircle2
} from "lucide-react";
import api from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card.jsx";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 py-8 md:p-10 w-full"
    >
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-lg mt-2">Manage your preferences and account security.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <TabButton
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
            icon={<User size={20} />}
            label="Edit Profile"
          />
          <TabButton
            active={activeTab === "discovery"}
            onClick={() => setActiveTab("discovery")}
            icon={<Sliders size={20} />}
            label="Discovery"
          />
          <TabButton
            active={activeTab === "account"}
            onClick={() => setActiveTab("account")}
            icon={<ShieldCheck size={20} />}
            label="Account & Security"
          />
        </div>

        <div className="flex-1 min-w-0 min-h-[80vh]">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ProfileSettings />
              </motion.div>
            )}
            {activeTab === "discovery" && (
              <motion.div
                key="discovery"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DiscoverySettings />
              </motion.div>
            )}
            {activeTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AccountSettings />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

const ProfileSettings = () => {
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    surname: "",
    bio: "",
    height: "",
    weight: "",
  });

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("user/profile/");
        const data = response.data;
        setProfileData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          surname: data.surname || "",
          bio: data.additional_info?.bio || "",
          height: data.additional_info?.height || "",
          weight: data.additional_info?.weight || "",
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    const payload = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      surname: profileData.surname,
      bio: profileData.bio,
    };

    if (profileData.height) payload.height = Number(profileData.height);
    if (profileData.weight) payload.weight = Number(profileData.weight);
    if (latitude && longitude) {
      payload.latitude = latitude;
      payload.longitude = longitude;
    }

    try {
      await api.patch("user/profile/", payload);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    setMessage({ type: "", text: "" });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
          setMessage({ type: "success", text: "New location ready to be saved." });
        },
        error => {
          setIsLocating(false);
          setMessage({ type: "error", text: "Could not get location. Check browser permissions." });
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-muted/50 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm">
        <h2 className="text-2xl font-bold mb-6">Public Profile</h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">First Name</label>
              <Input required value={profileData.firstName} onChange={(e) => setProfileData({...profileData, firstName: e.target.value})} className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Last Name</label>
              <Input required value={profileData.lastName} onChange={(e) => setProfileData({...profileData, lastName: e.target.value})} className="h-12" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Surname (Patronymic)</label>
            <Input value={profileData.surname} onChange={(e) => setProfileData({...profileData, surname: e.target.value})} className="h-12" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-muted-foreground">Bio</label>
            <textarea
              value={profileData.bio}
              onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              placeholder="Tell a bit about yourself..."
              className="flex min-h-[120px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Height (cm)</label>
              <Input type="number" placeholder="180" value={profileData.height} onChange={(e) => setProfileData({...profileData, height: e.target.value})} className="h-12" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">Weight (kg)</label>
              <Input type="number" placeholder="75" value={profileData.weight} onChange={(e) => setProfileData({...profileData, weight: e.target.value})} className="h-12" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-semibold text-muted-foreground">Location</label>
            <Button
              type="button"
              variant={latitude ? "secondary" : "outline"}
              onClick={getLocation}
              disabled={isLocating}
              className="w-full flex gap-2 h-12 rounded-xl"
            >
              {isLocating && <Loader2 className="w-4 h-4 animate-spin" />}
              {!isLocating && !latitude && <MapPin className="w-4 h-4" />}
              {!isLocating && latitude && <CheckCircle2 className="w-4 h-4 text-green-500" />}
              {isLocating ? "Getting Location..." : (latitude ? "New Location Pinned" : "Update My Location")}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Update this if you have moved to find people closer to you.</p>
          </div>

          {message.text && (
            <p className={cn("text-sm font-medium", message.type === "success" ? "text-green-500" : "text-destructive")}>
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={isSaving} className="w-full md:w-auto h-12 px-8 rounded-xl text-base mt-4">
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Save Profile
          </Button>
        </form>
      </Card>
    </div>
  );
};

const DiscoverySettings = () => {
  const [distance, setDistance] = useState(50);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get("user/profile/settings/");
        setDistance(response.data.search_distance);
        setMinAge(response.data.age_range.min);
        setMaxAge(response.data.age_range.max);
      } catch (error) {
        console.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.patch("user/profile/settings/", {
        search_distance: distance,
        min_age: minAge,
        max_age: maxAge
      });
      setMessage({ type: "success", text: "Discovery settings updated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update settings. Try again." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-muted/50 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Discovery Preferences</h2>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-lg">Maximum Distance</label>
              <span className="text-primary font-bold">{distance} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="5000"
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-lg">Age Range</label>
              <span className="text-primary font-bold">{minAge} - {maxAge} years</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Min Age</span>
                <Input type="number" min="18" max={maxAge} value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="text-lg h-12" />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground uppercase font-bold">Max Age</span>
                <Input type="number" min={minAge} max="100" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="text-lg h-12" />
              </div>
            </div>
          </div>
        </div>

        {message.text && (
          <p className={cn("text-sm font-medium", message.type === "success" ? "text-green-500" : "text-destructive")}>
            {message.text}
          </p>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto h-12 px-8 rounded-xl text-base">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Save Preferences
        </Button>
      </Card>
    </div>
  );
};

const AccountSettings = () => {
  const { logout } = useAuth();
  const [loadingAction, setLoadingAction] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [emailData, setEmailData] = useState({ newEmail: "", password: "" });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) return showMessage("error", "New passwords do not match.");

    setLoadingAction("password");
    try {
      await api.put("user/password/change/", {
        old_password: passwords.old,
        new_password: passwords.new,
        new_password_confirm: passwords.confirm
      });
      showMessage("success", "Password changed successfully. Please log in again.");
      setTimeout(() => logout(), 2000);
    } catch (error) {
      showMessage("error", error.response?.data?.old_password?.[0] || "Failed to change password.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoadingAction("email");
    try {
      const response = await api.post("user/email/change/", {
        new_email: emailData.newEmail,
        password: emailData.password
      });
      showMessage("success", response.data.message);
      setEmailData({ newEmail: "", password: "" });
    } catch (error) {
      showMessage("error", "Failed to request email change. Check your password.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    const pwd = prompt("WARNING: This action is irreversible. Enter your password to confirm account deletion:");
    if (!pwd) return;

    setLoadingAction("delete");
    try {
      await api.delete("user/delete/", { data: { password: pwd } });
      logout();
    } catch (error) {
      showMessage("error", "Failed to delete account. Incorrect password.");
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">

      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm bg-secondary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><User size={24} /></div>
          <h2 className="text-xl font-bold">Account Details</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Username</span>
            <p className="font-medium text-lg mt-1">spark_user</p>
          </div>
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Email Address</span>
            <p className="font-medium text-lg mt-1">user@spark.com</p>
          </div>
          <div>
            <span className="text-sm font-semibold text-muted-foreground">Account Status</span>
            <p className="font-medium text-lg mt-1 text-green-500">Active</p>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {message.text && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cn("p-4 rounded-xl border font-medium", message.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-destructive/10 border-destructive/20 text-destructive")}>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><KeyRound size={24} /></div>
          <h2 className="text-xl font-bold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input type="password" placeholder="Current Password" required value={passwords.old} onChange={(e) => setPasswords({...passwords, old: e.target.value})} className="h-12" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input type="password" placeholder="New Password" required value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} className="h-12" />
            <Input type="password" placeholder="Confirm New Password" required value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} className="h-12" />
          </div>
          <Button type="submit" disabled={loadingAction !== null} className="h-12 px-8 rounded-xl">
            {loadingAction === "password" ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Update Password"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Mail size={24} /></div>
          <div>
            <h2 className="text-xl font-bold">Change Email</h2>
            <p className="text-sm text-muted-foreground">We will send a confirmation link to the new address.</p>
          </div>
        </div>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <Input type="email" placeholder="New Email Address" required value={emailData.newEmail} onChange={(e) => setEmailData({...emailData, newEmail: e.target.value})} className="h-12" />
          <Input type="password" placeholder="Current Password (to confirm)" required value={emailData.password} onChange={(e) => setEmailData({...emailData, password: e.target.value})} className="h-12" />
          <Button type="submit" variant="secondary" disabled={loadingAction !== null} className="h-12 px-8 rounded-xl">
            {loadingAction === "email" ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Request Email Change"}
          </Button>
        </form>
      </Card>

      <Card className="p-6 md:p-8 rounded-[2rem] border-destructive/20 bg-destructive/5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-destructive/10 text-destructive rounded-xl"><AlertTriangle size={24} /></div>
          <h2 className="text-xl font-bold text-destructive">Danger Zone</h2>
        </div>
        <p className="text-muted-foreground mb-6">Once you delete your account, there is no going back. All your matches, messages, and photos will be permanently deleted.</p>
        <Button onClick={handleDeleteAccount} variant="destructive" disabled={loadingAction !== null} className="h-12 px-8 rounded-xl">
          {loadingAction === "delete" ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <><Trash2 className="mr-2 h-4 w-4" /> Delete Account</>}
        </Button>
      </Card>

    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-left font-medium transition-all duration-200",
      active
        ? "bg-primary text-primary-foreground shadow-md"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    )}
  >
    {icon}
    <span className="text-base">{label}</span>
  </button>
);

export default SettingsPage;