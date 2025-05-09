const Logo = () => {
    return (
      <div className="flex items-center">
        <svg className="h-10 w-10 text-brand-blue-100" viewBox="0 0 40 40" fill="currentColor">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M14 20L18 24L26 16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="ml-2 text-xl font-bold text-brand-blue-100">LearnFlow</span>
      </div>
    )
  }
  
  export default Logo