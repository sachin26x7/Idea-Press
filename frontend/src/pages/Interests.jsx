import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { ArrowRight, Check, Loader2, Sparkles } from 'lucide-react';

const interestOptions = [
  'Insight', 'Newsletter', 'Tips', 'Success Stories', 'Culture', 'Technology',
  'Business', 'Design', 'Lifestyle', 'Education', 'Science', 'Career', 'Travel', 'Opinion'
];

export default function Interests() {
  const { user, updateUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selected, setSelected] = useState(user?.interests || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const requiresMinimum = !user?.interestsCompleted;

  const toggleInterest = (interest) => {
    setSelected((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : current.length < 8 ? [...current, interest] : current);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (requiresMinimum && selected.length < 3) {
      setError('Please choose at least 3 interests to continue.');
      return;
    }
    setSaving(true);
    setError('');
    const data = new FormData();
    data.append('interests', JSON.stringify(selected));

    try {
      const response = await axios.put('/api/auth/profile', data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      updateUser(response.data.user);
      navigate('/all-blogs', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your interests.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <main className="interests-page">
      <section className="interests-card" aria-labelledby="interests-title">
        <span className="write-kicker"><Sparkles size={14} /> Personalize your feed</span>
        <h1 id="interests-title">What are you curious about?</h1>
        <p>Choose at least 3 topics you want to see more often. You can change these anytime from your profile.</p>
        <form onSubmit={handleSubmit}>
          <div className="interests-grid" aria-label="Interest categories">
            {interestOptions.map((interest) => {
              const active = selected.includes(interest);
              return (
                <button type="button" key={interest} className={`interest-option ${active ? 'active' : ''}`} onClick={() => toggleInterest(interest)} aria-pressed={active}>
                  <span>{interest}</span>{active && <Check size={16} />}
                </button>
              );
            })}
          </div>
          {error && <p className="text-destructive text-sm mt-4" role="alert">{error}</p>}
          <div className="interests-actions">
            <span>{selected.length}/8 selected</span>
            <Button type="submit" disabled={saving || (requiresMinimum && selected.length < 3)} className="gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Continue <ArrowRight size={16} /></>}
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
