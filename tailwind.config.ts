
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				communi: {
					primary: '#58A9FF',
					secondary: '#FF7A5C',
					tertiary: '#7ED957',
					quaternary: '#FFC947',
					dark: '#2D3748',
					light: '#F8FAFC'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'slide-up': {
					from: { transform: 'translateY(100%)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'float-in': {
					from: { opacity: '0', transform: 'translateY(24px)' },
					to: { opacity: '1', transform: 'translateY(0)' }
				},
				'trophy-reveal': {
					'0%': { opacity: '0', transform: 'scale(0.6) translateY(30px)' },
					'60%': { transform: 'scale(1.08) translateY(-4px)' },
					'100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
				},
				'score-jump': {
					'0%': { transform: 'scale(1) translateY(0)' },
					'50%': { transform: 'scale(1.5) translateY(-6px)' },
					'100%': { transform: 'scale(1) translateY(0)' }
				},
				'bubble-rise': {
					'0%': { opacity: '0', transform: 'translateY(12px) scale(0.85)' },
					'15%': { opacity: '1', transform: 'translateY(0) scale(1)' },
					'75%': { opacity: '1', transform: 'translateY(-8px) scale(1)' },
					'100%': { opacity: '0', transform: 'translateY(-20px) scale(0.9)' }
				},
				'highlight-pop': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'40%': { transform: 'scale(1.4)', opacity: '0.9' },
					'100%': { transform: 'scale(1)', opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
				'float-in': 'float-in 0.5s ease-out forwards',
				'trophy-reveal': 'trophy-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
				'score-jump': 'score-jump 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
				'bubble-rise': 'bubble-rise 3s ease-out forwards',
				'highlight-pop': 'highlight-pop 1.2s ease-out forwards'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
