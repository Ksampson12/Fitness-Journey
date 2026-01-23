import { useState } from "react";
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Settings as SettingsIcon, User, Edit, Trash2, Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Profile() {
  const { data: profile } = useUserProfile();
  const { logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    displayName: "",
    avatarArchetype: "",
    age: "",
    height: "",
    weight: "",
    equipment: [] as string[],
    activities: [] as string[]
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.user.resetProfile.path, {
        method: api.user.resetProfile.method,
      });
      if (!res.ok) throw new Error("Failed to reset profile");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      // Force reload to clear cache and redirect to onboarding
      window.location.href = "/onboarding";
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reset profile", variant: "destructive" });
    }
  });

  if (!profile) return null;

  const handleEditOpen = () => {
    setFormData({
      displayName: profile.displayName || "",
      avatarArchetype: profile.avatarArchetype || "shark-male",
      age: profile.age?.toString() || "",
      height: profile.height?.toString() || "",
      weight: profile.weight?.toString() || "",
      equipment: profile.equipment || [],
      activities: profile.activities || []
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        displayName: formData.displayName,
        avatarArchetype: formData.avatarArchetype,
        age: formData.age ? parseInt(formData.age) : undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        equipment: formData.equipment,
        activities: formData.activities
      });
      setIsOpen(false);
      toast({ title: "Profile updated", description: "Your stats have been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
  };

  const toggleEquipment = (item: string) => {
    const newEquipment = formData.equipment.includes(item)
      ? formData.equipment.filter(i => i !== item)
      : [...formData.equipment, item];
    setFormData({ ...formData, equipment: newEquipment });
  };

  const toggleActivity = (item: string) => {
    const newActivities = formData.activities.includes(item)
      ? formData.activities.filter(i => i !== item)
      : [...formData.activities, item];
    setFormData({ ...formData, activities: newActivities });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="h-48 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
      </div>

      <div className="px-6 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center relative overflow-hidden group">
            <User className="w-16 h-16 text-muted-foreground" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50" />
            <div className="absolute bottom-0 w-full bg-black/50 text-[10px] text-center py-1 text-white font-mono uppercase backdrop-blur-sm">
              Level {Math.floor(profile.xp / 1000) + 1}
            </div>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" onClick={handleEditOpen}>
                <Edit className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <Select 
                    value={formData.avatarArchetype} 
                    onValueChange={(val) => setFormData({...formData, avatarArchetype: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select avatar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shark-male">Shark (Male)</SelectItem>
                      <SelectItem value="dolphin-female">Dolphin (Female)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Equipment</Label>
                  <div className="flex flex-wrap gap-2">
                    {["Dumbbells", "Barbell", "Bench", "Kettlebell", "Pull-up Bar", "Resistance Bands", "Medicine Ball", "Treadmill", "None (Bodyweight)"].map(item => (
                      <button
                        key={item}
                        onClick={() => toggleEquipment(item)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          formData.equipment.includes(item)
                            ? "bg-green-500/20 border-green-500 text-green-500"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Activities</Label>
                  <div className="flex flex-wrap gap-2">
                    {["running", "cycling", "swimming", "hiking", "yoga", "weightlifting"].map(item => (
                      <button
                        key={item}
                        onClick={() => toggleActivity(item)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          formData.activities.includes(item)
                            ? "bg-purple-500/20 border-purple-500 text-purple-500"
                            : "bg-white/5 border-white/10 text-muted-foreground"
                        }`}
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-3xl font-display font-bold uppercase mb-1">
          {profile.displayName || `User-${(profile.userId || 'test').slice(0, 4)}`}
        </h1>
        <p className="text-primary font-mono text-sm uppercase tracking-wider mb-8">
          {profile.avatarArchetype === "shark-male" ? "Shark" : profile.avatarArchetype === "dolphin-female" ? "Dolphin" : profile.avatarArchetype} Class
        </p>

        <div className="space-y-6">
          <section>
             <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Stats</h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-white mb-1">{profile.xp}</div>
                  <div className="text-xs text-muted-foreground uppercase">Total XP</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-white mb-1">{profile.completedNodeIds?.length || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase">Missions Complete</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-orange-400 mb-1">{profile.streak}</div>
                  <div className="text-xs text-muted-foreground uppercase">Day Streak</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-yellow-400 mb-1">{profile.coins}</div>
                  <div className="text-xs text-muted-foreground uppercase">Coins</div>
                </div>
             </div>
          </section>

          <section>
             <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Physical</h2>
             <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                  <div className="text-xl font-display font-bold text-white mb-1">{profile.age || "-"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Age</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                  <div className="text-xl font-display font-bold text-white mb-1">{profile.height ? `${profile.height}cm` : "-"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Height</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl text-center">
                  <div className="text-xl font-display font-bold text-white mb-1">{profile.weight ? `${profile.weight}kg` : "-"}</div>
                  <div className="text-[10px] text-muted-foreground uppercase">Weight</div>
                </div>
             </div>
          </section>

          {(profile.equipment?.length > 0) && (
            <section>
              <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Equipment</h2>
              <div className="flex flex-wrap gap-2">
                {profile.equipment.map((item: string) => (
                  <span key={item} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                    {item}
                  </span>
                ))}
              </div>
            </section>
          )}

          {(profile.activities?.length > 0) && (
            <section>
              <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Activities</h2>
              <div className="flex flex-wrap gap-2">
                {profile.activities.map((item: string) => (
                  <span key={item} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </span>
                ))}
              </div>
            </section>
          )}

          <div className="space-y-4 mt-8">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setLocation("/settings")}
              data-testid="button-settings"
            >
              <Bell className="w-4 h-4 mr-2" /> Notifications & Settings
            </Button>

            <Button 
              variant="outline" 
              className="w-full text-destructive border-destructive/20 hover:bg-destructive/10" 
              onClick={() => {
                if (confirm("Are you sure? This will delete all your progress and redirect you to onboarding.")) {
                  resetMutation.mutate();
                }
              }}
              disabled={resetMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" /> 
              {resetMutation.isPending ? "Resetting..." : "Reset Journey (Dev)"}
            </Button>

            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </div>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}
