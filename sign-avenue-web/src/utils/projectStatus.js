export const PROJECT_STATUSES = [
  "draft",
  "acquiring_permits",
  "production",
  "installation",
  "complete",
  "cancelled",
];

export const statusLabel = (value) => {
  const map = {
    draft: "Draft",
    acquiring_permits: "Acquiring Permits",
    production: "Production",
    installation: "Installation",
    complete: "Complete",
    cancelled: "Cancelled",
  };

  return map[value] || "—";
};

export const canCustomerSchedule = (status) => status === "installation";
