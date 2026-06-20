// Whitelist of valid `readings` column names. Any key in an incoming POST /data
// payload that is NOT in this set is rejected before building the INSERT query.
// This is the single source of truth that prevents SQL injection via dynamic keys.

// PID / data columns the Android app may send. Excludes id (auto), timestamp and
// trip_id (handled explicitly by the server).
const DATA_COLUMNS = [
  // Engine basics
  'engine_load_pct', 'coolant_temp_c', 'rpm', 'speed_kmh', 'timing_advance_deg',
  'intake_air_temp_c', 'maf_g_per_s', 'throttle_pct', 'run_time_s',

  // Fuel system
  'fuel_trim_short_b1_pct', 'fuel_trim_long_b1_pct', 'fuel_trim_short_b2_pct',
  'fuel_trim_long_b2_pct', 'fuel_pressure_kpa', 'fuel_tank_level_pct', 'fuel_rate_lph',
  'fuel_type', 'ethanol_pct', 'fuel_system_status', 'fuel_rail_pressure_kpa',
  'fuel_rail_pressure_diesel_kpa', 'fuel_rail_abs_pressure_kpa', 'fuel_inject_timing_deg',

  // Intake / exhaust
  'intake_map_kpa', 'barometric_pressure_kpa', 'commanded_egr_pct', 'egr_error_pct',
  'commanded_evap_purge_pct', 'evap_system_vapor_pressure_pa', 'abs_evap_vapor_pressure_kpa',
  'evap_vapor_pressure_alt_pa', 'secondary_air_status',

  // Throttle / pedal
  'rel_throttle_pct', 'abs_throttle_b_pct', 'abs_throttle_c_pct', 'accel_pedal_d_pct',
  'accel_pedal_e_pct', 'accel_pedal_f_pct', 'commanded_throttle_pct', 'rel_accel_pedal_pct',

  // O2 sensors (voltage)
  'o2_b1s1_voltage', 'o2_b1s2_voltage', 'o2_b1s3_voltage', 'o2_b1s4_voltage',
  'o2_b2s1_voltage', 'o2_b2s2_voltage', 'o2_b2s3_voltage', 'o2_b2s4_voltage',

  // O2 sensors (lambda / wide-band)
  'o2_b1s1_lambda', 'o2_b1s2_lambda', 'o2_b2s1_lambda', 'o2_b2s2_lambda',
  'o2_b2s3_lambda', 'o2_b2s4_lambda', 'o2_b2s5_lambda', 'o2_b2s6_lambda',

  // O2 sensors (current)
  'o2_b1s1_current_ma', 'o2_b1s2_current_ma', 'o2_b2s1_current_ma', 'o2_b2s2_current_ma',
  'o2_b2s3_current_ma', 'o2_b2s4_current_ma', 'o2_b2s5_current_ma', 'o2_b2s6_current_ma',

  // O2 trim
  'short_o2_trim_b1_pct', 'long_o2_trim_b1_pct', 'short_o2_trim_b2_pct', 'long_o2_trim_b2_pct',
  'o2_sensors_present_2bank', 'o2_sensors_present_4bank',

  // Catalyst
  'cat_temp_b1s1_c', 'cat_temp_b2s1_c', 'cat_temp_b1s2_c', 'cat_temp_b2s2_c',

  // Torque
  'demanded_torque_pct', 'actual_torque_pct', 'reference_torque_nm', 'engine_torque_data_pct',

  // Electrical / misc
  'control_module_voltage_v', 'absolute_load_pct', 'commanded_lambda', 'ambient_air_temp_c',
  'engine_oil_temp_c', 'hybrid_battery_life_pct', 'aux_input_status',

  // Diagnostics
  'dtc_count', 'freeze_dtc', 'obd_standard', 'monitor_status_drive_cycle',
  'distance_with_mil_km', 'distance_since_clear_km', 'warmups_since_clear',
  'time_with_mil_min', 'time_since_clear_min', 'emission_requirements',

  // PID support bitmasks
  'pids_supported_01_20', 'pids_supported_21_40', 'pids_supported_41_60', 'pids_supported_61_80',

  // Alternative / extended sensors
  'mass_air_flow_sensor_g_per_s', 'engine_coolant_temp_2_c', 'intake_air_temp_2_c',
  'turbo_a_pressure_kpa', 'boost_pressure_kpa',
];

// All selectable columns (for the ?fields= query param on trip detail).
const ALL_COLUMNS = ['timestamp', 'trip_id', ...DATA_COLUMNS];

const DATA_COLUMN_SET = new Set(DATA_COLUMNS);
const ALL_COLUMN_SET = new Set(ALL_COLUMNS);

function isDataColumn(name) {
  return DATA_COLUMN_SET.has(name);
}

function isValidColumn(name) {
  return ALL_COLUMN_SET.has(name);
}

module.exports = { DATA_COLUMNS, ALL_COLUMNS, isDataColumn, isValidColumn };
