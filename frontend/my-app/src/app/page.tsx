'use client';

import React from 'react';
import { Layout } from '@/components/Layout';
import { TutorialCard } from '@/components/TutorialCard';
import { ArrowRight, Sparkles, TrendingUp, Users, Clock, Play } from 'lucide-react';
import Link from 'next/link';

// Mock data
const MOCK_TUTORIALS = [
  {
    id: '1',
    title: 'React Hooks Masterclass',
    description: 'Master useState, useEffect, and custom hooks',
    language: 'typescript',
    difficulty: 'intermediate',
    duration: 7200,
    status: 'published',
    tags: ['react', 'hooks', 'javascript'],
    creator: {
      id: '1',
      username: 'sarah_codes',
      displayName: 'Sarah Chen',
      email: 'sarah@example.com',
      joinedAt: '2024-01-01',
      stats: { learners: 1200, tutorials: 15, forks: 89, streak: 42 },
    },
    stats: { views: 3240, likes: 156, forks: 89, rating: 4.8, ratingCount: 45 },
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
  },
  {
    id: '2',
    title: 'Dynamic Programming Deep Dive',
    description: 'From Fibonacci to complex algorithms',
    language: 'python',
    difficulty: 'advanced',
    duration: 5400,
    status: 'published',
    tags: ['algorithms', 'dp', 'python'],
    creator: {
      id: '2',
      username: 'algo_master',
      displayName: 'Alex Johnson',
      email: 'alex@example.com',
      joinedAt: '2024-01-01',
      stats: { learners: 800, tutorials: 10, forks: 45, streak: 30 },
    },
    stats: { views: 2100, likes: 98, forks: 45, rating: 4.9, ratingCount: 32 },
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
  },
  {
    id: '3',
    title: 'Async/Await Explained Visually',
    description: 'Understanding JavaScript promises and async patterns',
    language: 'javascript',
    difficulty: 'intermediate',
    duration: 3600,
    status: 'published',
    tags: ['javascript', 'async', 'promises'],
    creator: {
      id: '3',
      username: 'js_wizard',
      displayName: 'Mike Ross',
      email: 'mike@example.com',
      joinedAt: '2024-01-01',
      stats: { learners: 500, tutorials: 8, forks: 34, streak: 21 },
    },
    stats: { views: 1560, likes: 76, forks: 34, rating: 4.7, ratingCount: 28 },
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
  },
  {
    id: '4',
    title: 'Rust for JavaScript Developers',
    description: 'A gentle introduction to Rust for JS devs',
    language: 'rust',
    difficulty: 'beginner',
    duration: 4800,
    status: 'published',
    tags: ['rust', 'systems', 'beginner'],
    creator: {
      id: '4',
      username: 'rustacean_dev',
      displayName: 'Emma Wilson',
      email: 'emma@example.com',
      joinedAt: '2024-01-01',
      stats: { learners: 600, tutorials: 6, forks: 23, streak: 15 },
    },
    stats: { views: 1890, likes: 89, forks: 23, rating: 4.6, ratingCount: 22 },
    createdAt: '2024-03-12',
    updatedAt: '2024-03-12',
  },
] as const;

export default function HomePage(): React.JSX.Element {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-surface to-background pt-16 pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 text-brand rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Interactive coding tutorials
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
                  Learn to code by doing
                </h1>
                
                <p className="text-lg text-text-secondary max-w-xl">
                  Watch tutorials where the code is the content. Pause, edit, and experiment 
                  with real code as you learn.
                </p>
                
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand/90 transition-colors shadow-brand"
                  >
                    <Play className="w-5 h-5" fill="currentColor" />
                    Start Learning
                  </Link>
                  
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-elevated text-text-primary rounded-xl font-medium hover:bg-overlay transition-colors"
                  >
                    Create Tutorial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-text-secondary pt-4">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    12K+ learners
                  </span>
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    500+ tutorials
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    2000+ hours
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <div className="relative bg-editor-bg rounded-2xl shadow-2xl overflow-hidden border border-overlay">
                  <div className="flex items-center gap-2 px-4 py-3 bg-surface border-b border-overlay">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red" />
                      <div className="w-3 h-3 rounded-full bg-amber" />
                      <div className="w-3 h-3 rounded-full bg-green" />
                    </div>
                    <span className="ml-4 text-sm text-text-secondary">fibonacci.ts</span>
                  </div>
                  
                  <div className="p-6 font-mono text-sm">
                    <pre className="text-text-primary">
                      {`const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n-1) 
       + fibonacci(n-2);
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Trending Section */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-brand" />
                <h2 className="text-2xl font-bold text-text-primary">Trending Now</h2>
              </div>
              
              <Link
                href="/explore"
                className="text-brand hover:underline text-sm font-medium"
              >
                View all
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_TUTORIALS.map((tutorial) => (
                <TutorialCard
                  key={tutorial.id}
                  tutorial={tutorial as any}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
