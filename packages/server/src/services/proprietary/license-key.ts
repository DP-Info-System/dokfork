import { db } from "@dpploy/server/db";
import { user } from "@dpploy/server/db/schema";
import { eq } from "drizzle-orm";
import { getOrganizationOwnerId } from "./sso";

export const hasValidLicense = async (organizationId: string) => {
	const ownerId = await getOrganizationOwnerId(organizationId);

	if (!ownerId) {
		return false;
	}

	const currentUser = await db.query.user.findFirst({
		where: eq(user.id, ownerId),
		columns: {
			enableEnterpriseFeatures: true,
			isValidEnterpriseLicense: true,
		},
	});
	return !!(
		currentUser?.enableEnterpriseFeatures &&
		currentUser?.isValidEnterpriseLicense
	);
};
