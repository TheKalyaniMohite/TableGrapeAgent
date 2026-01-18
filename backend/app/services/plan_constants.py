# Constants for plan generation rules

# Weather thresholds
MIN_TEMP_THRESHOLD = 5.0  # Celsius - risk of frost
MAX_TEMP_THRESHOLD = 35.0  # Celsius - heat stress
PRECIPITATION_THRESHOLD = 10.0  # mm - significant rain

# Irrigation thresholds
IRRIGATION_DAYS_SINCE = 3  # Days since last irrigation to suggest irrigation
DRY_DAYS_THRESHOLD = 5  # Days without rain to suggest irrigation

# Scouting thresholds
SCOUTING_DAYS_SINCE = 7  # Days since last scouting to suggest scouting
HIGH_SEVERITY_ISSUE = 2  # Severity >= 2 requires follow-up

# Brix sampling thresholds
BRIX_SAMPLING_DAYS_SINCE = 14  # Days since last brix sample
HARVEST_READINESS_BRIX_MIN = 15.0  # Minimum brix for harvest readiness

# Spray thresholds
SPRAY_DAYS_SINCE = 14  # Days since last spray to consider preventive spray
ISSUE_FOLLOWUP_DAYS = 3  # Days after issue detection to suggest spray






