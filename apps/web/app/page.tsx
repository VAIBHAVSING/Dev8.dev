import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Dev8.dev
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your development platform for modern web applications
          </p>
          
          <div className="space-y-4">
            <p className="text-lg text-gray-700">
              Get started with your development journey
            </p>
            <div className="space-x-4">
              <Link
                href="/signin"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Modern Stack</h3>
            <p className="text-gray-600">
              Built with Next.js, TypeScript, and modern development tools
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Authentication</h3>
            <p className="text-gray-600">
              Secure authentication with NextAuth.js and multiple providers
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-3">Go Services</h3>
            <p className="text-gray-600">
              High-performance backend services built with Go
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}