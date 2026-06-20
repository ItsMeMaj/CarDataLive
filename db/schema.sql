CREATE TABLE IF NOT EXISTS readings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME(3) NOT NULL,
    trip_id VARCHAR(36) NOT NULL,

    -- Engine basics
    engine_load_pct DECIMAL(5,1) NULL,
    coolant_temp_c SMALLINT NULL,
    rpm DECIMAL(7,1) NULL,
    speed_kmh SMALLINT NULL,
    timing_advance_deg DECIMAL(5,1) NULL,
    intake_air_temp_c SMALLINT NULL,
    maf_g_per_s DECIMAL(7,2) NULL,
    throttle_pct DECIMAL(5,1) NULL,
    run_time_s INT UNSIGNED NULL,

    -- Fuel system
    fuel_trim_short_b1_pct DECIMAL(5,1) NULL,
    fuel_trim_long_b1_pct DECIMAL(5,1) NULL,
    fuel_trim_short_b2_pct DECIMAL(5,1) NULL,
    fuel_trim_long_b2_pct DECIMAL(5,1) NULL,
    fuel_pressure_kpa SMALLINT UNSIGNED NULL,
    fuel_tank_level_pct DECIMAL(5,1) NULL,
    fuel_rate_lph DECIMAL(6,2) NULL,
    fuel_type TINYINT UNSIGNED NULL,
    ethanol_pct DECIMAL(5,1) NULL,
    fuel_system_status SMALLINT UNSIGNED NULL,
    fuel_rail_pressure_kpa DECIMAL(8,1) NULL,
    fuel_rail_pressure_diesel_kpa INT UNSIGNED NULL,
    fuel_rail_abs_pressure_kpa INT UNSIGNED NULL,
    fuel_inject_timing_deg DECIMAL(6,2) NULL,

    -- Intake / exhaust
    intake_map_kpa SMALLINT UNSIGNED NULL,
    barometric_pressure_kpa TINYINT UNSIGNED NULL,
    commanded_egr_pct DECIMAL(5,1) NULL,
    egr_error_pct DECIMAL(5,1) NULL,
    commanded_evap_purge_pct DECIMAL(5,1) NULL,
    evap_system_vapor_pressure_pa SMALLINT NULL,
    abs_evap_vapor_pressure_kpa DECIMAL(6,2) NULL,
    evap_vapor_pressure_alt_pa SMALLINT NULL,
    secondary_air_status TINYINT UNSIGNED NULL,

    -- Throttle / pedal
    rel_throttle_pct DECIMAL(5,1) NULL,
    abs_throttle_b_pct DECIMAL(5,1) NULL,
    abs_throttle_c_pct DECIMAL(5,1) NULL,
    accel_pedal_d_pct DECIMAL(5,1) NULL,
    accel_pedal_e_pct DECIMAL(5,1) NULL,
    accel_pedal_f_pct DECIMAL(5,1) NULL,
    commanded_throttle_pct DECIMAL(5,1) NULL,
    rel_accel_pedal_pct DECIMAL(5,1) NULL,

    -- O2 sensors (voltage)
    o2_b1s1_voltage DECIMAL(5,3) NULL,
    o2_b1s2_voltage DECIMAL(5,3) NULL,
    o2_b1s3_voltage DECIMAL(5,3) NULL,
    o2_b1s4_voltage DECIMAL(5,3) NULL,
    o2_b2s1_voltage DECIMAL(5,3) NULL,
    o2_b2s2_voltage DECIMAL(5,3) NULL,
    o2_b2s3_voltage DECIMAL(5,3) NULL,
    o2_b2s4_voltage DECIMAL(5,3) NULL,

    -- O2 sensors (lambda / wide-band)
    o2_b1s1_lambda DECIMAL(6,4) NULL,
    o2_b1s2_lambda DECIMAL(6,4) NULL,
    o2_b2s1_lambda DECIMAL(6,4) NULL,
    o2_b2s2_lambda DECIMAL(6,4) NULL,
    o2_b2s3_lambda DECIMAL(6,4) NULL,
    o2_b2s4_lambda DECIMAL(6,4) NULL,
    o2_b2s5_lambda DECIMAL(6,4) NULL,
    o2_b2s6_lambda DECIMAL(6,4) NULL,

    -- O2 sensors (current)
    o2_b1s1_current_ma DECIMAL(6,2) NULL,
    o2_b1s2_current_ma DECIMAL(6,2) NULL,
    o2_b2s1_current_ma DECIMAL(6,2) NULL,
    o2_b2s2_current_ma DECIMAL(6,2) NULL,
    o2_b2s3_current_ma DECIMAL(6,2) NULL,
    o2_b2s4_current_ma DECIMAL(6,2) NULL,
    o2_b2s5_current_ma DECIMAL(6,2) NULL,
    o2_b2s6_current_ma DECIMAL(6,2) NULL,

    -- O2 trim
    short_o2_trim_b1_pct DECIMAL(5,1) NULL,
    long_o2_trim_b1_pct DECIMAL(5,1) NULL,
    short_o2_trim_b2_pct DECIMAL(5,1) NULL,
    long_o2_trim_b2_pct DECIMAL(5,1) NULL,
    o2_sensors_present_2bank TINYINT UNSIGNED NULL,
    o2_sensors_present_4bank TINYINT UNSIGNED NULL,

    -- Catalyst
    cat_temp_b1s1_c DECIMAL(6,1) NULL,
    cat_temp_b2s1_c DECIMAL(6,1) NULL,
    cat_temp_b1s2_c DECIMAL(6,1) NULL,
    cat_temp_b2s2_c DECIMAL(6,1) NULL,

    -- Torque
    demanded_torque_pct SMALLINT NULL,
    actual_torque_pct SMALLINT NULL,
    reference_torque_nm SMALLINT UNSIGNED NULL,
    engine_torque_data_pct VARCHAR(50) NULL,

    -- Electrical / misc
    control_module_voltage_v DECIMAL(5,2) NULL,
    absolute_load_pct DECIMAL(6,1) NULL,
    commanded_lambda DECIMAL(6,4) NULL,
    ambient_air_temp_c SMALLINT NULL,
    engine_oil_temp_c SMALLINT NULL,
    hybrid_battery_life_pct DECIMAL(5,1) NULL,
    aux_input_status TINYINT UNSIGNED NULL,

    -- Diagnostics
    dtc_count TINYINT UNSIGNED NULL,
    freeze_dtc SMALLINT UNSIGNED NULL,
    obd_standard TINYINT UNSIGNED NULL,
    monitor_status_drive_cycle TEXT NULL,
    distance_with_mil_km SMALLINT UNSIGNED NULL,
    distance_since_clear_km SMALLINT UNSIGNED NULL,
    warmups_since_clear TINYINT UNSIGNED NULL,
    time_with_mil_min SMALLINT UNSIGNED NULL,
    time_since_clear_min SMALLINT UNSIGNED NULL,
    emission_requirements VARCHAR(20) NULL,

    -- PID support bitmasks (stored for debugging)
    pids_supported_01_20 VARCHAR(8) NULL,
    pids_supported_21_40 VARCHAR(8) NULL,
    pids_supported_41_60 VARCHAR(8) NULL,
    pids_supported_61_80 VARCHAR(8) NULL,

    -- Alternative / extended sensors
    mass_air_flow_sensor_g_per_s DECIMAL(7,2) NULL,
    engine_coolant_temp_2_c SMALLINT NULL,
    intake_air_temp_2_c SMALLINT NULL,
    turbo_a_pressure_kpa TINYINT UNSIGNED NULL,
    boost_pressure_kpa TINYINT UNSIGNED NULL,

    INDEX idx_trip_id (trip_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_trip_timestamp (trip_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
