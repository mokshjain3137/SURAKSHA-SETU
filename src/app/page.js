'use client';
import { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });
import SurakshaSetuSMSPanel from '@/components/SurakshaSetuSMSPanel';

const CREDENTIALS = {
  admin: { username: "1", password: "1", role: "Admin", fullName: "Govt Official" },
  user: { username: "2", password: "2", role: "User", fullName: "On-Duty Officer" },
  volunteer: { username: "3", password: "3", role: "Volunteer", fullName: "Field Volunteer" },
  maintenance: { username: "4", password: "4", role: "Maintenance", fullName: "System Maintenance Admin" }
};

const VOLUNTEER_SPECIALTIES = [
  {
    value: "Doctor",
    label: "Doctor / Physician",
    docLabel: "Official Doctor ID / Medical Council Registration Card",
    docHint: "Upload MBBS/MD license, Hospital Doctor ID, or State Medical Council ID (JPG, PNG, or PDF)"
  },
  {
    value: "Nurse",
    label: "Nurse / Nursing Staff",
    docLabel: "Official Nursing Council ID / Hospital Staff ID",
    docHint: "Upload Registered Nurse ID card or State Nursing Council registration (JPG, PNG, or PDF)"
  },
  {
    value: "NCC/NSS Cadet",
    label: "NCC / NSS Cadet",
    docLabel: "Official NCC / NSS Cadet ID Card or Unit Certificate",
    docHint: "Upload NCC C-Certificate, Battalion ID, or NSS Unit Volunteer Card (JPG, PNG, or PDF)"
  },
  {
    value: "Paramedic / EMT",
    label: "Paramedic / EMT",
    docLabel: "Official Paramedic / First-Aid Certification ID",
    docHint: "Upload EMT certification or Red Cross / St. John Ambulance ID (JPG, PNG, or PDF)"
  },
  {
    value: "Rescue Personnel",
    label: "Rescue / NDRF / SDRF Responder",
    docLabel: "Official Rescue Force / Fire & Emergency Service ID",
    docHint: "Upload NDRF/SDRF/Fire Service badge or deployment authorization (JPG, PNG, or PDF)"
  },
  {
    value: "Driver / Logistics",
    label: "Ambulance / Logistics Driver",
    docLabel: "Commercial Driving License & Emergency Vehicle Permit",
    docHint: "Upload valid Transport/Heavy Driving License or Ambulance Operator ID (JPG, PNG, or PDF)"
  },
  {
    value: "Civil Volunteer",
    label: "Civil Defense / General Volunteer",
    docLabel: "Government Photo ID / Civil Defense Volunteer Pass",
    docHint: "Upload Government ID or District Civil Defense Volunteer Pass (JPG, PNG, or PDF)"
  }
];

const DEFAULT_RESOURCES = [
  { id: 1, name: "Emergency Medical Kit", type: "Medical Supplies", totalQuantity: 500, availableQuantity: 350 },
  { id: 2, name: "Food Packages", type: "Food & Water", totalQuantity: 1000, availableQuantity: 800 },
  { id: 3, name: "Emergency Tents", type: "Shelter", totalQuantity: 100, availableQuantity: 75 },
  { id: 4, name: "Rescue Personnel", type: "Rescue Team", totalQuantity: 50, availableQuantity: 40 },
  { id: 5, name: "Emergency Ambulances", type: "Ambulance", totalQuantity: 20, availableQuantity: 15 },
  { id: 6, name: "Clean Drinking Water", type: "Food & Water", totalQuantity: 5000, availableQuantity: 3200 },
  { id: 7, name: "Blankets & Sleeping Bags", type: "Bedding", totalQuantity: 1500, availableQuantity: 1200 },
  { id: 8, name: "Inflatable Rescue Boats", type: "Rescue Boats", totalQuantity: 40, availableQuantity: 28 },
  { id: 9, name: "Heavy Duty Excavators (JCB)", type: "Heavy Machinery", totalQuantity: 15, availableQuantity: 10 }
];

const DEFAULT_VOLUNTEERS = [
  { id: 1, name: "Dr. Sandeep", role: "Medical", status: "available", lat: 12.5318, lng: 76.9051, phone: "9123456780" },
  { id: 2, name: "Kiran Kumar", role: "Rescue", status: "busy", lat: 12.5118, lng: 76.9151, phone: "9123456781" },
  { id: 3, name: "Arjun Singh", role: "Driver", status: "available", lat: 12.5418, lng: 76.8851, phone: "9123456782" }
];

const DUMMY_REQUESTS = [
  {
    id: 1,
    requestId: "REQ-1000",
    resourceType: "Medical Supplies",
    quantityRequested: 150,
    quantityAllocated: 100,
    quantityPending: 50,
    lat: 12.5118,
    lng: 76.8851,
    severity: 5,
    individualsAffected: 200,
    status: "partial",
    contactPerson: "Dr. Ramesh Sharma",
    contactPhone: "9876543210",
    address: "Near Mandya Railway Station, Mandya",
    description: "Critical medical supplies needed urgently for cyclone victims. Require emergency medicines, first aid kits, and antiseptics. Multiple injuries reported."
  },
  {
    id: 2,
    requestId: "REQ-1001",
    resourceType: "Food & Water",
    quantityRequested: 500,
    quantityAllocated: 0,
    quantityPending: 500,
    lat: 12.5318,
    lng: 76.9051,
    severity: 4,
    individualsAffected: 100,
    status: "pending",
    contactPerson: "Rajesh Kumar",
    contactPhone: "9876543211",
    address: "MIMS Doctors Quarters, Mandya",
    description: "Emergency food supplies and clean drinking water needed for evacuees at temporary shelter. Families include elderly and children requiring immediate assistance."
  },
  {
    id: 3,
    requestId: "REQ-1002",
    resourceType: "Shelter",
    quantityRequested: 30,
    quantityAllocated: 30,
    quantityPending: 0,
    lat: 12.5418,
    lng: 76.9051,
    severity: 3,
    individualsAffected: 50,
    status: "allocated",
    contactPerson: "Priya Nair",
    contactPhone: "9876543212",
    address: "Temple Road, Mandya",
    description: "Temporary shelter tents required for displaced families whose homes were damaged in heavy rains. Need waterproof tents with basic amenities."
  },
  {
    id: 4,
    requestId: "REQ-1003",
    resourceType: "Ambulance",
    quantityRequested: 5,
    quantityAllocated: 5,
    quantityPending: 0,
    lat: 12.5018,
    lng: 76.8951,
    severity: 5,
    individualsAffected: 25,
    status: "resolved",
    contactPerson: "Mohammed Ali",
    contactPhone: "9876543213",
    address: "Near Mandya Bus Stand, Mandya",
    description: "Emergency medical transport needed for critical patients. Several casualties with severe injuries requiring immediate hospital admission and specialized care.",
    resolvedAt: "2026-05-22T10:30:00Z"
  },
  {
    id: 5,
    requestId: "REQ-1004",
    resourceType: "Rescue Team",
    quantityRequested: 10,
    quantityAllocated: 0,
    quantityPending: 10,
    lat: 12.5218,
    lng: 76.9251,
    severity: 4,
    individualsAffected: 80,
    status: "pending",
    contactPerson: "Anil Verma",
    contactPhone: "9876543214",
    address: "Industrial Area, Mandya",
    description: "Rescue operation urgently needed for people stranded in flooded area. Water level rising rapidly. Require boats and trained rescue personnel immediately."
  }
];

const TRANSLATIONS = {
  en: {
    title: "Suraksha Setu",
    base: "Base: VVCE Mysuru Emergency Operations Center",
    hw_title: "Live Hardware Monitoring ",
    temp: "Temperature",
    hum: "Humidity",
    soil: "Soil Moisture",
    water: "Water Level",
    seismic: "Seismic Activity",
    air: "Air Quality",
    rain: "Rain Intensity",
    pressure: "Pressure",
    altitude: "Altitude",
    windSpeed: "Wind Speed",
    windDir: "Wind Direction",
    submit_req: "Submit Emergency Request",
    res_type: "Resource Type",
    qty: "Quantity",
    severity: "Severity (1-5)",
    affected: "Individuals Affected",
    desc: "Description",
    submit_btn: "Submit Request",
    sos_btn: "SOS",
    sos_label: "Instant Emergency Help",
    logout: "Logout",
    active_req: "Active Emergency Requests",
    resolved_req: "Resolved Requests",
    avail_res: "Available Resources",
    join_vol: "Join as a Volunteer",
    name: "Full Name",
    expertise: "Expertise",
    phone: "Phone Number",
    reg_vol: "Register as Volunteer",
    avail_supplies: "Available Supplies",
    normal_mode: "Normal Mode",
    tactical_mode: "Tactical Mode",
    total_req: "Total Requests",
    active_req_short: "Active Requests",
    resolved_req_short: "Resolved Requests",
    critical_priority: "Critical Priority",
    ai_assistant: "Suraksha Setu AI Assistant",
    gen_report: "Generate Situation Report",
    ai_helper_text: "Click 'Generate Situation Report' to get an AI analysis of the current environment logs.",
    analyzing_data: "Analyzing data...",
    weather_forecast: "Weather Forecast",
    loading_weather: "Loading weather details...",
    command_map: "Emergency Command Map",
    live_deployment: "LIVE DEPLOYMENT",
    last_sync: "Last Sync",
    city_name: "City Name",
    weather_desc: "Weather Description",
    feels_like: "Feels Like",
    visibility: "Visibility",
    cloudiness: "Cloudiness",
    coordinates: "Coordinates",
    timezone: "Timezone",
    location_map: "Emergency Location Map",
    submit_req_admin: "Submit Emergency Request (Govt Official)",
    on_duty_vols: "On-Duty Volunteers",
    sys_analytics: "System Analytics & Predictions",
    resolved_history: "Resolved Requests History",
    local_weather: "Local Weather",
    live_sensor_data: "Live Sensor Data",
    allocate_resources: "Allocate Resources",
    route_info: "Route Info",
    edit_resource: "Edit Resource",
    add_resource: "Add Resource",
    welcome_back: "Welcome Back",
    login_sub: "Sign in to your account",
    username: "Username",
    password: "Password",
    login_btn: "Login",
    demo_btn: "Use Demo Govt Official Credentials",
    dont_have_account: "Don't have an account? Register new account",
    disaster_mgmt: "Disaster Response Management System",
    join_suraksha_setu: "Join Suraksha Setu",
    create_account_sub: "Create your account to get started",
    account_security: "Account Security",
    confirm_password: "Confirm Password",
    retype_password: "Retype Password",
    choose_username: "Choose a unique username",
    min_chars: "Min 6 characters",
    account_type: "Account Type",
    standard_fn: "Standard Functionality",
    sys_mgmt: "System Management",
    create_account_btn: "Create Account",
    already_have_account: "Already have an account? Login here",
    type: "Type",
    qty_short: "Qty",
    location: "Location",
    person: "Person",
    phone_short: "Phone",
    priority: "Priority",
    status: "Status",
    actions: "Actions",
    id: "ID",
    resolved_at: "Resolved At",
    critical_first: "Critical First",
    low_first: "Low Risk First",
    purge: "Purge",
    allocate: "Allocate",
    resolve: "Resolve",
    route: "Route",
    ml_priority: "Real-time ML Priority",
    confidence: "Confidence",
    sos_hint: "One-click alert with your mobile GPS telemetry",
    medical_first_aid: "Medical / First Aid",
    rescue_search: "Rescue / Search",
    driver_logistics: "Driver / Logistics",
    general_assistance: "General Assistance",
    weather_syncing: "Weather readings syncing...",
    req_details: "Request Details",
    qty_to_allocate: "Quantity to Allocate",
    cancel: "Cancel",
    distance: "Distance",
    est_time: "Estimated Time",
    severity_level: "Severity Level",
    ok: "OK",
    resource_name: "Resource Name",
    total_qty: "Total Quantity",
    avail_qty: "Available Quantity",
    save: "Save",
    pinned_target: "Pinned Target",
    map_pin_required: "🚨 Map Target Pin Required",
    dispatch: "Dispatch",
    admin: "Govt Official",
    from_north: "from North",
    units: "units",
    dispatch_title: "Select Incident Request for Dispatch",
    dispatch_desc: "Select a request from the active list below to dispatch the volunteer to that specific location.",
    what: "What Needed",
    where: "Where (Location / Address)",
    no_pending_requests: "No active requests available to dispatch volunteers to.",
    exhaustion_forecast: "Inventory Exhaustion Forecast",
    hrs_left: "hrs left",
    burn_rate: "Burn Rate",
    units_hr: "units/hr",
    risk: "RISK",
    avg_priority: "Avg Priority",
    people_helped: "People Helped",
    utilization: "Utilization",
    avg_response_time: "Avg Response Time",
    coords_locked: "Coords Locked",
    pin_target_required: "🚨 Pinned target coords required (Click Map)"
  },
  kn: {
    title: "ಸುರಕ್ಷಾ ಸೇತು",
    base: "ನೆಲೆ: ವಿವಿಇಸಿ ಮೈಸೂರು ತುರ್ತು ಕಾರ್ಯಾಚರಣೆ ಕೇಂದ್ರ",
    hw_title: "ಲೈವ್ ಹಾರ್ಡ್‌ವೇರ್ ಮಾನಿಟರಿಂಗ್ (ಸುಪಬೇಸ್)",
    temp: "ತಾಪಮಾನ",
    hum: "ಆರ್ದ್ರತೆ",
    soil: "ಮಣ್ಣಿನ ತೇವಾಂಶ",
    water: "ನೀರಿನ ಮಟ್ಟ",
    seismic: "ಭೂಕಂಪನ ಚಟುವಟಿಕೆ",
    air: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ",
    rain: "ಮಳೆಯ ತೀವ್ರತೆ",
    pressure: "ಒತ್ತಡ",
    altitude: "ಎತ್ತರ",
    windSpeed: "ಗಾಳಿಯ ವೇಗ",
    windDir: "ಗಾಳಿಯ ದಿಕ್ಕು",
    submit_req: "ತುರ್ತು ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    res_type: "ಸಂಪನ್ಮೂಲ ಪ್ರಕಾರ",
    qty: "ಪ್ರಮಾಣ",
    severity: "ತೀವ್ರತೆ (1-5)",
    affected: "ಪೀಡಿತ ವ್ಯಕ್ತಿಗಳು",
    desc: "ವಿವರಣೆ",
    submit_btn: "ವಿನಂತಿಯನ್ನು ಸಲ್ಲಿಸಿ",
    sos_btn: "ಎಸ್ಒಎಸ್",
    sos_label: "ತತ್ಕ್ಷಣ ತುರ್ತು ಸಹಾಯ",
    logout: "ನಿರ್ಗಮಿಸಿ",
    active_req: "ಸಕ್ರಿಯ ತುರ್ತು ವಿನಂತಿಗಳು",
    resolved_req: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳು",
    avail_res: "ಲಭ್ಯವಿರುವ ಸಂಪನ್ಮೂಲಗಳು",
    join_vol: "ಸ್ವಯಂಸೇವಕರಾಗಿ ಸೇರಿ",
    name: "ಪೂರ್ಣ ಹೆಸರು",
    expertise: "ಪರಿಣತಿ",
    phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    reg_vol: "ಸ್ವಯಂಸೇವಕರಾಗಿ ನೋಂದಾಯಿಸಿ",
    avail_supplies: "ಲಭ್ಯವಿರುವ ಸರಬರಾಜುಗಳು",
    normal_mode: "ಸಾಮಾನ್ಯ ಮೋಡ್",
    tactical_mode: "ಯುದ್ಧತಂತ್ರದ ಮೋಡ್",
    total_req: "ಒಟ್ಟು ವಿನಂತಿಗಳು",
    active_req_short: "ಸಕ್ರಿಯ ವಿನಂತಿಗಳು",
    resolved_req_short: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳು",
    critical_priority: "ಗಂಭೀರ ಆದ್ಯತೆ",
    ai_assistant: "ಸುರಕ್ಷಾ ಸೇತು AI ಸಹಾಯಕಿ",
    gen_report: "ಪರಿಸ್ಥಿತಿ ವರದಿ ರಚಿಸಿ",
    ai_helper_text: "ಪ್ರಸ್ತುತ ಪರಿಸರದ ಲಾಗ್‌ಗಳ AI ವಿಶ್ಲೇಷಣೆಯನ್ನು ಪಡೆಯಲು 'ಪರಿಸ್ಥಿತಿ ವರದಿ ರಚಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ.",
    analyzing_data: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    weather_forecast: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    loading_weather: "ಹವಾಮಾನ ವಿವರಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    command_map: "ತುರ್ತು ನಿಯಂತ್ರಣ ನಕ್ಷೆ",
    live_deployment: "ಲೈವ್ ನಿಯೋಜನೆ",
    last_sync: "ಕೊನೆಯ ಸಿಂಕ್",
    city_name: "ನಗರದ ಹೆಸರು",
    weather_desc: "ಹವಾಮಾನ ವಿವರಣೆ",
    feels_like: "ಹಾಗೆ ಭಾಸವಾಗುತ್ತದೆ",
    visibility: "ಗೋಚರತೆ",
    cloudiness: "ಮೋಡ ಕವಿದ ವಾತಾವರಣ",
    coordinates: "ನಿರ್ದೇಶಾಂಕಗಳು",
    timezone: "ಸಮಯ ವಲಯ",
    location_map: "ತುರ್ತು ಸ್ಥಳ ನಕ್ಷೆ",
    submit_req_admin: "ತುರ್ತು ವಿನಂತಿ ಸಲ್ಲಿಸಿ (ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ)",
    on_duty_vols: "ಕರ್ತವ್ಯದಲ್ಲಿರುವ ಸ್ವಯಂಸೇವಕರು",
    sys_analytics: "ವ್ಯವಸ್ಥೆ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಮುನ್ಸೂಚನೆಗಳು",
    resolved_history: "ಪರಿಹರಿಸಲಾದ ವಿನಂತಿಗಳ ಇತಿಹಾಸ",
    local_weather: "ಸ್ಥಳೀಯ ಹವಾಮಾನ",
    live_sensor_data: "ಲೈವ್ ಸೆನ್ಸರ್ ಡೇಟಾ",
    allocate_resources: "ಸಂಪನ್ಮೂಲಗಳನ್ನು ಹಂಚಿಕೆ ಮಾಡಿ",
    route_info: "ಮಾರ್ಗ ಮಾಹಿತಿ",
    edit_resource: "ಸಂಪನ್ಮೂಲವನ್ನು ಸಂಪಾದಿಸಿ",
    add_resource: "ಸಂಪನ್ಮೂಲವನ್ನು ಸೇರಿಸಿ",
    welcome_back: "ಪುನಃ ಸುಸ್ವಾಗತ",
    login_sub: "ನಿಮ್ಮ ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    username: "ಬಳಕೆದಾರ ಹೆಸರು",
    password: "ಗುಪ್ತಪದ",
    login_btn: "ಲಾಗಿನ್",
    demo_btn: "ಡೆಮೊ ನಿರ್ವಾಹಕ ರುಜುವಾತುಗಳನ್ನು ಬಳಸಿ",
    dont_have_account: "ಖಾತೆ ಇಲ್ಲವೇ? ಹೊಸದನ್ನು ರಚಿಸಿ",
    disaster_mgmt: "ವಿಪತ್ತು ಪ್ರತಿಕ್ರಿಯೆ ನಿರ್ವಹಣಾ ವ್ಯವಸ್ಥೆ",
    join_suraksha_setu: "ಸುರಕ್ಷಾ ಸೇತು ಸೇರಿ",
    create_account_sub: "ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
    account_security: "ಖಾತೆ ಭದ್ರತೆ",
    confirm_password: "ದೃಢೀಕರಿಸಿ",
    retype_password: "ಗುಪ್ತಪದವನ್ನು ಮರುಟೈಪ್ ಮಾಡಿ",
    choose_username: "ವಿಶಿಷ್ಟ ಬಳಕೆದಾರ ಹೆಸರನ್ನು ಆರಿಸಿ",
    min_chars: "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು",
    account_type: "ಖಾತೆಯ ಪ್ರಕಾರ",
    standard_fn: "ಸಾಮಾನ್ಯ ಕಾರ್ಯಶೀಲತೆ",
    sys_mgmt: "ಸಿಸ್ಟಮ್ ನಿರ್ವಹಣೆ",
    create_account_btn: "ಖಾತೆ ರಚಿಸಿ",
    already_have_account: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ? ಲಾಗಿನ್ ಮಾಡಿ",
    type: "ಪ್ರಕಾರ",
    qty_short: "ಪ್ರಮಾಣ",
    location: "ಸ್ಥಳ",
    person: "ಸಂಪರ್ಕ ವ್ಯಕ್ತಿ",
    phone_short: "ಫೋನ್",
    priority: "ಆದ್ಯತೆ",
    status: "ಸ್ಥಿತಿ",
    actions: "ಕ್ರಮಗಳು",
    id: "ಐಡಿ",
    resolved_at: "ಪರಿಹರಿಸಲಾದ ಸಮಯ",
    critical_first: "ಗಂಭೀರ ಮೊದಲು",
    low_first: "ಕಡಿಮೆ ಆದ್ಯತೆ ಮೊದಲು",
    purge: "ಅಳಿಸಿ",
    allocate: "ಹಂಚಿಕೆ",
    resolve: "ಪರಿಹರಿಸಿ",
    route: "ಮಾರ್ಗ",
    ml_priority: "ನೈಜ-ಸಮಯದ ML ಆದ್ಯತೆ",
    confidence: "ವಿಶ್ವಾಸಾರ್ಹತೆ",
    sos_hint: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಜಿಪಿಎಸ್ ಟೆಲಿಮೆಟ್ರಿಯೊಂದಿಗೆ ಒಂದೇ ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಎಚ್ಚರಿಕೆ",
    medical_first_aid: "ವೈದ್ಯಕೀಯ / ಪ್ರಥಮ ಚಿಕಿತ್ಸೆ",
    rescue_search: "ರಕ್ಷಣೆ / ಹುಡುಕಾಟ",
    driver_logistics: "ಚಾಲಕ / ಲಾಜಿಸ್ಟಿಕ್ಸ್",
    general_assistance: "ಸಾಮಾನ್ಯ ಸಹಾಯ",
    weather_syncing: "ಹವಾಮಾನ ವಿವರಗಳು ಸಿಂಕ್ ಆಗುತ್ತಿವೆ...",
    req_details: "ವಿನಂತಿಯ ವಿವರಗಳು",
    qty_to_allocate: "ಹಂಚಿಕೆ ಮಾಡಬೇಕಾದ ಪ್ರಮಾಣ",
    cancel: "ರದ್ದುಮಾಡಿ",
    distance: "ದೂರ",
    est_time: "ಅಂದಾಜು ಸಮಯ",
    severity_level: "ತೀವ್ರತೆಯ ಮಟ್ಟ",
    ok: "ಸರಿ",
    resource_name: "ಸಂಪನ್ಮೂಲ ಹೆಸರು",
    total_qty: "ಒಟ್ಟು ಪ್ರಮಾಣ",
    avail_qty: "ಲಭ್ಯವಿರುವ ಪ್ರಮಾಣ",
    save: "ಉಳಿಸಿ",
    pinned_target: "ಪಿನ್ ಮಾಡಿದ ಗುರಿ",
    map_pin_required: "🚨 ನಕ್ಷೆಯಲ್ಲಿ ಗುರಿ ಗುರುತಿಸುವುದು ಅಗತ್ಯ",
    dispatch: "ನಿಯೋಜಿಸು",
    admin: "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿ",
    from_north: "ಉತ್ತರದಿಂದ",
    units: "ಘಟಕಗಳು",
    dispatch_title: "ನಿಯೋಜನೆಗಾಗಿ ಘಟನೆ ವಿನಂತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    dispatch_desc: "ಸ್ವಯಂಸೇವಕರನ್ನು ಆ ನಿರ್ದಿಷ್ಟ ಸ್ಥಳಕ್ಕೆ ನಿಯೋಜಿಸಲು ಕೆಳಗಿನ ಸಕ್ರಿಯ ಪಟ್ಟಿಯಿಂದ ವಿನಂತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    what: "ಏನು ಬೇಕಾಗಿದೆ",
    where: "ಎಲ್ಲಿ (ಸ್ಥಳ / ವಿಳಾಸ)",
    no_pending_requests: "ಸ್ವಯಂಸೇವಕರನ್ನು ನಿಯೋಜಿಸಲು ಯಾವುದೇ ಸಕ್ರಿಯ ವಿನಂತಿಗಳು ಲಭ್ಯವಿಲ್ಲ.",
    exhaustion_forecast: "ದಾಸ್ತಾನು ಖಾಲಿಯಾಗುವ ಮುನ್ಸೂಚನೆ",
    hrs_left: "ಗಂಟೆಗಳು ಬಾಕಿ",
    burn_rate: "ಬಳಕೆಯ ದರ",
    units_hr: "ಘಟಕಗಳು/ಗಂಟೆ",
    risk: "ಅಪಾಯ",
    avg_priority: "ಸರಾಸರಿ ಆದ್ಯತೆ",
    people_helped: "ಸಹಾಯ ಪಡೆದ ಜನರು",
    utilization: "ಬಳಕೆ ದರ",
    avg_response_time: "ಸರಾಸರಿ ಪ್ರತಿಕ್ರಿಯೆ ಸಮಯ",
    coords_locked: "ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಲಾಕ್ ಮಾಡಲಾಗಿದೆ",
    pin_target_required: "🚨 ಪಿನ್ ಮಾಡಿದ ಗುರಿಯ ನಿರ್ದೇಶಾಂಕಗಳು ಅಗತ್ಯವಿದೆ (ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ)"
  }
};

