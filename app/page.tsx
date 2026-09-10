"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import { Calendar as CalendarIcon, Menu as MenuIcon, X as XIcon } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { useArticles } from "@/app/context/article-context";
import GeometricPattern from "@/app/components/ui/geometric-pattern";

const Navbar = () => {
  const { isAuthenticated, openAuthModal, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <Image
              src="/app_logo.jpg"
              alt="Safir Qur'an"
              width={32}
              height={32}
              style={{ borderRadius: '8px', objectFit: 'cover' }}
            />
          </div>
          <div className={styles.logoText}>
            <span className={styles.brandName}>Safir Qur'an</span>
            <span className={styles.brandBadge}>Premium</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className={styles.navLinks}>
          <Link href="/quran" className={styles.navLink}>
            Read Quran
          </Link>
          <Link href="/sunnah" className={styles.navLink}>
            Sunnah
          </Link>
          <Link href="/calendar" className={`${styles.navLink} inline-flex items-center gap-1.5`}>
            <CalendarIcon size={16} className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
            <span>Calendar</span>
          </Link>
          <Link href="/learn" className={styles.navLink}>
            Learn
          </Link>

          {isAuthenticated ? (
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className={styles.dashboardBtn}
            >
              {isAdmin ? "Admin Dashboard" : "Dashboard"}
            </Link>
          ) : (
            <button onClick={openAuthModal} className={styles.loginBtn}>
              Login
            </button>
          )}
        </div>

        {/* Mobile Navigation Toggle Button */}
        <button
          className={styles.mobileMenuToggle}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={styles.mobileMenu}
          >
            <Link href="/quran" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Read Quran
            </Link>
            <Link href="/sunnah" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Sunnah
            </Link>
            <Link href="/calendar" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Calendar
            </Link>
            <Link href="/learn" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
              Learn
            </Link>
            <div className={styles.mobileMenuAuth}>
              {isAuthenticated ? (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className={styles.dashboardBtn}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isAdmin ? "Admin Dashboard" : "Dashboard"}
                </Link>
              ) : (
                <button
                  onClick={() => {
                    openAuthModal();
                    setMobileMenuOpen(false);
                  }}
                  className={styles.loginBtn}
                  style={{ width: "100%" }}
                >
                  Login
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  const { isAuthenticated, openAuthModal, isAdmin } = useAuth();

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.badge}
        >
          <span className={styles.pulse}></span>
          The Ultimate Islamic Companion
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.heroTitle}
        >
          Connect with the <br />
          <span className={styles.gradientText}>Divine Awareness</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.heroDesc}
        >
          A masterfully crafted platform for Quran reading, Sunnah studies, and
          spiritual growth. Experience the beauty of Islam with modern
          technology.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.heroButtons}
        >
          <Link href="/quran" className={styles.primaryBtn}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Start Reading
          </Link>

          {isAuthenticated ? (
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className={styles.secondaryBtn}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              {isAdmin ? "Go to Admin" : "My Dashboard"}
            </Link>
          ) : (
            <button onClick={openAuthModal} className={styles.secondaryBtn}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Login to Resume
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  link: string;
  delay: number;
}

const FeatureCard = ({ title, desc, icon, link, delay }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className={styles.featureCard}
  >
    <Link href={link} className={styles.featureCardLink}>
      <div className={styles.cardDecor}></div>
      <div className={styles.featureIcon}>{icon}</div>

      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDesc}>{desc}</p>

      <div className={styles.learnMore}>
        Explore Feature
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  </motion.div>
);

