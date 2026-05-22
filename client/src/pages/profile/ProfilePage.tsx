import { useState, useEffect } from "react";
import { usersApi, type UserDto } from "../../api_services/users/UsersAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import {
  PageHeader, Card, Input, Btn, Spinner, ErrorBox, SuccessBox
} from "../../components/ui/UI";

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [realName, setRealName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    usersApi.getMe().then(r => {
      if (r.success && r.data) {
        setProfile(r.data);
        setRealName(r.data.real_name ?? "");
        setAvatarUrl(r.data.avatar_url ?? "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await usersApi.updateProfile({
      real_name: realName || undefined,
      avatar_url: avatarUrl || undefined,
    });
    if (res.success) {
      setSuccess("Profil ažuriran!");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(res.message ?? "Greška pri čuvanju");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>;

  return (
    <div>
      <PageHeader eyebrow="Nalog" title="Podešavanja profila" />

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {success && <div className="mb-4"><SuccessBox message={success} /></div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Avatar */}
        <Card className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-cyan-500/20 flex items-center justify-center mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-emerald-600">{user?.username?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <p className="text-base font-bold text-white mb-0.5">{user?.username}</p>
          <p className="text-xs text-gray-500 mb-2">{profile?.email}</p>
          <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
            user?.role === "admin"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-emerald-50 text-emerald-600 border-cyan-500/20"
          }`}>
            {user?.role === "admin" ? "Administrator" : "Igrač"}
          </span>
        </Card>

        {/* Form */}
        <div className="col-span-2">
          <Card>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-5">Podaci profila</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Korisničko ime (gamer tag)</label>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                    {user?.username}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Gamer tag se ne može menjati</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1.5">Email</label>
                  <div className="bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed">
                    {profile?.email}
                  </div>
                </div>
              </div>
              <Input
                label="Pravo ime (opciono)"
                value={realName}
                onChange={setRealName}
                placeholder="npr. Marko Marković"
              />
              <Input
                label="URL profilne slike (opciono)"
                value={avatarUrl}
                onChange={setAvatarUrl}
                placeholder="https://..."
              />
              <div className="flex justify-end pt-2">
                <Btn onClick={handleSave} disabled={saving}>
                  {saving ? <Spinner size={14} /> : "Sačuvaj promene"}
                </Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
