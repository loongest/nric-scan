import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import MicroBlinkId from './component/MicroBlinkId'
import MicroBlinkUI from './component/MicroBlinkUI'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
      </Head>
      <main className={`${styles.main} ${inter.className}`}>
          {/* implementation without UI */}
          {/* <MicroBlinkId /> */}

          {/* implementation with UI */}
          <MicroBlinkUI />
      </main>
    </>
  )
}
