import {appWithTranslation} from 'next-i18next'
import '@/styles/globals.css'
import { AppProps } from 'next/app';
import Head from 'next/head';


import { AuthProvider } from '@/contexts/AuthContext';

function App({Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <Head>
                <title>Nuvo</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default appWithTranslation(App)