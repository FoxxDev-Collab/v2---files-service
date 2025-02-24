import Head from 'next/head'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Head>
        <title>New Cloud</title>
        <meta name="description" content="New Cloud application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-blue-600">New Cloud</span>
        </h1>
        <p className="mt-3 text-2xl">
          Your powerful cloud application
        </p>
      </main>
    </div>
  )
}
