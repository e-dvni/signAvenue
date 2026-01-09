export const PROJECT_STATUSES = [
  "draft",
  "acquiring_permits",
  "production",
  "installation",
  "complete",
  "cancelled",
];

export const statusLabel = (status) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "acquiring_permits":
      return "Acquiring Permits";
    case "production":
      return "Production";
    case "installation":
      return "Installation";
    case "complete":
      return "Complete";
    case "cancelled":
      return "Cancelled";
    default:
      return status
        ? status
            .toString()
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())
        : "—";
  }
};
