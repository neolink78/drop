import {appWithTranslation} from 'next-i18next'
import '@/styles/globals.css'
import { AppProps } from 'next/app';


import { AuthProvider } from '@/contexts/AuthContext';

function App({Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default appWithTranslation(App)