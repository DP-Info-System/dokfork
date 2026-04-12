import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { getInstanceId } from "@/utils/instance";
import { getSubscriptionStatus, type SubscriptionStatus } from "@/services/subscription.service";
import { useWhitelabelingPublic } from "@/utils/hooks/use-whitelabeling";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionPage() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { config: whitelabeling } = useWhitelabelingPublic();
	const [status, setStatus] = useState<SubscriptionStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const instanceId = getInstanceId();

	const fetchStatus = async () => {
		try {
			const data = await getSubscriptionStatus(instanceId);
			setStatus(data);
			setError(null);
			
			if (data.status === "active") {
				localStorage.setItem("LICENSE_STATUS", "active");
			} else {
				localStorage.setItem("LICENSE_STATUS", data.status);
			}
		} catch (err: any) {
			setError(err.message || "Failed to fetch subscription status");
			console.error("Subscription fetch error:", err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchStatus();
		const interval = setInterval(fetchStatus, 5000);
		return () => clearInterval(interval);
	}, [instanceId]);

	useEffect(() => {
		if (status?.status === "active") {
			toast.success("Subscription is active!");
			router.push("/dashboard/projects");
		}
	}, [status?.status, router]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active": return "bg-green-500 hover:bg-green-600";
			case "grace": return "bg-yellow-500 hover:bg-yellow-600";
			case "suspended": return "bg-red-500 hover:bg-red-600";
			default: return "bg-gray-500 hover:bg-gray-600";
		}
	};

	if (isLoading && !status) {
		return (
			<div className="flex items-center justify-center min-h-[50vh]">
				<div className="flex flex-col items-center gap-2">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
					<p className="text-sm text-muted-foreground">Checking subscription status...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex w-full items-center justify-center">
			<div className="flex flex-col items-center gap-4 w-full max-w-lg">
				<CardTitle className="text-2xl font-bold flex items-center gap-2">
					<Logo
						className="size-12"
						logoUrl={whitelabeling?.logoUrl || undefined}
					/>
					Subscription
				</CardTitle>
				<CardDescription className="text-center">
					Manage your DPPloy subscription and server status
				</CardDescription>

				{status?.status !== "active" && (
					<div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm font-medium text-center animate-pulse">
						Your subscription is inactive. Please subscribe to continue.
					</div>
				)}

				<CardContent className="w-full space-y-6 mt-4 border rounded-xl p-6 bg-card shadow-sm text-card-foreground">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-1">
							<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Plan</p>
							<p className="text-sm font-semibold">{status?.plan || "N/A"}</p>
						</div>
						<div className="space-y-1">
							<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</p>
							<Badge className={`${getStatusColor(status?.status || "")} text-white border-none`}>
								{status?.status?.toUpperCase() || "UNKNOWN"}
							</Badge>
						</div>
						<div className="space-y-1">
							<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Next Billing</p>
							<p className="text-sm font-semibold">{status?.next_billing_date || "N/A"}</p>
						</div>
						{status?.grace_until && (
							<div className="space-y-1">
								<p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Grace Until</p>
								<p className="text-sm font-bold text-yellow-600">{status.grace_until}</p>
							</div>
						)}
					</div>

					{error && (
						<div className="text-xs text-red-500 bg-red-500/5 p-3 rounded-md border border-red-500/10">
							{error}
						</div>
					)}

					<Button 
						className="w-full h-11 text-sm font-bold shadow-lg shadow-primary/20"
						onClick={() => window.open('https://dpinfosystem.in/billing', '_blank')}
					>
						Subscribe / Upgrade
					</Button>
					
					<div className="pt-4 border-t border-dashed">
						<p className="text-[10px] text-center text-muted-foreground italic">
							Instance ID: <span className="font-mono select-all bg-muted px-1 rounded">{instanceId}</span>
						</p>
					</div>
				</CardContent>
			</div>
		</div>
	);
}

SubscriptionPage.getLayout = (page: any) => {
	return <OnboardingLayout>{page}</OnboardingLayout>;
};
