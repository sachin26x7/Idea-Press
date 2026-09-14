import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, BookOpen, Image as ImageIcon, PenLine, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeWriters: 0, publishedBlogs: 0 });
  const [prismRotation, setPrismRotation] = useState({ x: -18, y: -28, z: 2 });
  const [isPrismManual, setIsPrismManual] = useState(false);
  const prismDrag = useRef(null);
  const autoResumeTimer = useRef(null);
  const autoSpinRef = useRef(null);
  const autoSpinAngle = useRef(-28);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/blogs');
      const blogs = data.blogs || [];

      // Count unique authors (active writers)
      const uniqueAuthors = new Set(blogs.map(blog => blog.author?._id));

      // Count total published blogs
      const totalBlogs = blogs.length;

      setStats({
        activeWriters: uniqueAuthors.size,
        publishedBlogs: totalBlogs
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      await fetchStats();
    };

    loadStats();
    
  }, [fetchStats]);

  // Auto-spin: continuously increment Y when not manual
  useEffect(() => {
    const tick = () => {
      if (!isPrismManual) {
        autoSpinAngle.current += 0.4;
        setPrismRotation(prev => ({ ...prev, y: autoSpinAngle.current }));
      }
    };
    autoSpinRef.current = setInterval(tick, 16);
    return () => clearInterval(autoSpinRef.current);
  }, [isPrismManual]);

  const handlePrismPointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    // Cancel any pending auto-resume
    if (autoResumeTimer.current) clearTimeout(autoResumeTimer.current);
    prismDrag.current = { x: event.clientX, y: event.clientY, rotation: { ...prismRotation } };
    setIsPrismManual(true);
  };

  const handlePrismPointerMove = (event) => {
    if (!prismDrag.current) return;
    const deltaX = event.clientX - prismDrag.current.x;
    const deltaY = event.clientY - prismDrag.current.y;
    const newX = prismDrag.current.rotation.x - deltaY * 0.4;
    const newY = prismDrag.current.rotation.y + deltaX * 0.5;
    autoSpinAngle.current = newY; // keep auto-spin in sync
    setPrismRotation({ x: newX, y: newY, z: prismDrag.current.rotation.z });
  };

  const handlePrismPointerUp = (event) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    prismDrag.current = null;
    // Resume auto-spin after 2.5 s of inactivity
    autoResumeTimer.current = setTimeout(() => setIsPrismManual(false), 2500);
  };

  const galleries = [
    { label: 'Visual notes', tone: 'coral' },
    { label: 'Tech & craft', tone: 'pine' },
    { label: 'Slow living', tone: 'ochre' },
    { label: 'Culture', tone: 'clay' },
  ];

  return (
    <div className="landing-page min-h-screen overflow-hidden -mx-4 px-4 sm:px-8 lg:px-12">
      <div className="landing-grid fixed inset-0 -z-10 pointer-events-none"></div>
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="landing-hero max-w-7xl mx-auto pt-12 sm:pt-20 pb-20"
      >
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-8 items-center min-h-[510px]">
          <div className="max-w-xl">
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="landing-kicker"><Sparkles size={15} /> A living notebook for curious people</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="landing-title mt-6">Inspiration<br /><span>is everywhere.</span></motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="landing-copy mt-7">A focused place to collect ideas, tell better stories, and find the people making thoughtful things.</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} className="flex flex-wrap items-center gap-3 mt-8">
              <button onClick={() => navigate('/register')} className="landing-primary">Get started <ArrowUpRight size={18} /></button>
              <button onClick={() => navigate('/login')} className="landing-secondary">Login to explore</button>
            </motion.div>
          </div>
          <div className="landing-collage relative min-h-[390px] sm:min-h-[460px]" aria-label="An animated three dimensional prism representing ideas">
            <div
              className="landing-prism-scene"
              role="img"
              tabIndex="0"
              aria-label="Interactive 4D blog ideas box. Drag to rotate."
              onPointerDown={handlePrismPointerDown}
              onPointerMove={handlePrismPointerMove}
              onPointerUp={handlePrismPointerUp}
            >
              <div
                className={`landing-prism ${isPrismManual ? 'landing-prism-manual' : ''}`}
                style={{ transform: `rotateX(${prismRotation.x}deg) rotateY(${prismRotation.y}deg) rotateZ(${prismRotation.z}deg)` }}
              >
                <div className="landing-prism-face landing-prism-front"><BookOpen size={34} /><span>IDEA<br />PRESS</span></div>
                <div className="landing-prism-face landing-prism-back"><span className="landing-prism-face-label">SHARE</span></div>
                <div className="landing-prism-face landing-prism-side"><span className="landing-prism-face-label">BLOGS</span></div>
                <div className="landing-prism-face landing-prism-side-left"><span className="landing-prism-face-label">IDEAS</span></div>
                <div className="landing-prism-face landing-prism-top"><span className="landing-prism-face-label">WRITE</span></div>
                <div className="landing-prism-face landing-prism-bottom"><span className="landing-prism-face-label">READ</span></div>
              </div>
            </div>
            <div className="landing-orbit landing-orbit-one"></div>
            <div className="landing-orbit landing-orbit-two"></div>
            <div className="landing-note landing-note-one"><PenLine size={15} /> write what stays with you</div>
            <div className="landing-note landing-note-two">read / make / repeat</div>
            <div className="landing-float-card landing-float-card-one"><span>01</span><strong>Collect</strong><small>the spark</small></div>
            <div className="landing-float-card landing-float-card-two"><span>02</span><strong>Share</strong><small>the point of view</small></div>
          </div>
        </div>
      </motion.section>
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="landing-stats max-w-7xl mx-auto mb-20" aria-label="IdeaPress community statistics">
        <div><strong>{stats.activeWriters}</strong><span>People writing</span></div>
        <div><strong>{stats.publishedBlogs}</strong><span>Stories published</span></div>
        <div><strong>{galleries.length}</strong><span>Curated spaces</span></div>
      </motion.section>
      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} id="featured" className="max-w-7xl mx-auto pb-20">
        <div className="landing-section-head"><div><p className="landing-eyebrow">Curated corners</p><h2>Galleries</h2></div><span>{stats.activeWriters || 0} voices in the room</span></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {galleries.map((gallery, index) => <button key={gallery.label} onClick={() => navigate('/all-blogs')} className={`landing-gallery landing-gallery-${gallery.tone}`}><ImageIcon size={18} /><strong>{gallery.label}</strong><span>Explore collection <ArrowUpRight size={14} /></span><i className={`landing-gallery-shape landing-gallery-shape-${index}`}></i></button>)}
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }} className="max-w-7xl mx-auto pb-16"><div className="landing-invite"><div><p className="landing-eyebrow">Make something memorable</p><h2>Collect and share<br /><span>what inspires you.</span></h2></div><button onClick={() => navigate('/register')} className="landing-primary">Create your space <ArrowUpRight size={18} /></button></div></motion.section>

      <footer className="max-w-7xl mx-auto border-t border-[rgba(23,42,37,.16)] py-8 flex flex-col md:flex-row gap-5 justify-between text-xs text-[#66746e]"><span className="flex items-center gap-2 text-[#172a25]"><span className="landing-mark"><BookOpen size={13} /></span> IdeaPress</span><span>Read slowly. Write honestly. Stay curious.</span><span>{stats.publishedBlogs} published ideas</span></footer>
    </div>
  );
}
