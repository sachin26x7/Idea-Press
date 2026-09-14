import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Camera, MapPin, BriefcaseBusiness, Globe, Save, Sparkles } from 'lucide-react';

const emptyProfile = { name: '', bio: '', work: '', location: '', website: '' };

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProfile);
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState('');
  const [interests, setInterests] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const loadProfile = async () => {
      try {
        const response = await axios.get(`/api/profiles/${user._id}`);
        const profile = response.data.user;
        setForm({
          name: profile.name || '',
          bio: profile.bio || '',
          work: profile.work || '',
          location: profile.location || '',
          website: profile.website || '',
        });
        setPreview(profile.avatar || '');
        setInterests(profile.interests || []);
      } catch {
        setForm({
          name: user.name || '',
          bio: user.bio || '',
          work: user.work || '',
          location: user.location || '',
          website: user.website || '',
        });
        setPreview(user.avatar || '');
        setInterests(user.interests || []);
      }
    };
    loadProfile();
  }, [user, navigate]);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatar(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (avatar) data.append('avatar', avatar);

    try {
      const response = await axios.put('/api/auth/profile', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      updateUser(response.data.user);
      setAvatar(null);
      setMessage('Profile saved successfully.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className="max-w-4xl mx-auto pb-16">
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[220px_1fr] gap-8 bg-card border border-border rounded-[var(--radius)] p-6 md:p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {preview ? (
              <img src={preview} alt="Profile preview" className="w-40 h-40 rounded-full object-cover border-4 border-primary/40" />
            ) : (
              <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl font-black text-on-dark">
                {form.name.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <label htmlFor="avatar" className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary/80 transition-colors" title="Choose profile picture">
              <Camera size={20} />
              <input id="avatar" type="file" accept="image/*" onChange={handleAvatar} className="sr-only" />
            </label>
          </div>
          <p className="text-xs text-muted-foreground text-center">JPG, PNG, WEBP up to 5 MB</p>
        </div>

        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <label className="space-y-2 text-sm font-medium">
              Display name
              <Input name="name" value={form.name} onChange={handleChange} maxLength={80} required />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Work / custom field
              <Input name="work" value={form.work} onChange={handleChange} maxLength={120} placeholder="Product designer, student, founder..." />
            </label>
            <label className="space-y-2 text-sm font-medium flex flex-col gap-2">
              <span className="flex items-center gap-2"><MapPin size={15} /> Location</span>
              <Input name="location" value={form.location} onChange={handleChange} maxLength={120} placeholder="City, Country" />
            </label>
            <label className="space-y-2 text-sm font-medium flex flex-col gap-2">
              <span className="flex items-center gap-2"><Globe size={15} /> Website</span>
              <Input name="website" value={form.website} onChange={handleChange} maxLength={240} placeholder="https://example.com" />
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium flex flex-col gap-2">
            <span className="flex items-center gap-2"><BriefcaseBusiness size={15} /> About you</span>
            <textarea name="bio" value={form.bio} onChange={handleChange} maxLength={500} rows={5} placeholder="What do you write about?" className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" />
          </label>
          <div className="flex items-center justify-between gap-4">
            <p className={`text-sm font-medium ${message.includes('successfully') ? 'text-primary' : 'text-destructive'}`}>{message}</p>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={saving} className="gap-2"><Save size={16} />{saving ? 'Saving...' : 'Save profile'}</Button>
            </div>
          </div>
        </div>
      </form>
      <section className="mt-8 rounded-[var(--radius)] border border-border bg-card p-6 shadow-[var(--shadow-card)]" aria-labelledby="interests-heading">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-semibold">Personalization</p>
            <h2 id="interests-heading" className="mt-1 text-2xl font-bold">Your interests</h2>
            <p className="mt-1 text-sm text-muted-foreground">Shape the topics you want to discover.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate('/interests')} className="gap-2"><Sparkles size={16} />Update interests</Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {interests.length > 0 ? interests.map((interest) => <span key={interest} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{interest}</span>) : <span className="text-sm text-muted-foreground">No interests selected yet.</span>}
        </div>
      </section>
    </section>
  );
}
