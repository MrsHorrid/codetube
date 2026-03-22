// components/TutorialCard.tsx
'use client';

import { Tutorial, TutorialProgress } from '@/types/codetube';
import { formatDuration, formatNumber, getLanguageColor } from '@/lib/utils';
import { Play, Star, Clock, Users, GitFork } from 'lucide-react';
import Link from 'next/link';

interface TutorialCardProps {
  tutorial: Tutorial;
  progress?: TutorialProgress;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function TutorialCard({ tutorial, progress, variant = 'default' }: TutorialCardProps) {
  const hasProgress = progress && progress.progress > 0;
  const isCompleted = progress?.progress === 100;

  if (variant === 'compact') {
    return (
      <Link
        href={`/tutorial/${tutorial.id}`}
        className="group block bg-surface rounded-lg overflow-hidden hover:ring-2 hover:ring-brand/50 transition-all duration-200 hover:-translate-y-1"
      >
        <div className="aspect-video bg-elevated relative overflow-hidden">
          {/* Editor Preview Placeholder */}
          <div className="absolute inset-0 bg-gradient-to-br from-editor-bg to-surface p-3">
            <pre className="text-[8px] text-text-secondary font-mono opacity-50">
              {tutorial.language === 'javascript' || tutorial.language === 'typescript'
                ? `const greet = () => {
  return "Hello";
};`
                : tutorial.language === 'python'
                ? `def greet():
    return "Hello"`
                : `function greet() {
  return "Hello";
}`}
            </pre>
          </div>
          
          {/* Language Badge */}
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-surface/90 rounded text-[10px] font-medium">
            {tutorial.language.toUpperCase()}
          </div>
          
          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
              <Play className="w-5 h-5 text-white ml-0.5" />
            </div>
          </div>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-sm text-text-primary line-clamp-1 group-hover:text-brand transition-colors">
            {tutorial.title}
          </h3>          
          <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
            <span>@{tutorial.creator.username}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(tutorial.duration * 1000)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link
        href={`/tutorial/${tutorial.id}`}
        className="group flex gap-4 bg-surface rounded-lg p-3 hover:bg-elevated transition-colors"
      >
        <div className="w-32 h-20 bg-editor-bg rounded overflow-hidden flex-shrink-0">
          <pre className="text-[6px] text-text-secondary font-mono p-2 opacity-50">
            {tutorial.language === 'javascript' || tutorial.language === 'typescript'
              ? `const greet = () => {
  return "Hello";
};`
              : `def greet():
    return "Hello"`}
          </pre>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-brand transition-colors">
            {tutorial.title}
          </h3>          
          <p className="text-sm text-text-secondary mt-1 line-clamp-1">
            @{tutorial.creator.username}
          </p>          
          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(tutorial.duration * 1000)}
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              {tutorial.stats.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={`/tutorial/${tutorial.id}`}
      className="group block bg-surface rounded-xl overflow-hidden hover:ring-2 hover:ring-brand/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="aspect-video bg-elevated relative overflow-hidden">
        {/* Editor Preview Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-editor-bg to-surface p-4">
          <pre className="text-[10px] text-text-secondary font-mono opacity-60">
            {tutorial.language === 'javascript' || tutorial.language === 'typescript'
              ? `const fibonacci = (n) => {
  if (n <= 1) return n;
  return fibonacci(n-1) 
       + fibonacci(n-2);
}`
              : tutorial.language === 'python'
              ? `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) \
         + fibonacci(n-2)`
              : `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) 
       + fibonacci(n-2);
}`}
          </pre>
        </div>
        
        {/* Language Badge */}
        <div 
          className="absolute top-3 right-3 px-2 py-1 bg-surface/90 backdrop-blur rounded-md text-xs font-medium flex items-center gap-1.5"
        >
          <span 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: getLanguageColor(tutorial.language) }}
          />
          {tutorial.language.toUpperCase()}
        </div>
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-brand">
            <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg text-text-primary line-clamp-1 group-hover:text-brand transition-colors">
          {tutorial.title}
        </h3>        
        <Link 
          href={`/profile/${tutorial.creator.username}`}
          className="text-brand text-sm hover:underline mt-1 inline-block"
        >
          @{tutorial.creator.username}
        </Link>
        
        <div className="flex items-center gap-4 mt-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {formatDuration(tutorial.duration * 1000)}
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-4 h-4" />
            {tutorial.stats.rating.toFixed(1)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            {formatNumber(tutorial.stats.views)}
          </span>
        </div>
        
        {/* Progress Bar */}
        {hasProgress && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-secondary">
                {isCompleted ? 'Completed' : `${Math.round(progress!.progress)}% complete`}
              </span>
              {isCompleted && <span className="text-green">✓</span>}
            </div>
            <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  isCompleted ? 'bg-green' : 'bg-brand'
                }`}
                style={{ width: `${progress!.progress}%` }}
              />
            </div>
            
            {!isCompleted && (
              <button className="mt-3 w-full py-2 bg-brand/10 text-brand rounded-lg text-sm font-medium hover:bg-brand/20 transition-colors flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Continue
              </button>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
