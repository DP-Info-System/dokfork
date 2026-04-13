import { API_BASE_URL } from "@/utils/license-api";

export interface SubscriptionResponse {
	subscription_id: string;
	key: string;
}

export interface ValidateResponse {
	status: "active" | "inactive" | "expired";
	message?: string;
}

export const createSubscription = async (
	email: string,
	instance_id: string,
): Promise<SubscriptionResponse> => {
	const response = await fetch(`${API_BASE_URL}/api/subscription`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ email, instance_id }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || "Failed to create subscription");
	}

	return response.json();
};

export const validateLicense = async (
	instance_id: string,
): Promise<ValidateResponse> => {
	const response = await fetch(`${API_BASE_URL}/api/license/validate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ instance_id }),
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || "Failed to validate license");
	}

	return response.json();
};
