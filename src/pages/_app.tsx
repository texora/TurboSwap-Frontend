import { getCookie } from 'cookies-next'
import type { AppContext, AppProps } from 'next/app'
import App from 'next/app'
import Head from 'next/head'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import Decimal from 'decimal.js'
import { getSelectorsByUserAgent } from 'react-device-detect'
import { BreakpointChecks, MatchBreakpointsContext } from '@/hooks/useResponsive'

import i18n from '../i18n'
import { isClient } from '../utils/common'
import '@/components/Toast/toast.css'
import '@/components/LandingPage/components/tvl.css'
import '@/components/LandingPage/liquidity.css'
import '@/components/AppLayout/mobilebottomNavbar.css'
import 'react-day-picker/dist/style.css'
import { GoogleAnalytics } from '@next/third-parties/google'

// pages/_app.js or _app.tsx
import { ChakraProvider } from '@chakra-ui/react'
import { theme } from '@/theme'

const DynamicProviders = dynamic(() => import('@/provider').then((mod) => mod.Providers))
const DynamicContent = dynamic(() => import('@/components/Content'))
const DynamicAppNavLayout = dynamic(() => import('@/components/AppLayout/AppNavLayout'))

const CONTENT_ONLY_PATH = ['/', '404', '/docs/disclaimer', '/moonpay']
const OVERFLOW_HIDDEN_PATH = ['/liquidity-pools']

Decimal.set({ precision: 1e3 })

const MyApp = ({ Component, pageProps, lng, breakPoints, ...props }: AppProps & { lng: string; breakPoints: BreakpointChecks }) => {
  const { pathname } = useRouter()

  const [onlyContent, overflowHidden] = useMemo(
    () => [CONTENT_ONLY_PATH.includes(pathname), OVERFLOW_HIDDEN_PATH.includes(pathname)],
    [pathname]
  )

  // if (isLocal()) {
  //   const lang = lng || (getCookie('i18nextLng') as string) || 'en'
  //   i18n.changeLanguage(lang)
  // }

  return (
    <>
      <GoogleAnalytics gaId="G-DR3V6FTKE3" />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="twitter:url" content="https://x.com/turboswap_svm" />
        {/* <meta name="twitter:image" content="https://img-v1.raydium.io/share/7be7ee6c-56b2-451e-a010-6c21e0db2ee5.png" /> */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@TurboSwapProtocol" />
        <meta name="twitter:creator" content="@TurboSwapProtocol" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="twitter:title" content="TurboSwap" />
        <meta name="twitter:description" content="Lightning fast dex on Eclipse Network" />
        <meta property="tg:url" content="https://t.me/TurboSwap_SVM" />
        <meta property="og:description" content="Lightning fast dex on Eclipse Network" />
        <meta property="og:url" content="https://turboswap.fun/" />
        <meta property="og:type" content="website" />
        {/* <meta property="og:image" content="https://img-v1.raydium.io/share/7be7ee6c-56b2-451e-a010-6c21e0db2ee5.png" /> */}
        <meta property="og:image:alt" content="TurboSwap" />
        <meta property="og:locale" content="en" />
        <meta property="og:site_name" content="TurboSwap" />
        <meta property="og:title" content="Swap | TurboSwap" />
        <title>{pageProps?.title ? `${pageProps.title} TurboSwap` : 'TurboSwap'}</title>
      </Head>
      <DynamicProviders>
        <ChakraProvider theme={theme}>
          <MatchBreakpointsContext.Provider value={breakPoints}>
            <DynamicContent {...props}>
              {onlyContent ? (
                <Component {...pageProps} />
              ) : (
                <DynamicAppNavLayout overflowHidden={overflowHidden}>
                  <Component {...pageProps} />
                </DynamicAppNavLayout>
              )}
            </DynamicContent>
          </MatchBreakpointsContext.Provider>
          ;
        </ChakraProvider>
      </DynamicProviders>
    </>
  )
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  if (isClient()) return {}
  try {
    const ctx = await App.getInitialProps(appContext)
    const userAgent = appContext.ctx.req?.headers['user-agent'] || ''
    let breakPoints = {
      isMobile: false,
      isTablet: false,
      isDesktop: false
    }
    if (typeof userAgent === 'string' && userAgent.length > 0) {
      breakPoints = getSelectorsByUserAgent(userAgent)
    }
    let lng = getCookie('i18nextLng', { req: appContext.ctx.req, res: appContext.ctx.res }) as string
    lng = lng || 'en'
    i18n.changeLanguage(lng)

    return { ...ctx, breakPoints }
  } catch (err) {
    return {}
  }
}

export default MyApp
