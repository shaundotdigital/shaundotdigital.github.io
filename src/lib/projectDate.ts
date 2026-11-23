// "Jul 2019": month and short year, in UK English. Read as UTC so the month never shifts with the visitor's time zone.
export function formatProjectDate(date: Date) {
	return date.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}
