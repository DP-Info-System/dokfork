import { API_BASE_URL } from "@/utils/api";

export interface SubscriptionStatus {
	plan: string;
	status: "active" | "grace" | "suspended" | "inactive";
	next_billing_date: string | null;
	expires_at: string | null;
	grace_until?: string | null;
}

export const getSubscriptionStatus = async (
	instance_id: string,
): Promise<SubscriptionStatus> => {
	const response = await fetch(
		`${API_BASE_URL}/api/subscription/status?instance_id=${instance_id}`,
	);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || "Failed to fetch subscription status");
	}

	return response.json();
};
