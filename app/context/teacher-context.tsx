'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TeacherApplication, Teacher } from '@/types/teacher';

interface TeacherContextType {
  applications: TeacherApplication[];
  teachers: Teacher[];
  submitApplication: (application: Omit<TeacherApplication, 'id' | 'status' | 'submittedAt'>) => void;
  approveApplication: (applicationId: string, adminNotes?: string) => void;
  rejectApplication: (applicationId: string, adminNotes: string) => void;
  addTeacher: (teacherData: Partial<Teacher> & { name: string; email: string; bio: string; subjects: string[] }) => Teacher;
  removeTeacher: (teacherId: string) => void;
  getApplication: (id: string) => TeacherApplication | undefined;
  getTeacher: (id: string) => Teacher | undefined;
  getTeacherByEmail: (email: string) => Teacher | undefined;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
}

const TeacherContext = createContext<TeacherContextType | undefined>(undefined);

const DEFAULT_INITIAL_TEACHERS: Teacher[] = [
  {
    id: 'teacher_default_1',
    name: 'Sheikh Ahmed Al-Mansoor',
    email: 'ahmed.almansoor@quranmaster.com',
    phone: '+1 555-0192',
    photo: '/default-avatar.png',
    avatarId: 'preset-1',
    bio: 'Over 12 years of experience teaching Tajweed and Qira\'at. Holds Ijazah with an unbroken chain in Hafs \'an Asim.',
    qualifications: ['Ijazah in Hafs \'an Asim', 'B.A. Islamic Studies, Al-Azhar University'],
    subjects: ['Tajweed & Recitation', 'Quran Memorization (Hifz)'],
    levels: ['Beginner', 'Intermediate', 'Advanced'],
    rating: 4.9,
    reviewCount: 42,
    profileUrl: '/teachers/sheikh-ahmed-al-mansoor-default-1',
    hourlyRate: 25,
    availability: 'Flexible (Morning & Evening slots)',
    ijazah: true,
    joinedAt: new Date().toISOString(),
    verified: true,
    students: 124,
    totalStudents: 124,
    status: 'approved'
  },
  {
    id: 'teacher_default_2',
    name: 'Ustadha Mariam Hassan',
    email: 'mariam.hassan@quranmaster.com',
    phone: '+1 555-0193',
    photo: '/default-avatar.png',
    avatarId: 'preset-2',
    bio: 'Specialized in teaching Classical Arabic & Tajweed for sisters and youth with interactive, engaging methods.',
    qualifications: ['M.A. Arabic Linguistics', 'Certified Tajweed Instructor'],
    subjects: ['Arabic Language', 'Tajweed & Recitation'],
    levels: ['Beginner', 'Intermediate'],
    rating: 5.0,
    reviewCount: 38,
    profileUrl: '/teachers/ustadha-mariam-hassan-default-2',
    hourlyRate: 22,
    availability: 'Weekdays & Weekends',
    ijazah: true,
    joinedAt: new Date().toISOString(),
    verified: true,
    students: 98,
    totalStudents: 98,
    status: 'approved'
  },
  {
    id: 'teacher_default_3',
    name: 'Shaykh Tariq Al-Baqillani',
    email: 'tariq.baqillani@quranmaster.com',
    phone: '+1 555-0194',
    photo: '/default-avatar.png',
    avatarId: 'preset-3',
    bio: 'Al-Azhar graduate specializing in Islamic Jurisprudence (Fiqh), Aqidah (Core Creed), and Hadith studies.',
    qualifications: ['B.A. Shariah & Law, Al-Azhar', 'Ijazah in Hadith Collections'],
    subjects: ['Islamic Jurisprudence (Fiqh)', 'Core Creed (Aqidah)', 'Prophetic Traditions (Hadith)'],
    levels: ['Intermediate', 'Advanced'],
    rating: 4.9,
    reviewCount: 31,
    profileUrl: '/teachers/shaykh-tariq-al-baqillani-default-3',
    hourlyRate: 28,
    availability: 'Evening & Weekend slots',
    ijazah: true,
    joinedAt: new Date().toISOString(),
    verified: true,
    students: 86,
    totalStudents: 86,
    status: 'approved'
  }
];

