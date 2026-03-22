// components/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { 
  Search, 
  Plus, 
  Bell, 
  Menu, 
  X,
  Code2,
  User,
  Settings,
  LogOut,
  BookOpen,
  Flame
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated } = useAuthStore();
  const { openSearch, toggleSidebar } = useUIStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-overlay">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Code2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gradient hidden sm:block">
                CodeTube
              </span>
            </Link>
          </div>
          
          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <button
              onClick={openSearch}
              className="w-full flex items-center gap-3 px-4 py-2 bg-elevated rounded-lg text-text-secondary hover:bg-overlay transition-colors"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">Search tutorials, creators, topics...</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 bg-surface rounded text-xs">
                <span>⌘</span>K
              </kbd>
            </button>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={openSearch}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            
            {isAuthenticated ? (
              <>
                <Link
                  href="/studio"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </Link>
                
                <button className="p-2 text-text-secondary hover:text-text-primary transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red rounded-full" />
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-elevated transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand" />
                      </div>
                    )}
                  </button>
                  
                  {isProfileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-overlay shadow-lg z-50 py-2">
                        <div className="px-4 py-3 border-b border-overlay">
                          <p className="font-medium text-text-primary">{user?.displayName}</p>
                          <p className="text-sm text-text-secondary">@{user?.username}</p>
                        </div>
                        
                        <Link
                          href={`/profile/${user?.username}`}
                          className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Profile
                        </Link>
                        
                        <Link
                          href="/my-learning"
                          className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                        >
                          <BookOpen className="w-4 h-4" />
                          My Learning
                        </Link>
                        
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        
                        <div className="border-t border-overlay mt-2 pt-2">
                          <button
                            onClick={() => useAuthStore.getState().logout()}
                            className="w-full flex items-center gap-3 px-4 py-2 text-text-secondary hover:bg-elevated hover:text-red transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="hidden sm:block px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  Explore
                </Link>
                
                <Link
                  href="/signin"
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
