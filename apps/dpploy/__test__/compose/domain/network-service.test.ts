import { addDPPloyNetworkToService } from "@dpploy/server";
import { describe, expect, it } from "vitest";

describe("addDPPloyNetworkToService", () => {
	it("should add network to an empty array", () => {
		const result = addDPPloyNetworkToService([]);
		expect(result).toEqual(["dpploy-network", "default"]);
	});

	it("should not add duplicate network to an array", () => {
		const result = addDPPloyNetworkToService(["dpploy-network"]);
		expect(result).toEqual(["dpploy-network", "default"]);
	});

	it("should add network to an existing array with other networks", () => {
		const result = addDPPloyNetworkToService(["other-network"]);
		expect(result).toEqual(["other-network", "dpploy-network", "default"]);
	});

	it("should add network to an object if networks is an object", () => {
		const result = addDPPloyNetworkToService({ "other-network": {} });
		expect(result).toEqual({
			"other-network": {},
			"dpploy-network": {},
			default: {},
		});
	});

	it("should not duplicate default network when already present", () => {
		const result = addDPPloyNetworkToService(["default", "dpploy-network"]);
		expect(result).toEqual(["default", "dpploy-network"]);
	});
});
