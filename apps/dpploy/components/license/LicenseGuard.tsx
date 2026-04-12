import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/router";
import { authClient } from "@/lib/auth-client";
import { getSubscriptionStatus } from "@/services/subscription.service";
import { getInstanceId } from "@/utils/instance";

const WHITELISTED_ROUTES = [
	"/",
	"/register",
	"/reset-password",
	"/send-reset-password",
	"/subscription",
];

interface Props {
	children: ReactNode;
}

export const LicenseGuard = ({ children }: Props) => {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();
	const [isValidating, setIsValidating] = useState(true);
	
	useEffect(() => {
		const validate = async () => {
			if (isPending) return;

			if (typeof window === "undefined") return;

			const isWhitelisted = WHITELISTED_ROUTES.includes(router.pathname);
			
			if (!session) {
				setIsValidating(false);
				return;
			}

			try {
				const instanceId = getInstanceId();
				const statusData = await getSubscriptionStatus(instanceId);
				localStorage.setItem("LICENSE_STATUS", statusData.status);

				if (statusData.status !== "active" && !isWhitelisted) {
					router.push("/subscription");
				}
			} catch (error) {
				console.error("License validation error:", error);
				
				const cachedStatus = localStorage.getItem("LICENSE_STATUS");
				if (cachedStatus !== "active" && !isWhitelisted) {
					router.push("/subscription");
				}
			} finally {
				setIsValidating(false);
			}
		};

		validate();
	}, [session, isPending, router.pathname, router]);

	if (isValidating && !WHITELISTED_ROUTES.includes(router.pathname) && session) {
		return (
			<div className="flex items-center justify-center h-screen bg-background">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return <>{children}</>;
};