const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "";

export default function Home() {
  // Toast Notification State
  const [toast, setToast] = useState({ message: '', type: '', visible: false });
  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Authentication & Session
  const [currentUser, setCurrentUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // Registration Form
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('User');
  const [regError, setRegError] = useState('');

  // Core Data State
  const [requests, setRequests] = useState([]);
  const [resources, setResources] = useState(DEFAULT_RESOURCES);
  const [volunteers, setVolunteers] = useState(DEFAULT_VOLUNTEERS);
  const [nextRequestId, setNextRequestId] = useState(1005);
  const [dispatchingVolId, setDispatchingVolId] = useState(null);

  // Map & Location State
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Weather & Sensors
  const [weatherData, setWeatherData] = useState(null);
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    water_level: null,
    seismic: null,
    rain_level: null,
    latitude: 0,
    longitude: 0,
    status: "Live Hardware Sync",
    created_at: null
  });

  // Settings & Accessibility
  const [lang, setLang] = useState('en');
  const [tacticalMode, setTacticalMode] = useState(false);
  const [mobileView, setMobileView] = useState(false);

  // AI Triage & Matchmaking & Broadcasts State
  const [selectedTriageRequest, setSelectedTriageRequest] = useState(null);
  const [aiTriageLoading, setAiTriageLoading] = useState(false);
  const [broadcasts, setBroadcasts] = useState([]);
  const [newBroadcastMsg, setNewBroadcastMsg] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("info");
  const [broadcastZone, setBroadcastZone] = useState("All Sectors");
  const [isDemoModeOpen, setIsDemoModeOpen] = useState(false);

  // AI Alert Deduplication & Noise Reducer State
  const [aiDedupActive, setAiDedupActive] = useState(false);
  const [aiDedupLoading, setAiDedupLoading] = useState(false);
  const [aiDedupResult, setAiDedupResult] = useState(null);
  const [expandedClusterMap, setExpandedClusterMap] = useState({});

  // Collapsible UI panels (Hardware open by default for live telemetry monitoring)
  const [isHardwareExpanded, setIsHardwareExpanded] = useState(true);
  const [isWeatherExpanded, setIsWeatherExpanded] = useState(false);
  const [isVolunteerFormExpanded, setIsVolunteerFormExpanded] = useState(false);
  const [isUserResourcesExpanded, setIsUserResourcesExpanded] = useState(false);

  // AI Assistant State
  const [aiSummaryOutput, setAiSummaryOutput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sort Risk Level
  const [riskSort, setRiskSort] = useState('critical');

  // Modals & Allocation Inputs
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateRequest, setAllocateRequest] = useState(null);
  const [allocateQtyVal, setAllocateQtyVal] = useState('');
  const [allocateVolunteerId, setAllocateVolunteerId] = useState('');

  const [showResourceModal, setShowResourceModal] = useState(false);
  const [resourceModalData, setResourceModalData] = useState({ id: '', name: '', type: '', totalQuantity: '', availableQuantity: '' });

  // User Dashboard Form Inputs
  const [userResourceType, setUserResourceType] = useState('');
  const [userQuantity, setUserQuantity] = useState('');
  const [userSeverity, setUserSeverity] = useState('');
  const [userIndividuals, setUserIndividuals] = useState('');
  const [userDescription, setUserDescription] = useState('');

  // Admin Dashboard Form Inputs
  const [adminResourceType, setAdminResourceType] = useState('');
  const [adminQuantity, setAdminQuantity] = useState('');
  const [adminSeverity, setAdminSeverity] = useState('');
  const [adminIndividuals, setAdminIndividuals] = useState('');
  const [adminContact, setAdminContact] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminDescription, setAdminDescription] = useState('');

  // SurakshaSetu Off-Grid SMS Alerts
  const [smsData, setSmsData] = useState([]);

  // Volunteer Join Inputs
  const [volName, setVolName] = useState('');
  const [volRole, setVolRole] = useState('Medical');
  const [volPhone, setVolPhone] = useState('');

  // Volunteer Login Verification & Onboarding State
  const [volunteerProfile, setVolunteerProfile] = useState({
    id: null,
    name: '',
    phone: '',
    specialty: '',
    docNumber: '',
    docFileName: '',
    docFileSize: '',
    isVerified: false
  });

  // System Maintenance Admin State (Role 4)
  const [maintenanceTab, setMaintenanceTab] = useState('health'); // 'health' | 'onboarding' | 'offline-maps' | 'anti-spam'
  const [systemHealth, setSystemHealth] = useState({
    telemetry: { status: 'Checking...', latency: 0, count: 0, nodeCount: 1 },
    sms: { status: 'Checking...', latency: 0, count: 0 },
    requests: { status: 'Checking...', latency: 0, count: 0 },
    volunteers: { status: 'Checking...', latency: 0, count: 0 },
    offlineMaps: { status: 'Checking...', latency: 0, count: 0 },
    antiSpam: { status: 'Checking...', latency: 0, count: 0 },
    lastChecked: null
  });
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);

  // Maintenance: Volunteer Onboarding Form (Add-Only, verified: false, status: 'pending')
  const [maintVolName, setMaintVolName] = useState('');
  const [maintVolPhone, setMaintVolPhone] = useState('');
  const [maintVolSpecialty, setMaintVolSpecialty] = useState('Paramedic / EMT');
  const [maintVolSector, setMaintVolSector] = useState('Tumkur Central Sector');
  const [maintVolDocNumber, setMaintVolDocNumber] = useState('');
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);

  // Maintenance: Offline Maps Management
  const [offlineMapPackages, setOfflineMapPackages] = useState([]);
  const [syncingMapId, setSyncingMapId] = useState(null);
  const [viewingMapPackage, setViewingMapPackage] = useState(null);

  // Maintenance: Anti-Spam Management
  const [antiSpamConfig, setAntiSpamConfig] = useState({
    blockedNumbers: [],
    spamKeywords: [],
    rateLimitEnabled: true,
    rateLimitWindowSeconds: 30
  });
  const [newBlockedNumberInput, setNewBlockedNumberInput] = useState('');
  const [newSpamKeywordInput, setNewSpamKeywordInput] = useState('');

  const routeTimeoutRef = useRef(null);
  const routeModalTimeoutRef = useRef(null);

  const t = TRANSLATIONS[lang];

  // 1. Initial Load & Setup
  useEffect(() => {
    // Restore User Session
    const savedUser = localStorage.getItem('drmsCurrentUser');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        setTimeout(() => {
          setCurrentUser(userObj);
        }, 0);
      } catch (e) {
        localStorage.removeItem('drmsCurrentUser');
      }
    }

    const savedVolunteerProfile = localStorage.getItem('surakshaVolunteerProfile');
    if (savedVolunteerProfile) {
      try {
        const volProf = JSON.parse(savedVolunteerProfile);
        setTimeout(() => {
          setVolunteerProfile(volProf);
        }, 0);
      } catch (e) {
        localStorage.removeItem('surakshaVolunteerProfile');
      }
    }

    // Restore Settings
    localStorage.removeItem('suraksha_setu_lang');
    const savedTactical = localStorage.getItem('tacticalMode') === 'true';
    const savedMobile = localStorage.getItem('mobileViewActive') === 'true';
    setTimeout(() => {
      setTacticalMode(savedTactical);
      setMobileView(savedMobile);
    }, 0);

    // Load broadcasts from server
    const loadBroadcasts = async () => {
      try {
        const res = await fetch('/api/broadcasts');
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data);
        }
      } catch (err) {
        console.error("Failed to load broadcasts:", err);
      }
    };

    // Load requests from server, fallback to seeded DUMMY_REQUESTS if empty/fails
    const loadRequests = async () => {
      try {
        const res = await fetch('/api/requests');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            let maxReqNum = 1005;
            const mapped = data.map(req => {
              const reqMatch = typeof req.requestId === 'string' && req.requestId.match(/^REQ-(\d+)$/);
              if (reqMatch) {
                const num = parseInt(reqMatch[1], 10);
                if (num > maxReqNum) maxReqNum = num;
              }

              const isSos = Boolean(req.isSOS || (typeof req.requestId === 'string' && req.requestId.startsWith('SOS-')) || req.resourceType === 'CRITICAL SOS');
              const hasStoredPriority = typeof req.priorityScore === 'number' && typeof req.mlPriorityClass === 'string';
              const mlResult = calculateMLPriority(req.resourceType, req.individualsAffected, req.severity);

              return {
                ...req,
                id: req.id || req.requestId,
                priorityScore: isSos
                  ? Math.max(150, req.priorityScore || 150)
                  : (hasStoredPriority ? req.priorityScore : mlResult.priorityScore),
                mlPriorityClass: isSos
                  ? 'critical'
                  : (hasStoredPriority ? req.mlPriorityClass : mlResult.priorityClass),
                mlConfidence: typeof req.mlConfidence === 'number'
                  ? req.mlConfidence
                  : (isSos ? 0.99 : mlResult.mlConfidence / 100)
              };
            });
            setRequests(mapped);
            setNextRequestId(prev => Math.max(prev, maxReqNum + 1));
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load requests from server:", err);
      }

      const seededRequests = DUMMY_REQUESTS.map(req => {
        const mlResult = calculateMLPriority(req.resourceType, req.individualsAffected, req.severity);
        return {
          ...req,
          priorityScore: mlResult.priorityScore,
          mlPriorityClass: mlResult.priorityClass,
          mlConfidence: mlResult.mlConfidence / 100
        };
      });
      setRequests(seededRequests);
    };

    const loadVolunteers = async () => {
      try {
        const res = await fetch('/api/volunteers');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setVolunteers(data);
          }
        }
      } catch (err) {
        console.warn("Failed to load volunteers from server:", err);
      }
    };

    loadRequests();
    loadBroadcasts();
    loadVolunteers();

    // Poll updates every 6 seconds (hackathon friendly speed!)
    const pollInterval = setInterval(() => {
      loadRequests();
      loadBroadcasts();
      loadVolunteers();
    }, 6000);

    return () => clearInterval(pollInterval);
  }, []);

  // Sync Body CSS Styles
  useEffect(() => {
    if (tacticalMode) {
      document.body.classList.add('tactical-mode');
    } else {
      document.body.classList.remove('tactical-mode');
    }
    localStorage.setItem('tacticalMode', tacticalMode);
  }, [tacticalMode]);

  useEffect(() => {
    if (mobileView) {
      document.body.classList.add('mobile-view-active');
    } else {
      document.body.classList.remove('mobile-view-active');
    }
    localStorage.setItem('mobileViewActive', mobileView);
  }, [mobileView]);

  // Sync base position for map and fetch weather
  const currentBaseLocation = useMemo(() => {
    if (sensorData.latitude && sensorData.longitude) {
      return {
        lat: sensorData.latitude,
        lng: sensorData.longitude,
        name: "Dynamic Telemetry Node"
      };
    }
    return {
      lat: 12.3275,
      lng: 76.6133,
      name: "VVCE-MYS"
    };
  }, [sensorData.latitude, sensorData.longitude]);

  useEffect(() => {
    fetchWeather(currentBaseLocation.lat, currentBaseLocation.lng);
  }, [currentBaseLocation, lang]);

  // 2. High-Speed Live Telemetry Polling (Sub-second local stream + Cloud fallback)
  useEffect(() => {
    let active = true;
    const fetchSensorData = async () => {
      // 1. Fast local telemetry endpoint (sub-millisecond when ESP32 streams locally)
      try {
        const localRes = await fetch('/api/telemetry', { cache: 'no-store' });
        if (localRes.ok) {
          const telemetryData = await localRes.json();
          if (telemetryData && (telemetryData.temperature !== undefined || telemetryData.created_at)) {
            if (!active) return;
            setSensorData(prev => ({
              ...prev,
              ...telemetryData,
              status: telemetryData.status || "Live Hardware Sync"
            }));
            return;
          }
        }
      } catch (e) {
        // Fall back to Supabase
      }

      // 2. Fall back to Supabase Cloud if local feed is offline
      try {
        const configResponse = await fetch('/api/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          const rawUrl = config.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
          const key = config.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

          if (rawUrl && key) {
            const supabaseUrl = `${rawUrl.replace(/\/$/, '')}/rest/v1/sensor_logs?select=*&order=created_at.desc&limit=1`;
            const response = await fetch(supabaseUrl, {
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`
              },
              cache: 'no-store'
            });
            if (response.ok) {
              const data = await response.json();
              if (!active) return;
              if (data && data.length > 0 && data[0]) {
                setSensorData(prev => ({
                  ...prev,
                  ...data[0],
                  status: data[0].status || "Live Hardware Sync"
                }));
                return;
              }
            }
          }
        }
      } catch (err) {
        // Suppress
      }
    };

    // Fetch immediately on mount
    fetchSensorData();

    // Poll every 800ms for ultra-responsive, real-time live hardware streaming
    const interval = setInterval(fetchSensorData, 800);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // 2.5 SurakshaSetu SMS live feed is managed via SurakshaSetuSMSPanel component

  // 3. API Requests & Helper Functions
  function fetchWeather(lat, lng) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=${lang === 'kn' ? 'kn' : 'en'}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.main) setWeatherData(data);
      })
      .catch(err => console.error('Error fetching weather:', err));
  }

  const getAISummary = async () => {
    setIsAiLoading(true);
    setAiSummaryOutput(lang === 'kn' ? "ಟೆಲಿಮೆಟ್ರಿ ವೆಕ್ಟರ್‌ಗಳು ಮತ್ತು ಸಂಕಲಿಸಿದ ವರದಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ..." : "Analyzing telemetry vectors and compiled reports...");
    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sensorData, lang })
      });
      const data = await response.json();
      if (data.summary) {
        setAiSummaryOutput(data.summary);
      } else {
        setAiSummaryOutput(lang === 'kn' ? "AI ಸಾರಾಂಶವನ್ನು ರಚಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು Groq API ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ." : "AI failed to generate summary. Please check Groq API connection.");
      }
    } catch (err) {
      setAiSummaryOutput(lang === 'kn' ? "ನೆಟ್‌ವರ್ಕ್ ದೋಷ: ದಯವಿಟ್ಟು ಇಂಟರ್ನೆಟ್ ಸಂಪರ್ಕ ಅಥವಾ Groq API ಕೀ ಸಂರಚನೆಯನ್ನು ಪರಿಶೀಲಿಸಿ." : "Network Error: Please check internet connection or verify Groq API key configuration.");
    } finally {
      setIsAiLoading(false);
    }
  };

  function calculateMLPriority(resourceType, individualsAffected, severity) {
    let priorityClass = 'low';
    let baseScore = 0;

    if (resourceType === 'CRITICAL SOS') {
      return {
        priorityClass: 'critical',
        priorityScore: 150 + ((severity || 5) * 3),
        mlConfidence: 99
      };
    }

    if (resourceType === 'Ambulance' || resourceType === 'Rescue Team' || resourceType === 'Rescue Boats') {
      if (individualsAffected >= 25) {
        priorityClass = 'critical';
        baseScore = 120;
      } else if (individualsAffected >= 5) {
        priorityClass = 'high';
        baseScore = 70;
      } else {
        priorityClass = 'medium';
        baseScore = 40;
      }
    } else if (resourceType === 'Medical Supplies' || resourceType === 'Medical' || resourceType === 'Heavy Machinery') {
      if (individualsAffected >= 100 || (individualsAffected >= 50 && severity >= 4)) {
        priorityClass = 'critical';
        baseScore = 110;
      } else if (individualsAffected >= 50 || (individualsAffected >= 25 && severity >= 4)) {
        priorityClass = 'high';
        baseScore = 65;
      } else if (individualsAffected >= 10) {
        priorityClass = 'medium';
        baseScore = 35;
      } else {
        priorityClass = 'low';
        baseScore = 15;
      }
    } else if (resourceType === 'Food & Water') {
      if (individualsAffected >= 200) {
        priorityClass = 'critical';
        baseScore = 105;
      } else if (individualsAffected >= 100) {
        priorityClass = 'high';
        baseScore = 60;
      } else if (individualsAffected >= 30) {
        priorityClass = 'medium';
        baseScore = 32;
      } else {
        priorityClass = 'low';
        baseScore = 12;
      }
    } else if (resourceType === 'Shelter' || resourceType === 'Bedding') {
      if (individualsAffected >= 150) {
        priorityClass = 'critical';
        baseScore = 108;
      } else if (individualsAffected >= 80) {
        priorityClass = 'high';
        baseScore = 62;
      } else if (individualsAffected >= 20) {
        priorityClass = 'medium';
        baseScore = 30;
      } else {
        priorityClass = 'low';
        baseScore = 10;
      }
    }

    const finalScore = baseScore + ((severity || 1) * 3);
    const confidence = Math.min(95, 75 + Math.floor(Math.random() * 15));

    return {
      priorityClass,
      priorityScore: finalScore,
      mlConfidence: confidence
    };
  }

  // Live forecasting calculations
  const forecasts = useMemo(() => {
    return resources.map(res => {
      const relevantRequests = requests.filter(r => r.resourceType === res.type && r.status !== 'resolved');
      const hourlyRate = (relevantRequests.length * 0.8) + 1.2;
      const hoursLeft = (res.availableQuantity / hourlyRate).toFixed(1);
      const riskStatus = hoursLeft < 12 ? "critical" : (hoursLeft < 24 ? "high" : "low");

      return {
        ...res,
        hoursLeft,
        hourlyRate: hourlyRate.toFixed(1),
        riskStatus
      };
    });
  }, [resources, requests]);

  // Analytics Metrics
  const avgPriority = useMemo(() => {
    const active = requests.filter(r => r.status !== 'resolved');
    if (active.length === 0) return 0.0;
    const sum = active.reduce((acc, curr) => acc + (curr.priorityScore || 0), 0);
    return (sum / active.length).toFixed(1);
  }, [requests]);

  const peopleHelped = useMemo(() => {
    const resolved = requests.filter(r => r.status === 'resolved');
    return resolved.reduce((acc, curr) => acc + (curr.individualsAffected || 0), 0);
  }, [requests]);

  const resourceUtilization = useMemo(() => {
    const total = resources.reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const available = resources.reduce((acc, curr) => acc + curr.availableQuantity, 0);
    if (total === 0) return 0;
    return (((total - available) / total) * 100).toFixed(0);
  }, [resources]);

  // Map Click Location Handlers
  const handleMapClick = (latlng) => {
    setSelectedLocation(latlng);
  };

  const handleAutoFetchGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(latlng);
        },
        (error) => {
          console.error("GPS Error:", error);
          alert("Failed to fetch GPS location: " + error.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Sorted Requests
  const sortedRequests = useMemo(() => {
    const active = requests.filter(r => r.status !== 'resolved');
    const resolved = requests.filter(r => r.status === 'resolved');

    const sortFn = (a, b) => {
      if (riskSort === 'critical') {
        return (b.priorityScore || 0) - (a.priorityScore || 0);
      }
      return (a.priorityScore || 0) - (b.priorityScore || 0);
    };

    return {
      active: [...active].sort(sortFn),
      resolved: [...resolved].sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt))
    };
  }, [requests, riskSort]);

  // 4. Form Submit & Dispatch Methods
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setAuthError('');

    const username = usernameInput.trim();
    const password = passwordInput;

    if (username === CREDENTIALS.admin.username && password === CREDENTIALS.admin.password) {
      setCurrentUser(CREDENTIALS.admin);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.admin));
    } else if (username === CREDENTIALS.user.username && password === CREDENTIALS.user.password) {
      setCurrentUser(CREDENTIALS.user);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.user));
    } else if (username === CREDENTIALS.volunteer.username && password === CREDENTIALS.volunteer.password) {
      const freshProfile = {
        id: null,
        name: '',
        phone: '',
        specialty: '',
        docNumber: '',
        docFileName: '',
        docFileSize: '',
        isVerified: false
      };
      setVolunteerProfile(freshProfile);
      localStorage.removeItem('surakshaVolunteerProfile');
      setCurrentUser(CREDENTIALS.volunteer);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.volunteer));
    } else if (username === CREDENTIALS.maintenance.username && password === CREDENTIALS.maintenance.password) {
      setCurrentUser(CREDENTIALS.maintenance);
      localStorage.setItem('drmsCurrentUser', JSON.stringify(CREDENTIALS.maintenance));
    } else {
      setAuthError('Invalid credentials. Check username or password.');
    }
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError('');

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    showToast('Demo registration completed. You can now login with local credentials.', 'success');
    setShowRegister(false);
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('drmsCurrentUser');
    localStorage.removeItem('surakshaVolunteerProfile');
    setVolunteerProfile({
      id: null,
      name: '',
      phone: '',
      specialty: '',
      docNumber: '',
      docFileName: '',
      docFileSize: '',
      isVerified: false
    });
    setShowRegister(false);
    setUsernameInput('');
    setPasswordInput('');
  };

  const fillDemoCredentials = (user = '1', pass = '1') => {
    setUsernameInput(user);
    setPasswordInput(pass);
  };

  const handleSelectExistingVolunteer = (vol) => {
    const restoredProfile = {
      id: vol.id,
      name: vol.name,
      phone: vol.phone || 'N/A',
      specialty: vol.specialty || vol.role || 'Volunteer',
      docNumber: vol.docNumber || '',
      docFileName: vol.docFileName || 'Verified on file',
      docFileSize: '',
      isVerified: true,
      verifiedAt: vol.verifiedAt || new Date().toISOString()
    };
    setVolunteerProfile(restoredProfile);
    localStorage.setItem('surakshaVolunteerProfile', JSON.stringify(restoredProfile));

    const updatedUser = {
      ...CREDENTIALS.volunteer,
      fullName: `${restoredProfile.name} (${restoredProfile.specialty})`
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('drmsCurrentUser', JSON.stringify(updatedUser));
    showToast(`Welcome back, ${restoredProfile.name}! Viewing your personal dispatch dashboard.`, 'success');
  };

  const handleVolunteerVerifySubmit = async (e) => {
    e.preventDefault();
    if (!volunteerProfile.name.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }
    if (!volunteerProfile.specialty) {
      showToast('Please select your area of specialty or profession.', 'error');
      return;
    }
    if (!volunteerProfile.docFileName) {
      showToast('Please upload the required verification document.', 'error');
      return;
    }

    const cleanName = volunteerProfile.name.trim();
    const cleanPhone = volunteerProfile.phone.trim() || 'N/A';
    const existingVol = volunteers.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
    const volId = existingVol ? existingVol.id : Date.now();

    const newVolRecord = {
      id: volId,
      name: cleanName,
      role: volunteerProfile.specialty,
      specialty: volunteerProfile.specialty,
      phone: cleanPhone,
      docNumber: volunteerProfile.docNumber.trim(),
      docFileName: volunteerProfile.docFileName,
      verified: true,
      verifiedAt: new Date().toISOString(),
      status: existingVol ? existingVol.status : 'available',
      lat: existingVol ? existingVol.lat : currentBaseLocation.lat + (Math.random() - 0.5) * 0.02,
      lng: existingVol ? existingVol.lng : currentBaseLocation.lng + (Math.random() - 0.5) * 0.02
    };

    try {
      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVolRecord)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.volunteers) {
          setVolunteers(data.volunteers);
        }
      }
    } catch (err) {
      console.warn("Failed to persist verified volunteer:", err);
    }

    const verifiedProfile = {
      ...volunteerProfile,
      id: volId,
      name: cleanName,
      phone: cleanPhone,
      isVerified: true,
      verifiedAt: newVolRecord.verifiedAt
    };

    setVolunteerProfile(verifiedProfile);
    localStorage.setItem('surakshaVolunteerProfile', JSON.stringify(verifiedProfile));

    const updatedUser = {
      ...CREDENTIALS.volunteer,
      fullName: `${verifiedProfile.name} (${verifiedProfile.specialty})`
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('drmsCurrentUser', JSON.stringify(updatedUser));

    setVolunteers(prev => {
      const exists = prev.some(v => v.id === volId || v.name.toLowerCase() === cleanName.toLowerCase());
      if (exists) {
        return prev.map(v => (v.id === volId || v.name.toLowerCase() === cleanName.toLowerCase()) ? newVolRecord : v);
      }
      return [newVolRecord, ...prev];
    });

    showToast(`✅ ID verified as ${verifiedProfile.specialty}! Your profile is now live on the Govt Official dashboard.`, 'success');
  };

  const handleVolunteerCompleteDispatch = async (req) => {
    const volunteerName = volunteerProfile.name || currentUser?.fullName || 'Field Volunteer';
    const volunteerSpec = volunteerProfile.specialty || 'Volunteer';

    const updatedReq = {
      ...req,
      dispatchStatus: 'completed',
      completedByVolunteerId: volunteerProfile.id || req.assignedVolunteerId || null,
      completedByVolunteerName: volunteerName,
      completedBySpecialty: volunteerSpec,
      completedByDocFile: volunteerProfile.docFileName || '',
      dispatchedAt: new Date().toISOString()
    };

    setRequests(prev => prev.map(r => (r.id === req.id || r.requestId === req.requestId) ? updatedReq : r));

    // Mark volunteer available again once dispatch is done
    if (volunteerProfile.id) {
      setVolunteers(prev => prev.map(v => v.id === volunteerProfile.id ? { ...v, status: 'available' } : v));
      fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: volunteerProfile.id, name: volunteerName, status: 'available' })
      }).catch(err => console.warn("Failed to update volunteer availability:", err));
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReq)
      });
      if (!res.ok) throw new Error('Failed to sync dispatch completion');
      showToast(`✅ Dispatch completed by ${volunteerName} (${volunteerSpec})! Moved to your Completed list & updated on Govt Official dashboard.`, 'success');
    } catch (err) {
      console.warn("Error completing dispatch on server:", err);
      showToast('Failed to sync completion with Govt Official server.', 'error');
    }
  };

  const getUniqueRequestId = (prefix = 'REQ') => {
    if (prefix === 'SOS') {
      return `SOS-${Date.now().toString().slice(-6)}`;
    }
    let candidate = nextRequestId;
    while (requests.some(r => r.requestId === `${prefix}-${candidate}`)) {
      candidate += 1;
    }
    setNextRequestId(candidate + 1);
    return `${prefix}-${candidate}`;
  };

  const handleUserRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      showToast('Please click on the map to specify coordinates first.', 'error');
      return;
    }

    const qty = parseInt(userQuantity, 10);
    const sev = parseInt(userSeverity, 10);
    const affected = parseInt(userIndividuals, 10);

    const mlResult = calculateMLPriority(userResourceType, affected, sev);

    const newRequest = {
      id: Date.now(),
      requestId: getUniqueRequestId('REQ'),
      resourceType: userResourceType,
      quantityRequested: qty,
      quantityAllocated: 0,
      quantityPending: qty,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      severity: sev,
      individualsAffected: affected,
      status: 'pending',
      priorityScore: parseFloat(mlResult.priorityScore.toFixed(1)),
      mlPriorityClass: mlResult.priorityClass,
      mlConfidence: parseFloat((mlResult.mlConfidence / 100).toFixed(2)),
      contactPerson: currentUser ? currentUser.fullName : "Field Dispatcher",
      contactPhone: "N/A",
      description: userDescription
    };

    setRequests(prev => [newRequest, ...prev]);

    // Save request to server DB persistently
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      if (!res.ok) throw new Error('Failed to save request');
    } catch (err) {
      console.warn("Error saving request to server:", err);
      showToast('Failed to sync request to Admin Dashboard.', 'error');
      return;
    }

    // Reset Form
    setUserResourceType('');
    setUserQuantity('');
    setUserSeverity('');
    setUserIndividuals('');
    setUserDescription('');
    setSelectedLocation(null);

    showToast('Emergency request submitted successfully!', 'success');
  };

  const handleAdminRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) {
      showToast('Please select coordinates on the map.', 'error');
      return;
    }

    const qty = parseInt(adminQuantity, 10);
    const sev = parseInt(adminSeverity, 10);
    const affected = parseInt(adminIndividuals, 10);

    const mlResult = calculateMLPriority(adminResourceType, affected, sev);

    const newRequest = {
      id: Date.now(),
      requestId: getUniqueRequestId('REQ'),
      resourceType: adminResourceType,
      quantityRequested: qty,
      quantityAllocated: 0,
      quantityPending: qty,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      severity: sev,
      individualsAffected: affected,
      status: 'pending',
      priorityScore: parseFloat(mlResult.priorityScore.toFixed(1)),
      mlPriorityClass: mlResult.priorityClass,
      mlConfidence: parseFloat((mlResult.mlConfidence / 100).toFixed(2)),
      contactPerson: adminContact,
      contactPhone: adminPhone,
      description: adminDescription
    };

    setRequests(prev => [newRequest, ...prev]);

    // Save request to server DB persistently
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      if (!res.ok) throw new Error('Failed to save request');
    } catch (err) {
      console.warn("Error saving request to server:", err);
      showToast('Failed to save request to server.', 'error');
      return;
    }

    // Reset Form
    setAdminResourceType('');
    setAdminQuantity('');
    setAdminSeverity('');
    setAdminIndividuals('');
    setAdminContact('');
    setAdminPhone('');
    setAdminDescription('');
    setSelectedLocation(null);

    showToast('Emergency request submitted successfully!', 'success');
  };

  const handleVolunteerRegister = async (e) => {
    e.preventDefault();
    const newVol = {
      id: Date.now(),
      name: volName,
      role: volRole,
      specialty: volRole,
      phone: volPhone,
      status: 'available',
      verified: false,
      lat: currentBaseLocation.lat + (Math.random() - 0.5) * 0.04,
      lng: currentBaseLocation.lng + (Math.random() - 0.5) * 0.04
    };

    setVolunteers(prev => [newVol, ...prev]);
    fetch('/api/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVol)
    }).catch(err => console.warn("Failed to persist volunteer:", err));
    showToast(`Thank you ${volName}! You are registered as ${volRole} volunteer.`, 'success');
    setVolName('');
    setVolPhone('');
  };

  const handleDispatchVolunteer = async (volId, reqId) => {
    const target = requests.find(r => r.id === reqId);
    if (!target) {
      showToast("Request not found.", 'error');
      return;
    }
    const vol = volunteers.find(v => v.id === volId);
    if (!vol) return;

    // Update volunteer state locally and on server
    setVolunteers(prev => prev.map(v => v.id === volId ? { ...v, status: 'busy' } : v));
    fetch('/api/volunteers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: volId, name: vol.name, status: 'busy' })
    }).catch(err => console.warn("Failed to update volunteer status:", err));

    // Update request locally and on server
    const updatedRequest = {
      ...target,
      status: 'allocated',
      quantityAllocated: target.quantityRequested,
      quantityPending: 0,
      assignedVolunteerId: volId,
      assignedVolunteerName: vol.name,
      assignedVolunteerSpecialty: vol.specialty || vol.role,
      dispatchStatus: 'yet_to_dispatch',
      completedByVolunteerId: null,
      completedByVolunteerName: null,
      completedBySpecialty: null,
      allocatedAt: new Date().toISOString()
    };

    setRequests(prev => prev.map(r => r.id === reqId ? updatedRequest : r));

    // Select it for triage sidebar too to update UI
    if (selectedTriageRequest && selectedTriageRequest.id === reqId) {
      setSelectedTriageRequest(updatedRequest);
    }

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRequest)
      });
      showToast(`Dispatched ${vol.name} (${vol.specialty || vol.role}) to ${target.requestId} (${target.resourceType})`, 'success');
    } catch (err) {
      console.error("Failed to sync dispatch on server:", err);
    }

    setDispatchingVolId(null);

    // Draw route on map
    handleShowRoute(target);
  };

  const getCoordinatesDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSendEmergencyBroadcast = async () => {
    if (!newBroadcastMsg.trim()) {
      showToast("Broadcast message cannot be empty", "warning");
      return;
    }

    try {
      const response = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newBroadcastMsg,
          targetZone: broadcastZone,
          severity: broadcastSeverity
        })
      });
      if (response.ok) {
        setNewBroadcastMsg("");
        // Reload broadcasts locally
        const res = await fetch('/api/broadcasts');
        if (res.ok) {
          const data = await res.json();
          setBroadcasts(data);
        }
        showToast("Emergency Broadcast sent to mesh network successfully!", "success");
      }
    } catch (err) {
      console.error("Failed to send broadcast:", err);
      showToast("Failed to send broadcast", "error");
    }
  };

  const handleRunAITriage = async (req) => {
    setAiTriageLoading(true);
    try {
      const response = await fetch('/api/ai-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: req.description,
          lang: lang
        })
      });
      if (response.ok) {
        const data = await response.json();
        const updated = {
          ...req,
          mlPriorityClass: data.mlPriorityClass,
          mlConfidence: data.mlConfidence,
          triageSummary: data.triageSummary
        };
        setSelectedTriageRequest(updated);

        // Also update requests state locally
        setRequests(prev => prev.map(r => r.id === req.id ? updated : r));
        showToast("AI Triage analysis complete!", "success");
      }
    } catch (err) {
      console.error("AI Triage run failed:", err);
      showToast("AI Triage run failed", "error");
    } finally {
      setAiTriageLoading(false);
    }
  };

  const handleRunAIDedup = async () => {
    setAiDedupLoading(true);
    try {
      const activeList = requests.filter(r => r.status !== 'resolved');
      const response = await fetch('/api/ai-dedup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: activeList })
      });
      if (response.ok) {
        const data = await response.json();
        setAiDedupResult(data);
        setAiDedupActive(true);
        showToast(
          lang === 'kn'
            ? `AI ನಕಲಿ ಕಡಿತ ಯಶಸ್ವಿಯಾಗಿದೆ: ${data.duplicateAlertsSuppressed} ನಕಲಿ ಕರೆಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ (${data.noiseReductionPercentage}% ಕಡಿತ).`
            : `AI Deduplication: ${data.duplicateAlertsSuppressed} duplicate calls/alerts merged (${data.noiseReductionPercentage}% noise reduction)`,
          'success'
        );
      }
    } catch (err) {
      console.error("AI Dedup failed:", err);
      showToast("AI Deduplication failed", "error");
    } finally {
      setAiDedupLoading(false);
    }
  };

  const handleSaveAITriage = async (req) => {
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.requestId,
          mlPriorityClass: req.mlPriorityClass,
          mlConfidence: req.mlConfidence,
          triageSummary: req.triageSummary
        })
      });
      if (response.ok) {
        showToast("AI Triage committed to database!", "success");
      }
    } catch (err) {
      console.error("Failed to save triage:", err);
      showToast("Failed to save triage", "error");
    }
  };

  const handleShowRoute = (request) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${currentBaseLocation.lng},${currentBaseLocation.lat};${request.lng},${request.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code === 'Ok' && data.routes.length > 0) {
          const route = data.routes[0];
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);

          setRouteData({
            distance,
            duration,
            location: `Lat: ${request.lat.toFixed(4)}, Lng: ${request.lng.toFixed(4)}`,
            lat: request.lat,
            lng: request.lng,
            contactPerson: request.contactPerson,
            contactPhone: request.contactPhone,
            individualsAffected: request.individualsAffected,
            severity: request.severity,
            description: request.description
          });

          const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(coordinates);
          setShowRouteModal(true);

          fetchWeather(request.lat, request.lng);

          if (routeTimeoutRef.current) clearTimeout(routeTimeoutRef.current);
          routeTimeoutRef.current = setTimeout(() => {
            setRouteCoordinates([]);
            fetchWeather(currentBaseLocation.lat, currentBaseLocation.lng);
          }, 20000);

          if (routeModalTimeoutRef.current) clearTimeout(routeModalTimeoutRef.current);
          routeModalTimeoutRef.current = setTimeout(() => {
            setShowRouteModal(false);
          }, 8000);
        }
      })
      .catch(err => {
        console.error('Error fetching route:', err);
        showToast('Route mapping connection timed out.', 'error');
      });
  };

  const handleSOSPanic = async () => {
    if (!confirm("🚨 CONFIRM SOS PANIC TRIGGER? This immediately broadcasts coordinates to the emergency team via secure channels.")) {
      return;
    }

    const resolveCoords = () => new Promise((resolve) => {
      if (selectedLocation && typeof selectedLocation.lat === 'number' && typeof selectedLocation.lng === 'number') {
        resolve({ lat: selectedLocation.lat, lng: selectedLocation.lng, source: 'Map Pin' });
        return;
      }
      if (!navigator.geolocation) {
        resolve({ lat: currentBaseLocation.lat, lng: currentBaseLocation.lng, source: 'Base Telemetry Fallback' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude, source: 'GPS' });
        },
        () => {
          resolve({ lat: currentBaseLocation.lat, lng: currentBaseLocation.lng, source: 'Base Telemetry Fallback' });
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
      );
    });

    const coords = await resolveCoords();
    const qty = parseInt(userQuantity, 10) > 0 ? parseInt(userQuantity, 10) : 1;
    const sev = parseInt(userSeverity, 10) > 0 ? parseInt(userSeverity, 10) : 5;
    const affected = parseInt(userIndividuals, 10) > 0 ? parseInt(userIndividuals, 10) : 1;
    const resourceType = userResourceType || "CRITICAL SOS";
    const customDesc = userDescription && userDescription.trim()
      ? `🚨 SOS ALERT: ${userDescription.trim()}`
      : "🚨 SECURE SOS SIGNAL: Panic alert dispatched from mobile client. Critical response required at location.";

    const mlResult = calculateMLPriority(resourceType, affected, sev);

    const newRequest = {
      id: Date.now(),
      requestId: getUniqueRequestId('SOS'),
      resourceType,
      quantityRequested: qty,
      quantityAllocated: 0,
      quantityPending: qty,
      lat: coords.lat,
      lng: coords.lng,
      severity: sev,
      individualsAffected: affected,
      status: 'pending',
      priorityScore: Math.max(150.0, parseFloat(mlResult.priorityScore.toFixed(1))),
      mlPriorityClass: 'critical',
      mlConfidence: 0.99,
      isSOS: true,
      contactPerson: currentUser ? currentUser.fullName : "Anonymous Civilian",
      contactPhone: coords.source === 'GPS' ? "GEO-LOCATED" : "SOS-DISPATCH",
      description: customDesc
    };

    setRequests(prev => [newRequest, ...prev]);

    try {
      const saveRes = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });
      if (!saveRes.ok) {
        throw new Error('Failed to persist SOS to server');
      }
    } catch (err) {
      console.warn("Error saving SOS request to server:", err);
      showToast("Failed to sync SOS to Command HQ server.", 'error');
      return;
    }

    // Clear user form fields if filled before SOS
    setUserResourceType('');
    setUserQuantity('');
    setUserSeverity('');
    setUserIndividuals('');
    setUserDescription('');
    setSelectedLocation(null);

    // Telegram Message Dispatcher (non-blocking)
    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
    const chatID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";
    const msg = `🚨 *CRITICAL SOS ALERT*\n\nUser: ${newRequest.contactPerson}\nNeed: ${newRequest.resourceType} (${newRequest.quantityRequested})\nLocation: https://www.google.com/maps?q=${coords.lat},${coords.lng}\nStatus: IMMEDIATE RESPONSE REQUIRED`;

    if (botToken && chatID) {
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatID,
          text: msg,
          parse_mode: 'Markdown'
        })
      }).catch(err => console.warn("Telegram API notification skipped:", err));
    }

    showToast("🚨 SOS EMERGENCY BROADCAST SUCCESSFUL! Sent directly to Admin Command Dashboard.", 'success');
  };

  const handleAllocateOpen = (request) => {
    setAllocateRequest(request);
    setAllocateQtyVal('');
    setAllocateVolunteerId(request.assignedVolunteerId ? String(request.assignedVolunteerId) : '');
    setShowAllocateModal(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocateRequest) return;
    const qty = parseInt(allocateQtyVal, 10);

    const targetType = allocateRequest.resourceType === 'CRITICAL SOS'
      ? 'Rescue Team'
      : (allocateRequest.resourceType === 'Medical' ? 'Medical Supplies' : allocateRequest.resourceType);
    const resource = resources.find(r => r.type === targetType);
    if (!resource) {
      showToast("Error: Resource mapping node missing.", 'error');
      return;
    }

    if (qty > resource.availableQuantity) {
      showToast(`Insufficient supplies. Current stock: ${resource.availableQuantity}`, 'warning');
      return;
    }

    if (qty > allocateRequest.quantityPending) {
      showToast(`Allocation exceeds outstanding requests. Pending: ${allocateRequest.quantityPending}`, 'warning');
      return;
    }

    const selectedVol = allocateVolunteerId
      ? volunteers.find(v => String(v.id) === String(allocateVolunteerId))
      : null;

    setResources(prev => prev.map(r => r.type === targetType ? { ...r, availableQuantity: r.availableQuantity - qty } : r));

    const pending = allocateRequest.quantityPending - qty;
    const allocated = (allocateRequest.quantityAllocated || 0) + qty;
    const status = pending === 0 ? 'allocated' : 'partial';
    const updatedReq = {
      ...allocateRequest,
      quantityAllocated: allocated,
      quantityPending: pending,
      status,
      dispatchStatus: 'yet_to_dispatch',
      allocatedAt: new Date().toISOString(),
      completedByVolunteerId: null,
      completedByVolunteerName: null,
      completedBySpecialty: null,
      ...(selectedVol ? {
        assignedVolunteerId: selectedVol.id,
        assignedVolunteerName: selectedVol.name,
        assignedVolunteerSpecialty: selectedVol.specialty || selectedVol.role
      } : {})
    };

    setRequests(prev => prev.map(req => req.id === allocateRequest.id ? updatedReq : req));

    if (selectedVol) {
      setVolunteers(prev => prev.map(v => v.id === selectedVol.id ? { ...v, status: 'busy' } : v));
      fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedVol.id, name: selectedVol.name, status: 'busy' })
      }).catch(err => console.warn("Failed to update volunteer status:", err));
    }

    // Update server DB persistently
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReq)
      });
      if (!res.ok) throw new Error('Server sync failed');
    } catch (err) {
      console.error("Error saving allocation to server:", err);
    }

    setShowAllocateModal(false);
    setAllocateRequest(null);
    setAllocateVolunteerId('');
    showToast(
      selectedVol
        ? `Logistics allocation logged & dispatched to ${selectedVol.name}!`
        : 'Logistics allocation logged!',
      'success'
    );
  };

  const handleMarkResolved = async (requestId) => {
    if (confirm("Verify request resolution and close incident file?")) {
      const target = requests.find(r => r.id === requestId);
      if (!target) return;
      const updatedReq = { ...target, status: 'resolved', resolvedAt: new Date().toISOString() };
      setRequests(prev => prev.map(req => req.id === requestId ? updatedReq : req));

      // Update server DB persistently
      try {
        await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedReq)
        });
      } catch (err) {
        console.error("Error resolving request on server:", err);
      }
    }
  };

  const handleDeleteRequest = (requestId) => {
    if (confirm("Permanently purge this resolved record from archives?")) {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const handleResourceOpen = (res = null) => {
    if (res) {
      setResourceModalData({
        id: res.id,
        name: res.name,
        type: res.type,
        totalQuantity: res.totalQuantity,
        availableQuantity: res.availableQuantity
      });
    } else {
      setResourceModalData({ id: '', name: '', type: '', totalQuantity: '', availableQuantity: '' });
    }
    setShowResourceModal(true);
  };

  const handleResourceSave = (e) => {
    e.preventDefault();
    const { id, name, type, totalQuantity, availableQuantity } = resourceModalData;
    const total = parseInt(totalQuantity);
    const avail = parseInt(availableQuantity);

    if (id) {
      setResources(prev => prev.map(r => r.id === id ? { ...r, name, type, totalQuantity: total, availableQuantity: avail } : r));
    } else {
      setResources(prev => [...prev, { id: Date.now(), name, type, totalQuantity: total, availableQuantity: avail }]);
    }
    setShowResourceModal(false);
  };

  // Helper cardinal weather converter
  const degToCardinal = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.round(((deg % 360) / 45)) % 8];
  };

  const getWeatherItems = (data) => {
    if (!data) return [];
    const windDirection = data.wind && data.wind.deg !== undefined
      ? `${degToCardinal(data.wind.deg)} (${data.wind.deg}° ${t.from_north})`
      : 'N/A';

    return [
      { label: t.city_name, value: data.name || 'N/A' },
      { label: t.weather_desc, value: data.weather && data.weather[0] ? data.weather[0].description : 'N/A' },
      { label: t.temp, value: data.main ? `${data.main.temp}°C` : 'N/A' },
      { label: t.feels_like, value: data.main ? `${data.main.feels_like}°C` : 'N/A' },
      { label: t.hum, value: data.main ? `${data.main.humidity}%` : 'N/A' },
      { label: t.pressure, value: data.main ? `${data.main.pressure} hPa` : 'N/A' },
      { label: t.windSpeed, value: data.wind ? `${data.wind.speed} m/s` : 'N/A' },
      { label: t.windDir, value: windDirection },
      { label: t.visibility, value: data.visibility !== undefined ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A' },
      { label: t.cloudiness, value: data.clouds ? `${data.clouds.all}%` : 'N/A' },
      { label: t.coordinates, value: data.coord ? `${data.coord.lat.toFixed(6)}, ${data.coord.lon.toFixed(6)}` : 'N/A' },
      { label: t.timezone, value: data.timezone !== undefined ? `GMT${data.timezone >= 0 ? '+' : ''}${data.timezone / 3600}` : 'N/A' },
    ];
  };


  // System Maintenance Admin (Role 4) Effects & Handlers
  useEffect(() => {
    if (currentUser?.role === 'Maintenance') {
      let isSubscribed = true;

      const pollHealth = async () => {
        try {
          const t0 = Date.now();
          const [telRes, smsRes, reqRes, volRes, mapRes, spamRes] = await Promise.allSettled([
            fetch('/api/telemetry'),
            fetch('/api/surakshasetu-sms'),
            fetch('/api/requests'),
            fetch('/api/volunteers'),
            fetch('/api/offline-maps'),
            fetch('/api/anti-spam')
          ]);

          const telData = telRes.status === 'fulfilled' && telRes.value.ok ? await telRes.value.json() : null;
          const smsArr = smsRes.status === 'fulfilled' && smsRes.value.ok ? await smsRes.value.json() : [];
          const reqArr = reqRes.status === 'fulfilled' && reqRes.value.ok ? await reqRes.value.json() : [];
          const volArr = volRes.status === 'fulfilled' && volRes.value.ok ? await volRes.value.json() : [];
          const mapArr = mapRes.status === 'fulfilled' && mapRes.value.ok ? await mapRes.value.json() : [];
          const spamObj = spamRes.status === 'fulfilled' && spamRes.value.ok ? await spamRes.value.json() : null;

          const totalLatency = Math.max(12, Math.round((Date.now() - t0) / 6));

          if (!isSubscribed) return;

          setSystemHealth({
            telemetry: {
              status: telRes.status === 'fulfilled' && telRes.value.ok ? 'Online' : 'Degraded',
              latency: Math.round(totalLatency * 0.9),
              count: Array.isArray(telData) ? telData.length : (telData ? 1 : 0),
              nodeCount: telData?.nodeId ? 1 : (Array.isArray(telData) ? telData.length : 1)
            },
            sms: {
              status: smsRes.status === 'fulfilled' && smsRes.value.ok ? 'Online' : 'Standby',
              latency: Math.round(totalLatency * 1.1),
              count: Array.isArray(smsArr) ? smsArr.length : 0
            },
            requests: {
              status: reqRes.status === 'fulfilled' && reqRes.value.ok ? 'Online' : 'Degraded',
              latency: totalLatency,
              count: Array.isArray(reqArr) ? reqArr.length : 0
            },
            volunteers: {
              status: volRes.status === 'fulfilled' && volRes.value.ok ? 'Online' : 'Degraded',
              latency: Math.round(totalLatency * 0.8),
              count: Array.isArray(volArr) ? volArr.length : 0
            },
            offlineMaps: {
              status: mapRes.status === 'fulfilled' && mapRes.value.ok ? 'Online' : 'Local Only',
              latency: Math.round(totalLatency * 0.7),
              count: Array.isArray(mapArr) ? mapArr.length : 0
            },
            antiSpam: {
              status: spamRes.status === 'fulfilled' && spamRes.value.ok ? 'Online' : 'Inactive',
              latency: Math.round(totalLatency * 0.6),
              count: (spamObj?.blockedNumbers?.length || 0) + (spamObj?.spamKeywords?.length || 0)
            },
            lastChecked: new Date().toLocaleTimeString()
          });

          if (Array.isArray(mapArr) && mapArr.length > 0) {
            setOfflineMapPackages(mapArr);
          }
          if (spamObj && spamObj.blockedNumbers) {
            setAntiSpamConfig(spamObj);
          }
          if (Array.isArray(volArr) && volArr.length > 0) {
            setVolunteers(volArr);
          }
          if (Array.isArray(reqArr) && reqArr.length > 0) {
            setRequests(reqArr);
          }
        } catch (e) {
          console.error('System health check error:', e);
        }
      };

      pollHealth();
      const interval = setInterval(pollHealth, 10000);
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }
  }, [currentUser]);

  const handleForceRefreshCaches = async () => {
    setIsHealthRefreshing(true);
    try {
      const [telRes, smsRes, reqRes, volRes, mapRes, spamRes] = await Promise.allSettled([
        fetch('/api/telemetry'),
        fetch('/api/surakshasetu-sms'),
        fetch('/api/requests'),
        fetch('/api/volunteers'),
        fetch('/api/offline-maps'),
        fetch('/api/anti-spam')
      ]);
      if (reqRes.status === 'fulfilled' && reqRes.value.ok) {
        const reqData = await reqRes.value.json();
        if (Array.isArray(reqData)) setRequests(reqData);
      }
      if (volRes.status === 'fulfilled' && volRes.value.ok) {
        const volData = await volRes.value.json();
        if (Array.isArray(volData)) setVolunteers(volData);
      }
      if (mapRes.status === 'fulfilled' && mapRes.value.ok) {
        const mapData = await mapRes.value.json();
        if (Array.isArray(mapData)) setOfflineMapPackages(mapData);
      }
      if (spamRes.status === 'fulfilled' && spamRes.value.ok) {
        const spamData = await spamRes.value.json();
        if (spamData?.blockedNumbers) setAntiSpamConfig(spamData);
      }
      showToast("All system API endpoints and caches refreshed successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Refresh completed with minor network warnings", "warning");
    } finally {
      setIsHealthRefreshing(false);
    }
  };

  const handleClearStaleRecords = () => {
    const resolvedCount = requests.filter(r => r.status === 'resolved').length;
    setRequests(prev => prev.filter(r => r.status !== 'resolved'));
    showToast(`Cleaned ${resolvedCount} stale resolved incident records from memory queue.`, "success");
  };

  const handleExportSystemSnapshot = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      node: "HQ Emergency Operations Center - Tumkur",
      systemHealth,
      telemetrySnapshot: sensorData,
      activeRequestsCount: requests.length,
      activeRequests: requests,
      registeredVolunteersCount: volunteers.length,
      registeredVolunteers: volunteers,
      offlineMapPackages,
      antiSpamConfig
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suraksha_system_state_snapshot_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("System State JSON Snapshot generated and exported!", "success");
  };

  const handleMaintenanceVolunteerOnboard = async (e) => {
    e.preventDefault();
    if (!maintVolName.trim() || !maintVolPhone.trim()) {
      showToast("Please enter Volunteer Name and Contact Phone", "error");
      return;
    }
    setIsOnboardingSaving(true);
    try {
      const newVol = {
        name: maintVolName.trim(),
        role: maintVolSpecialty,
        specialty: maintVolSpecialty,
        phone: maintVolPhone.trim(),
        sector: maintVolSector.trim() || 'Tumkur Sector',
        docNumber: maintVolDocNumber.trim() || `CRED-${Date.now().toString().slice(-6)}`,
        verified: false,
        status: "pending",
        lat: 13.3409,
        lng: 77.1010,
        createdAt: new Date().toISOString()
      };

      const res = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVol)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.volunteers) {
          setVolunteers(data.volunteers);
        } else if (data.volunteer) {
          setVolunteers(prev => [data.volunteer, ...prev]);
        }
        setMaintVolName('');
        setMaintVolPhone('');
        setMaintVolDocNumber('');
        showToast("New Field Volunteer onboarded in PENDING state. Awaiting Govt Official (Role 1) verification.", "success");
      } else {
        showToast("Failed to save volunteer to backend", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error onboarding volunteer", "error");
    } finally {
      setIsOnboardingSaving(false);
    }
  };

  const handleSyncOfflineMap = async (pkgId) => {
    setSyncingMapId(pkgId);
    try {
      const res = await fetch('/api/offline-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', id: pkgId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.packages) setOfflineMapPackages(data.packages);
        showToast("Offline map package synchronized and cached successfully!", "success");
      } else {
        showToast("Failed to sync offline map package", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error syncing offline map", "error");
    } finally {
      setSyncingMapId(null);
    }
  };

  const handleAddBlockedNumber = async (e) => {
    e.preventDefault();
    if (!newBlockedNumberInput.trim()) return;
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addNumber', number: newBlockedNumberInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
        setNewBlockedNumberInput('');
        showToast("Number added to anti-spam blocklist", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to update blocked numbers", "error");
    }
  };

  const handleRemoveBlockedNumber = async (num) => {
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeNumber', number: num })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
        showToast("Number removed from blocklist", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove number", "error");
    }
  };

  const handleAddSpamKeyword = async (e) => {
    e.preventDefault();
    if (!newSpamKeywordInput.trim()) return;
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addKeyword', keyword: newSpamKeywordInput.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
        setNewSpamKeywordInput('');
        showToast("Spam keyword pattern added to active filter", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to add spam keyword", "error");
    }
  };

  const handleRemoveSpamKeyword = async (kw) => {
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'removeKeyword', keyword: kw })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
        showToast("Keyword removed from filter", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to remove keyword", "error");
    }
  };

  const handleToggleRateLimit = async () => {
    const nextVal = !antiSpamConfig.rateLimitEnabled;
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSettings', rateLimitEnabled: nextVal, rateLimitWindowSeconds: antiSpamConfig.rateLimitWindowSeconds })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
        showToast(`Duplicate SMS suppression ${nextVal ? 'enabled' : 'disabled'}`, "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRateLimitWindowChange = async (newSecs) => {
    const val = parseInt(newSecs) || 30;
    try {
      const res = await fetch('/api/anti-spam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateSettings', rateLimitEnabled: antiSpamConfig.rateLimitEnabled, rateLimitWindowSeconds: val })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setAntiSpamConfig(data.config);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ML priority live display calculations
  const userPriorityResult = useMemo(() => {
    if (!userResourceType) return { priorityClass: 'low', mlConfidence: 0 };
    return calculateMLPriority(userResourceType, parseInt(userIndividuals) || 0, parseInt(userSeverity) || 0);
  }, [userResourceType, userIndividuals, userSeverity]);

  const adminPriorityResult = useMemo(() => {
    if (!adminResourceType) return { priorityClass: 'low', mlConfidence: 0 };
    return calculateMLPriority(adminResourceType, parseInt(adminIndividuals) || 0, parseInt(adminSeverity) || 0);
  }, [adminResourceType, adminIndividuals, adminSeverity]);

  // Return JSX
  return (
    <div>
      {/* 1. AUTHENTICATION COMPONENT */}
      {!currentUser && (
        <div id="authScreen" className="login-container">
          <div className="auth-wrapper">
            <div className={`auth-container ${showRegister ? 'show-register' : ''}`} id="authContainer">

              {/* Logo Side Panel */}
              <div className="logo-panel">
                <div className="logo-box">
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                    <i className="fas fa-shield-halved" style={{ fontSize: '42px', color: '#ffffff' }}></i>
                  </div>
                  <h2>Suraksha Setu</h2>
                  <p>Disaster Response Management System</p>
                </div>
              </div>

              {/* Login Form Panel */}
              <div className="form-panel">
                {!showRegister ? (
                  <div className="login-card" id="loginFormCard">
                    <h1>Welcome Back</h1>
                    <p>Login to your account</p>
                    <form onSubmit={handleLoginSubmit}>
                      <div className="form-group">
                        <label htmlFor="username">{t.username}</label>
                        <input
                          type="text"
                          id="username"
                          className="form-control"
                          required
                          value={usernameInput}
                          onChange={(e) => setUsernameInput(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="password">{t.password}</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            id="password"
                            className="form-control"
                            required
                            style={{ paddingRight: '40px' }}
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Login
                      </button>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => fillDemoCredentials('1', '1')}
                          style={{ width: '100%', fontSize: '12px', borderBottomWidth: '2px', padding: '8px 6px' }}
                        >
                          Govt Official (1 / 1)
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => fillDemoCredentials('2', '2')}
                          style={{ width: '100%', fontSize: '12px', borderBottomWidth: '2px', padding: '8px 6px' }}
                        >
                          Victim / Officer (2 / 2)
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => fillDemoCredentials('3', '3')}
                          style={{ width: '100%', fontSize: '12px', borderBottomWidth: '2px', padding: '8px 6px', borderColor: '#3b82f6', color: '#1d4ed8', fontWeight: '600' }}
                        >
                          Volunteer (3 / 3)
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => fillDemoCredentials('4', '4')}
                          style={{ width: '100%', fontSize: '12px', borderBottomWidth: '2px', padding: '8px 6px', borderColor: '#10b981', color: '#047857', fontWeight: '600' }}
                        >
                          Maintenance (4 / 4)
                        </button>
                      </div>
                      {authError && <div className="error-message" style={{ display: 'block' }}>{authError}</div>}
                    </form>
                    <div className="auth-link">
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(true); }}>
                        Don&apos;t have an account? Create one
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="login-card" id="registerFormCard">
                    <h1>Join Suraksha Setu</h1>
                    <p>{t.create_account_sub}</p>
                    <form onSubmit={handleRegisterSubmit}>
                      <div className="form-section-title">Account Security</div>
                      <div className="form-group">
                        <label htmlFor="regUsername">Username *</label>
                        <input
                          type="text"
                          id="regUsername"
                          className="form-control"
                          placeholder="Choose a unique username"
                          required
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="regPassword">Password *</label>
                          <input
                            type="password"
                            id="regPassword"
                            className="form-control"
                            placeholder="Min. 6 characters"
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="regConfirmPassword">Confirm *</label>
                          <input
                            type="password"
                            id="regConfirmPassword"
                            className="form-control"
                            placeholder="Re-type password"
                            required
                            value={regConfirmPassword}
                            onChange={(e) => setRegConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-section-title" style={{ marginTop: '5px' }}>Account Type</div>
                      <div className="role-toggle">
                        <label className={`role-btn ${regRole === 'User' ? 'active' : ''}`} onClick={() => setRegRole('User')}>
                          <input type="radio" name="regRole" value="User" checked={regRole === 'User'} readOnly />
                          <i className="fa-solid fa-user role-icon"></i>
                          <span>User</span>
                          <small>Standard functionality</small>
                        </label>
                        <label className={`role-btn ${regRole === 'Admin' ? 'active' : ''}`} onClick={() => setRegRole('Admin')}>
                          <input type="radio" name="regRole" value="Admin" checked={regRole === 'Admin'} readOnly />
                          <i className="fa-solid fa-user-gear role-icon"></i>
                          <span>Govt Official</span>
                          <small>System management</small>
                        </label>
                      </div>

                      {regError && <div className="error-message" style={{ display: 'block' }}>{regError}</div>}

                      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                        Create Account
                      </button>
                    </form>
                    <div className="auth-link">
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowRegister(false); }}>
                        Already have an account? Login
                      </a>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. ADMIN DASHBOARD */}
      {currentUser && currentUser.role === 'Admin' && (
        <div id="adminDashboard" className="dashboard" style={{ display: 'block' }}>

          {/* Header Panel */}
          <div className="header">
            <div className="header-brand" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)', flexShrink: 0 }}>
                <i className="fas fa-shield-halved" style={{ fontSize: '24px', color: '#ffffff' }}></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 38px)', letterSpacing: '0.5px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: 'clamp(12px, 2vw, 16px)', opacity: 0.9, fontWeight: 'normal', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.base}</span>
              </div>
            </div>
            <div className="header-right">
              <a
                href="/suraksha_setu_mobile_arm64.apk"
                download="suraksha_setu_mobile_arm64.apk"
                className="btn btn-secondary btn-small"
                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1d4ed8', color: '#ffffff', border: '1px solid #3b82f6', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                title="Download Android Mobile Mesh APK (Google Nearby BLE + Wi-Fi Direct)"
              >
                <i className="fas fa-mobile-screen"></i>
                <span>Download Mobile APK</span>
              </a>
              <div className="user-info">
                <span id="userRole" style={{ fontWeight: 'bold', color: '#ffffff' }}>{t.admin}</span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">

            {/* Top Stat Cards */}
            <div className="stats-grid" id="adminStatsGrid" style={{ display: 'grid', marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-clipboard-list"></i></div>
                <div className="stat-content">
                  <h3>{t.total_req}</h3>
                  <div className="value">{requests.length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-hourglass-half"></i></div>
                <div className="stat-content">
                  <h3>{t.active_req_short}</h3>
                  <div className="value">{requests.filter(r => r.status !== 'resolved').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-check-circle"></i></div>
                <div className="stat-content">
                  <h3>{t.resolved_req_short}</h3>
                  <div className="value">{requests.filter(r => r.status === 'resolved').length}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="icon-container"><i className="fas fa-exclamation-triangle"></i></div>
                <div className="stat-content">
                  <h3>{t.critical_priority}</h3>
                  <div className="value">{requests.filter(r => r.mlPriorityClass === 'critical' && r.status !== 'resolved').length}</div>
                </div>
              </div>
            </div>


            {/* Map Workstation Section */}
            <div className="section" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0 }}><i className="fas fa-map-location-dot"></i> {t.command_map}</h2>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={handleAutoFetchGPS}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '600'
                    }}
                  >
                    <i className="fas fa-location-crosshairs"></i> Fetch GPS Location
                  </button>
                  <span className="status-badge status-pending">{t.live_deployment}</span>
                </div>
              </div>
              <div className="map-container-wrapper" style={{ width: '100%', border: '1px solid #ddd', overflow: 'hidden', borderRadius: '12px' }}>
                <MapComponent
                  lat={currentBaseLocation.lat}
                  lng={currentBaseLocation.lng}
                  name={currentBaseLocation.name}
                  requests={requests}
                  volunteers={volunteers}
                  onMapClick={handleMapClick}
                  selectedLocation={selectedLocation}
                  routeCoordinates={routeCoordinates}
                  smsAlerts={smsData}
                />
              </div>
            </div>

            {/* Admin Input Panel and Requests table layout */}
            <div className="main-workspace">
              {/* Left Column: Active Requests */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Active Requests */}
                <div className="section" id="activeRequestsSection" style={{ height: 'auto', display: 'block', margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 style={{ margin: 0 }}>{t.active_req}</h2>
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={handleRunAIDedup}
                        disabled={aiDedupLoading}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: aiDedupActive ? '#eff6ff' : '#f8fafc',
                          color: aiDedupActive ? '#2563eb' : '#475569',
                          borderColor: aiDedupActive ? '#93c5fd' : '#cbd5e1',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title="Group multiple duplicate calls and alerts into unified incidents"
                      >
                        <i className={`fas ${aiDedupLoading ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} style={{ color: '#2563eb' }}></i>
                        {aiDedupLoading 
                          ? (lang === 'kn' ? 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...' : 'Analyzing Duplicates...') 
                          : aiDedupActive 
                          ? (lang === 'kn' ? 'AI ಕ್ಲಸ್ಟರಿಂಗ್ ಸಕ್ರಿಯವಾಗಿದೆ' : 'AI Dedup Active (Refresh)') 
                          : (lang === 'kn' ? 'AI ನಕಲಿ ಕರೆಗಳನ್ನು ಕಡಿತಗೊಳಿಸಿ' : 'Reduce Duplicate Alerts (AI)')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {aiDedupActive && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setAiDedupActive(false)}
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          {lang === 'kn' ? 'ಸಾಮಾನ್ಯ ವೀಕ್ಷಣೆ' : 'Raw View'}
                        </button>
                      )}
                      <select id="riskSort" className="form-control" style={{ width: 'auto' }} value={riskSort} onChange={(e) => setRiskSort(e.target.value)}>
                        <option value="critical">{t.critical_first}</option>
                        <option value="low">{t.low_first}</option>
                      </select>
                    </div>
                  </div>

                  {/* AI Deduplication Noise Reduction Metric Banner */}
                  {aiDedupActive && aiDedupResult && (
                    <div
                      style={{
                        padding: '10px 14px',
                        marginBottom: '15px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                        border: '1px solid #bbf7d0',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-shield-halved" style={{ color: '#16a34a', fontSize: '16px' }}></i>
                        <span>
                          <strong>{lang === 'kn' ? 'AI ನಕಲಿ ಕಡಿತ ಎಂಜಿನ್:' : 'AI Incident Clustering Engine:'}</strong>{' '}
                          {aiDedupResult.duplicateAlertsSuppressed} {lang === 'kn' ? 'ನಕಲಿ ಕರೆಗಳನ್ನು ವಿಲೀನಗೊಳಿಸಲಾಗಿದೆ' : 'duplicate/redundant calls grouped into'}{' '}
                          <strong>{aiDedupResult.clusteredIncidentsCount} {lang === 'kn' ? 'ಪ್ರಾಥಮಿಕ ಘಟನೆಗಳು' : 'master incidents'}</strong>.
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                          ⚡ {aiDedupResult.noiseReductionPercentage}% {lang === 'kn' ? 'ಶಬ್ದ ಕಡಿತ' : 'Noise Reduction'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                          [{aiDedupResult.providerUsed}]
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>{t.type}</th><th>{t.qty_short}</th><th>{t.location}</th><th>{t.person}</th><th>{t.phone_short}</th><th>{t.priority}</th><th>{t.status}</th><th>{t.actions}</th></tr>
                      </thead>
                      <tbody id="activeRequestsTable">
                        {aiDedupActive && aiDedupResult?.clusters ? (
                          aiDedupResult.clusters.map((cluster, cIdx) => {
                            const req = cluster.primaryIncident || {};
                            const hasDups = cluster.duplicateCount > 0;
                            const isClusterExpanded = Boolean(expandedClusterMap[cluster.clusterId || cIdx]);

                            return (
                              <Fragment key={cluster.clusterId || cIdx}>
                                <tr
                                  style={{
                                    backgroundColor: hasDups ? '#f8fafc' : undefined,
                                    borderLeft: hasDups ? '4px solid #2563eb' : undefined
                                  }}
                                >
                                  <td>
                                    <div>{req.resourceType}</div>
                                    {hasDups && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedClusterMap(prev => ({ ...prev, [cluster.clusterId || cIdx]: !prev[cluster.clusterId || cIdx] }))}
                                        style={{
                                          marginTop: '4px',
                                          background: '#dbeafe',
                                          color: '#1d4ed8',
                                          border: '1px solid #93c5fd',
                                          borderRadius: '4px',
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <i className={`fas ${isClusterExpanded ? 'fa-chevron-up' : 'fa-layer-group'}`}></i>
                                        {cluster.totalReports} Calls ({cluster.duplicateCount} Dups)
                                      </button>
                                    )}
                                  </td>
                                  <td>{req.quantityAllocated || 0}/{req.quantityRequested}</td>
                                  <td style={{ fontSize: '13px', maxWidth: '150px' }}>
                                    {req.address || (req.lat ? `Lat: ${Number(req.lat).toFixed(4)}, Lng: ${Number(req.lng).toFixed(4)}` : 'N/A')}
                                    {cluster.aiSummary && hasDups && (
                                      <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px', fontWeight: 600 }}>
                                        {cluster.aiSummary}
                                      </div>
                                    )}
                                  </td>
                                  <td>{req.contactPerson || 'N/A'}</td>
                                  <td className="contact-phone">
                                    {req.contactPhone || 'N/A'}
                                    {cluster.callerNumbers && cluster.callerNumbers.length > 1 && (
                                      <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>
                                        +{cluster.callerNumbers.length - 1} other callers
                                      </span>
                                    )}
                                  </td>
                                  <td><span className={`priority-badge priority-${req.mlPriorityClass || cluster.severity || 'medium'}`}>{(req.mlPriorityClass || cluster.severity || 'medium').toUpperCase()}</span></td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                      <span className={`status-badge status-${req.status || 'pending'}`}>{(req.status || 'pending').toUpperCase()}</span>
                                      {req.dispatchStatus === 'completed' ? (
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '3px 7px', borderRadius: '4px', display: 'inline-block' }}>
                                          ✓ Allocated by {req.completedByVolunteerName || 'Volunteer'}{req.completedBySpecialty ? ` (${req.completedBySpecialty})` : ''}
                                        </span>
                                      ) : req.assignedVolunteerName ? (
                                        <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                          ⏳ Dispatched to {req.assignedVolunteerName} · Yet to Dispatch
                                        </span>
                                      ) : (req.status === 'allocated' || req.status === 'partial') ? (
                                        <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                          ⏳ YET TO DISPATCH
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                  <td>
                                    <div className="btn-group">
                                      <button className="btn btn-secondary btn-small" onClick={() => handleShowRoute(req)}>{t.route}</button>
                                      <button className="btn btn-secondary btn-small" onClick={() => { setSelectedTriageRequest(req); showToast(`Selected ${req.requestId} for AI Triage`, 'info'); }} style={{ background: selectedTriageRequest?.id === req.id ? '#ccd6c8' : '' }}>
                                        <i className="fas fa-brain"></i> {lang === 'kn' ? 'ವಿಂಗಡಿಸು' : 'Triage'}
                                      </button>
                                      {req.status !== 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleAllocateOpen(req)}>{t.allocate}</button>}
                                      {req.status === 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleMarkResolved(req.id)}>{t.resolve}</button>}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Duplicate Calls Sub-Table */}
                                {isClusterExpanded && (cluster.duplicateReports || []).map((dup, dIdx) => (
                                  <tr
                                    key={`${cluster.clusterId}-sub-${dIdx}`}
                                    style={{
                                      backgroundColor: '#f1f5f9',
                                      borderLeft: '4px solid #94a3b8',
                                      fontSize: '11px'
                                    }}
                                  >
                                    <td style={{ paddingLeft: '20px' }}>
                                      <i className="fas fa-turn-up fa-rotate-90" style={{ marginRight: '6px', color: '#94a3b8' }}></i>
                                      <span style={{ color: '#2563eb', fontWeight: 600 }}>Duplicate Call #{dIdx + 1}</span>
                                    </td>
                                    <td>{dup.quantityRequested || '1'}</td>
                                    <td>{dup.address || 'Same Sector'}</td>
                                    <td>{dup.contactPerson || 'Caller'}</td>
                                    <td>{dup.contactPhone || 'N/A'}</td>
                                    <td colSpan="3">
                                      <span style={{ background: '#e2e8f0', color: '#475569', padding: '1px 6px', borderRadius: '3px', fontWeight: 600, marginRight: '8px' }}>
                                        {dup.duplicateReason || 'Matched Incident'}
                                      </span>
                                      <span style={{ color: '#64748b' }}>
                                        {dup.description || dup.whatNeeded || 'Identical emergency report'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </Fragment>
                            );
                          })
                        ) : (
                          sortedRequests.active.map(req => (
                            <tr key={req.id || req.requestId}>
                              <td>{req.resourceType}</td>
                              <td>{req.quantityAllocated || 0}/{req.quantityRequested}</td>
                              <td style={{ fontSize: '13px', maxWidth: '150px' }}>{req.address || (req.lat ? `Lat: ${Number(req.lat).toFixed(4)}, Lng: ${Number(req.lng).toFixed(4)}` : 'N/A')}</td>
                              <td>{req.contactPerson || 'N/A'}</td>
                              <td className="contact-phone">{req.contactPhone || 'N/A'}</td>
                              <td><span className={`priority-badge priority-${req.mlPriorityClass}`}>{req.mlPriorityClass.toUpperCase()}</span></td>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                  <span className={`status-badge status-${req.status}`}>{req.status.toUpperCase()}</span>
                                  {req.dispatchStatus === 'completed' ? (
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '3px 7px', borderRadius: '4px', display: 'inline-block' }}>
                                      ✓ Allocated by {req.completedByVolunteerName || 'Volunteer'}{req.completedBySpecialty ? ` (${req.completedBySpecialty})` : ''}
                                    </span>
                                  ) : req.assignedVolunteerName ? (
                                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                      ⏳ Dispatched to {req.assignedVolunteerName} · Yet to Dispatch
                                    </span>
                                  ) : (req.status === 'allocated' || req.status === 'partial') ? (
                                    <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                      ⏳ YET TO DISPATCH
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td>
                                <div className="btn-group">
                                  <button className="btn btn-secondary btn-small" onClick={() => handleShowRoute(req)}>{t.route}</button>
                                  <button className="btn btn-secondary btn-small" onClick={() => { setSelectedTriageRequest(req); showToast(`Selected ${req.requestId} for AI Triage`, 'info'); }} style={{ background: selectedTriageRequest?.id === req.id ? '#ccd6c8' : '' }}>
                                    <i className="fas fa-brain"></i> {lang === 'kn' ? 'ವಿಂಗಡಿಸು' : 'Triage'}
                                  </button>
                                  {req.status !== 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleAllocateOpen(req)}>{t.allocate}</button>}
                                  {req.status === 'allocated' && <button className="btn btn-primary btn-small" onClick={() => handleMarkResolved(req.id)}>{t.resolve}</button>}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: Submit Emergency Request Form (Admin Side) */}
              <div className="form-section" style={{ height: 'auto', margin: 0 }}>
                <h2>{t.submit_req_admin}</h2>
                <div className="priority-display" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: 'auto auto', gap: '0px', alignItems: 'center' }}>
                  <h3>{t.ml_priority}</h3>
                  <div className="confidence">{t.confidence}: {adminPriorityResult.mlConfidence}%</div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div className={`priority-badge priority-${adminPriorityResult.priorityClass}`}>{adminPriorityResult.priorityClass.toUpperCase()}</div>
                  </div>
                </div>

                <form onSubmit={handleAdminRequestSubmit}>
                  <div className="form-group">
                    <label style={{ fontSize: '16px' }}>{t.res_type}</label>
                    <select className="form-control" style={{ height: '50px', fontSize: '15px' }} required value={adminResourceType} onChange={(e) => setAdminResourceType(e.target.value)}>
                      <option value="">{t.select_resource}</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Food & Water">Food &amp; Water</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Rescue Team">Rescue Team</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Bedding">Bedding</option>
                      <option value="Rescue Boats">Rescue Boats</option>
                      <option value="Heavy Machinery">Heavy Machinery</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t.qty}</label>
                      <input type="number" className="form-control" required min="1" value={adminQuantity} onChange={(e) => setAdminQuantity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.severity}</label>
                      <select className="form-control" required value={adminSeverity} onChange={(e) => setAdminSeverity(e.target.value)}>
                        <option value="">Select Severity</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.affected}</label>
                    <input type="number" className="form-control" required min="1" value={adminIndividuals} onChange={(e) => setAdminIndividuals(e.target.value)} />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>{t.person}</label>
                      <input type="text" className="form-control" required value={adminContact} onChange={(e) => setAdminContact(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>{t.phone}</label>
                      <input type="text" className="form-control" required value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t.desc}</label>
                    <textarea className="form-control" rows="3" required value={adminDescription} onChange={(e) => setAdminDescription(e.target.value)}></textarea>
                  </div>

                  <div style={{ fontSize: '12px', margin: '5px 0 10px', color: '#666' }}>
                    {selectedLocation ? `${t.pinned_target}: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}` : t.map_pin_required}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: '60px', fontSize: '18px', fontWeight: 'bold' }}>
                    {t.submit_btn}
                  </button>
                </form>
              </div>
            </div>

            {/* Divider and Secondary Operational Feeds (Below the fold) */}
            <div style={{ borderTop: '2px dashed var(--color-border)', margin: '40px 0 24px', paddingTop: '24px' }}>
              <h2 style={{ fontSize: '20px', color: 'var(--color-primary)', marginBottom: '20px', fontWeight: '600' }}>
                <i className="fas fa-chart-line"></i> Operational Feeds & Telemetry
              </h2>
            </div>

            {/* Collapsible telemetry grids */}
            <div className="collapsible-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '24px' }}>

              {/* Sensor Card */}
              <div id="hardwareSection" className="weather-section" style={{ display: 'block' }}>
                <div className="weather-header" onClick={() => setIsHardwareExpanded(prev => !prev)}>
                  <h2><i className="fas fa-microchip"></i> {t.hw_title}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isHardwareExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isHardwareExpanded ? 'expanded' : ''}`}>
                  {/* Clean Hardware Status Header Strip */}
                  <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #f8fafc, #eff6ff)', borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ position: 'relative', display: 'flex', height: '10px', width: '10px' }}>
                        <span style={{ position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#22c55e', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></span>
                        <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '10px', width: '10px', background: '#16a34a' }}></span>
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', letterSpacing: '0.3px' }}>
                        {lang === 'kn' ? 'ಲೈವ್ ಹಾರ್ಡ್‌ವೇರ್ ಟೆಲಿಮೆಟ್ರಿ ಸ್ಟ್ರೀಮ್ (ESP32 Node)' : 'Live Hardware Telemetry Stream (ESP32 Node)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Status:</span>
                        <strong style={{
                          color: sensorData.status?.includes('CRITICAL') || sensorData.status?.includes('DANGER') || sensorData.status?.includes('WARNING') || sensorData.status?.includes('ALARM') ? '#ef4444' : '#16a34a',
                          background: sensorData.status?.includes('CRITICAL') || sensorData.status?.includes('DANGER') ? '#fef2f2' : '#f0fdf4',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          border: `1px solid ${sensorData.status?.includes('CRITICAL') || sensorData.status?.includes('DANGER') ? '#fca5a5' : '#bbf7d0'}`,
                          fontSize: '11px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {sensorData.status || 'Normal Operational Baseline'}
                        </strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>
                        {t.last_sync || 'Last Sync'}: <strong>{sensorData.created_at ? new Date(sensorData.created_at).toLocaleTimeString() : 'Connecting...'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 5 Real Connected Hardware Sensors Grid */}
                  <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                    
                    {/* 1. Temperature (DHT22) */}
                    <div className={`stat-card hw-card ${sensorData.temperature > 38.0 ? 'danger-alert-card' : ''}`} style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', margin: 0, height: 'auto', border: '1px solid #e2e8f0' }} id="hwCardTemp">
                      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <i className="fas fa-temperature-high"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          {t.temp} <span style={{ opacity: 0.65, fontWeight: '500' }}>· DHT22</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
                          {sensorData.temperature != null ? Number(sensorData.temperature).toFixed(1) : '--'}<span style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', marginLeft: '3px' }}>°C</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Humidity (DHT22) */}
                    <div className={`stat-card hw-card ${sensorData.humidity > 85.0 ? 'danger-alert-card' : ''}`} style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', margin: 0, height: 'auto', border: '1px solid #e2e8f0' }} id="hwCardHum">
                      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <i className="fas fa-droplet"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          {t.hum} <span style={{ opacity: 0.65, fontWeight: '500' }}>· DHT22</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
                          {sensorData.humidity != null ? Number(sensorData.humidity).toFixed(1) : '--'}<span style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', marginLeft: '3px' }}>%</span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Seismic Tremor (ADXL345) */}
                    <div className={`stat-card hw-card ${sensorData.seismic > 1.0 ? 'danger-alert-card' : ''}`} style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', margin: 0, height: 'auto', border: '1px solid #e2e8f0' }} id="hwCardSeismic">
                      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <i className="fas fa-wave-square"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          {t.seismic} <span style={{ opacity: 0.65, fontWeight: '500' }}>· ADXL345</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
                          {sensorData.seismic != null ? Number(sensorData.seismic).toFixed(2) : '--'}<span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginLeft: '4px' }}>m/s²</span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Water Level / Distance (HC-SR04) */}
                    <div className={`stat-card hw-card ${sensorData.water_level < 15.0 ? 'danger-alert-card' : ''}`} style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', margin: 0, height: 'auto', border: '1px solid #e2e8f0' }} id="hwCardWater">
                      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#f0f9ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <i className="fas fa-water"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          {t.water} <span style={{ opacity: 0.65, fontWeight: '500' }}>· HC-SR04</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
                          {sensorData.water_level != null ? Number(sensorData.water_level).toFixed(1) : '--'}<span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginLeft: '3px' }}>cm</span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Rain Intensity (Raindrop Module) */}
                    <div className={`stat-card hw-card ${sensorData.rain_level > 60 ? 'danger-alert-card' : ''}`} style={{ padding: '16px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '14px', margin: 0, height: 'auto', border: '1px solid #e2e8f0' }} id="hwCardRain">
                      <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                        <i className="fas fa-cloud-showers-heavy"></i>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          {t.rain} <span style={{ opacity: 0.65, fontWeight: '500' }}>· Rain Grid</span>
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', lineHeight: 1.2 }}>
                          {sensorData.rain_level != null ? Number(sensorData.rain_level).toFixed(0) : '--'}<span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', marginLeft: '3px' }}>%</span>
                        </div>
                      </div>
                    </div>

                  </div>
                  <div style={{ padding: '0 15px 15px', fontSize: '10px', color: '#666', textAlign: 'right' }}>
                    {t.last_sync || 'Last Sync'}: {sensorData.created_at ? new Date(sensorData.created_at).toLocaleTimeString() : 'Connecting...'}
                  </div>
                </div>
              </div>

              {/* Weather Card */}
              <div id="weatherSection" className="weather-section" style={{ display: 'block' }}>
                <div className="weather-header" onClick={() => setIsWeatherExpanded(prev => !prev)}>
                  <h2><i className="fas fa-cloud-sun"></i> {t.weather_forecast}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isWeatherExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isWeatherExpanded ? 'expanded' : ''}`}>
                  {weatherData ? (
                    <div className="weather-grid" style={{ padding: '15px' }}>
                      {getWeatherItems(weatherData).map((item, idx) => (
                        <div className="weather-item" key={idx}>
                          <label>{item.label}</label>
                          <div className="value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)' }}>
                      {t.loading_weather}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Secondary Workspace for SMS, Volunteers, and AI Panel */}
            <div className="main-workspace secondary-workspace" style={{ minHeight: 'auto', marginBottom: '24px' }}>

              {/* Left Column: Live SMS Requests and Volunteers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* SurakshaSetu Off-Grid SMS Gateway */}
                <SurakshaSetuSMSPanel onAlertsUpdate={setSmsData} />

                {/* Volunteer Dispatch Grid */}
                <div className="section" id="volunteerManagementSection" style={{ margin: 0 }}>
                  <h2>{t.on_duty_vols}</h2>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr><th>{t.name}</th><th>{t.role}</th><th>{t.status}</th><th>{t.phone}</th><th>{t.actions}</th></tr>
                      </thead>
                      <tbody id="volunteerTable">
                        {volunteers.map(v => (
                          <tr key={v.id}>
                            <td>
                              <strong>{v.name}</strong>
                              {v.verified && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '2px 6px', borderRadius: '4px' }}>
                                  ✓ Verified
                                </span>
                              )}
                              {v.docFileName && (
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                  ID Doc: {v.docFileName}
                                </div>
                              )}
                            </td>
                            <td>{v.specialty || v.role}</td>
                            <td><span className={`status-badge status-${v.status}`}>{v.status.toUpperCase()}</span></td>
                            <td>{v.phone}</td>
                            <td>
                              <button className="btn btn-primary btn-small" onClick={() => setDispatchingVolId(v.id)} disabled={v.status === 'busy'}>
                                {t.dispatch}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Triage & Rescue Coordination Control Hub */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* 1. AI Incident Triage Panel */}
                <div className="section" style={{ margin: 0 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-brain" style={{ color: '#2f442f' }}></i> Disaster AI Triage Center
                  </h2>

                  {selectedTriageRequest ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                      <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                          <span>ID: {selectedTriageRequest.requestId}</span>
                          <span className={`status-badge status-${selectedTriageRequest.status}`}>{selectedTriageRequest.status.toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--color-text)' }}>
                          <strong>Need:</strong> {selectedTriageRequest.resourceType} ({selectedTriageRequest.individualsAffected} affected)
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px', fontStyle: 'italic', color: '#555' }}>
                          &quot;{selectedTriageRequest.description}&quot;
                        </div>
                      </div>

                      {/* AI Action Trigger */}
                      <button
                        className="btn btn-primary"
                        disabled={aiTriageLoading}
                        onClick={() => handleRunAITriage(selectedTriageRequest)}
                        style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold' }}
                      >
                        {aiTriageLoading ? (
                          <span><i className="fas fa-spinner fa-spin"></i> Categorizing Distress...</span>
                        ) : (
                          <span><i className="fas fa-robot"></i> Analyze with Disaster AI</span>
                        )}
                      </button>

                      {/* AI Classification Output */}
                      {selectedTriageRequest.mlPriorityClass && (
                        <div style={{ background: '#f0f5f0', padding: '12px', borderRadius: '8px', border: '1px solid #b2cbb2', marginTop: '5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2d3b2e' }}>AI Urgency Class:</span>
                            <span className={`status-badge status-${selectedTriageRequest.mlPriorityClass}`} style={{ fontSize: '11px', fontWeight: '800' }}>
                              {selectedTriageRequest.mlPriorityClass.toUpperCase()}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2d3b2e' }}>AI Confidence Score:</span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#22c55e' }}>
                              {((selectedTriageRequest.mlConfidence || 0.85) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#333', borderTop: '1px solid #ccd6c8', paddingTop: '8px', lineHeight: '1.4' }}>
                            <strong>AI Action Directive:</strong> {selectedTriageRequest.triageSummary || "No summary generated."}
                          </div>

                          {/* Save Triage to Database */}
                          <button
                            className="btn btn-secondary btn-small"
                            onClick={() => handleSaveAITriage(selectedTriageRequest)}
                            style={{ width: '100%', marginTop: '10px', padding: '6px', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            <i className="fas fa-save"></i> Commit Triage to Server
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#666', fontSize: '13px' }}>
                      <i className="fas fa-info-circle" style={{ fontSize: '20px', display: 'block', marginBottom: '8px', color: 'var(--color-sage)' }}></i>
                      Select an incident request from the map or lists to run AI Triage and Matchmaking.
                    </div>
                  )}
                </div>

                {/* 2. Smart Proximity Rescuer Matchmaking */}
                {selectedTriageRequest && (
                  <div className="section" style={{ margin: 0 }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fas fa-map-marked-alt" style={{ color: '#2f442f' }}></i> Smart Rescuer Matchmaking
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Active rescuers ranked by distance to <strong>{selectedTriageRequest.requestId}</strong>:
                      </div>

                      {/* Proximity calculation and mapping list */}
                      {(() => {
                        const rankedVolunteers = volunteers.map(vol => {
                          const dist = getCoordinatesDistance(vol.lat, vol.lng, selectedTriageRequest.lat, selectedTriageRequest.lng);
                          // Match check
                          const isSkillMatch = (
                            (selectedTriageRequest.resourceType === 'Medical' && vol.role === 'Medical Responder') ||
                            (selectedTriageRequest.resourceType === 'Rescue Team' && vol.role === 'Rescue Team Lead') ||
                            (selectedTriageRequest.resourceType === 'Food & Water' && vol.role === 'Logistics Coordinator') ||
                            (selectedTriageRequest.resourceType === 'Shelter' && vol.role === 'Shelter Manager') ||
                            (selectedTriageRequest.resourceType === 'Ambulance' && vol.role === 'Ambulance Operator')
                          );
                          return { ...vol, distance: dist, isSkillMatch };
                        });

                        // Sort by distance
                        rankedVolunteers.sort((a, b) => a.distance - b.distance);

                        return rankedVolunteers.map(vol => (
                          <div
                            key={vol.id}
                            style={{
                              padding: '10px',
                              borderRadius: '8px',
                              border: vol.isSkillMatch ? '2px solid #3a6841' : '1px solid var(--color-border)',
                              background: vol.status === 'busy' ? '#f4f4f4' : (vol.isSkillMatch ? '#f0f5f0' : 'var(--color-surface)'),
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                {vol.name} {vol.isSkillMatch && <span style={{ color: '#3a6841', fontSize: '11px', fontWeight: 'bold' }}>⭐ Match</span>}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666' }}>{vol.distance.toFixed(2)} km</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#555' }}>
                              <span>Role: {vol.role}</span>
                              <span className={`status-badge status-${vol.status}`} style={{ fontSize: '9px' }}>{vol.status}</span>
                            </div>

                            {vol.status !== 'busy' && (
                              <button
                                className="btn btn-primary btn-small"
                                onClick={() => handleDispatchVolunteer(vol.id, selectedTriageRequest.id)}
                                style={{ width: '100%', marginTop: '4px', fontSize: '11px', padding: '4px', fontWeight: 'bold' }}
                              >
                                <i className="fas fa-paper-plane"></i> Dispatch Rescuer
                              </button>
                            )}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                )}

                {/* 3. Emergency Broadcast Center */}
                <div className="section" style={{ margin: 0 }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-bullhorn" style={{ color: '#2f442f' }}></i> HQ Emergency Broadcasts
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                    <textarea
                      className="form-control"
                      placeholder="Enter emergency warning to broadcast back to offline mobile mesh..."
                      value={newBroadcastMsg}
                      onChange={(e) => setNewBroadcastMsg(e.target.value)}
                      style={{ width: '100%', minHeight: '60px', padding: '10px', fontSize: '12.5px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <select
                        className="form-control"
                        value={broadcastZone}
                        onChange={(e) => setBroadcastZone(e.target.value)}
                        style={{ padding: '6px', fontSize: '11.5px' }}
                      >
                        <option value="All Sectors">All Sectors</option>
                        <option value="Sector A">Sector A</option>
                        <option value="Sector B">Sector B</option>
                        <option value="Sector C">Sector C</option>
                        <option value="Sector D">Sector D</option>
                      </select>

                      <select
                        className="form-control"
                        value={broadcastSeverity}
                        onChange={(e) => setBroadcastSeverity(e.target.value)}
                        style={{ padding: '6px', fontSize: '11.5px' }}
                      >
                        <option value="info">Info Alert</option>
                        <option value="warning">High Warning</option>
                        <option value="critical">Critical Alarm</option>
                      </select>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleSendEmergencyBroadcast}
                      style={{ padding: '8px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      <i className="fas fa-broadcast-tower"></i> Broadcast to Mesh Nodes
                    </button>

                    {/* Broadcast history list */}
                    {broadcasts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #ccd6c8', paddingTop: '10px', marginTop: '5px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#2d3b2e' }}>Recent Warnings:</div>
                        {broadcasts.map(bc => (
                          <div
                            key={bc.id}
                            style={{
                              padding: '8px',
                              borderRadius: '6px',
                              background: bc.severity === 'critical' ? '#ffebeb' : (bc.severity === 'warning' ? '#fff4e5' : '#f0f5f0'),
                              borderLeft: `4px solid ${bc.severity === 'critical' ? '#ef4444' : (bc.severity === 'warning' ? '#f59e0b' : '#3a6841')}`,
                              fontSize: '11.5px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                              <span>Zone: {bc.targetZone}</span>
                              <span style={{ fontSize: '10px', color: '#666' }}>{new Date(bc.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div style={{ color: '#222' }}>{bc.message}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>


            </div>

            {/* Inventory Exhaustion Forecast and analytics */}
            <div className="section" id="analyticsSection" style={{ display: 'block' }}>
              <h2>{t.sys_analytics}</h2>
              <div className="ai-demand-section" style={{ marginBottom: '20px' }}>
                <div className="ai-demand-header">
                  <h3><i className="fas fa-hourglass-half"></i> {t.exhaustion_forecast}</h3>
                </div>
                <div className="ai-demand-grid" id="forecastingGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  {forecasts.map(f => (
                    <div className={`ai-demand-card forecast-${f.riskStatus}`} key={f.id} style={{
                      padding: '15px',
                      borderRadius: '12px',
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderLeft: `5px solid ${f.riskStatus === 'critical' ? '#ff4444' : (f.riskStatus === 'high' ? '#ff8800' : '#22c55e')}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '120px'
                    }}>
                      <div style={{ fontWeight: '700', marginBottom: '5px' }}><i className="fas fa-hourglass-half"></i> {f.name}</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)' }}>{f.availableQuantity} <span style={{ fontSize: '14px' }}>{t.units}</span></div>
                      <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        {t.burn_rate}: ~{f.hourlyRate} {t.units_hr}<br />
                        <span className={`status-badge status-${f.riskStatus}`}>{f.riskStatus.toUpperCase()} {t.risk}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analytics-grid">
                <div className="analytics-card"><h3>{t.avg_priority}</h3><div className="value" id="avgPriority">{avgPriority}</div></div>
                <div className="analytics-card"><h3>{t.people_helped}</h3><div className="value" id="totalIndividuals">{peopleHelped}</div></div>
                <div className="analytics-card"><h3>{t.utilization}</h3><div className="value" id="resourceUtilization">{resourceUtilization}%</div></div>
                <div className="analytics-card"><h3>{t.avg_response_time}</h3><div className="value" id="avgResponseTime">N/A</div></div>
              </div>
            </div>

            {/* Resolved requests */}
            <div className="section" id="resolvedRequestsSection" style={{ opacity: 0.8, display: 'block' }}>
              <h2>{t.resolved_history}</h2>
              <div className="table-container">
                <table style={{ fontSize: '13px' }}>
                  <thead>
                    <tr><th>{t.id}</th><th>{t.type}</th><th>{t.location}</th><th>{t.person}</th><th>{t.phone_short}</th><th>{t.desc}</th><th>{t.priority}</th><th>{t.resolved_at}</th><th>{t.actions}</th></tr>
                  </thead>
                  <tbody>
                    {sortedRequests.resolved.map(req => (
                      <tr key={req.id || req.requestId}>
                        <td><strong>{req.requestId}</strong></td>
                        <td>
                          <div>{req.resourceType}</div>
                          {req.completedByVolunteerName && (
                            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: '600' }}>
                              ✓ Allocated by {req.completedByVolunteerName}{req.completedBySpecialty ? ` (${req.completedBySpecialty})` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', maxWidth: '150px' }}>{req.address || `Lat: ${req.lat.toFixed(4)}, Lng: ${req.lng.toFixed(4)}`}</td>
                        <td>{req.contactPerson || 'N/A'}</td>
                        <td>{req.contactPhone || 'N/A'}</td>
                        <td style={{ fontSize: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.description}>
                          {req.description}
                        </td>
                        <td><span className={`priority-badge priority-${req.mlPriorityClass}`}>{req.mlPriorityClass.toUpperCase()}</span></td>
                        <td>{new Date(req.resolvedAt).toLocaleString()}</td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary btn-small" onClick={() => handleDeleteRequest(req.id)}>{t.purge}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. USER DASHBOARD */}
      {currentUser && currentUser.role === 'User' && (
        <div id="userDashboard" className="dashboard" style={{ display: 'block' }}>

          {/* Header */}
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                <i className="fas fa-shield-halved" style={{ fontSize: '26px', color: '#ffffff' }}></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: 0, fontSize: '42px', letterSpacing: '1px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: '17px', opacity: 0.9, fontWeight: 'normal' }}>{t.base}</span>
              </div>
            </div>
            <div className="header-right">
              <a
                href="/suraksha_setu_mobile_arm64.apk"
                download="suraksha_setu_mobile_arm64.apk"
                className="btn btn-secondary btn-small"
                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1d4ed8', color: '#ffffff', border: '1px solid #3b82f6', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}
                title="Download Android Mobile Mesh APK (Google Nearby BLE + Wi-Fi Direct)"
              >
                <i className="fas fa-mobile-screen"></i>
                <span>Download Mobile APK</span>
              </a>
              <button
                className="btn btn-secondary btn-small"
                id="mobileViewToggle"
                onClick={() => setMobileView(prev => !prev)}
                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className={mobileView ? "fas fa-desktop" : "fas fa-mobile-alt"}></i>
              </button>
              <div className="user-info">
                <span id="userDashboardRole">{currentUser.fullName}</span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">
            <div className="main-workspace" style={{ marginBottom: '24px' }}>

              {/* User map coordinate picker */}
              <div className="map-section">
                <h2><i className="fas fa-map-marked-alt"></i> {t.location_map}</h2>
                <div style={{ height: '560px', minHeight: '500px', width: '100%', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                  <MapComponent
                    lat={currentBaseLocation.lat}
                    lng={currentBaseLocation.lng}
                    name={currentBaseLocation.name}
                    requests={requests}
                    volunteers={volunteers}
                    onMapClick={handleMapClick}
                    selectedLocation={selectedLocation}
                    routeCoordinates={routeCoordinates}
                    smsAlerts={smsData}
                  />
                </div>
              </div>

              {/* User input emergency trigger panel */}
              <div className="form-section">

                {/* Panic SOS Button */}
                <div className="sos-container">
                  <button className="btn-sos" onClick={handleSOSPanic}>
                    <i className="fas fa-hand-holding-medical"></i>
                    <span>{t.sos_btn}</span>
                  </button>
                  <div className="sos-label">{t.sos_label}</div>
                  <div className="sos-hint">{t.sos_hint}</div>
                </div>

                <h2>{t.submit_req}</h2>

                {/* Dynamic ML Score Box */}
                <div className="priority-display" id="userPriorityDisplay" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gridTemplateRows: 'auto auto', gap: '0px', alignItems: 'center' }}>
                  <h3 style={{ margin: 0 }}>Real-time ML Priority</h3>
                  <div className="confidence" id="userPriorityConfidence">{t.confidence}: {userPriorityResult.mlConfidence}%</div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
                    <div className={`priority-badge priority-${userPriorityResult.priorityClass}`} id="userPriorityBadge">
                      {userPriorityResult.priorityClass.toUpperCase()}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleUserRequestSubmit}>
                  <div className="form-group">
                    <label htmlFor="userResourceType" style={{ fontSize: '16px' }}>{t.res_type}</label>
                    <select id="userResourceType" className="form-control" required style={{ height: '50px', fontSize: '15px' }} value={userResourceType} onChange={(e) => setUserResourceType(e.target.value)}>
                      <option value="">Select Resource</option>
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Food & Water">Food &amp; Water</option>
                      <option value="Shelter">Shelter</option>
                      <option value="Rescue Team">Rescue Team</option>
                      <option value="Ambulance">Ambulance</option>
                      <option value="Bedding">Bedding</option>
                      <option value="Rescue Boats">Rescue Boats</option>
                      <option value="Heavy Machinery">Heavy Machinery</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="userQuantity">{t.qty}</label>
                      <input type="number" id="userQuantity" className="form-control" required min="1" value={userQuantity} onChange={(e) => setUserQuantity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="userSeverity">{t.severity}</label>
                      <select id="userSeverity" className="form-control" required value={userSeverity} onChange={(e) => setUserSeverity(e.target.value)}>
                        <option value="">Select Severity</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="userIndividualsAffected">{t.affected}</label>
                    <input type="number" id="userIndividualsAffected" className="form-control" required min="1" value={userIndividuals} onChange={(e) => setUserIndividuals(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label htmlFor="userDescription">{t.desc}</label>
                    <textarea id="userDescription" className="form-control" rows="3" required value={userDescription} onChange={(e) => setUserDescription(e.target.value)}></textarea>
                  </div>

                  <div style={{ fontSize: '12px', margin: '5px 0 10px', color: '#666' }}>
                    {selectedLocation ? `${t.coords_locked}: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lng.toFixed(5)}` : t.pin_target_required}
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ height: '60px', fontSize: '18px', fontWeight: 'bold' }}>
                    {t.submit_btn}
                  </button>
                </form>

              </div>
            </div>

            {/* SurakshaSetu Off-Grid SMS Gateway */}
            <div style={{ marginBottom: '24px' }}>
              <SurakshaSetuSMSPanel onAlertsUpdate={setSmsData} />
            </div>

            {/* Weather / Sensors / Volunteers Accordions */}
            <div className="sections-grid" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Weather info */}
              <div className="weather-section" id="userWeatherSection">
                <div className="weather-header" onClick={() => setIsWeatherExpanded(prev => !prev)}>
                  <h2><i className="fas fa-cloud-sun"></i> {t.local_weather}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isWeatherExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isWeatherExpanded ? 'expanded' : ''}`}>
                  {weatherData ? (
                    <div className="weather-grid" style={{ padding: '15px' }}>
                      {getWeatherItems(weatherData).map((item, idx) => (
                        <div className="weather-item" key={idx}>
                          <label>{item.label}</label>
                          <div className="value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '15px', color: '#666' }}>{t.weather_syncing}</div>
                  )}
                </div>
              </div>

              {/* Hardware Sensors */}
              <div className="weather-section" id="userHardwareSection">
                <div className="weather-header" onClick={() => setIsHardwareExpanded(prev => !prev)}>
                  <h2><i className="fas fa-microchip"></i> {t.live_sensor_data}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isHardwareExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isHardwareExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div className="hw-item" style={{ padding: '10px', background: sensorData.temperature > 38.0 ? '#fee2e2' : '#fff', color: sensorData.temperature > 38.0 ? '#991b1b' : 'inherit', border: sensorData.temperature > 38.0 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>{t.temp} (DHT22)</label>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sensorData.temperature != null ? `${Number(sensorData.temperature).toFixed(1)}°C` : '--'}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: sensorData.humidity > 85.0 ? '#fee2e2' : '#fff', color: sensorData.humidity > 85.0 ? '#991b1b' : 'inherit', border: sensorData.humidity > 85.0 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>{t.hum} (DHT22)</label>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sensorData.humidity != null ? `${Number(sensorData.humidity).toFixed(1)}%` : '--'}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: sensorData.seismic > 0.5 ? '#fee2e2' : '#fff', color: sensorData.seismic > 0.5 ? '#991b1b' : 'inherit', border: sensorData.seismic > 0.5 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>{t.seismic} (ADXL345)</label>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sensorData.seismic != null ? `${Number(sensorData.seismic).toFixed(2)} m/s²` : '--'}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: sensorData.water_level < 15.0 ? '#fee2e2' : '#fff', color: sensorData.water_level < 15.0 ? '#991b1b' : 'inherit', border: sensorData.water_level < 15.0 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>{t.water} (HC-SR04)</label>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sensorData.water_level != null ? `${Number(sensorData.water_level).toFixed(1)} cm` : '--'}</div>
                    </div>
                    <div className="hw-item" style={{ padding: '10px', background: sensorData.rain_level > 50 ? '#fee2e2' : '#fff', color: sensorData.rain_level > 50 ? '#991b1b' : 'inherit', border: sensorData.rain_level > 50 ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px' }}>
                      <label style={{ fontSize: '11px', color: '#64748b' }}>{t.rain} (Rain Grid)</label>
                      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{sensorData.rain_level != null ? `${Number(sensorData.rain_level).toFixed(0)}%` : '--'}</div>
                    </div>
                  </div>
                  <div style={{ padding: '0 15px 12px', fontSize: '10px', color: '#64748b', textAlign: 'right' }}>
                    {t.last_sync || 'Last Sync'}: {sensorData.created_at ? new Date(sensorData.created_at).toLocaleTimeString() : 'Connecting...'}
                  </div>
                </div>
              </div>

              {/* Volunteer Register */}
              <div className="weather-section" id="volunteerSection">
                <div className="weather-header" onClick={() => setIsVolunteerFormExpanded(prev => !prev)}>
                  <h2><i className="fas fa-user-plus"></i> {t.join_vol}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isVolunteerFormExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isVolunteerFormExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '20px' }}>
                    <form onSubmit={handleVolunteerRegister}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>{t.name}</label>
                          <input type="text" className="form-control" required value={volName} onChange={(e) => setVolName(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label>{t.expertise}</label>
                          <select className="form-control" required value={volRole} onChange={(e) => setVolRole(e.target.value)}>
                            <option value="Medical">Medical / First Aid</option>
                            <option value="Rescue">Rescue / Search</option>
                            <option value="Driver">Driver / Logistics</option>
                            <option value="General">General Assistance</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>{t.phone}</label>
                        <input type="tel" className="form-control" required value={volPhone} onChange={(e) => setVolPhone(e.target.value)} />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>{t.reg_vol}</button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Supplies List */}
              <div className="weather-section" id="userResourcesSection">
                <div className="weather-header" onClick={() => setIsUserResourcesExpanded(prev => !prev)}>
                  <h2><i className="fas fa-boxes"></i> {t.avail_supplies}</h2>
                  <i className="fas fa-chevron-down" style={{ transform: isUserResourcesExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}></i>
                </div>
                <div className={`weather-content ${isUserResourcesExpanded ? 'expanded' : ''}`}>
                  <div style={{ padding: '20px' }}>
                    <div className="resources-grid">
                      {resources.map(res => {
                        const pct = ((res.availableQuantity / res.totalQuantity) * 100).toFixed(0);
                        return (
                          <div className="resource-card" key={res.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                              <span>{res.name}</span>
                              <span style={{ color: 'var(--color-primary)' }}>{res.availableQuantity}/{res.totalQuantity}</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress" style={{ width: `${pct}%`, background: pct < 20 ? '#ef4444' : (pct < 50 ? '#f97316' : '#10b981') }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 3.5 VOLUNTEER PORTAL (ONBOARDING VERIFICATION + DISPATCH DASHBOARD) */}
      {currentUser && currentUser.role === 'Volunteer' && (
        <div id="volunteerDashboard" className="dashboard" style={{ display: 'block' }}>

          {/* Header (Exact Same Blue & White Theme) */}
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
                <i className="fas fa-shield-halved" style={{ fontSize: '28px', color: '#ffffff' }}></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: 0, fontSize: '48px', letterSpacing: '1px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: '20px', opacity: 0.9, fontWeight: 'normal' }}>{t.base}</span>
              </div>
            </div>
            <div className="header-right">
              <div className="user-info">
                <span id="volunteerRoleBadge" style={{ fontWeight: 'bold', color: '#ffffff' }}>
                  {volunteerProfile.isVerified
                    ? `✓ ${volunteerProfile.name} (${volunteerProfile.specialty})`
                    : 'Volunteer · Verification Required'}
                </span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">
            {!volunteerProfile.isVerified ? (
              /* Step 1: Specialty & Required Document Verification */
              <div className="section" id="volunteerVerificationCard" style={{ maxWidth: '720px', margin: '32px auto', padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', borderBottom: '2px solid var(--color-border)', paddingBottom: '14px' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '20px' }}>
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div>
                    <h2 style={{ margin: 0, color: 'var(--color-primary)' }}>Volunteer Credential &amp; Specialty Verification</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '13.5px', color: 'var(--color-text-secondary)', fontWeight: '400' }}>
                      Select your area of specialty or profession and upload the required official document to activate dispatch access.
                    </p>
                  </div>
                </div>

                {volunteers.filter(v => v.verified).length > 0 && (
                  <div style={{ marginTop: '14px', padding: '14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-user-check"></i> Already Verified? Continue as Existing Volunteer Profile:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {volunteers.filter(v => v.verified).map(vol => (
                        <button
                          key={vol.id}
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => handleSelectExistingVolunteer(vol)}
                          style={{ width: 'auto', padding: '7px 12px', fontSize: '12.5px', fontWeight: '600', borderColor: '#93c5fd', background: '#eff6ff', color: '#1e40af' }}
                        >
                          <i className="fas fa-check-circle" style={{ color: '#16a34a', marginRight: '6px' }}></i>
                          {vol.name} ({vol.specialty || vol.role})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleVolunteerVerifySubmit} style={{ marginTop: '18px' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="volunteerNameInput">Full Name *</label>
                      <input
                        id="volunteerNameInput"
                        type="text"
                        className="form-control"
                        placeholder="e.g., Dr. Sandeep / Cadet Priya"
                        required
                        value={volunteerProfile.name}
                        onChange={(e) => setVolunteerProfile(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="volunteerPhoneInput">Contact Number *</label>
                      <input
                        id="volunteerPhoneInput"
                        type="tel"
                        className="form-control"
                        placeholder="e.g., 9876543210"
                        required
                        value={volunteerProfile.phone}
                        onChange={(e) => setVolunteerProfile(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label htmlFor="volunteerSpecialtySelect">Area of Specialty / Profession *</label>
                    <select
                      id="volunteerSpecialtySelect"
                      className="form-control"
                      required
                      style={{ height: '50px', fontSize: '15px' }}
                      value={volunteerProfile.specialty}
                      onChange={(e) => setVolunteerProfile(prev => ({ ...prev, specialty: e.target.value, docFileName: '', docFileSize: '' }))}
                    >
                      <option value="">Select your specialty / profession</option>
                      {VOLUNTEER_SPECIALTIES.map(spec => (
                        <option key={spec.value} value={spec.value}>{spec.label}</option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const selectedSpec = VOLUNTEER_SPECIALTIES.find(s => s.value === volunteerProfile.specialty);
                    return (
                      <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '14px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <i className="fas fa-file-shield"></i>
                          <span>
                            {selectedSpec
                              ? `Required Verification Document: ${selectedSpec.docLabel}`
                              : 'Select a specialty above to see the required verification document'}
                          </span>
                        </div>
                        <p style={{ fontSize: '12.5px', color: '#334155', marginBottom: '12px', fontWeight: '400' }}>
                          {selectedSpec
                            ? selectedSpec.docHint
                            : 'For example: Doctors upload their Official Doctor ID / Medical Council card; Nurses upload Nursing Council ID; NCC/NSS Cadets upload Cadet ID.'}
                        </p>

                        <div className="form-group">
                          <label htmlFor="volunteerDocNumber">Official ID / License Number (Optional)</label>
                          <input
                            id="volunteerDocNumber"
                            type="text"
                            className="form-control"
                            placeholder={selectedSpec ? `Enter ${selectedSpec.value} ID number` : 'Enter official ID number'}
                            value={volunteerProfile.docNumber}
                            onChange={(e) => setVolunteerProfile(prev => ({ ...prev, docNumber: e.target.value }))}
                          />
                        </div>

                        <div className="form-group" style={{ marginTop: '10px' }}>
                          <label htmlFor="volunteerDocUpload">
                            Upload Verification Document *
                          </label>
                          <input
                            id="volunteerDocUpload"
                            type="file"
                            className="form-control"
                            accept="image/*,.pdf"
                            required
                            onChange={(e) => {
                              const file = e.target.files && e.target.files[0];
                              if (file) {
                                setVolunteerProfile(prev => ({
                                  ...prev,
                                  docFileName: file.name,
                                  docFileSize: `${(file.size / 1024).toFixed(1)} KB`
                                }));
                              }
                            }}
                          />
                        </div>

                        {volunteerProfile.docFileName && (
                          <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#ffffff', border: '1px solid #93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#1d4ed8' }}>
                            <span><i className="fas fa-check-circle" style={{ marginRight: '6px', color: '#16a34a' }}></i> Uploaded: <strong>{volunteerProfile.docFileName}</strong></span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{volunteerProfile.docFileSize}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <button type="submit" className="btn btn-primary" id="verifyVolunteerBtn" style={{ marginTop: '18px', height: '54px', fontSize: '16px', fontWeight: 'bold' }}>
                    <i className="fas fa-shield-check" style={{ marginRight: '8px' }}></i>
                    Verify Document &amp; Enter Volunteer Dashboard
                  </button>
                </form>
              </div>
            ) : (
              /* Step 2: Verified Volunteer Dispatch Dashboard */
              (() => {
                const matchesCurrentVolunteer = (req, nameKey, idKey) => {
                  if (volunteerProfile.id && req[idKey] && String(req[idKey]) === String(volunteerProfile.id)) {
                    return true;
                  }
                  if (volunteerProfile.name && req[nameKey]) {
                    return req[nameKey].trim().toLowerCase() === volunteerProfile.name.trim().toLowerCase();
                  }
                  return false;
                };

                const pendingDispatchRequests = sortedRequests.active.filter(
                  req => matchesCurrentVolunteer(req, 'assignedVolunteerName', 'assignedVolunteerId') && req.dispatchStatus !== 'completed'
                );
                const completedDispatchRequests = requests.filter(
                  req => req.dispatchStatus === 'completed' && matchesCurrentVolunteer(req, 'completedByVolunteerName', 'completedByVolunteerId')
                );

                return (
                  <div>
                    {/* Volunteer Verified Identity Banner */}
                    <div className="section" style={{ marginBottom: '20px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          <i className="fas fa-user-check"></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-primary)' }}>
                            {volunteerProfile.name} · <span style={{ color: '#2563eb' }}>{volunteerProfile.specialty}</span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                            Verified Document: <strong>{volunteerProfile.docFileName}</strong>
                            {volunteerProfile.docNumber ? ` (ID: ${volunteerProfile.docNumber})` : ''}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '999px' }}>
                        ✓ VERIFIED {volunteerProfile.specialty.toUpperCase()}
                      </span>
                    </div>

                    {/* Volunteer KPI Cards */}
                    <div className="stats-grid" style={{ display: 'grid', marginBottom: '24px' }}>
                      <div className="stat-card">
                        <div className="icon-container"><i className="fas fa-truck-loading"></i></div>
                        <div className="stat-content">
                          <h3>Yet to Dispatch</h3>
                          <div className="value">{pendingDispatchRequests.length}</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="icon-container"><i className="fas fa-clipboard-check"></i></div>
                        <div className="stat-content">
                          <h3>Allocations Completed</h3>
                          <div className="value">{completedDispatchRequests.length}</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="icon-container"><i className="fas fa-user-md"></i></div>
                        <div className="stat-content">
                          <h3>Verified Specialty</h3>
                          <div className="value" style={{ fontSize: '22px' }}>{volunteerProfile.specialty}</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="icon-container"><i className="fas fa-triangle-exclamation"></i></div>
                        <div className="stat-content">
                          <h3>Total Active Incidents</h3>
                          <div className="value">{sortedRequests.active.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Resources Allocated for Dispatch (Pending / Yet to Dispatch) */}
                    <div className="section" id="volunteerDispatchQueueSection" style={{ marginBottom: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="fas fa-boxes-packing"></i> Allocated to You for Dispatch ({volunteerProfile.name})
                        </h2>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '4px 10px', borderRadius: '6px' }}>
                          {pendingDispatchRequests.length} Dispatch Pending / Yet to Dispatch
                        </span>
                      </div>

                      {pendingDispatchRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)', background: 'var(--color-surface)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                          <i className="fas fa-check-double" style={{ fontSize: '24px', color: '#2563eb', marginBottom: '8px', display: 'block' }}></i>
                          No pending dispatches assigned to <strong>{volunteerProfile.name}</strong> right now. When the Govt Official dispatches a resource to you, it will appear here automatically.
                        </div>
                      ) : (
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Request ID</th>
                                <th>Resource Allocated</th>
                                <th>Qty Allocated</th>
                                <th>Destination / Contact</th>
                                <th>Priority</th>
                                <th>Dispatch Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody id="volunteerPendingTable">
                              {pendingDispatchRequests.map(req => (
                                <tr key={req.id || req.requestId}>
                                  <td><strong>{req.requestId}</strong></td>
                                  <td>
                                    <div style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{req.resourceType}</div>
                                    <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>Allocated to you ({volunteerProfile.name}) for Dispatch</div>
                                  </td>
                                  <td><strong>{req.quantityAllocated || req.quantityRequested}</strong> / {req.quantityRequested}</td>
                                  <td style={{ fontSize: '12.5px', maxWidth: '200px' }}>
                                    <div>{req.address || `Lat: ${req.lat.toFixed(4)}, Lng: ${req.lng.toFixed(4)}`}</div>
                                    <div style={{ color: '#2563eb', fontWeight: '600' }}>{req.contactPerson || 'N/A'} · {req.contactPhone || 'N/A'}</div>
                                  </td>
                                  <td>
                                    <span className={`priority-badge priority-${req.mlPriorityClass}`}>
                                      {req.mlPriorityClass.toUpperCase()}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '3px 8px', borderRadius: '4px' }}>
                                        DISPATCH IS PENDING
                                      </span>
                                      <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#1d4ed8', background: '#dbeafe', border: '1px solid #93c5fd', padding: '2px 7px', borderRadius: '4px' }}>
                                        YET TO DISPATCH
                                      </span>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="btn-group">
                                      <button
                                        className="btn btn-secondary btn-small"
                                        onClick={() => handleShowRoute(req)}
                                      >
                                        <i className="fas fa-route"></i> Route
                                      </button>
                                      <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => handleVolunteerCompleteDispatch(req)}
                                        style={{ fontWeight: '700' }}
                                      >
                                        <i className="fas fa-check"></i> Allocation Completed
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Interactive Dispatch Map */}
                    <div className="section" style={{ marginBottom: '24px' }}>
                      <h2 style={{ marginBottom: '12px' }}><i className="fas fa-map-location-dot"></i> Live Dispatch Operations Map</h2>
                      <div style={{ height: '420px', width: '100%', border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
                        <MapComponent
                          lat={currentBaseLocation.lat}
                          lng={currentBaseLocation.lng}
                          name={currentBaseLocation.name}
                          requests={requests}
                          volunteers={volunteers}
                          onMapClick={handleMapClick}
                          selectedLocation={selectedLocation}
                          routeCoordinates={routeCoordinates}
                        />
                      </div>
                    </div>

                    {/* Completed Dispatches Log */}
                    <div className="section" id="volunteerCompletedSection">
                      <h2 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-circle-check" style={{ color: '#16a34a' }}></i> Completed by {volunteerProfile.name} ({volunteerProfile.specialty})
                      </h2>
                      {completedDispatchRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
                          No completed allocations yet. Click &ldquo;Allocation Completed&rdquo; on any pending dispatch above once delivered.
                        </div>
                      ) : (
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Request ID</th>
                                <th>Resource</th>
                                <th>Qty</th>
                                <th>Allocated By Volunteer</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {completedDispatchRequests.map(req => (
                                <tr key={req.id || req.requestId}>
                                  <td><strong>{req.requestId}</strong></td>
                                  <td>{req.resourceType}</td>
                                  <td>{req.quantityAllocated || req.quantityRequested}/{req.quantityRequested}</td>
                                  <td>
                                    <strong>{req.completedByVolunteerName || volunteerProfile.name}</strong>
                                    {req.completedBySpecialty ? ` (${req.completedBySpecialty})` : ''}
                                  </td>
                                  <td>
                                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#15803d', background: '#dcfce7', border: '1px solid #86efac', padding: '4px 8px', borderRadius: '4px' }}>
                                      ✓ ALLOCATION COMPLETED
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* 3.6 SYSTEM MAINTENANCE ADMIN WORKSPACE (Strictly Scoped to 4 Capabilities) */}
      {currentUser && currentUser.role === 'Maintenance' && (
        <div id="maintenanceDashboard" className="dashboard" style={{ display: 'block' }}>
          {/* Header Panel (Exact Same Tactical Blue/Dark Theme) */}
          <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(16, 185, 129, 0.5)', flexShrink: 0 }}>
                <i className="fas fa-screwdriver-wrench" style={{ fontSize: '26px', color: '#10b981' }}></i>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h1 style={{ margin: 0, fontSize: '42px', letterSpacing: '1px', lineHeight: '1.2' }}>{t.title}</h1>
                <span style={{ fontSize: '17px', opacity: 0.9, fontWeight: 'normal' }}>System Maintenance &amp; Operations Center · Tumkur HQ</span>
              </div>
            </div>
            <div className="header-right">
              <div className="user-info">
                <span style={{ fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fas fa-circle-check"></i> System Maintenance Admin (4)
                </span>
              </div>
              <button className="btn btn-logout btn-small" onClick={handleLogout}>{t.logout}</button>
            </div>
          </div>

          <div className="container">
            {/* Top Tactical Navigation Tabs for the 4 Scoped Capabilities */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '2px solid var(--color-border)', paddingBottom: '14px' }}>
              <button
                className={`btn ${maintenanceTab === 'health' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMaintenanceTab('health')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
              >
                <i className="fas fa-heart-pulse"></i> A. System Health &amp; Telemetry
              </button>
              <button
                className={`btn ${maintenanceTab === 'onboarding' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMaintenanceTab('onboarding')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
              >
                <i className="fas fa-user-plus"></i> B. Volunteer Onboarding (Add-Only)
              </button>
              <button
                className={`btn ${maintenanceTab === 'offline-maps' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMaintenanceTab('offline-maps')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
              >
                <i className="fas fa-map-location"></i> C. Offline Maps Management
              </button>
              <button
                className={`btn ${maintenanceTab === 'anti-spam' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMaintenanceTab('anti-spam')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 'bold' }}
              >
                <i className="fas fa-shield-virus"></i> D. Anti-Spam &amp; Guardrails
              </button>
            </div>

            {/* TAB A: OVERALL SYSTEM MAINTENANCE & HEALTH MONITOR */}
            {maintenanceTab === 'health' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header Actions Card */}
                <div className="section" style={{ margin: 0, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-tower-broadcast" style={{ color: '#10b981' }}></i>
                        Overall System Health &amp; Maintenance Monitor
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Live telemetry polling across microservices, databases, and gateway nodes. Last check: <strong>{systemHealth.lastChecked || 'Active'}</strong>
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={handleForceRefreshCaches}
                        disabled={isHealthRefreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                      >
                        <i className={`fas fa-rotate ${isHealthRefreshing ? 'fa-spin' : ''}`}></i>
                        Force-Refresh Endpoints
                      </button>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={handleClearStaleRecords}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#f59e0b', borderColor: '#f59e0b' }}
                      >
                        <i className="fas fa-broom"></i>
                        Clear Resolved Records
                      </button>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={handleExportSystemSnapshot}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', background: '#059669', borderColor: '#047857' }}
                      >
                        <i className="fas fa-download"></i>
                        Export System State JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status Cards Grid */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  {/* Card 1: ESP32 Telemetry */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#d1fae5', color: '#047857' }}>
                      <i className="fas fa-microchip"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>ESP32 Hardware Nodes</h3>
                        <span className="status-badge status-allocated">{systemHealth.telemetry.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>{systemHealth.telemetry.nodeCount} Active Node(s)</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Latency: <strong>{systemHealth.telemetry.latency} ms</strong> · Temp: {sensorData.temperature != null ? `${sensorData.temperature}°C` : '--'} · H2O: {sensorData.water_level != null ? `${sensorData.water_level}cm` : '--'}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: SMS Gateway */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      <i className="fas fa-tower-cell"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>SurakshaSetu SMS Gateway</h3>
                        <span className="status-badge status-allocated">{systemHealth.sms.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>{smsData.length} Incoming Alerts</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Latency: <strong>{systemHealth.sms.latency} ms</strong> · Gateway: {process.env.NEXT_PUBLIC_HQ_GATEWAY_PHONE || '+91-HQ-GATEWAY'}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Disaster Requests Engine */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                      <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Incident Requests Store</h3>
                        <span className="status-badge status-allocated">{systemHealth.requests.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>{requests.length} Total Incidents</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Latency: <strong>{systemHealth.requests.latency} ms</strong> · Active: {requests.filter(r => r.status !== 'resolved').length}
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Field Volunteers Directory */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#fef3c7', color: '#b45309' }}>
                      <i className="fas fa-users-gear"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Volunteers Registry</h3>
                        <span className="status-badge status-allocated">{systemHealth.volunteers.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>{volunteers.length} Field Responders</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Latency: <strong>{systemHealth.volunteers.latency} ms</strong> · Verified: {volunteers.filter(v => v.verified).length} · Pending: {volunteers.filter(v => !v.verified).length}
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Offline Maps Packages */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      <i className="fas fa-map"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Offline GIS Packages</h3>
                        <span className="status-badge status-allocated">{systemHealth.offlineMaps.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>{offlineMapPackages.length} Regions Cached</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Latency: <strong>{systemHealth.offlineMaps.latency} ms</strong> · Tile Storage: ~397 MB
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Anti-Spam Guardrails */}
                  <div className="stat-card">
                    <div className="icon-container" style={{ background: '#f1f5f9', color: '#334155' }}>
                      <i className="fas fa-shield-halved"></i>
                    </div>
                    <div className="stat-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>Anti-Spam &amp; Guardrails</h3>
                        <span className="status-badge status-allocated">{systemHealth.antiSpam.status}</span>
                      </div>
                      <div className="value" style={{ fontSize: '22px' }}>
                        {antiSpamConfig.blockedNumbers?.length || 0} Blocked / {antiSpamConfig.spamKeywords?.length || 0} Filters
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        Rate Limiting: <strong>{antiSpamConfig.rateLimitEnabled ? 'ON' : 'OFF'}</strong> ({antiSpamConfig.rateLimitWindowSeconds}s Cooldown)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endpoint Diagnostics Table */}
                <div className="section" style={{ margin: 0 }}>
                  <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-server"></i> API Gateway Health Matrix
                  </h3>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>API Route / Microservice</th>
                          <th>Storage Backend</th>
                          <th>Status</th>
                          <th>Measured Latency</th>
                          <th>Records / Items</th>
                          <th>Health Diagnostics</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>/api/telemetry</strong></td>
                          <td><code>src/data/telemetry.json</code></td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.telemetry.latency} ms</td>
                          <td>{systemHealth.telemetry.count} snapshot(s)</td>
                          <td>ESP32 node heartbeat active</td>
                        </tr>
                        <tr>
                          <td><strong>/api/surakshasetu-sms</strong></td>
                          <td>Google Apps Script /exec Webhook</td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.sms.latency} ms</td>
                          <td>{smsData.length} SMS alert(s)</td>
                          <td>Upstream webhook sync active (5s poll)</td>
                        </tr>
                        <tr>
                          <td><strong>/api/requests</strong></td>
                          <td><code>src/data/requests.json</code></td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.requests.latency} ms</td>
                          <td>{requests.length} record(s)</td>
                          <td>Active queue read/write operational</td>
                        </tr>
                        <tr>
                          <td><strong>/api/volunteers</strong></td>
                          <td><code>src/data/volunteers.json</code></td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.volunteers.latency} ms</td>
                          <td>{volunteers.length} volunteer(s)</td>
                          <td>Role 1 verification pipeline intact</td>
                        </tr>
                        <tr>
                          <td><strong>/api/offline-maps</strong></td>
                          <td><code>src/data/offline-maps.json</code></td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.offlineMaps.latency} ms</td>
                          <td>{offlineMapPackages.length} package(s)</td>
                          <td>Bounding boxes &amp; offline tiles ready</td>
                        </tr>
                        <tr>
                          <td><strong>/api/anti-spam</strong></td>
                          <td><code>src/data/anti-spam.json</code></td>
                          <td><span className="status-badge status-allocated">HEALTHY</span></td>
                          <td>{systemHealth.antiSpam.latency} ms</td>
                          <td>{systemHealth.antiSpam.count} active rule(s)</td>
                          <td>Duplicate suppression &amp; phone filter active</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: VOLUNTEER ONBOARDING (ADD-ONLY — NO APPROVAL AUTHORITY) */}
            {maintenanceTab === 'onboarding' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Strict Rule Notice Alert */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '16px 20px', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <i className="fas fa-triangle-exclamation" style={{ fontSize: '22px', marginTop: '2px', color: '#d97706' }}></i>
                  <div>
                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Strict System Guardrail: Add-Only Onboarding Mode</strong>
                    <span style={{ fontSize: '13px', lineHeight: '1.4' }}>
                      System Maintenance Admins register and ingest new field volunteers into the centralized database with <code>verified: false</code> and <code>status: &quot;pending&quot;</code>.
                      <strong> Approval and tactical dispatch authority remains exclusively with Role 1 (Govt Official / Incident Commander).</strong>
                      No approval or verification controls exist in this workstation.
                    </span>
                  </div>
                </div>

                {/* Onboarding Form */}
                <div className="section" style={{ margin: 0, padding: '24px' }}>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-user-plus" style={{ color: '#2563eb' }}></i> Register New Field Volunteer
                  </h2>
                  <form onSubmit={handleMaintenanceVolunteerOnboard}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="maintVolNameInput">Full Name *</label>
                        <input
                          type="text"
                          id="maintVolNameInput"
                          className="form-control"
                          placeholder="e.g., Ramesh Gowda"
                          required
                          value={maintVolName}
                          onChange={(e) => setMaintVolName(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintVolPhoneInput">Phone / Contact Number *</label>
                        <input
                          type="tel"
                          id="maintVolPhoneInput"
                          className="form-control"
                          placeholder="e.g., +91 98765 43210"
                          required
                          value={maintVolPhone}
                          onChange={(e) => setMaintVolPhone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintVolSpecialtySelect">Skill / Emergency Role *</label>
                        <select
                          id="maintVolSpecialtySelect"
                          className="form-control"
                          value={maintVolSpecialty}
                          onChange={(e) => setMaintVolSpecialty(e.target.value)}
                        >
                          {VOLUNTEER_SPECIALTIES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="maintVolSectorInput">Deployment Sector / Location</label>
                        <input
                          type="text"
                          id="maintVolSectorInput"
                          className="form-control"
                          placeholder="e.g., Tumkur Central / Sira / Koratagere"
                          value={maintVolSector}
                          onChange={(e) => setMaintVolSector(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label htmlFor="maintVolDocInput">Credential Type &amp; Registration ID (NCC / NSS / Medical Council / Transport License)</label>
                        <input
                          type="text"
                          id="maintVolDocInput"
                          className="form-control"
                          placeholder="e.g., NCC-KAR-2023-8821 or KMC-DOC-49210 or Transport DL-06-2021"
                          value={maintVolDocNumber}
                          onChange={(e) => setMaintVolDocNumber(e.target.value)}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isOnboardingSaving}
                        style={{ padding: '10px 24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <i className={`fas fa-user-check ${isOnboardingSaving ? 'fa-spin' : ''}`}></i>
                        Onboard Field Volunteer (Pending Verification)
                      </button>
                    </div>
                  </form>
                </div>

                {/* Read-Only Volunteer Registry Table */}
                <div className="section" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-list-check"></i> Registered Field Responders Directory (Read-Only)
                    </h2>
                    <span className="status-badge status-allocated">{volunteers.length} Responders Enrolled</span>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Volunteer Name</th>
                          <th>Specialty / Role</th>
                          <th>Contact Phone</th>
                          <th>Credential / Registration ID</th>
                          <th>Sector / Zone</th>
                          <th>Verification Status (Role 1 Authority)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {volunteers.map(vol => (
                          <tr key={vol.id}>
                            <td><strong>#{String(vol.id).slice(-4)}</strong></td>
                            <td>
                              <strong>{vol.name}</strong>
                            </td>
                            <td>{vol.specialty || vol.role}</td>
                            <td>{vol.phone}</td>
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: '11px', background: 'var(--color-surface)', padding: '2px 6px', borderRadius: '4px' }}>
                                {vol.docNumber || 'NOT-SPECIFIED'}
                              </span>
                            </td>
                            <td>{vol.sector || 'Tumkur Sector'}</td>
                            <td>
                              {vol.verified ? (
                                <span className="status-badge status-allocated" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fas fa-check-circle"></i> Verified by Govt
                                </span>
                              ) : (
                                <span className="status-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <i className="fas fa-clock"></i> Pending Govt Approval
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB C: OFFLINE MAPS MANAGEMENT & CACHE UPDATER */}
            {maintenanceTab === 'offline-maps' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div className="section" style={{ margin: 0, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-map-location" style={{ color: '#2563eb' }}></i>
                        Tactical Offline Maps &amp; Tile Cache Registry
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Manage bounding box tile packages cached locally for zero-connectivity field operations across Karnataka.
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        onClick={() => {
                          const target = viewingMapPackage || offlineMapPackages[0];
                          if (target) {
                            setViewingMapPackage(target);
                          }
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                      >
                        <i className="fas fa-map-location-dot"></i>
                        {viewingMapPackage ? 'Viewing Map' : 'View Map'}
                      </button>
                      <span className="status-badge status-allocated">
                        <i className="fas fa-database"></i> {offlineMapPackages.length} Region Packages Synced
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Offline Map Viewport (Displayed when View Map is clicked) */}
                {viewingMapPackage && (
                  <div className="section" id="offlineMapViewportSection" style={{ margin: 0, padding: '20px', border: '2px solid #2563eb', borderRadius: '12px', background: '#ffffff', boxShadow: '0 4px 16px rgba(37,99,235,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '19px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-map-location-dot" style={{ color: '#2563eb' }}></i>
                            {viewingMapPackage.name}
                          </h3>
                          <span className="status-badge status-allocated">
                            <i className="fas fa-satellite"></i> TACTICAL GIS VIEW ACTIVE
                          </span>
                          <span className="status-badge status-pending">
                            v{viewingMapPackage.version}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Region: <strong>{viewingMapPackage.region}</strong> · Center Coordinates: <strong>[{viewingMapPackage.center?.join(', ')}]</strong> · Zoom Range: <strong>{viewingMapPackage.minZoom} - {viewingMapPackage.maxZoom}</strong>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-small"
                          onClick={() => setViewingMapPackage(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
                        >
                          <i className="fas fa-times"></i> Close Map
                        </button>
                      </div>
                    </div>

                    {/* Map Component View */}
                    <div style={{ height: '480px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'hidden' }}>
                      <MapComponent
                        lat={viewingMapPackage.center[0]}
                        lng={viewingMapPackage.center[1]}
                        name={viewingMapPackage.name}
                        requests={requests}
                        volunteers={volunteers}
                        onMapClick={handleMapClick}
                        selectedLocation={selectedLocation}
                        routeCoordinates={routeCoordinates}
                        smsAlerts={smsData}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12.5px', color: 'var(--color-text-secondary)', flexWrap: 'wrap', gap: '10px', background: 'var(--color-surface)', padding: '10px 14px', borderRadius: '8px' }}>
                      <div>
                        <i className="fas fa-database" style={{ color: '#2563eb' }}></i> Cache: <strong>{viewingMapPackage.tilesCount?.toLocaleString()} Tiles ({viewingMapPackage.sizeMb} MB)</strong> · Status: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>{viewingMapPackage.status?.toUpperCase() || 'SYNCED'}</span>
                      </div>
                      <div>
                        <strong>Sector Bounds:</strong> North: {viewingMapPackage.bounds?.north}, South: {viewingMapPackage.bounds?.south}, East: {viewingMapPackage.bounds?.east}, West: {viewingMapPackage.bounds?.west}
                      </div>
                    </div>
                  </div>
                )}

                {/* Map Packages Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                  {offlineMapPackages.map(pkg => (
                    <div
                      key={pkg.id}
                      className="section"
                      style={{
                        margin: 0,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: viewingMapPackage?.id === pkg.id ? '2px solid #2563eb' : '1px solid var(--color-border)',
                        boxShadow: viewingMapPackage?.id === pkg.id ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0, fontSize: '17px', color: '#1e293b' }}>{pkg.name}</h3>
                          <span className="status-badge status-allocated">v{pkg.version}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                          <i className="fas fa-location-dot"></i> {pkg.region}
                        </div>

                        <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px', lineHeight: '1.6' }}>
                          <div><strong>Bounding Coordinates:</strong> N:{pkg.bounds?.north}, S:{pkg.bounds?.south}, E:{pkg.bounds?.east}, W:{pkg.bounds?.west}</div>
                          <div><strong>Center:</strong> [{pkg.center?.join(', ')}]</div>
                          <div><strong>Zoom Range:</strong> Zoom Level {pkg.minZoom} - {pkg.maxZoom}</div>
                          <div><strong>Estimated Tiles:</strong> {pkg.tilesCount?.toLocaleString()} tiles ({pkg.sizeMb} MB)</div>
                          <div><strong>Last Synchronized:</strong> {pkg.lastUpdated ? new Date(pkg.lastUpdated).toLocaleString() : 'Recently'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setViewingMapPackage(pkg);
                            const el = document.getElementById('offlineMapViewportSection');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontWeight: 'bold',
                            borderColor: viewingMapPackage?.id === pkg.id ? '#10b981' : '#2563eb',
                            color: viewingMapPackage?.id === pkg.id ? '#047857' : '#1d4ed8',
                            background: viewingMapPackage?.id === pkg.id ? '#ecfdf5' : 'transparent',
                            padding: '10px 8px'
                          }}
                        >
                          <i className="fas fa-map-location-dot"></i>
                          {viewingMapPackage?.id === pkg.id ? 'Viewing Map' : 'View Map'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleSyncOfflineMap(pkg.id)}
                          disabled={syncingMapId === pkg.id}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 'bold', padding: '10px 8px' }}
                        >
                          <i className={`fas fa-arrows-rotate ${syncingMapId === pkg.id ? 'fa-spin' : ''}`}></i>
                          {syncingMapId === pkg.id ? 'Syncing...' : 'Sync Package'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB D: ANTI-SPAM & INCOMING ALERT GUARDRAILS */}
            {maintenanceTab === 'anti-spam' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Active Guardrails Overview Card */}
                <div className="section" style={{ margin: 0, padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fas fa-shield-virus" style={{ color: '#dc2626' }}></i>
                        Anti-Spam &amp; Ingestion Guardrails Configuration
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        Filter bogus senders, commercial spam keywords, and repetitive SMS floods from polluting emergency queues.
                      </p>
                    </div>
                    <span className="status-badge status-allocated">
                      <i className="fas fa-shield-check"></i> Filter Active on /api/surakshasetu-sms &amp; /api/requests
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {/* Blocked Sender Numbers Panel */}
                  <div className="section" style={{ margin: 0, padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-phone-slash" style={{ color: '#dc2626' }}></i>
                      Blocked Sender Phone Numbers ({antiSpamConfig.blockedNumbers?.length || 0})
                    </h3>
                    <form onSubmit={handleAddBlockedNumber} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. +919999999999"
                        value={newBlockedNumberInput}
                        onChange={(e) => setNewBlockedNumberInput(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary btn-small" style={{ whiteSpace: 'nowrap' }}>
                        Block Number
                      </button>
                    </form>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {antiSpamConfig.blockedNumbers && antiSpamConfig.blockedNumbers.length > 0 ? (
                        antiSpamConfig.blockedNumbers.map(num => (
                          <div
                            key={num}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              background: 'var(--color-surface)',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              fontSize: '13px'
                            }}
                          >
                            <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{num}</span>
                            <button
                              type="button"
                              className="btn btn-secondary btn-small"
                              onClick={() => handleRemoveBlockedNumber(num)}
                              style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '2px 8px', fontSize: '11px' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '10px' }}>
                          No blocked numbers registered.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spam Keywords Filter Panel */}
                  <div className="section" style={{ margin: 0, padding: '20px' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-filter" style={{ color: '#f59e0b' }}></i>
                      Spam Keywords &amp; Text Patterns ({antiSpamConfig.spamKeywords?.length || 0})
                    </h3>
                    <form onSubmit={handleAddSpamKeyword} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. lottery, prize, casino"
                        value={newSpamKeywordInput}
                        onChange={(e) => setNewSpamKeywordInput(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary btn-small" style={{ whiteSpace: 'nowrap' }}>
                        Add Keyword
                      </button>
                    </form>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {antiSpamConfig.spamKeywords && antiSpamConfig.spamKeywords.length > 0 ? (
                        antiSpamConfig.spamKeywords.map(kw => (
                          <span
                            key={kw}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            {kw}
                            <button
                              type="button"
                              onClick={() => handleRemoveSpamKeyword(kw)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold' }}
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '10px' }}>
                          No keyword filters set.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rate-Limiting & Duplicate Suppression Settings */}
                  <div className="section" style={{ margin: 0, padding: '20px', gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <i className="fas fa-gauge-high" style={{ color: '#047857' }}></i>
                      Rate-Limiting &amp; Duplicate SMS Suppression Controls
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--color-surface)', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="rateLimitToggle"
                          checked={antiSpamConfig.rateLimitEnabled}
                          onChange={handleToggleRateLimit}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="rateLimitToggle" style={{ cursor: 'pointer', fontWeight: '600', fontSize: '14px', margin: 0 }}>
                          Enable Rate-Limiting &amp; Duplicate SMS Flood Suppression
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label htmlFor="cooldownInput" style={{ fontSize: '13px', margin: 0 }}>
                          Duplicate Cooldown Window:
                        </label>
                        <input
                          type="number"
                          id="cooldownInput"
                          className="form-control"
                          min="5"
                          max="300"
                          style={{ width: '90px' }}
                          value={antiSpamConfig.rateLimitWindowSeconds}
                          onChange={(e) => handleRateLimitWindowChange(e.target.value)}
                        />
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODALS & DIALOGS */}
      {/* Allocate Supplies Modal */}
      {showAllocateModal && allocateRequest && (
        <div id="allocateModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{t.allocate_resources}</h2>
              <button className="btn-close" onClick={() => { setShowAllocateModal(false); setAllocateRequest(null); }}>&times;</button>
            </div>
            <div style={{ background: 'var(--color-surface)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Request Details
              </h3>
              <div className="info-item"><span className="info-label">Request ID:</span><span className="info-value">{allocateRequest.requestId}</span></div>
              <div className="info-item"><span className="info-label">Resource Type:</span><span className="info-value">{allocateRequest.resourceType}</span></div>
              <div className="info-item"><span className="info-label">Quantity Requested:</span><span className="info-value">{allocateRequest.quantityRequested}</span></div>
              <div className="info-item"><span className="info-label">Contact Person:</span><span className="info-value">{allocateRequest.contactPerson}</span></div>
              <div className="info-item"><span className="info-label">Contact Phone:</span><span className="info-value" style={{ color: '#2563eb' }}>{allocateRequest.contactPhone}</span></div>
              <div className="info-item"><span className="info-label">Location:</span><span className="info-value">{`Lat: ${allocateRequest.lat.toFixed(5)}, Lng: ${allocateRequest.lng.toFixed(5)}`}</span></div>
              <div className="info-item"><span className="info-label">Individuals Affected:</span><span className="info-value">{allocateRequest.individualsAffected}</span></div>
              <div className="info-item"><span className="info-label">Severity:</span><span className="info-value">{allocateRequest.severity}</span></div>
              <div className="info-item"><span className="info-label">Priority:</span><span className="info-value">{allocateRequest.mlPriorityClass.toUpperCase()}</span></div>
              <div className="info-item" style={{ borderBottom: 'none' }}><span className="info-label">Description:</span></div>
              <p className="description-text" style={{ marginTop: '8px' }}>{allocateRequest.description || 'N/A'}</p>
            </div>
            <form onSubmit={handleAllocateSubmit}>
              <div className="form-group">
                <label>{t.qty_to_allocate}</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="1"
                  max={allocateRequest.quantityPending}
                  value={allocateQtyVal}
                  onChange={(e) => setAllocateQtyVal(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label htmlFor="allocateVolunteerSelect">Dispatch / Assign to Volunteer</label>
                <select
                  id="allocateVolunteerSelect"
                  className="form-control"
                  value={allocateVolunteerId}
                  onChange={(e) => setAllocateVolunteerId(e.target.value)}
                >
                  <option value="">-- Select Verified Volunteer to Dispatch (Optional) --</option>
                  {volunteers.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.specialty || v.role}) {v.verified ? '✓ Verified' : ''} — {v.status.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Allocate</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAllocateModal(false); setAllocateRequest(null); setAllocateVolunteerId(''); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OSRM Route Info Modal */}
      {showRouteModal && routeData && (
        <div id="routeModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Route Information</h2>
              <button className="btn-close" onClick={() => setShowRouteModal(false)}>&times;</button>
            </div>
            <div className="route-info-grid">
              <div className="info-section">
                <h3>Route Details</h3>
                <div className="info-item"><span className="info-label">Distance:</span><span className="info-value">{routeData.distance} km</span></div>
                <div className="info-item"><span className="info-label">Estimated Time:</span><span className="info-value">{routeData.duration} minutes</span></div>
              </div>
              <div className="info-section">
                <h3>Emergency Details</h3>
                <div className="info-item"><span className="info-label">Location:</span><span className="info-value">{routeData.location}</span></div>
                <div className="info-item"><span className="info-label">Contact Person:</span><span className="info-value">{routeData.contactPerson}</span></div>
                <div className="info-item"><span className="info-label">Contact Phone:</span><span className="info-value" style={{ color: '#2563eb' }}>{routeData.contactPhone}</span></div>
                <div className="info-item"><span className="info-label">Individuals Affected:</span><span className="info-value">{routeData.individualsAffected}</span></div>
                <div className="info-item"><span className="info-label">Severity Level:</span><span className="info-value">{routeData.severity}</span></div>
              </div>
              <div className="info-section full-width">
                <h3>Description</h3>
                <p className="description-text">{routeData.description || 'N/A'}</p>
              </div>
            </div>
            <div className="btn-group" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, height: '50px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={() => {
                  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentBaseLocation.lat},${currentBaseLocation.lng}&destination=${routeData.lat},${routeData.lng}`;
                  window.open(googleMapsUrl, '_blank');
                }}
              >
                <i className="fas fa-external-link-alt"></i> Open Google Maps
              </button>
              <button className="btn btn-secondary" style={{ flex: 1, height: '50px', fontSize: '16px', fontWeight: 'bold' }} onClick={() => setShowRouteModal(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showResourceModal && (
        <div id="resourceModal" className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>{resourceModalData.id ? t.edit_resource : t.add_resource}</h2>
              <button className="btn-close" onClick={() => setShowResourceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleResourceSave}>
              <div className="form-group">
                <label htmlFor="resourceName">Resource Name</label>
                <input
                  type="text"
                  id="resourceName"
                  className="form-control"
                  required
                  value={resourceModalData.name}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resourceTypeSelect">Resource Type</label>
                <select
                  id="resourceTypeSelect"
                  className="form-control"
                  required
                  value={resourceModalData.type}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, type: e.target.value })}
                >
                  <option value="" disabled>Select Resource</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Food & Water">Food &amp; Water</option>
                  <option value="Shelter">Shelter</option>
                  <option value="Rescue Team">Rescue Team</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Bedding">Bedding</option>
                  <option value="Rescue Boats">Rescue Boats</option>
                  <option value="Heavy Machinery">Heavy Machinery</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="resourceTotal">Total Quantity</label>
                <input
                  type="number"
                  id="resourceTotal"
                  className="form-control"
                  required
                  min="1"
                  value={resourceModalData.totalQuantity}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, totalQuantity: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="resourceAvailable">Available Quantity</label>
                <input
                  type="number"
                  id="resourceAvailable"
                  className="form-control"
                  required
                  min="0"
                  value={resourceModalData.availableQuantity}
                  onChange={(e) => setResourceModalData({ ...resourceModalData, availableQuantity: e.target.value })}
                />
              </div>
              <div className="btn-group">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResourceModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Volunteer Modal */}
      {dispatchingVolId !== null && (() => {
        const vol = volunteers.find(v => v.id === dispatchingVolId);
        const activeRequests = requests.filter(r => r.status !== 'resolved');
        return (
          <div id="dispatchModal" className="modal" style={{ display: 'flex' }}>
            <div className="modal-content" style={{ maxWidth: '850px', width: '90%' }}>
              <div className="modal-header">
                <h2>{t.dispatch_title || "Dispatch Volunteer"}: {vol ? vol.name : ""}</h2>
                <button className="btn-close" onClick={() => setDispatchingVolId(null)}>&times;</button>
              </div>
              <div style={{ marginBottom: '15px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {t.dispatch_desc || "Select a request from the active list below to dispatch the volunteer to that specific location."}
              </div>

              {activeRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
                  {t.no_pending_requests || "No active requests available to dispatch volunteers to."}
                </div>
              ) : (
                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>{t.id || "ID"}</th>
                        <th>{t.what || "What"}</th>
                        <th>{t.where || "Where"}</th>
                        <th>{t.priority || "Priority"}</th>
                        <th>{t.actions || "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRequests.map(req => (
                        <tr key={req.id}>
                          <td><strong>{req.requestId}</strong></td>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{req.resourceType}</div>
                            <div style={{ fontSize: '11px', color: '#666', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.description}>
                              {req.description}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>{req.address || "Mandya Region"}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>Lat: {req.lat.toFixed(4)}, Lng: {req.lng.toFixed(4)}</div>
                          </td>
                          <td>
                            <span className={`status-badge status-${req.mlPriorityClass || 'low'}`}>
                              {(req.mlPriorityClass || 'low').toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleDispatchVolunteer(dispatchingVolId, req.id)}
                            >
                              {t.dispatch || "Dispatch"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setDispatchingVolId(null)}>
                  {t.cancel || "Cancel"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {toast.visible && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: toast.type === 'success' ? '#22c55e' : (toast.type === 'error' ? '#ef4444' : (toast.type === 'warning' ? '#f59e0b' : '#3b82f6')),
          color: '#fff',
          padding: '16px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <i className={toast.type === 'success' ? 'fas fa-check-circle' : (toast.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-exclamation-triangle')}></i>
          <span>{toast.message}</span>
          <button onClick={() => setToast(prev => ({ ...prev, visible: false }))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '10px', fontSize: '18px', fontWeight: 'bold', lineHeight: '1' }}>×</button>
        </div>
      )}



    </div>
  );
}
