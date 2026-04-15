import { useEffect, useState } from "react";
import api from '@/services/axios.js';
import { Button } from "@/components/ui/button.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.jsx";

export default function SettingsPage({ userData, onUpdateData }) {
    const [isSaving, setIsSaving] = useState(false);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [intentionsList, setIntentionsList] = useState([]);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        surname: "",
        birthDate: "",
        bio: "",
        education: "",
        height: "",
        weight: "",
        intentionId: "",
    });

    const [searchSettings, setSearchSettings] = useState({
        search_distance: 50,
        min_age: 18,
        max_age: 50,
    });

    useEffect(() => {
        const fetchIntentions = api.get("user/intentions/").catch(err => {
            console.error("error fetching intentions", err);
            return { data: [] };
        });

        const fetchSettings = api.get("user/profile/settings/").catch(err => {
            console.warn("unable to find settings", err);
            return {
                data: {
                    search_distance: 50,
                    age_range: { min: 18, max: 50 }
                }
            };
        });

        Promise.all([fetchIntentions, fetchSettings])
            .then(([intentionsRes, settingsRes]) => {
                setIntentionsList(intentionsRes.data);
                setSearchSettings({
                    search_distance: settingsRes.data.search_distance || 50,
                    min_age: settingsRes.data.age_range?.min || 18,
                    max_age: settingsRes.data.age_range?.max || 50,
                });
            })
            .finally(() => setIsSettingsLoading(false));
    }, []);

    useEffect(() => {
        if (userData) {
            setFormData({
                firstName: userData.first_name || "",
                lastName: userData.last_name || "",
                surname: userData.surname || "",
                birthDate: userData.additional_info?.birth_date || "",
                bio: userData.additional_info?.bio || "",
                education: userData.additional_info?.education || "",
                height: userData.additional_info?.height || "",
                weight: userData.additional_info?.weight || "",
                intentionId: userData.intention?.id?.toString() || "",
            });
        }
    }, [userData]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setSearchSettings((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const profilePayload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                surname: formData.surname,
                birth_date: formData.birthDate,
                bio: formData.bio,
                education: formData.education,
                height: formData.height ? Number(formData.height) : null,
                weight: formData.weight ? Number(formData.weight) : null,
            };

            if (formData.intentionId) {
                profilePayload.intention_id = Number(formData.intentionId);
            }

            const settingsPayload = {
                search_distance: Number(searchSettings.search_distance),
                min_age: Number(searchSettings.min_age),
                max_age: Number(searchSettings.max_age),
            };


            await Promise.all([
                api.patch("user/profile/", profilePayload),
                api.patch("user/profile/settings/", settingsPayload).catch(err => {
                })
            ]);

            if (onUpdateData) {
                const selectedIntention = intentionsList.find(i => i.id.toString() === formData.intentionId);
                onUpdateData({
                    ...userData,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    surname: formData.surname,
                    intention: selectedIntention || userData.intention,
                    additional_info: {
                        ...userData.additional_info,
                        birth_date: formData.birthDate,
                        bio: formData.bio,
                        education: formData.education,
                        height: formData.height,
                        weight: formData.weight,
                    }
                });
            }

            alert("Дані успішно збережено!");
        } catch (error) {
            console.error("Critial error while saving:", error.response?.data || error);
            alert("Сталася помилка при збереженні. Перевірте консоль.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!userData || isSettingsLoading) {
        return (
            <div className="h-[calc(100vh-100px)] w-full flex items-center justify-center">
                <div className="animate-pulse text-primary font-bold text-2xl flex items-center gap-3">
                    <span className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 pb-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Profile settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your data and search filter
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. ОСОБИСТА ІНФОРМАЦІЯ */}
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Private information</h2>
                    <FieldGroup className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field>
                                <FieldLabel>Name</FieldLabel>
                                <Input name="firstName" value={formData.firstName} onChange={handleProfileChange} required />
                            </Field>
                            <Field>
                                <FieldLabel>Surname</FieldLabel>
                                <Input name="lastName" value={formData.lastName} onChange={handleProfileChange} required />
                            </Field>
                            <Field>
                                <FieldLabel>Last name</FieldLabel>
                                <Input name="surname" value={formData.surname} onChange={handleProfileChange} />
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel>Date of birth</FieldLabel>
                            <Input name="birthDate" type="date" value={formData.birthDate} onChange={handleProfileChange} />
                        </Field>

                        <Field>
                            <div className="flex justify-between items-center">
                                <FieldLabel>Email</FieldLabel>
                                <span className="text-xs text-muted-foreground text-orange-500">Protected</span>
                            </div>
                            <Input value={userData.email || ""} disabled className="bg-muted opacity-70" placeholder="user@spark.com" />
                        </Field>
                    </FieldGroup>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2"></h2>
                    <FieldGroup className="space-y-4">
                        <Field>
                            <FieldLabel>Bio</FieldLabel>
                            <Input name="bio" value={formData.bio} onChange={handleProfileChange} placeholder="Кілька слів про себе..." />
                        </Field>
                        <Field>
                            <FieldLabel>Education</FieldLabel>
                            <Input name="education" value={formData.education} onChange={handleProfileChange} placeholder="Спеціальність, ЗВО..." />
                        </Field>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field>
                                <FieldLabel>Height</FieldLabel>
                                <Input name="height" type="number" min="100" max="250" value={formData.height} onChange={handleProfileChange} placeholder="175" />
                            </Field>
                            <Field>
                                <FieldLabel>Weight</FieldLabel>
                                <Input name="weight" type="number" min="30" max="250" value={formData.weight} onChange={handleProfileChange} placeholder="70" />
                            </Field>
                            <Field>
                                <FieldLabel>Мета знайомства</FieldLabel>
                                <select
                                    name="intentionId"
                                    value={formData.intentionId}
                                    onChange={handleProfileChange}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="" disabled>Choose...</option>
                                    {intentionsList.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </FieldGroup>
                </div>

                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Search filtersу</h2>
                    <FieldGroup className="space-y-6">
                        <Field>
                            <FieldLabel>Max distance: <span className="font-bold text-primary">{searchSettings.search_distance} км</span></FieldLabel>
                            <input
                                type="range"
                                name="search_distance"
                                min="1"
                                max="1000"
                                value={searchSettings.search_distance}
                                onChange={handleSettingsChange}
                                className="w-full mt-2 accent-primary"
                            />
                        </Field>

                        <div className="grid grid-cols-2 gap-4">
                            <Field>
                                <FieldLabel>Min age</FieldLabel>
                                <Input name="min_age" type="number" min="18" max="100" value={searchSettings.min_age} onChange={handleSettingsChange} />
                            </Field>
                            <Field>
                                <FieldLabel>Max age</FieldLabel>
                                <Input name="max_age" type="number" min="18" max="100" value={searchSettings.max_age} onChange={handleSettingsChange} />
                            </Field>
                        </div>
                    </FieldGroup>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isSaving} className="w-full sm:w-64 text-lg h-12 shadow-md hover:shadow-lg transition-shadow">
                        {isSaving ? "Saving..." : "Save changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}