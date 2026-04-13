import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { getInstanceId } from "@/utils/instance";
import { createSubscription, validateLicense } from "@/services/license.service";
import { useWhitelabelingPublic } from "@/utils/hooks/use-whitelabeling";

export default function ActivateLicense() {
	const router = useRouter();
	const { data: session } = authClient.useSession();
	const { config: whitelabeling } = useWhitelabelingPublic();
	const [licenseKey, setLicenseKey] = useState("");
	const [isSubscribing, setIsSubscribing] = useState(false);
	const [isActivating, setIsActivating] = useState(false);
	const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);

	const instanceId = getInstanceId();

	// Polling logic
	useEffect(() => {
		let interval: NodeJS.Timeout;
		
		if (isWaitingForPayment) {
			interval = setInterval(async () => {
				try {
					const res = await validateLicense(instanceId);
					if (res.status === "active") {
						localStorage.setItem("LICENSE_STATUS", "active");
						toast.success("License activated successfully!");
						router.push("/dashboard/projects");
					}
				} catch (error) {
					console.error("Polling error:", error);
				}
			}, 3000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [isWaitingForPayment, instanceId, router]);

	const handleActivateManual = async () => {
		if (!licenseKey) {
			toast.error("Please enter a license key");
			return;
		}
		
		setIsActivating(true);
		try {
			// For manual license key, we store it and then validate
			localStorage.setItem("LICENSE_KEY", licenseKey);
			const res = await validateLicense(instanceId);
			
			if (res.status === "active") {
				localStorage.setItem("LICENSE_STATUS", "active");
				toast.success("License activated!");
				router.push("/dashboard/projects");
			} else {
				toast.error(res.message || "Invalid or inactive license key");
			}
		} catch (error: any) {
			toast.error(error.message || "Failed to activate license");
		} finally {
			setIsActivating(false);
		}
	};

	const handleSubscribe = async () => {
		if (!session?.user?.email) {
			toast.error("User email not found. Please log in again.");
			return;
		}

		setIsSubscribing(true);
		try {
			const { subscription_id, key } = await createSubscription(
				session.user.email,
				instanceId
			);

			const rzp = new (window as any).Razorpay({
				key: key,
				subscription_id: subscription_id,
				name: "DPPloy Subscription",
				description: "Activate your DPPloy License",
				handler: () => {
					setIsWaitingForPayment(true);
					toast.info("Processing subscription... Please wait");
				},
				modal: {
					ondismiss: () => {
						setIsSubscribing(false);
					}
				}
			});

			rzp.open();
		} catch (error: any) {
			toast.error(error.message || "Failed to initiate subscription");
			setIsSubscribing(false);
		}
	};

	return (
		<div className="flex w-full items-center justify-center">
			<div className="flex flex-col items-center gap-4 w-full max-w-lg">
				<CardTitle className="text-2xl font-bold flex items-center gap-2">
					<Logo
						className="size-12"
						logoUrl={whitelabeling?.logoUrl || undefined}
					/>
					License Activation
				</CardTitle>
				<CardDescription>
					Activate your server to continue using DPPloy
				</CardDescription>

				<CardContent className="w-full space-y-6 mt-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Enter License Key</label>
						<Input
							placeholder="XXXX-XXXX-XXXX-XXXX"
							value={licenseKey}
							onChange={(e) => setLicenseKey(e.target.value)}
							disabled={isWaitingForPayment}
						/>
						<Button
							className="w-full mt-2"
							onClick={handleActivateManual}
							isLoading={isActivating}
							disabled={isWaitingForPayment}
						>
							Activate License
						</Button>
					</div>

					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-background px-2 text-muted-foreground">OR</span>
						</div>
					</div>

					<div className="space-y-4">
						<Button
							variant="outline"
							className="w-full"
							onClick={handleSubscribe}
							isLoading={isSubscribing}
							disabled={isWaitingForPayment}
						>
							Subscribe & Activate
						</Button>
						
						{isWaitingForPayment && (
							<div className="p-4 bg-muted rounded-lg text-center animate-pulse">
								<p className="text-sm font-medium">
									Processing subscription... Please wait
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Do not refresh this page.
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</div>
		</div>
	);
}

ActivateLicense.getLayout = (page: any) => {
	return <OnboardingLayout>{page}</OnboardingLayout>;
};
