import Logo from './Logo'
import QuoteSection from './QuoteSection'

const AuthLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      {}
      <QuoteSection />

      {}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-12 flex justify-center lg:justify-start">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
