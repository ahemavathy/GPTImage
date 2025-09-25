'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Edit3, Image, Brush, BarChart3, TrendingUp, Menu, X } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Generate',
    icon: Sparkles
  },
  {
    href: '/edit',
    label: 'Edit',
    icon: Edit3
  },
  {
    href: '/iterative',
    label: 'Iterate',
    icon: BarChart3
  },
  {
    href: '/analyze',
    label: 'Share',
    icon: Image
  },
  {
    href: '/scoring',
    label: 'Score',
    icon: TrendingUp
  }
]

export default function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getNavItemStyles = (isActive: boolean) => {
    const baseClasses = 'flex items-center px-4 py-2 rounded-lg font-medium transition-colors'
    
    if (isActive) {
      return `${baseClasses} text-blue-600 bg-blue-50`
    }
    return `${baseClasses} text-gray-700 hover:text-blue-600 hover:bg-blue-50`
  }

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Sparkles className="w-8 h-8 text-indigo-600 mr-2" />
            <span className="text-xl font-bold text-gray-900">AI Image Studio</span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={getNavItemStyles(isActive)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-indigo-600 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={getNavItemStyles(isActive)}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
