import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MapPin, BriefcaseBusiness, Globe, FileText } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import { getMediaUrl } from '../lib/media';

export default function PublicProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/profiles/${id}`);
        setProfile(response.data.user);
        setBlogs(response.data.blogs || []);
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Could not load this profile.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  if (loading) return <p className="text-center text-muted-foreground py-20">Loading profile...</p>;
  if (error) return <p className="text-center text-destructive py-20">{error}</p>;

  return (
    <section className="max-w-6xl mx-auto pb-16">
      <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-card p-6 md:p-10 mb-10 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {profile.avatar ? (
            <img src={getMediaUrl(profile.avatar)} alt={profile.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary/40 shrink-0" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-5xl font-black text-on-dark shrink-0">{profile.name?.charAt(0)}</div>
          )}
          <div className="text-center md:text-left min-w-0">
            <p className="text-sm uppercase tracking-[0.25em] text-primary font-semibold">Writer profile</p>
            <h1 className="text-4xl font-black mt-2">{profile.name}</h1>
            {profile.work && <p className="text-lg text-secondary mt-2">{profile.work}</p>}
            {profile.bio && <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">{profile.bio}</p>}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-5 text-sm text-muted-foreground">
              {profile.location && <span className="flex items-center gap-1"><MapPin size={15} />{profile.location}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe size={15} />Website</a>}
              <span className="flex items-center gap-1"><FileText size={15} />{blogs.length} {blogs.length === 1 ? 'post' : 'posts'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BriefcaseBusiness className="text-primary" size={20} />
        <h2 className="text-2xl font-bold">Published by {profile.name}</h2>
      </div>
      {blogs.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-xl py-16 text-center text-muted-foreground">No published posts yet.</div>
      )}
      <Link to="/" className="inline-block mt-8 text-primary hover:underline">Back to all posts</Link>
    </section>
  );
}