const Articles = () => {
  // Dynamically load articles from context
  // We import it here or pass it down. Since this is a client component, we can use the hook directly if we import it.
  // However, I need to make sure I import it at the top.
  // Wait, I cannot add imports with this tool easily in the middle of a file if I don't replace the top.
  // I will replace the component logic.

  // NOTE: This assumes useArticles is imported. I need to make sure I added the import in a previous step or I will have to add it now.
  // I see I only added useAuth import. I need to add useArticles import at the top of the file as well.
  // I will do that in a separate step to be safe, or if I can replace the whole file content that's safer but larger.
  // I will assume I can update the component here and then update imports.
  // Actually, I can use a simpler approach: define the component to accept articles or just use the hook if I add the import.

  // Let's rely on the next step to add the import.
  // For now, I will use window as a fallback or just empty if not available to avoid error,
  // BUT actually, I'll just change the component to use the context hook, and I'll add the import in the next tool call.

  const { articles } = useArticles();
  const latestArticles = articles
    .filter((a) => a.status === "published")
    .slice(0, 3);

  return (
    <section className={styles.articles}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Latest Insights</h2>
        <p className={styles.sectionDesc}>
          Read our latest articles to deepen your understanding of the Quran and
          Sunnah.
        </p>
      </div>
      <div className={styles.articlesGrid}>
        {latestArticles.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={styles.articleCard}
          >
            <div className={styles.articleImage}>
              <div className={styles.articleImageOverlay}></div>
              <span className={styles.articleCategory}>{article.category}</span>
            </div>
            <div className={styles.articleContent}>
              <div className={styles.articleMeta}>
                <span>{article.author}</span>
                <span>{article.publishedAt}</span>
              </div>
              <h3 className={styles.articleTitle}>{article.title}</h3>
              <p className={styles.articleExcerpt}>{article.excerpt}</p>
              <Link
                href={`/articles/${article.id}`}
                className={styles.readMoreBtn}
              >
                Read Article
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const LearningPlatform = () => {
  return (
    <section className={styles.learningPlatform}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Transform Your Quran Journey</h2>
        <p className={styles.sectionDesc}>
          Join thousands of students learning with certified teachers or become
          a teacher yourself
        </p>
      </div>

      <div className={styles.platformCards}>
        {/* Student Enrollment Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className={styles.platformCard}
        >
          <div className={styles.cardImageSection}>
            <Image
              src="/child-enjoy.jpg"
              alt="Child learning Quran joyfully"
              className={styles.cardImage}
              width={600}
              height={400}
            />
            <div className={styles.cardImageOverlay}>
              <div className={styles.cardBadge}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                <span>For Students</span>
              </div>
            </div>
          </div>

          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              Start Learning with Expert Teachers
            </h3>
            <p className={styles.cardDescription}>
              Connect with certified Quran teachers who will guide you through
              Tajweed, memorization, and understanding the divine message.
            </p>

            <ul className={styles.benefitsList}>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>50+ Certified Teachers</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Flexible Schedule</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Progress Tracking</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>One-on-One Sessions</span>
              </li>
            </ul>

            <div className={styles.cardStats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>2,500+</div>
                <div className={styles.statLabel}>Active Students</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>4.9★</div>
                <div className={styles.statLabel}>Avg Rating</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>10k+</div>
                <div className={styles.statLabel}>Sessions Completed</div>
              </div>
            </div>

            <Link href="/learn/teachers" className={styles.cardCta}>
              <span>Explore Teachers</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Teacher Recruitment Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className={`${styles.platformCard} ${styles.teacherCard}`}
        >
          <div className={styles.cardImageSection}>
            <div className={styles.teacherCardBg}>
              <svg
                className={styles.teacherIcon}
                width="120"
                height="120"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
            </div>
            <div className={styles.cardImageOverlay}>
              <div className={`${styles.cardBadge} ${styles.goldBadge}`}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <span>For Teachers</span>
              </div>
            </div>
          </div>

          <div className={styles.cardContent}>
            <h3 className={styles.cardTitle}>
              Share Your Knowledge, Inspire Hearts
            </h3>
            <p className={styles.cardDescription}>
              Join our platform as a certified teacher and make a lasting impact
              by teaching Quran to students worldwide.
            </p>

            <ul className={styles.benefitsList}>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Set Your Own Schedule</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Competitive Earnings</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Global Student Reach</span>
              </li>
              <li>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Full Platform Support</span>
              </li>
            </ul>

            <div className={styles.requirementsList}>
              <h4>Requirements:</h4>
              <div className={styles.requirements}>
                <span className={styles.requirement}>Ijazah Certificate</span>
                <span className={styles.requirement}>Teaching Experience</span>
                <span className={styles.requirement}>Fluent Arabic</span>
              </div>
            </div>

            <Link
              href="/learn/join-teacher"
              className={`${styles.cardCta} ${styles.goldCta}`}
            >
              <span>Apply as Teacher</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      title: "Advanced Reader",
      desc: "Immersive reading experience with customizable fonts, translations, and tafsir.",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      link: "/quran",
    },
    {
      title: "Sunnah Hadith",
      desc: "Access authentic Hadith collections from Sahih Al-Bukhari, Muslim, and more.",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      link: "/sunnah",
    },
    {
      title: "Learning Hub",
      desc: "Master Tajweed, memorize surahs, and track your progress with interactive tools.",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      ),
      link: "/learn",
    },
    {
      title: "Personal Journal",
      desc: "Reflect on your spiritual journey with a dedicated daily journal and activity tracking.",
      icon: (
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
      link: "/dashboard",
    },
  ];

  return (
    <section className={styles.features}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Everything you need</h2>
        <p className={styles.sectionDesc}>
          A complete ecosystem designed to help you connect deeper with your
          faith through beautiful design and powerful features.
        </p>
      </div>
      <div className={styles.featuresGrid}>
        {features.map((f, i) => (
          <FeatureCard key={i} {...f} delay={i * 0.1} />
        ))}
      </div>
    </section>
  );
};

const OurApps = () => {
  return (
    <section className={styles.ourAppsSection}>
      <div className={styles.ourAppsContainer}>
        <div className={styles.ourAppsHeader}>
          <div className={styles.ourAppsBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="3" ry="3"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
            Mobile &amp; Ecosystem
          </div>
          <h2 className={styles.ourAppsTitle}>Our Apps</h2>
          <p className={styles.ourAppsSubtitle}>
            Experience Safir Qur&apos;an anytime, anywhere. Take the divine word, audio recitations, and interactive Tajweed learning with you on all your devices.
          </p>
        </div>

        <div className={styles.ourAppsGrid}>
          {/* Main Mobile App Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={styles.mainAppCard}
          >
            <div>
              <div className={styles.mainAppHeader}>
                <div className={styles.mainAppIcon}>
                  <Image
                    src="/app_logo.jpg"
                    alt="Safir Qur'an Mobile App"
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.mainAppTitleGroup}>
                  <h3 className={styles.mainAppName}>Safir Qur&apos;an Mobile App</h3>
                  <span className={styles.mainAppTagline}>Available for iOS &amp; Android</span>
                </div>
              </div>

              <p className={styles.mainAppDesc}>
                Full-featured Quranic reading and listening experience designed for smartphones and tablets. Seamless offline access, sync across devices, and crystalline audio recitations.
              </p>

              <div className={styles.appFeaturesList}>
                <div className={styles.appFeatureItem}>
                  <span className={styles.appFeatureIcon}>📖</span>
                  <span>Interactive Mushaf Reader</span>
                </div>
                <div className={styles.appFeatureItem}>
                  <span className={styles.appFeatureIcon}>🎧</span>
                  <span>30+ Top Reciters &amp; Audio Sync</span>
                </div>


              </div>
            </div>

            <div className={styles.downloadButtonsGroup}>
              <a
                href="/downloads/Safir.apk"
                download="Safir.apk"
                className={`${styles.appStoreBtn} ${styles.apkDownloadBtn}`}
                title="Download Safir Qur'an Android APK"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997 0-.551.4482-.9993.9993-.9993.5511 0 .9993.4483.9993.9993 0 .5511-.4482.9997-.9993.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997 0-.551.4482-.9993.9993-.9993.5511 0 .9993.4483.9993.9993 0 .5511-.4482.9997-.9993.9997zm11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1523-.5676.416.416 0 00-.5676.1523l-2.0223 3.503c-1.4638-.6692-3.1364-1.046-4.9126-1.046s-3.4488.3768-4.9126 1.046l-2.0223-3.503a.416.416 0 00-.5676-.1523.416.416 0 00-.1523.5676l1.9973 3.4592c-3.134 1.7064-5.2678 4.8872-5.5404 8.6186h21.9056c-.2726-3.7314-2.4064-6.9122-5.5404-8.6186z" />
                </svg>
                <div className={styles.appStoreText}>
                  <span className={styles.appStoreSub}>Download Direct</span>
                  <span className={styles.appStoreMain}>Android APK</span>
                </div>
              </a>

              <a href="#" className={styles.appStoreBtn}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.85.96-2.93-.93.04-2.06.62-2.73 1.4-.59.69-1.11 1.79-.97 2.85 1.05.08 2.11-.54 2.74-1.32z" />
                </svg>
                <div className={styles.appStoreText}>
                  <span className={styles.appStoreSub}>Download on the</span>
                  <span className={styles.appStoreMain}>App Store</span>
                </div>
              </a>
            </div>
          </motion.div>

          {/* Web App / Progressive Web App Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className={styles.secondaryAppCard}
          >
            <div>
              <div className={styles.webPwaBadge}>
                ⚡ Progressive Web App (PWA)
              </div>
              <h3>Safir Qur&apos;an Web &amp; Desktop</h3>
              <p>
                Install Safir Qur&apos;an directly on your Mac, Windows, or Linux desktop in seconds without downloading from an app store. Instant desktop experience with offline support.
              </p>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Link href="/quran" className={styles.primaryBtn} style={{ display: 'inline-flex', width: '100%', justifyContent: 'center' }}>
                Open Web Application
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <GeometricPattern showOverlay={false} fixed={true} />
      {/* Pass no props, components use hook internally */}
      <Navbar />
      <main>
        <Hero />
        <Features />
        <LearningPlatform />
        <Articles />
        <OurApps />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Image
                  src="/app_logo.jpg"
                  alt="Safir Qur'an"
                  width={24}
                  height={24}
                  style={{ borderRadius: '6px', objectFit: 'cover' }}
                />
              </div>
              <div className={styles.logoText}>
                <span className={styles.brandName}>Safir Qur'an</span>
              </div>
            </div>
            <p>
              Built with love for the Ummah. Our mission is to make Quran
              reading and learning accessible and beautiful for everyone.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Platform</h4>
            <div className={styles.footerLinks}>
              <Link href="/quran">Read Quran</Link>
              <Link href="/sunnah">Sunnah Hadith</Link>
              <Link href="/learn">Learning Hub</Link>
              <Link href="/dashboard">Dashboard</Link>
            </div>
          </div>
          <div className={styles.footerCol}>
            <h4>Support</h4>
            <div className={styles.footerLinks}>
              <Link href="#">Help Center</Link>
              <Link href="#">Privacy Policy</Link>
              <Link href="#">Terms of Service</Link>
              <Link href="#">Contact Us</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 Safir Qur'an. All rights reserved.</p>
          <p>Made with ❤️ for the Ummah</p>
        </div>
      </footer>
    </div>
  );
}
