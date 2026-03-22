'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { TutorialCard } from '@/components/TutorialCard';
import { MapPin, Link as LinkIcon, Calendar, Flame, Users, BookOpen, GitFork, Github, Twitter, Linkedin, Settings, Award, CheckCircle2, Lock, Clock } from 'lucide-react';
import Link from 'next/link';

const MOCK_USER = {
  id: '1',
  username: 'sarah_codes',
  displayName: 'Sarah Chen',
  bio: 'Making complex things simple. Frontend engineer passionate about teaching.',
  location: 'San Francisco, CA',
  website: 'sarah.dev',
  joinedAt: '2024-03-01',
  stats: { learners: 1234, tutorials: 48, forks: 892, streak: 42 },
  social: { github: 'sarahchen', twitter: 'sarah_codes', linkedin: 'sarahchen' },
};

const MOCK_TUTORIALS = [
  {
    id: '1',
    title: 'React Hooks Masterclass',
    description: 'Master useState, useEffect, and custom hooks',
    language: 'typescript',
    difficulty: 'intermediate',
    duration: 7200,
    status: 'published',
    tags: ['react', 'hooks'],
    creator: MOCK_USER,
    stats: { views: 3240, likes: 156, forks: 89, rating: 4.8, ratingCount: 45 },
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  },
  {
    id: '2',
    title: 'TypeScript Fundamentals',
    description: 'From basics to advanced types',
    language: 'typescript',
    difficulty: 'beginner',
    duration: 5400,
    status: 'published',
    tags: ['typescript', 'javascript'],
    creator: MOCK_USER,
    stats: { views: 2100, likes: 98, forks: 45, rating: 4.9, ratingCount: 32 },
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
  },
  {
    id: '3',
    title: 'CSS Grid Layout Mastery',
    description: 'Build complex layouts with CSS Grid',
    language: 'css',
    difficulty: 'intermediate',
    duration: 3600,
    status: 'published',
    tags: ['css', 'layout'],
    creator: MOCK_USER,
    stats: { views: 1560, likes: 76, forks: 34, rating: 4.7, ratingCount: 28 },
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
];

const MOCK_PROGRESS = [
  { id: '1', tutorialId: '1', userId: '1', progress: 67, currentTime: 4824, startedAt: '2024-03-15', lastWatchedAt: '2024-03-20' },
  { id: '2', tutorialId: '2', userId: '1', progress: 100, currentTime: 5400, completedAt: '2024-03-18', startedAt: '2024-03-10', lastWatchedAt: '2024-03-18' },
];

const MOCK_CERTIFICATES = [
  { id: '1', name: 'JavaScript Fundamentals Track', completedAt: '2024-03-15', tutorials: 6, completed: 6 },
  { id: '2', name: 'React Mastery Track', completedAt: null, tutorials: 8, completed: 4 },
];

export default function ProfilePage(): React.JSX.Element {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('tutorials');

  return (
    <Layout>
      <div className="min-h-screen pb-20">
        {/* Profile Header */}
        <div className="bg-surface border-b border-overlay">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-2xl bg-gradient-brand flex items-center justify-center text-4xl font-bold text-white">
                  {MOCK_USER.displayName.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-text-primary">{MOCK_USER.displayName}</h1>
                    <p className="text-brand text-lg">@{MOCK_USER.username}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors">
                      Follow
                    </button>
                    <button className="p-2 bg-elevated text-text-primary rounded-lg hover:bg-overlay transition-colors">
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <p className="text-text-secondary mt-3 max-w-2xl">{MOCK_USER.bio}</p>
                
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-text-secondary">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {MOCK_USER.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined March 2024
                  </span>
                  <span className="flex items-center gap-1 text-amber">
                    <Flame className="w-4 h-4" />
                    {MOCK_USER.stats.streak}-day streak
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-4">
                  <a href="#" className="p-2 bg-elevated rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                    <Github className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-2 bg-elevated rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-2 bg-elevated rounded-lg text-text-secondary hover:text-text-primary transition-colors">
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                
                <div className="flex items-center gap-6 mt-6 pt-6 border-t border-overlay">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{MOCK_USER.stats.learners.toLocaleString()}</p>
                    <p className="text-sm text-text-secondary">Learners</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{MOCK_USER.stats.tutorials}</p>
                    <p className="text-sm text-text-secondary">Tutorials</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{MOCK_USER.stats.forks}</p>
                    <p className="text-sm text-text-secondary">Forks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex items-center gap-1 border-b border-overlay">
            {[
              { id: 'tutorials', label: 'Tutorials', icon: BookOpen },
              { id: 'progress', label: 'Progress', icon: CheckCircle2 },
              { id: 'forks', label: 'My Forks', icon: GitFork },
              { id: 'certificates', label: 'Certificates', icon: Award },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id ? 'text-brand border-brand' : 'text-text-secondary border-transparent hover:text-text-primary'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="mt-8">
            {activeTab === 'tutorials' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_TUTORIALS.map((tutorial) => (
                  <TutorialCard key={tutorial.id} tutorial={tutorial as any} />
                ))}
              </div>
            )}
            
            {activeTab === 'progress' && (
              <div className="space-y-4">
                {MOCK_PROGRESS.map((progress) => {
                  const tutorial = MOCK_TUTORIALS.find((t) => t.id === progress.tutorialId);
                  if (!tutorial) return null;
                  return (
                    <Link key={progress.id} href={`/tutorial/${tutorial.id}`} className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-overlay hover:border-brand/50 transition-colors">
                      <div className="w-16 h-16 bg-editor-bg rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-8 h-8 text-text-muted" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-text-primary">{tutorial.title}</h4>
                        <div className="mt-2">
                          <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${progress.progress === 100 ? 'bg-green' : 'bg-brand'}`} style={{ width: `${progress.progress}%` }} />
                          </div>
                        </div>
                      </div>
                      <div>
                        {progress.progress === 100 ? <CheckCircle2 className="w-6 h-6 text-green" /> : <Clock className="w-6 h-6 text-amber" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
            
            {activeTab === 'certificates' && (
              <div className="space-y-4">
                {MOCK_CERTIFICATES.map((cert) => (
                  <div key={cert.id} className={`p-6 rounded-xl border ${cert.completedAt ? 'bg-surface border-brand/20' : 'bg-surface/50 border-overlay'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={`font-semibold ${cert.completedAt ? 'text-text-primary' : 'text-text-secondary'}`}>{cert.name}</h3>
                        <p className="text-sm text-text-secondary mt-1">{cert.completed}/{cert.tutorials} tutorials completed</p>
                      </div>
                      <div>
                        {cert.completedAt ? <Award className="w-8 h-8 text-brand" /> : <Lock className="w-8 h-8 text-text-muted" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
