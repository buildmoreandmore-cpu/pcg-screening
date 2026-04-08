import { redirect } from 'next/navigation'

// Unified login entry point — redirects to /portal/login
// which handles both admin and employer authentication
export default function LoginRedirect() {
  redirect('/portal/login')
}
