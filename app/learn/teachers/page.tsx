'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTeachers } from '@/app/context/teacher-context';
import { renderAvatar, getAvatarPreset } from '@/app/components/avatar/avatar-utils';
import BookingModal from '@/app/learn/booking-modal';
import GeometricPattern from '@/app/components/ui/geometric-pattern';
import styles from './teachers.module.css';

const AVAILABLE_SUBJECTS = [
  'Tajweed & Recitation',
  'Arabic Language',
  'Islamic Jurisprudence (Fiqh)',
  'Core Creed (Aqidah)',
  'Prophetic Traditions (Hadith)',
  'Quran Memorization (Hifz)',
  'Prophetic Biography (Seerah)',
];

const AVATAR_PRESETS = [
  { id: 'preset-1', label: 'Preset 1' },
  { id: 'preset-2', label: 'Preset 2' },
  { id: 'preset-3', label: 'Preset 3' },
  { id: 'preset-4', label: 'Preset 4' },
];

export default function ConfirmedTeachersPage() {
  const { teachers, addTeacher, removeTeacher } = useTeachers();

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [maxRate, setMaxRate] = useState<string>('all');
  const [ijazahOnly, setIjazahOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc' | 'students' | 'newest'>('rating');

  // Modals & UI state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // New Teacher Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    hourlyRate: 25,
    qualifications: '',
    avatarId: 'preset-1',
    ijazah: true,
    subjects: ['Tajweed & Recitation'] as string[],
  });

  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return (
      searchQuery.trim() !== '' ||
      selectedSubject !== 'all' ||
      maxRate !== 'all' ||
      ijazahOnly ||
      sortBy !== 'rating'
    );
  }, [searchQuery, selectedSubject, maxRate, ijazahOnly, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('all');
    setMaxRate('all');
    setIjazahOnly(false);
    setSortBy('rating');
  };

  // Filtered & Sorted teachers list
  const filteredTeachers = useMemo(() => {
    let result = teachers.filter((teacher) => {
      const matchesSearch =
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.bio.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        selectedSubject === 'all' || teacher.subjects.includes(selectedSubject);

      const matchesPrice =
        maxRate === 'all' || (teacher.hourlyRate || 25) <= Number(maxRate);

      const matchesIjazah = !ijazahOnly || Boolean(teacher.ijazah);

      return matchesSearch && matchesSubject && matchesPrice && matchesIjazah;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
      if (sortBy === 'price-asc') return (a.hourlyRate || 25) - (b.hourlyRate || 25);
      if (sortBy === 'price-desc') return (b.hourlyRate || 25) - (a.hourlyRate || 25);
      if (sortBy === 'students') return (b.students || 0) - (a.students || 0);
      if (sortBy === 'newest')
        return new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime();
      return 0;
    });
  }, [teachers, searchQuery, selectedSubject, maxRate, ijazahOnly, sortBy]);

  const handleToggleSubject = (subject: string) => {
    setFormData((prev) => {
      const exists = prev.subjects.includes(subject);
      if (exists) {
        if (prev.subjects.length === 1) return prev; // Keep at least one
        return { ...prev, subjects: prev.subjects.filter((s) => s !== subject) };
      } else {
        return { ...prev, subjects: [...prev.subjects, subject] };
      }
    });
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter teacher full name.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formData.bio.trim()) {
      setFormError('Please provide a brief bio or teaching summary.');
      return;
    }
    if (formData.subjects.length === 0) {
      setFormError('Please select at least one teaching subject.');
      return;
    }

    const qualArray = formData.qualifications
      ? formData.qualifications.split(',').map((s) => s.trim()).filter(Boolean)
      : ['Certified Quran & Islamic Educator'];

    const created = addTeacher({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || '+1 555-0100',
      bio: formData.bio.trim(),
      subjects: formData.subjects,
      hourlyRate: Number(formData.hourlyRate) || 25,
      qualifications: qualArray,
      avatarId: formData.avatarId,
      ijazah: formData.ijazah,
      verified: true,
      rating: 5.0,
      students: 0,
    });

    // Reset Form
    setFormData({
      name: '',
      email: '',
      phone: '',
      bio: '',
      hourlyRate: 25,
      qualifications: '',
      avatarId: 'preset-1',
      ijazah: true,
      subjects: ['Tajweed & Recitation'],
    });

    setIsAddModalOpen(false);
    setSuccessToast(`Teacher "${created.name}" successfully added to confirmed list!`);

    setTimeout(() => {
      setSuccessToast('');
    }, 4000);
  };

  return (
    <div className={styles.container}>
      <GeometricPattern showOverlay={false} fixed={true} />

      <div className={styles.innerWrapper}>
        {/* Top Header Navigation */}
        <div className={styles.topBar}>
          <Link href="/learn" className={styles.backBtn} title="Back to Learn Hub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5"></path>
              <path d="M12 19l-7-7 7-7"></path>
            </svg>
          </Link>
        </div>

        {/* Hero Header */}
        <motion.div
          className={styles.heroHeader}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className={styles.heroBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Confirmed Educators Directory
          </span>
          <h1 className={styles.heroTitle}>Confirmed Quran Teachers</h1>
          <p className={styles.heroSubtitle}>
            Explore, filter, and connect with certified Islamic scholars and Tajweed instructors on Safir Qur'an.
          </p>
        </motion.div>

        {/* Success Toast */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#15803d',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              ✓ {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rich Interactive Control Panel */}
        <div className={styles.controlPanel}>
          <div className={styles.topControlRow}>
            <div className={styles.searchBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search teachers by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <button
              className={styles.addBtn}
              onClick={() => setIsAddModalOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              Add Confirmed Teacher
            </button>
          </div>

          {/* Interactive Filter Grid */}
          <div className={styles.filterGrid}>
            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Subjects</option>
                {AVAILABLE_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Max Hourly Rate</label>
              <select
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Any Price</option>
                <option value="20">Under $20/hr</option>
                <option value="25">Under $25/hr</option>
                <option value="30">Under $30/hr</option>
                <option value="50">Under $50/hr</option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={styles.filterSelect}
              >
                <option value="rating">Highest Rated ⭐</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="students">Most Popular</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            <div className={styles.filterField}>
              <label className={styles.filterLabel}>Certifications</label>
              <label className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={ijazahOnly}
                  onChange={(e) => setIjazahOnly(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <span>Ijazah Certified Only</span>
              </label>
            </div>
          </div>

          {/* Results Counter & Reset Button Row */}
          <div className={styles.resultsMetaRow}>
            <span>
              Showing {filteredTeachers.length} of {teachers.length} confirmed teachers
            </span>

            {isFilterActive && (
              <button onClick={resetFilters} className={styles.resetBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                Reset All Filters
              </button>
            )}
          </div>
        </div>

        {/* Teachers Grid */}
        <div className={styles.teachersGrid}>
          {filteredTeachers.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h3>No Confirmed Teachers Match Filters</h3>
              <p>Try adjusting your search criteria or resetting filters to see available teachers.</p>
              {isFilterActive && (
                <button onClick={resetFilters} className={styles.resetBtn} style={{ marginTop: '1rem' }}>
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            filteredTeachers.map((teacher, index) => (
              <motion.div
                key={teacher.id}
                className={styles.teacherCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.avatarRing}>
                    {renderAvatar(getAvatarPreset(teacher.avatarId), teacher.name, 58)}
                    {teacher.verified && (
                      <div className={styles.verifiedBadge} title="Confirmed Educator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className={styles.headerInfoCol}>
                    <div className={styles.nameAndRateRow}>
                      <h3 className={styles.teacherName}>{teacher.name}</h3>
                      <span className={styles.rateBadge}>${teacher.hourlyRate || 25}/hr</span>
                    </div>

                    <div className={styles.verifiedLabel}>
                      <span>Confirmed Educator</span>
                      {teacher.ijazah && <span>• Ijazah Certified</span>}
                    </div>
                  </div>
                </div>

                <p className={styles.bio}>
                  {teacher.bio}
                </p>

                <div className={styles.subjectList}>
                  {teacher.subjects.map((sub, i) => (
                    <span key={i} className={styles.subjectChip}>
                      {sub}
                    </span>
                  ))}
                </div>

                <div className={styles.cardFooter}>
                  <button
                    className={styles.bookBtn}
                    onClick={() => setIsBookingOpen(true)}
                  >
                    Book Class
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"></path>
                    </svg>
                  </button>

                  <button
                    className={styles.removeBtn}
                    title="Remove Teacher"
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove "${teacher.name}"?`)) {
                        removeTeacher(teacher.id);
                      }
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add Confirmed Teacher Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className={styles.modalBackdrop}>
            <motion.div
              className={styles.modalCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Add Confirmed Teacher</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {formError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  ⚠️ {formError}
                </div>
              )}

              <form onSubmit={handleCreateTeacher}>
                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sheikh Omar Farooq"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. omar.farooq@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Hourly Rate ($/hr)</label>
                    <input
                      type="number"
                      min="5"
                      max="200"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className={styles.input}
                    />
                  </div>

                  <div>
                    <label className={styles.label}>Phone Number</label>
                    <input
                      type="text"
                      placeholder="+1 555-0199"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Avatar Preset</label>
                    <select
                      value={formData.avatarId}
                      onChange={(e) => setFormData({ ...formData, avatarId: e.target.value })}
                      className={styles.select}
                    >
                      {AVATAR_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Teaching Subjects * (Select all that apply)</label>
                    <div className={styles.subjectSelector}>
                      {AVAILABLE_SUBJECTS.map((sub) => {
                        const active = formData.subjects.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            className={`${styles.subjectSelectChip} ${active ? styles.subjectSelectChipActive : ''}`}
                            onClick={() => handleToggleSubject(sub)}
                          >
                            {active ? '✓ ' : '+ '}
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Qualifications & Degrees (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="e.g. Ijazah in Ten Qira'at, B.A. Islamic Shariah"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.label}>Bio & Background *</label>
                    <textarea
                      placeholder="Enter teacher bio, teaching experience, and specializations..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className={styles.textarea}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn}>
                  Confirm & Add Teacher
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
      />
    </div>
  );
}
