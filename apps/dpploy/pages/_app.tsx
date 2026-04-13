import "@/styles/globals.css";

import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import Head from "next/head";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import NextTopLoader from "nextjs-toploader";
import type { ReactElement, ReactNode } from "react";
import { SearchCommand } from "@/components/dashboard/search-command";
import { LicenseGuard } from "@/components/license/LicenseGuard";
import { WhitelabelingProvider } from "@/components/proprietary/whitelabeling/whitelabeling-provider";
import { Toaster } from "@/components/ui/sonner";
import { api } from "@/utils/api";

const inter = Inter({ subsets: ["latin"] });

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
	getLayout?: (page: ReactElement) => ReactNode;
	theme?: string;
};

type AppPropsWithLayout = AppProps & {
	Component: NextPageWithLayout;
};

const MyApp = ({
	Component,
	pageProps: { ...pageProps },
}: AppPropsWithLayout) => {
	const getLayout = Component.getLayout ?? ((page) => page);

	return (
		<>
			<style jsx global>
				{`
					:root {
						--font-inter: ${inter.style.fontFamily};
					}
				`}
			</style>
			<Head>
				<title>DPPloy</title>
			</Head>
			<Script
				src="https://checkout.razorpay.com/v1/checkout.js"
				strategy="beforeInteractive"
			/>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
				forcedTheme={Component.theme}
			>
				<NextTopLoader color="hsl(var(--sidebar-ring))" />
				<WhitelabelingProvider />
				<Toaster richColors />
				<SearchCommand />
				<LicenseGuard>{getLayout(<Component {...pageProps} />)}</LicenseGuard>
			</ThemeProvider>
		</>
	);
};

export default api.withTRPC(MyApp);
