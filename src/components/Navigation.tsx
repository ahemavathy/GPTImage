'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Edit3, Image, Brush, BarChart3 } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Generate',
    icon: Sparkles,
    color: 'indigo'
  },
  {
    href: '/edit',
    label: 'Edit',
    icon: Edit3,
    color: 'purple'
  },
  {
    href: '/iterative',
    label: 'Iterate',
    icon: BarChart3,
    color: 'blue'
  },
  {
    href: '/analyze',
    label: 'Share',
    icon: Image,
    color: 'green'
  }
]

export default function Navigation() {
  const pathname = usePathname()

  const getNavItemStyles = (item: NavItem, isActive: boolean) => {
    if (isActive) {
      return `flex items-center px-4 py-2 rounded-lg text-${item.color}-600 bg-${item.color}-50 font-medium transition-colors`
    }
    return `flex items-center px-4 py-2 rounded-lg text-gray-700 hover:text-${item.color}-600 hover:bg-${item.color}-50 font-medium transition-colors`
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
                  className={getNavItemStyles(item, isActive)}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-700 hover:text-indigo-600 p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
