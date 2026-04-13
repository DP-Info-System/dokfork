import { addDPPloyNetworkToRoot } from "@dpploy/server";
import { describe, expect, it } from "vitest";

describe("addDPPloyNetworkToRoot", () => {
	it("should create network object if networks is undefined", () => {
		const result = addDPPloyNetworkToRoot(undefined);
		expect(result).toEqual({ "dpploy-network": { external: true } });
	});

	it("should add network to an empty object", () => {
		const result = addDPPloyNetworkToRoot({});
		expect(result).toEqual({ "dpploy-network": { external: true } });
	});

	it("should not modify existing network configuration", () => {
		const existing = { "dpploy-network": { external: false } };
		const result = addDPPloyNetworkToRoot(existing);
		expect(result).toEqual({ "dpploy-network": { external: true } });
	});

	it("should add network alongside existing networks", () => {
		const existing = { "other-network": { external: true } };
		const result = addDPPloyNetworkToRoot(existing);
		expect(result).toEqual({
			"other-network": { external: true },
			"dpploy-network": { external: true },
		});
	});
});
