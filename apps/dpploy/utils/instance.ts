const INSTANCE_ID_KEY = "INS";

export const getInstanceId = (): string => {
	if (typeof window === "undefined") return "";

	let id = localStorage.getItem(INSTANCE_ID_KEY);

	if (!id) {
		id = crypto.randomUUID();
		localStorage.setItem(INSTANCE_ID_KEY, id);
	}

	return id;
};
