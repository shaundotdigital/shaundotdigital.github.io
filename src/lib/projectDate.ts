// "July 2019": full month and year, in UK English. Read as UTC so the month never shifts with the visitor's time zone.
export function formatProjectDate(date: Date) {
	return date.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}
