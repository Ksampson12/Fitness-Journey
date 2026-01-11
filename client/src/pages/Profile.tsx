import { useState } from "react";
import { useUserProfile, useUpdateProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Edit } from "lucide-react";
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

export default function Profile() {
  const { data: profile } = useUserProfile();
  const { logout } = useAuth();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    avatarArchetype: "",
    age: "",
    height: "",
    weight: "",
  });

  if (!profile) return null;

  const handleEditOpen = () => {
    setFormData({
      avatarArchetype: profile.avatarArchetype || "rookie",
      age: profile.age?.toString() || "",
      height: profile.height?.toString() || "",
      weight: profile.weight?.toString() || "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        avatarArchetype: formData.avatarArchetype,
        age: formData.age ? parseInt(formData.age) : undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
      });
      setIsOpen(false);
      toast({ title: "Profile updated", description: "Your stats have been saved." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    }
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
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="archetype" className="text-right">
                    Avatar
                  </Label>
                  <Select 
                    value={formData.avatarArchetype} 
                    onValueChange={(val) => setFormData({...formData, avatarArchetype: val})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rookie">Rookie</SelectItem>
                      <SelectItem value="runner">Runner</SelectItem>
                      <SelectItem value="lifter">Lifter</SelectItem>
                      <SelectItem value="yogi">Yogi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="age" className="text-right">
                    Age
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="height" className="text-right">
                    Height (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({...formData, height: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weight" className="text-right">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({...formData, weight: e.target.value})}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <h1 className="text-3xl font-display font-bold uppercase mb-1">User-{profile.userId.slice(0, 4)}</h1>
        <p className="text-primary font-mono text-sm uppercase tracking-wider mb-8">{profile.avatarArchetype} Class</p>

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

          <Button 
            variant="destructive" 
            className="w-full mt-8" 
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}
