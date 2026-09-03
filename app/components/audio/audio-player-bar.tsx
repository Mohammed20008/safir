'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAudio } from '@/app/context/audio-context';
import { useUserData } from '@/app/context/user-data-context';
import { surahs } from '@/data/surah-data';
import { reciters } from '@/data/reciters';

import styles from './audio-player-bar.module.css';

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function AudioPlayerBar() {
  const { 
    state, 
    togglePlay, 
    seek, 
    playNextVerse, 
    playPreviousVerse, 
    setPlaybackRate,
    setRepeatCount,
    currentReciter,
    playVerse,
    playSurah,
    stop
  } = useAudio();

  const { settings, updateSettings } = useUserData();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showRepeatMenu, setShowRepeatMenu] = useState(false);
  const [showReciterMenu, setShowReciterMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { 
    isPlaying, 
    currentTime, 
    duration, 
    buffered, 
    currentSurah, 
    currentVerse,
    playbackMode,
    playbackRate,
    repeatCount,
    currentVersePlayCount
  } = state;

  const surah = currentSurah ? surahs.find(s => s.number === currentSurah) : null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    seek(percentage * duration);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      seek(percentage * duration);
    }
  }, [isDragging, duration, seek]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Click outside to close menus
  useEffect(() => {
    if (!showSpeedMenu && !showRepeatMenu && !showReciterMenu && !showMobileMoreMenu) return;
    const handleOutsideClick = () => {
      setShowSpeedMenu(false);
      setShowRepeatMenu(false);
      setShowReciterMenu(false);
      setShowMobileMoreMenu(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showSpeedMenu, showRepeatMenu, showReciterMenu, showMobileMoreMenu]);

  // Switch reciter seamlessly and restart playback of the current content on the new voice
  const handleReciterChange = (reciterId: number) => {
    updateSettings({ selectedReciterId: reciterId });
    if (currentSurah) {
      if (playbackMode === 'verse' && currentVerse) {
        setTimeout(() => {
          playVerse(currentSurah, currentVerse);
        }, 50);
      } else if (playbackMode === 'surah') {
        setTimeout(() => {
          playSurah(currentSurah);
        }, 50);
      }
    }
  };

  if (!currentSurah) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const repeatOptions = [
    { value: 1, label: '1x (No Repeat)' },
    { value: 2, label: 'Repeat 2x' },
    { value: 3, label: 'Repeat 3x' },
    { value: 5, label: 'Repeat 5x' },
    { value: 10, label: 'Repeat 10x' },
    { value: 999, label: 'Infinite (∞)' }
  ];

  return (
    <div 
      className={`${styles.playerBar} ${isCollapsed ? styles.collapsed : ''}`}
      onClick={() => isCollapsed && setIsCollapsed(false)}
    >
      {isCollapsed ? (
        <div className={styles.collapsedContent} title="Click to Expand Player">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13"></path>
            <circle cx="6" cy="18" r="3"></circle>
            <circle cx="18" cy="16" r="3"></circle>
          </svg>
          {isPlaying && <div className={styles.glowingDot} />}
        </div>
      ) : (
        <div className={styles.container} onClick={(e) => e.stopPropagation()}>
          {/* Integrated progress bar at the top edge */}
          <div 
            className={styles.progressContainer} 
            ref={progressBarRef}
            onClick={handleProgressClick}
            onMouseDown={() => setIsDragging(true)}
          >
            <div 
              className={styles.bufferedBar} 
              style={{ width: `${bufferedProgress}%` }}
            />
            <div 
              className={styles.progressBar} 
              style={{ width: `${progress}%` }}
            >
              <div className={styles.progressKnob} />
            </div>
          </div>

          <div className={styles.content}>
            {/* Surah & Reciter Info */}
            <div className={styles.info}>
              {/* Equalizer Visualizer */}
              <div className={`${styles.visualizer} ${isPlaying ? styles.animating : ''}`}>
                <span className={styles.bar1}></span>
                <span className={styles.bar2}></span>
                <span className={styles.bar3}></span>
              </div>
              <div className={styles.textInfo}>
                <span className={styles.surahName}>
                  {surah ? `${surah.transliteration} (${surah.number})` : 'Surah'}
                  {currentVerse && <span className={styles.verseNum}> : {currentVerse}</span>}
                  {playbackMode === 'verse' && repeatCount > 1 && (
                    <span className={styles.loopBadge}>
                      {currentVersePlayCount}/{repeatCount === 999 ? '∞' : repeatCount}
                    </span>
                  )}
                </span>
                <span className={styles.reciterName}>{currentReciter?.name}</span>
              </div>
            </div>

            {/* Controls */}
            <div className={styles.controls}>
              <button 
                className={styles.controlBtn} 
                onClick={playPreviousVerse}
                title="Previous Verse"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="19 20 9 12 19 4 19 20"></polygon>
                  <line x1="5" y1="19" x2="5" y2="5"></line>
                </svg>
              </button>

              <button 
                className={styles.playBtn} 
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>

              <button 
                className={styles.controlBtn} 
                onClick={playNextVerse}
                title="Next Verse"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 4 15 12 5 20 5 4"></polygon>
                  <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
              </button>
            </div>

            {/* Time & Actions */}
            <div className={styles.actions}>
              <div className={styles.timeInfo}>
                <span>{formatTime(currentTime)}</span>
                <span className={styles.timeDivider}>/</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Reciter Selector */}
              <div className={styles.dropdownContainer}>
                <button 
                  className={`${styles.actionBtn} ${showReciterMenu ? styles.actionBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReciterMenu(!showReciterMenu);
                    setShowSpeedMenu(false);
                    setShowRepeatMenu(false);
                  }}
                  title="Choose Reciter"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                  </svg>
                  <span>Reciter</span>
                </button>
                {showReciterMenu && (
                  <div className={`${styles.dropdownMenu} ${styles.dropdownMenuReciters}`}>
                    {reciters.map((r) => (
                      <button
                        key={r.id}
                        className={`${styles.dropdownItem} ${settings.selectedReciterId === r.id ? styles.dropdownItemActive : ''}`}
                        onClick={() => handleReciterChange(r.id)}
                      >
                        <span>{r.name}</span>
                        <span className={styles.reciterSubtext}>{r.subtext}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Repeat Loop Selector */}
              <div className={styles.dropdownContainer}>
                <button 
                  className={`${styles.actionBtn} ${showRepeatMenu ? styles.actionBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRepeatMenu(!showRepeatMenu);
                    setShowSpeedMenu(false);
                    setShowReciterMenu(false);
                  }}
                  title="Repeat Options"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 1l4 4-4 4"></path>
                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                    <path d="M7 23l-4-4 4-4"></path>
                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                  </svg>
                  <span>{repeatCount === 1 ? 'Loop' : repeatCount === 999 ? '∞' : `${repeatCount}x`}</span>
                </button>
                {showRepeatMenu && (
                  <div className={styles.dropdownMenu}>
                    {repeatOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`${styles.dropdownItem} ${repeatCount === opt.value ? styles.dropdownItemActive : ''}`}
                        onClick={() => setRepeatCount(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Playback Speed Selector */}
              <div className={styles.dropdownContainer}>
                <button 
                  className={`${styles.actionBtn} ${showSpeedMenu ? styles.actionBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowRepeatMenu(false);
                    setShowReciterMenu(false);
                  }}
                  title="Playback Speed"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{playbackRate}x</span>
                </button>
                {showSpeedMenu && (
                  <div className={styles.dropdownMenu}>
                    {speedOptions.map((rate) => (
                      <button
                        key={rate}
                        className={`${styles.dropdownItem} ${playbackRate === rate ? styles.dropdownItemActive : ''}`}
                        onClick={() => setPlaybackRate(rate)}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Collapse Trigger */}
              <button 
                className={styles.controlBtn}
                onClick={() => setIsCollapsed(true)}
                title="Collapse Player"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {/* Close Button */}
              <button 
                className={styles.controlBtn}
                onClick={() => stop()}
                title="Stop & Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
              </button>
            </div>

            {/* Mobile Options Arrow Trigger & Popup Menu (Mobile Only) */}
            <div className={styles.mobileMoreContainer}>
              <button
                className={`${styles.mobileMoreBtn} ${showMobileMoreMenu ? styles.mobileMoreBtnActive : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMobileMoreMenu(!showMobileMoreMenu);
                  setShowReciterMenu(false);
                  setShowRepeatMenu(false);
                  setShowSpeedMenu(false);
                }}
                aria-label="More Audio Options"
                title="Audio Options"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  style={{
                    transform: showMobileMoreMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s ease',
                  }}
                >
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>

              {showMobileMoreMenu && (
                <div className={styles.mobileMoreMenuPopup} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.mobileMenuHeader}>
                    <span>Audio Options</span>
                    <button
                      className={styles.mobileMenuCloseBtn}
                      onClick={() => setShowMobileMoreMenu(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Reciter Selector */}
                  <div className={styles.mobileMenuSection}>
                    <label>Reciter</label>
                    <select
                      value={settings.selectedReciterId}
                      onChange={(e) => handleReciterChange(Number(e.target.value))}
                      className={styles.mobileSelect}
                    >
                      {reciters.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.subtext})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speed Selector */}
                  <div className={styles.mobileMenuSection}>
                    <label>Playback Speed</label>
                    <div className={styles.mobilePillGroup}>
                      {speedOptions.map((rate) => (
                        <button
                          key={rate}
                          className={`${styles.mobilePillOption} ${playbackRate === rate ? styles.mobilePillActive : ''}`}
                          onClick={() => setPlaybackRate(rate)}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Repeat Loop Selector */}
                  <div className={styles.mobileMenuSection}>
                    <label>Loop Mode</label>
                    <div className={styles.mobilePillGroup}>
                      {repeatOptions.map((opt) => (
                        <button
                          key={opt.value}
                          className={`${styles.mobilePillOption} ${repeatCount === opt.value ? styles.mobilePillActive : ''}`}
                          onClick={() => setRepeatCount(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.mobileMenuActions}>
                    <button
                      className={styles.mobileStopBtn}
                      onClick={() => {
                        stop();
                        setShowMobileMoreMenu(false);
                      }}
                    >
                      ⏹️ Stop & Close
                    </button>
                    <button
                      className={styles.mobileCollapseBtn}
                      onClick={() => {
                        setIsCollapsed(true);
                        setShowMobileMoreMenu(false);
                      }}
                    >
                      🔽 Minimize
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