export function TeacherProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Load from localStorage
  useEffect(() => {
    const storedApplications = localStorage.getItem('teacher_applications');
    const storedTeachers = localStorage.getItem('teachers');
    
    if (storedApplications) {
      setApplications(JSON.parse(storedApplications));
    }
    
    if (storedTeachers) {
      try {
        const parsed = JSON.parse(storedTeachers);
        const uniqueTeachers = parsed.reduce((acc: Teacher[], current: Teacher) => {
          const x = acc.find(item => item.email.toLowerCase() === current.email.toLowerCase());
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        if (uniqueTeachers.length > 0) {
          setTeachers(uniqueTeachers);
        } else {
          setTeachers(DEFAULT_INITIAL_TEACHERS);
        }
      } catch (e) {
        console.error('Error loading teachers', e);
        setTeachers(DEFAULT_INITIAL_TEACHERS);
      }
    } else {
      setTeachers(DEFAULT_INITIAL_TEACHERS);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem('teacher_applications', JSON.stringify(applications));
    }
  }, [applications]);

  useEffect(() => {
    if (teachers.length > 0) {
      localStorage.setItem('teachers', JSON.stringify(teachers));
    }
  }, [teachers]);

  const submitApplication = (applicationData: Omit<TeacherApplication, 'id' | 'status' | 'submittedAt'>) => {
    const newApplication: TeacherApplication = {
      ...applicationData,
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    setApplications(prev => [newApplication, ...prev]);
  };

  const approveApplication = (applicationId: string, adminNotes?: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    // Update application status
    setApplications(prev => prev.map(app =>
      app.id === applicationId
        ? { ...app, status: 'approved' as const, reviewedAt: new Date().toISOString(), adminNotes }
        : app
    ));

    // Create teacher profile
    const newTeacher: Teacher = {
      id: `teacher_${Date.now()}`,
      name: application.personalInfo.name,
      email: application.personalInfo.email,
      phone: application.personalInfo.phone,
      photo: application.personalInfo.photo || '/default-avatar.png',
      bio: application.bio,
      qualifications: [...application.qualifications.degrees, ...application.qualifications.certifications],
      subjects: application.teachingInfo.subjects,
      levels: application.teachingInfo.levels,
      rating: 5.0,
      reviewCount: 0,
      profileUrl: `/teachers/${application.personalInfo.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      hourlyRate: application.teachingInfo.hourlyRate,
      availability: application.teachingInfo.availability,
      ijazah: application.qualifications.ijazah,
      joinedAt: new Date().toISOString(),
      verified: true, // Approved teachers are verified
      students: 0, // Initial student count
      totalStudents: 0,
      status: 'approved',
    };

    setTeachers(prev => [newTeacher, ...prev]);
  };

  const rejectApplication = (applicationId: string, adminNotes: string) => {
    // 1. Update application status
    setApplications(prev => prev.map(app =>
      app.id === applicationId
        ? { ...app, status: 'rejected' as const, reviewedAt: new Date().toISOString(), adminNotes }
        : app
    ));

    // 2. Remove from teachers list if exists (Effectively "Delete Teacher")
    const application = applications.find(app => app.id === applicationId);
    if (application) {
       setTeachers(prev => prev.filter(t => t.email !== application.personalInfo.email));
    }
  };

  const addTeacher = (teacherData: Partial<Teacher> & { name: string; email: string; bio: string; subjects: string[] }) => {
    const slug = teacherData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newTeacher: Teacher = {
      id: `teacher_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: teacherData.name,
      email: teacherData.email,
      phone: teacherData.phone || '+1 555-0100',
      photo: teacherData.photo || '/default-avatar.png',
      avatarId: teacherData.avatarId || 'preset-1',
      bio: teacherData.bio,
      qualifications: teacherData.qualifications || ['Certified Quran Instructor'],
      subjects: teacherData.subjects.length > 0 ? teacherData.subjects : ['Tajweed & Recitation'],
      levels: teacherData.levels || ['Beginner', 'Intermediate', 'Advanced'],
      rating: teacherData.rating || 5.0,
      reviewCount: teacherData.reviewCount || 1,
      profileUrl: teacherData.profileUrl || `/teachers/${slug}-${Date.now()}`,
      hourlyRate: teacherData.hourlyRate || 25,
      availability: teacherData.availability || 'Flexible availability',
      ijazah: teacherData.ijazah ?? true,
      joinedAt: new Date().toISOString(),
      verified: true,
      students: teacherData.students || 0,
      totalStudents: teacherData.totalStudents || 0,
      status: 'approved'
    };

    setTeachers(prev => [newTeacher, ...prev]);
    return newTeacher;
  };

  const removeTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(t => t.id !== teacherId));
  };

  const getApplication = (id: string) => {
    return applications.find(app => app.id === id);
  };

  const getTeacher = (idOrSlug: string) => {
    return teachers.find(teacher => 
      teacher.id === idOrSlug || 
      teacher.profileUrl.endsWith(`/${idOrSlug}`)
    );
  };

  const getTeacherByEmail = (email: string) => {
    return teachers.find(teacher => teacher.email.toLowerCase() === email.toLowerCase());
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers(prev => prev.map(teacher => 
      teacher.id === id ? { ...teacher, ...updates } : teacher
    ));
  };

  return (
    <TeacherContext.Provider
      value={{
        applications,
        teachers,
        submitApplication,
        approveApplication,
        rejectApplication,
        addTeacher,
        removeTeacher,
        getApplication,
        getTeacher,
        getTeacherByEmail,
        updateTeacher,
      }}
    >
      {children}
    </TeacherContext.Provider>
  );
}

export function useTeachers() {
  const context = useContext(TeacherContext);
  if (context === undefined) {
    throw new Error('useTeachers must be used within a TeacherProvider');
  }
  return context;
}
