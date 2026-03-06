'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import FloatingHeader from '../components/FloatingHeader';
import NeuroLoader from '../components/NeuroLoader';
import Footer from '../components/Footer';

/* ── Mock Doctor Data (production: fetched from Supabase) ── */
const DOCTORS = [
  {
    id: 'd1',
    name: 'Dr. Ananya Sharma',
    specialty: 'Neurologist',
    hospital: 'AIIMS, New Delhi',
    experience: '18 years',
    rating: 4.9,
    reviews: 342,
    avatar: null,
    initials: 'AS',
    available: true,
    nextSlot: 'Today, 3:00 PM',
    fee: '₹800',
    languages: ['English', 'Hindi'],
    bio: "Specializes in neurodegenerative disorders, with extensive research in Alzheimer's and dementia diagnostics.",
  },
  {
    id: 'd2',
    name: 'Dr. Rajesh Menon',
    specialty: 'Geriatric Psychiatrist',
    hospital: 'Fortis Hospital, Mumbai',
    experience: '14 years',
    rating: 4.8,
    reviews: 218,
    avatar: null,
    initials: 'RM',
    available: true,
    nextSlot: 'Tomorrow, 10:00 AM',
    fee: '₹700',
    languages: ['English', 'Hindi', 'Malayalam'],
    bio: 'Focuses on cognitive decline in the elderly, behavioral management, and caregiver counseling.',
  },
  {
    id: 'd3',
    name: 'Dr. Priya Nair',
    specialty: 'Neuroradiologist',
    hospital: 'Apollo Hospitals, Chennai',
    experience: '12 years',
    rating: 4.7,
    reviews: 156,
    avatar: null,
    initials: 'PN',
    available: false,
    nextSlot: 'Feb 20, 11:00 AM',
    fee: '₹900',
    languages: ['English', 'Tamil'],
    bio: 'Expert in MRI brain imaging and interpretation, specializing in early detection of neurodegenerative changes.',
  },
  {
    id: 'd4',
    name: 'Dr. Vikram Desai',
    specialty: 'Neuropsychologist',
    hospital: 'Manipal Hospital, Bangalore',
    experience: '10 years',
    rating: 4.6,
    reviews: 189,
    avatar: null,
    initials: 'VD',
    available: true,
    nextSlot: 'Today, 5:30 PM',
    fee: '₹650',
    languages: ['English', 'Hindi', 'Kannada'],
    bio: 'Provides cognitive assessments, neuropsychological testing, and rehabilitation plans for dementia patients.',
  },
  {
    id: 'd5',
    name: 'Dr. Meera Kapoor',
    specialty: 'Neurologist',
    hospital: 'Max Hospital, Gurugram',
    experience: '22 years',
    rating: 4.9,
    reviews: 487,
    avatar: null,
    initials: 'MK',
    available: true,
    nextSlot: 'Today, 4:15 PM',
    fee: '₹1200',
    languages: ['English', 'Hindi', 'Punjabi'],
    bio: 'Renowned neurologist specializing in dementia care, movement disorders, and clinical trials for neurodegenerative diseases.',
  },
  {
    id: 'd6',
    name: 'Dr. Arjun Patel',
    specialty: 'Geriatrician',
    hospital: 'Kokilaben Hospital, Mumbai',
    experience: '16 years',
    rating: 4.7,
    reviews: 264,
    avatar: null,
    initials: 'AP',
    available: false,
    nextSlot: 'Feb 21, 9:00 AM',
    fee: '₹750',
    languages: ['English', 'Hindi', 'Gujarati'],
    bio: 'Specializes in comprehensive geriatric assessment and long-term management of dementia and age-related conditions.',
  },
];

const SPECIALTIES = [
  'All',
  'Neurologist',
  'Geriatric Psychiatrist',
  'Neuroradiologist',
  'Neuropsychologist',
  'Geriatrician',
];

