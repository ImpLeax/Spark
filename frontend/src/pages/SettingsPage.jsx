import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle2,
  Camera,
  Plus,
  X
} from "lucide-react";
import api from "@/services/axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/Card.jsx";
import { cn } from "@/lib/utils";


const getErrorMessage = (error, defaultMessage) => {
  const data = error.response?.data;
  if (data) {
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return data[firstKey][0];
    } else if (firstKey && typeof data[firstKey] === "string") {
      return data[firstKey];
    }
  }
  return defaultMessage;
};

const FormMessage = ({ msg }) => (
  <AnimatePresence>
    {msg && (
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden mb-6"
      >
        <div className={cn(
          "p-4 rounded-xl border font-medium flex items-center gap-2",
          msg.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-destructive/10 border-destructive/20 text-destructive"
        )}>
          {msg.type === "error" && <AlertTriangle className="w-5 h-5 shrink-0" />}
          {msg.text}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);


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
              <motion.div key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <ProfileSettings />
              </motion.div>
            )}
            {activeTab === "discovery" && (
              <motion.div key="discovery" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                <DiscoverySettings />
              </motion.div>
            )}
            {activeTab === "account" && (
              <motion.div key="account" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
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
    firstName: "", lastName: "", surname: "", bio: "", height: "", weight: "",
  });
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [avatar, setAvatar] = useState(null);
  const [gallery, setGallery] = useState([]);
  const avatarInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const [message, setMessage] = useState(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [profileRes, galleryRes] = await Promise.all([
          api.get("user/profile/"),
          api.get("user/profile/gallery/")
        ]);

        const data = profileRes.data;
        setProfileData({
          firstName: data.first_name || "",
          lastName: data.last_name || "",
          surname: data.surname || "",
          bio: data.additional_info?.bio || "",
          height: data.additional_info?.height || "",
          weight: data.additional_info?.weight || "",
        });
        setAvatar(data.avatar);
        setGallery(galleryRes.data);
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      await api.put("user/profile/avatar/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const res = await api.get("user/profile/");
      setAvatar(res.data.avatar);
      showMessage("success", "Avatar updated successfully!");
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to upload avatar."));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    setIsUploadingAvatar(true);
    try {
      await api.delete("user/profile/avatar/");
      setAvatar(null);
      showMessage("success", "Avatar removed.");
    } catch (error) {
      showMessage("error", "Failed to remove avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setIsUploadingGallery(true);
    const formData = new FormData();
    files.forEach(file => formData.append("photos", file));

    try {
      await api.post("user/profile/gallery/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const res = await api.get("user/profile/gallery/");
      setGallery(res.data);
      showMessage("success", "Photos added successfully!");
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to upload photos."));
    } finally {
      setIsUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleGalleryDelete = async (id) => {
    try {
      await api.delete(`user/profile/gallery/${id}/`);
      setGallery(prev => prev.filter(img => img.id !== id));
      showMessage("success", "Photo deleted.");
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to delete photo."));
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

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
      showMessage("success", "Profile info updated successfully!");
    } catch (error) {
      showMessage("error", getErrorMessage(error, "Failed to update profile info."));
    } finally {
      setIsSaving(false);
    }
  };

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setIsLocating(false);
          showMessage("success", "New location ready to be saved.");
        },
        error => {
          setIsLocating(false);
          showMessage("error", "Could not get location. Check browser permissions.");
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
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        <FormMessage msg={message} />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 pb-8 border-b border-border">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-background shadow-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <User size={48} className="text-muted-foreground/50" />
            )}
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold">Profile Avatar</h3>
            <p className="text-sm text-muted-foreground mb-4">This is your main identity photo.</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => avatarInputRef.current.click()} disabled={isUploadingAvatar}>
                <Camera className="w-4 h-4 mr-2" /> Change Avatar
              </Button>
              {avatar && (
                <Button size="sm" variant="destructive" onClick={handleAvatarDelete} disabled={isUploadingAvatar}>
                  Remove
                </Button>
              )}
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>
        </div>

        <div className="mb-10 pb-8 border-b border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold">Photo Gallery</h3>
              <p className="text-sm text-muted-foreground">Add 2 to 4 photos to show off your personality.</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => galleryInputRef.current.click()}
              disabled={isUploadingGallery || gallery.length >= 4}
            >
              {isUploadingGallery ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Photo
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <AnimatePresence>
              {gallery.map(img => (
                <motion.div key={img.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary border shadow-sm group">
                  <img src={img.photo} className="w-full h-full object-cover" alt="Gallery item" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => handleGalleryDelete(img.id)}
                      className="p-3 bg-destructive text-white rounded-full hover:scale-110 active:scale-95 transition-transform shadow-xl"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {gallery.length === 0 && !isUploadingGallery && (
               <div className="col-span-full py-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                 No photos in gallery.
               </div>
            )}
          </div>
          <input type="file" multiple accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleGalleryUpload} />
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4">Basic Information</h3>
          <form onSubmit={handleSaveInfo} className="space-y-6">
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
              <Button type="button" variant={latitude ? "secondary" : "outline"} onClick={getLocation} disabled={isLocating} className="w-full flex gap-2 h-12 rounded-xl">
                {isLocating && <Loader2 className="w-4 h-4 animate-spin" />}
                {!isLocating && !latitude && <MapPin className="w-4 h-4" />}
                {!isLocating && latitude && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {isLocating ? "Getting Location..." : (latitude ? "New Location Pinned" : "Update My Location")}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">Update this if you have moved to find people closer to you.</p>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full md:w-auto h-12 px-8 rounded-xl text-base mt-4">
              {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Save Information
            </Button>
          </form>
        </div>
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
  const [message, setMessage] = useState(null);

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
    setMessage(null);
    try {
      await api.patch("user/profile/settings/", {
        search_distance: distance,
        min_age: minAge,
        max_age: maxAge
      });
      setMessage({ type: "success", text: "Discovery settings updated successfully!" });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: "error", text: getErrorMessage(error, "Failed to update settings. Try again.") });
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
          <FormMessage msg={message} />

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

  const [msgPassword, setMsgPassword] = useState(null);
  const [msgEmail, setMsgEmail] = useState(null);
  const [msgDelete, setMsgDelete] = useState(null);

  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [emailData, setEmailData] = useState({ newEmail: "", password: "" });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const showMessage = (setter, type, text) => {
    setter({ type, text });
    setTimeout(() => setter(null), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return showMessage(setMsgPassword, "error", "New passwords do not match.");
    }

    setLoadingAction("password");
    try {
      await api.put("user/password/change/", {
        old_password: passwords.old,
        new_password: passwords.new,
        new_password_confirm: passwords.confirm
      });
      showMessage(setMsgPassword, "success", "Password changed successfully. Please log in again.");
      setTimeout(() => logout(), 2000);
    } catch (error) {
      showMessage(setMsgPassword, "error", getErrorMessage(error, "Failed to change password."));
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
      showMessage(setMsgEmail, "success", response.data.message);
      setEmailData({ newEmail: "", password: "" });
    } catch (error) {
      showMessage(setMsgEmail, "error", getErrorMessage(error, "Failed to request email change."));
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!deletePassword) return;

    setLoadingAction("delete");
    try {
      await api.delete("user/delete/", { data: { password: deletePassword } });
      logout();
    } catch (error) {
      showMessage(setMsgDelete, "error", getErrorMessage(error, "Failed to delete account."));
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

      <Card className="p-6 md:p-8 rounded-[2rem] border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><KeyRound size={24} /></div>
          <h2 className="text-xl font-bold">Change Password</h2>
        </div>
        <FormMessage msg={msgPassword} />
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
        <FormMessage msg={msgEmail} />
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
        <FormMessage msg={msgDelete} />
        <AnimatePresence mode="wait">
          {!showDeleteConfirm ? (
            <motion.div key="delete-btn" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="h-12 px-8 rounded-xl">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </motion.div>
          ) : (
            <motion.form key="delete-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleConfirmDelete} className="space-y-4 p-5 bg-destructive/10 rounded-2xl border border-destructive/20">
              <div className="flex gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-bold">This action is irreversible. Enter your password to confirm deletion.</p>
              </div>
              <Input type="password" placeholder="Current Password" required value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="h-12 bg-background border-destructive/30 focus-visible:ring-destructive" />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setMsgDelete(null); }} className="flex-1 h-12 rounded-xl" disabled={loadingAction === "delete"}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={loadingAction === "delete"} className="flex-1 h-12 rounded-xl">
                  {loadingAction === "delete" ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Permanently Delete"}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
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