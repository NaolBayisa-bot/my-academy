import AmbientBackground from '../../components/AmbientBackground'

function ExampleLandingPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <AmbientBackground grid={true} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-on-surface mb-4 font-headline-lg">
            Welcome
          </h1>
          <p className="text-on-surface-variant mb-6">
            Experience the Kinetic Glass UI design system
          </p>
        </div>
      </div>
    </div>
  )
}

function ExampleAuthPage() {
  return (
    <div className="relative min-h-screen bg-background flex flex-col">
      <AmbientBackground grid={false} />

      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="glass-panel rounded-2xl p-8 max-w-sm w-full">
          <h2 className="text-2xl font-semibold text-on-surface mb-6">
            Sign In
          </h2>
        </div>
      </div>
    </div>
  )
}

export { ExampleLandingPage, ExampleAuthPage }