export default function DoctorsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [contactMode, setContactMode] = useState(null); // "chat" | "call" | "appointment"
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const chatEndRef = useRef(null);
  const router = useRouter();

  const MAX_MESSAGES_PER_SESSION = 10; // anti-spam

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        // Not signed in — redirect to auth page
        router.push('/auth');
        return;
      }
      setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredDoctors = DOCTORS.filter((d) => {
    const matchesFilter =
      activeFilter === 'All' || d.specialty === activeFilter;
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    if (messageCount >= MAX_MESSAGES_PER_SESSION) return;

    const newMessage = {
      id: Date.now(),
      sender: 'user',
      text: messageInput.trim(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');
    setMessageCount((c) => c + 1);

    // Simulate doctor auto-reply
    setTimeout(() => {
      const replies = [
        `Thank you for reaching out. I'll review your concern carefully. Could you share your recent scan report for a more accurate assessment?`,
        `I appreciate you contacting me. Based on what you've described, I'd recommend scheduling a detailed consultation. Would you like to book an appointment?`,
        `Thank you for your message. For a thorough evaluation, I'll need to see your MRI scans and medical history. You can share these securely through the platform.`,
        `I understand your concern. Neurodegenerative conditions require careful evaluation. Please share any scan results you have from the Neuroscan analysis.`,
      ];
      const autoReply = {
        id: Date.now() + 1,
        sender: 'doctor',
        text: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1500);
  };

  const handleBookAppointment = () => {
    if (!appointmentDate || !appointmentTime || !appointmentReason.trim())
      return;
    setAppointmentBooked(true);
  };

  const closeModal = () => {
    setSelectedDoctor(null);
    setContactMode(null);
    setMessages([]);
    setMessageInput('');
    setMessageCount(0);
    setAppointmentDate('');
    setAppointmentTime('');
    setAppointmentReason('');
    setAppointmentBooked(false);
    setMessageSent(false);
  };

  const openContact = (doctor, mode) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setSelectedDoctor(doctor);
    setContactMode(mode);
    setMessages([]);
    setMessageCount(0);
    setAppointmentBooked(false);
    setMessageSent(false);

    if (mode === 'chat') {
      setMessages([
        {
          id: 0,
          sender: 'system',
          text: `You're now connected with ${doctor.name}. Please describe your concern. Note: You can send up to ${MAX_MESSAGES_PER_SESSION} messages per session to respect the doctor's time.`,
          time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        },
      ]);
    }
  };

  const renderStars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    return (
      <span className='doc-stars' aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: full }).map((_, i) => (
          <svg
            key={`f${i}`}
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='var(--accent)'
            stroke='none'>
            <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
          </svg>
        ))}
        {half && (
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='var(--accent)'
            stroke='none'
            style={{ clipPath: 'inset(0 50% 0 0)' }}>
            <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
          </svg>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <FloatingHeader />
        <main className='doctors-page'>
          <div className='profile-loading'>
            <NeuroLoader size={52} color='var(--accent)' />
            <p>Loading…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <FloatingHeader />

      <main className='doctors-page'>
        {/* ─── Hero ─── */}
        <div className='doctors-hero'>
          <div className='doctors-hero-bg' aria-hidden='true'>
            <div className='profile-hero-orb profile-hero-orb-1' />
            <div className='profile-hero-orb profile-hero-orb-2' />
            <div className='profile-hero-grid' />
          </div>
          <div className='doctors-hero-content'>
            <div
              className='section-eyebrow'
              style={{
                color: 'rgba(255,255,255,0.8)',
                borderColor: 'rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
              }}>
              Expert Support
            </div>
            <h1>Consult a Specialist</h1>
            <p>
              Connect with verified neurologists, psychiatrists, and specialists
              for professional guidance on your scan results. Chat, call, or
              book an appointment — all in one place.
            </p>
          </div>
        </div>

        {/* ─── Trust Badges ─── */}
        <div className='doctors-trust-bar'>
          <div className='trust-badge'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--accent)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            </svg>
            <span>Verified Doctors</span>
          </div>
          <div className='trust-badge'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--accent)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
              <path d='M7 11V7a5 5 0 0 1 10 0v4' />
            </svg>
            <span>End-to-End Encrypted</span>
          </div>
          <div className='trust-badge'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--accent)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <circle cx='12' cy='12' r='10' />
              <polyline points='12 6 12 12 16 14' />
            </svg>
            <span>Quick Response</span>
          </div>
          <div className='trust-badge'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--accent)'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'>
              <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
              <circle cx='8.5' cy='7' r='4' />
              <line x1='20' y1='8' x2='20' y2='14' />
              <line x1='23' y1='11' x2='17' y2='11' />
            </svg>
            <span>Anti-Spam Protected</span>
          </div>
        </div>

        {/* ─── Filters & Search ─── */}
        <div className='doctors-content'>
          <div className='doctors-toolbar'>
            <div className='doctors-search'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
              <input
                type='text'
                placeholder='Search doctors, specialties, hospitals…'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='doctors-search-input'
              />
            </div>
            <div className='doctors-filters'>
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  className={`doctors-filter-btn ${activeFilter === s ? 'active' : ''}`}
                  onClick={() => setActiveFilter(s)}
                  type='button'>
                  {s}
                </button>
              ))}
            </div>
          </div>


          {filteredDoctors.length === 0 ? (
            <div className='doctors-empty'>
              <svg
                width='48'
                height='48'
                viewBox='0 0 24 24'
                fill='none'
                stroke='var(--gray-300)'
                strokeWidth='1.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <circle cx='11' cy='11' r='8' />
                <line x1='21' y1='21' x2='16.65' y2='16.65' />
              </svg>
              <h3>No doctors found</h3>
              <p>Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className='doctors-grid'>
              {filteredDoctors.map((doc) => (
                <div className='doctor-card' key={doc.id}>
                  <div className='doctor-card-header'>
                    <div className='doctor-avatar'>
                      {doc.initials}
                      <span
                        className={`doctor-status ${doc.available ? 'online' : 'offline'}`}
                      />
                    </div>
                    <div className='doctor-header-info'>
                      <h3>{doc.name}</h3>
                      <p className='doctor-specialty'>{doc.specialty}</p>
                      <div className='doctor-rating'>
                        {renderStars(doc.rating)}
                        <span className='doctor-rating-num'>{doc.rating}</span>
                        <span className='doctor-reviews'>({doc.reviews})</span>
                      </div>
                    </div>
                  </div>

                  <div className='doctor-card-body'>
                    <p className='doctor-bio'>{doc.bio}</p>
                    <div className='doctor-details'>
                      <div className='doctor-detail'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' />
                          <circle cx='12' cy='10' r='3' />
                        </svg>
                        {doc.hospital}
                      </div>
                      <div className='doctor-detail'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <rect
                            x='2'
                            y='7'
                            width='20'
                            height='14'
                            rx='2'
                            ry='2'
                          />
                          <path d='M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16' />
                        </svg>
                        {doc.experience} experience
                      </div>
                      <div className='doctor-detail'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <circle cx='12' cy='12' r='10' />
                          <polyline points='12 6 12 12 16 14' />
                        </svg>
                        Next: {doc.nextSlot}
                      </div>
                      <div className='doctor-detail'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <line x1='12' y1='1' x2='12' y2='23' />
                          <path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                        </svg>
                        Consultation: {doc.fee}
                      </div>
                    </div>
                    <div className='doctor-languages'>
                      {doc.languages.map((l) => (
                        <span key={l} className='doctor-lang-tag'>
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className='doctor-card-actions'>
                    <button
                      className='doc-action-btn doc-chat-btn'
                      onClick={() => openContact(doc, 'chat')}
                      type='button'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                      </svg>
                      Chat
                    </button>
                    <button
                      className='doc-action-btn doc-call-btn'
                      onClick={() => openContact(doc, 'call')}
                      type='button'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
                      </svg>
                      Call
                    </button>
                    <button
                      className='doc-action-btn doc-appt-btn'
                      onClick={() => openContact(doc, 'appointment')}
                      type='button'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <rect
                          x='3'
                          y='4'
                          width='18'
                          height='18'
                          rx='2'
                          ry='2'
                        />
                        <line x1='16' y1='2' x2='16' y2='6' />
                        <line x1='8' y1='2' x2='8' y2='6' />
                        <line x1='3' y1='10' x2='21' y2='10' />
                      </svg>
                      Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── How It Works ─── */}
        <div className='doctors-how-section'>
          <h2>How Doctor Support Works</h2>
          <div className='doctors-how-grid'>
            <div className='doctors-how-card'>
              <div className='doctors-how-num'>1</div>
              <h4>Browse Specialists</h4>
              <p>
                Filter by specialty, availability, or search by name. All
                doctors are verified and experienced in neurodegenerative
                conditions.
              </p>
            </div>
            <div className='doctors-how-card'>
              <div className='doctors-how-num'>2</div>
              <h4>Share Your Scans</h4>
              <p>
                Securely share your Neuroscan analysis results with your chosen
                doctor for an informed consultation.
              </p>
            </div>
            <div className='doctors-how-card'>
              <div className='doctors-how-num'>3</div>
              <h4>Get Expert Guidance</h4>
              <p>
                Receive professional medical advice through chat, voice call, or
                scheduled appointments at your convenience.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Contact Modal ─── */}
      {selectedDoctor && contactMode && (
        <div className='doc-modal-backdrop' onClick={closeModal}>
          <div className='doc-modal' onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className='doc-modal-header'>
              <div className='doc-modal-doc-info'>
                <div className='doctor-avatar small'>
                  {selectedDoctor.initials}
                  <span
                    className={`doctor-status ${selectedDoctor.available ? 'online' : 'offline'}`}
                  />
                </div>
                <div>
                  <h3>{selectedDoctor.name}</h3>
                  <p>{selectedDoctor.specialty}</p>
                </div>
              </div>
              <div className='doc-modal-header-right'>
                {contactMode === 'chat' && (
                  <span className='doc-msg-counter'>
                    {messageCount}/{MAX_MESSAGES_PER_SESSION} messages
                  </span>
                )}
                <button
                  className='report-modal-close'
                  onClick={closeModal}
                  type='button'
                  aria-label='Close'>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Chat Mode */}
            {contactMode === 'chat' && (
              <div className='doc-chat-container'>
                <div className='doc-chat-messages'>
                  {messages.map((msg) => (
                    <div key={msg.id} className={`doc-chat-msg ${msg.sender}`}>
                      {msg.sender === 'system' ? (
                        <div className='doc-chat-system'>{msg.text}</div>
                      ) : (
                        <>
                          <div className='doc-chat-bubble'>{msg.text}</div>
                          <span className='doc-chat-time'>{msg.time}</span>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className='doc-chat-input-bar'>
                  {messageCount >= MAX_MESSAGES_PER_SESSION ? (
                    <div className='doc-chat-limit-msg'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <circle cx='12' cy='12' r='10' />
                        <line x1='12' y1='8' x2='12' y2='12' />
                        <line x1='12' y1='16' x2='12.01' y2='16' />
                      </svg>
                      Message limit reached for this session. Please book an
                      appointment for a detailed consultation.
                    </div>
                  ) : (
                    <>
                      <input
                        type='text'
                        placeholder='Type your message…'
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && handleSendMessage()
                        }
                        className='doc-chat-input'
                        maxLength={500}
                      />
                      <button
                        className='doc-chat-send'
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        type='button'
                        aria-label='Send message'>
                        <svg
                          width='18'
                          height='18'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <line x1='22' y1='2' x2='11' y2='13' />
                          <polygon points='22 2 15 22 11 13 2 9 22 2' />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Call Mode */}
            {contactMode === 'call' && (
              <div className='doc-call-container'>
                <div className='doc-call-avatar'>{selectedDoctor.initials}</div>
                <h3>{selectedDoctor.name}</h3>
                <p className='doc-call-specialty'>
                  {selectedDoctor.specialty} • {selectedDoctor.hospital}
                </p>
                {selectedDoctor.available ? (
                  <>
                    <div className='doc-call-status available'>
                      <span className='doc-call-dot' />
                      Available Now
                    </div>
                    <p className='doc-call-note'>
                      Voice consultations are limited to 15 minutes. For longer
                      discussions, please book an appointment.
                    </p>
                    <a href='tel:+911234567890' className='doc-call-action-btn'>
                      <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z' />
                      </svg>
                      Start Voice Call
                    </a>
                  </>
                ) : (
                  <>
                    <div className='doc-call-status unavailable'>
                      Currently Unavailable
                    </div>
                    <p className='doc-call-note'>
                      This doctor is not available for calls right now. Next
                      available: <strong>{selectedDoctor.nextSlot}</strong>
                    </p>
                    <button
                      className='doc-call-action-btn secondary'
                      onClick={() => setContactMode('appointment')}
                      type='button'>
                      <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <rect
                          x='3'
                          y='4'
                          width='18'
                          height='18'
                          rx='2'
                          ry='2'
                        />
                        <line x1='16' y1='2' x2='16' y2='6' />
                        <line x1='8' y1='2' x2='8' y2='6' />
                        <line x1='3' y1='10' x2='21' y2='10' />
                      </svg>
                      Book an Appointment Instead
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Appointment Mode */}
            {contactMode === 'appointment' && (
              <div className='doc-appt-container'>
                {appointmentBooked ? (
                  <div className='doc-appt-success'>
                    <div className='doc-appt-success-icon'>
                      <svg
                        width='48'
                        height='48'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='#059669'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
                        <polyline points='22 4 12 14.01 9 11.01' />
                      </svg>
                    </div>
                    <h3>Appointment Booked!</h3>
                    <p>
                      Your appointment with{' '}
                      <strong>{selectedDoctor.name}</strong> has been confirmed.
                    </p>
                    <div className='doc-appt-confirm-details'>
                      <div>
                        <label>Date</label>
                        <span>
                          {new Date(appointmentDate).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          )}
                        </span>
                      </div>
                      <div>
                        <label>Time</label>
                        <span>{appointmentTime}</span>
                      </div>
                      <div>
                        <label>Fee</label>
                        <span>{selectedDoctor.fee}</span>
                      </div>
                    </div>
                    <p className='doc-appt-notice'>
                      You will receive a confirmation email with meeting details
                      shortly.
                    </p>
                    <button
                      className='doc-appt-done-btn'
                      onClick={closeModal}
                      type='button'>
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className='doc-appt-title'>Book Appointment</h3>
                    <p className='doc-appt-subtitle'>
                      Schedule a consultation with {selectedDoctor.name}
                    </p>

                    <div className='doc-appt-form'>
                      <div className='doc-appt-field'>
                        <label>Preferred Date</label>
                        <input
                          type='date'
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className='doc-appt-input'
                        />
                      </div>
                      <div className='doc-appt-field'>
                        <label>Preferred Time</label>
                        <select
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className='doc-appt-input'>
                          <option value=''>Select a time slot</option>
                          <option value='09:00 AM'>09:00 AM</option>
                          <option value='10:00 AM'>10:00 AM</option>
                          <option value='11:00 AM'>11:00 AM</option>
                          <option value='02:00 PM'>02:00 PM</option>
                          <option value='03:00 PM'>03:00 PM</option>
                          <option value='04:00 PM'>04:00 PM</option>
                          <option value='05:00 PM'>05:00 PM</option>
                        </select>
                      </div>
                      <div className='doc-appt-field full'>
                        <label>Reason for Consultation</label>
                        <textarea
                          value={appointmentReason}
                          onChange={(e) => setAppointmentReason(e.target.value)}
                          placeholder='Briefly describe your concern (e.g., reviewing MRI scan results, seeking a second opinion, follow-up on diagnosis)…'
                          className='doc-appt-textarea'
                          rows={3}
                          maxLength={500}
                        />
                      </div>
                    </div>

                    <div className='doc-appt-summary'>
                      <div className='doc-appt-summary-row'>
                        <span>Consultation Fee</span>
                        <strong>{selectedDoctor.fee}</strong>
                      </div>
                      <div className='doc-appt-summary-row'>
                        <span>Duration</span>
                        <strong>30 minutes</strong>
                      </div>
                    </div>

                    <button
                      className='doc-appt-book-btn'
                      onClick={handleBookAppointment}
                      disabled={
                        !appointmentDate ||
                        !appointmentTime ||
                        !appointmentReason.trim()
                      }
                      type='button'>
                      <svg
                        width='18'
                        height='18'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
                        <polyline points='22 4 12 14.01 9 11.01' />
                      </svg>
                      Confirm Appointment
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
