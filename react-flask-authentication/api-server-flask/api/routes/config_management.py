from flask import Blueprint, request, jsonify, send_from_directory
from flask_restx import Api, Resource, fields
from werkzeug.utils import secure_filename

import os
import json
import re
import pyodbc
from api.models import db, Users, EmailSettings

# Create Blueprint
config_management_bp = Blueprint('config_management', __name__)
config_management_api = Api(config_management_bp, version='1.0', title='Configuration Management API',
                            description='API for managing production center configuration')

# Path to the React config file
REACT_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    '..',
    '..',
    '..',
    'react-ui',
    'src',
    'utils',
    'productionCenterConfig.js'
)

# Path to the branding config file
BRANDING_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    '..',
    '..',
    '..',
    'react-ui',
    'src',
    'utils',
    'appBrandingConfig.js'
)

# Folder for uploaded branding assets (logo, favicon)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
BRANDING_UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'branding')
ALLOWED_BRANDING_IMAGE_EXTENSIONS = ('.svg', '.png', '.jpg', '.jpeg', '.ico', '.webp')

# Path to server settings file
SERVER_SETTINGS_PATH = os.path.join(BASE_DIR, 'static', 'serverSettings.json')

# Path to installation settings file
INSTALLATION_SETTINGS_PATH = os.path.join(BASE_DIR, 'static', 'installationSettings.json')

# Path to installation config file for React
INSTALLATION_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    '..',
    '..',
    '..',
    'react-ui',
    'src',
    'utils',
    'installationConfig.js'
)

# Path to application modules settings file
APPLICATION_MODULES_SETTINGS_PATH = os.path.join(BASE_DIR, 'static', 'applicationModules.json')

# Path to application modules config file for React
APPLICATION_MODULES_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__),
    '..',
    '..',
    '..',
    'react-ui',
    'src',
    'utils',
    'applicationModulesConfig.js'
)




def parse_js_object(content, object_name):
    """Parse a JavaScript object from the config file"""
    # Find the object definition
    pattern = rf'export const {object_name} = {{([^}}]+)}};'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        return {}

    obj_content = match.group(1)
    result = {}

    # Parse key-value pairs
    for line in obj_content.split('\n'):
        line = line.strip()
        if ':' in line:
            # Remove comments
            line = re.sub(r'//.*$', '', line).strip()
            if not line:
                continue

            # Parse key: value
            parts = line.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip()
                value = parts[1].strip().rstrip(',').strip("'\"")
                result[key] = value

    return result

def parse_js_array_object(content, object_name):
    """Parse a JavaScript object containing arrays from the config file"""
    # Find the object definition
    pattern = rf'export const {object_name} = {{(.*?)^}};'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)

    if not match:
        return {}

    obj_content = match.group(1)
    result = {}

    # Parse each array entry
    current_key = None
    current_array = []

    for line in obj_content.split('\n'):
        line = line.strip()

        # Skip comments and empty lines
        if line.startswith('//') or not line:
            continue

        # Check if this is a key line
        if line.startswith('[') and ']:' in line:
            # Save previous array if exists
            if current_key:
                result[current_key] = current_array

            # Extract key
            key_match = re.search(r'\[(.*?)\]:', line)
            if key_match:
                current_key = key_match.group(1).strip()
                current_array = []

        # Check if this is an array value
        elif current_key and ('CUTTING_ROOMS.' in line or 'DESTINATIONS.' in line):
            # Extract value
            value_match = re.search(r'(CUTTING_ROOMS|DESTINATIONS)\.(\w+)', line)
            if value_match:
                current_array.append(value_match.group(2))

    # Save last array
    if current_key:
        result[current_key] = current_array

    return result

def parse_combination_keys(content):
    """Parse combination keys from the config file"""
    pattern = r'export const COMBINATION_KEYS = {(.*?)^};'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)

    if not match:
        return {}

    obj_content = match.group(1)
    result = {}

    for line in obj_content.split('\n'):
        line = line.strip()

        # Skip comments and empty lines
        if line.startswith('//') or not line:
            continue

        # Parse template literal keys
        if '`${' in line and '}`]:' in line:
            # Extract the combination and key
            match = re.search(r'\$\{CUTTING_ROOMS\.(\w+)\}\+\$\{DESTINATIONS\.(\w+)\}`\]:\s*[\'"](\w+)[\'"]', line)
            if match:
                cutting_room = match.group(1)
                destination = match.group(2)
                key = match.group(3)
                result[f"{cutting_room}+{destination}"] = key

    return result

def parse_cutting_room_colors(content):
    """Parse cutting room colors from the config file"""
    pattern = r'export const CUTTING_ROOM_COLORS = {(.*?)^};'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)

    if not match:
        return {}

    obj_content = match.group(1)
    result = {}

    for line in obj_content.split('\n'):
        line = line.strip()

        # Skip comments and empty lines
        if line.startswith('//') or not line:
            continue

        # Parse color entries
        if '[CUTTING_ROOMS.' in line:
            match = re.search(r'\[CUTTING_ROOMS\.(\w+)\]:\s*[\'"]([#\w]+)[\'"]', line)
            if match:
                cutting_room = match.group(1)
                color = match.group(2)
                result[cutting_room] = color

    return result

def parse_machine_specifications(content):
    """Parse machine specifications from the config file"""
    pattern = r'export const CUTTING_ROOM_MACHINES = {(.*?)^};'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)

    if not match:
        return {}

    obj_content = match.group(1)
    result = {}
    current_key = None
    current_machines = []

    for line in obj_content.split('\n'):
        line = line.strip()

        # Skip comments and empty lines
        if line.startswith('//') or not line:
            continue

        # Check if this is a key line
        if '[CUTTING_ROOMS.' in line and ']:' in line:
            # Save previous machines if exists
            if current_key:
                result[current_key] = current_machines

            # Extract key
            key_match = re.search(r'\[CUTTING_ROOMS\.(\w+)\]:', line)
            if key_match:
                current_key = key_match.group(1)
                current_machines = []

        # Check if this is a machine spec line
        elif current_key and 'percentage:' in line and 'length:' in line and 'width:' in line:
            # Extract machine specs
            spec_match = re.search(r'percentage:\s*(\d+),\s*length:\s*([\d.]+),\s*width:\s*(\d+)', line)
            if spec_match:
                machine = {
                    'percentage': int(spec_match.group(1)),
                    'length': float(spec_match.group(2)),
                    'width': int(spec_match.group(3))
                }
                current_machines.append(machine)

    # Save last machines
    if current_key:
        result[current_key] = current_machines

    return result


def _escape_js_single_quotes(value):
    if not isinstance(value, str):
        value = str(value)
    # Escape backslashes first, then single quotes
    return value.replace('\\', '\\\\').replace("'", "\\'")


def _ensure_branding_folder():
    """Ensure the upload folder for branding assets exists and return its path."""
    os.makedirs(BRANDING_UPLOAD_FOLDER, exist_ok=True)
    return BRANDING_UPLOAD_FOLDER


def _allowed_branding_extension(filename):
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_BRANDING_IMAGE_EXTENSIONS


def read_server_settings():
    """Read server settings from JSON file."""
    defaults = {
        "databaseHost": "",
        "databasePort": "",
        "databaseName": "",
        "databaseUser": "",
        "databasePassword": "",
        "odbcDriver": "ODBC Driver 18 for SQL Server",
        "vpnServerHostname": "sslvpn1.calzedonia.com",
        "vpnProxyPath": "/web_forward_CuttingApplicationAPI",
        "vmHostname": "gab-navint01p.csg1.sys.calzedonia.com",
        "vmIpAddress": "172.27.57.210",
        "consumptionAnalyticsPowerBiUrl": ""
    }

    print(f"[SERVER_SETTINGS] Reading from: {SERVER_SETTINGS_PATH}")
    print(f"[SERVER_SETTINGS] File exists: {os.path.exists(SERVER_SETTINGS_PATH)}")

    if not os.path.exists(SERVER_SETTINGS_PATH):
        print(f"[SERVER_SETTINGS] File not found, returning defaults")
        return defaults

    try:
        with open(SERVER_SETTINGS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"[SERVER_SETTINGS] Loaded data: {data}")
            # Merge with defaults to ensure all keys exist
            return {**defaults, **data}

    except Exception as e:
        print(f"[SERVER_SETTINGS] Error reading server settings: {e}")
        return defaults



def read_installation_settings():
    """Read installation settings for Kanban (cutting room, devices, and mappings)."""
    defaults = {
        "internalCuttingRoom": "ZALLI",
        "spreaderLineCount": 3,
        "cutterLineCount": 2,
        "cutterAssignments": {},  # Empty by default - no hardcoded assignments
    }

    if not os.path.exists(INSTALLATION_SETTINGS_PATH):
        return defaults

    try:
        with open(INSTALLATION_SETTINGS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f) or {}

        # Backwards compatibility: map legacy key to the new one if needed
        if "internalCuttingRoom" not in data and "installationCuttingRoom" in data:
            data["internalCuttingRoom"] = data["installationCuttingRoom"]

        merged = {**defaults, **data}

        # Merge cutterAssignments separately to preserve any custom mappings
        if "cutterAssignments" in data:
            merged["cutterAssignments"] = {
                **defaults.get("cutterAssignments", {}),
                **data.get("cutterAssignments", {}),
            }

        return merged
    except Exception as e:
        print(f"[INSTALLATION_SETTINGS] Error reading installation settings: {e}")
        return defaults



def _generate_installation_config_file_content(settings):
    """Generate the JavaScript config file content for installation settings."""
    internal_cutting_room = (
        settings.get("internalCuttingRoom")
        or settings.get("installationCuttingRoom")
        or "ZALLI"
    )

    def _to_int(value, default):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    spreader_line_count = _to_int(settings.get("spreaderLineCount"), 3)
    cutter_line_count = _to_int(settings.get("cutterLineCount"), 2)

    # Build device lists
    spreader_devices = ["SP0"] + [f"SP{i}" for i in range(1, spreader_line_count + 1)] + ["MS"]
    cutter_devices = [f"CT{i}" for i in range(1, cutter_line_count + 1)]

    # Normalise cutter assignments so all cutters exist
    raw_assignments = settings.get("cutterAssignments") or {}
    normalised_assignments = {}
    for cutter in cutter_devices:
        devices = raw_assignments.get(cutter) or []
        # Keep only non-empty string values
        cleaned_devices = []
        for device in devices:
            if isinstance(device, str):
                device = device.strip()
                if device:
                    cleaned_devices.append(device)
        normalised_assignments[cutter] = cleaned_devices

    lines = []
    lines.append("/**")
    lines.append(" * Installation-specific configuration for Kanban (cutting room, devices, mappings).")
    lines.append(" * This file is auto-generated by the backend. Do not edit manually.")
    lines.append(" */")
    lines.append("")
    lines.append(
        f"export const INTERNAL_CUTTING_ROOM = '{_escape_js_single_quotes(internal_cutting_room)}';"
    )
    lines.append(f"export const SPREADER_LINE_COUNT = {spreader_line_count};")
    lines.append(f"export const CUTTER_LINE_COUNT = {cutter_line_count};")
    lines.append("")

    def _format_str_array(name, values):
        lines.append(f"export const {name} = [")
        for value in values:
            lines.append(f"  '{_escape_js_single_quotes(value)}',")
        lines.append("];")
        lines.append("")

    _format_str_array("SPREADER_DEVICES", spreader_devices)
    _format_str_array("CUTTER_DEVICES", cutter_devices)

    lines.append("export const CUTTER_ASSIGNMENTS = {")
    for cutter, devices in normalised_assignments.items():
        devices_str = ", ".join(f"'{_escape_js_single_quotes(d)}'" for d in devices)
        lines.append(f"  {cutter}: [{devices_str}],")
    lines.append("};")
    lines.append("")

    return "\n".join(lines)



def write_installation_settings(settings):
    """Write installation settings to JSON file and regenerate the React config file."""
    try:
        os.makedirs(os.path.dirname(INSTALLATION_SETTINGS_PATH), exist_ok=True)
        with open(INSTALLATION_SETTINGS_PATH, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)

        # Also regenerate the React installation config used by the frontend
        config_content = _generate_installation_config_file_content(settings)
        os.makedirs(os.path.dirname(INSTALLATION_CONFIG_PATH), exist_ok=True)
        with open(INSTALLATION_CONFIG_PATH, 'w', encoding='utf-8') as f:
            f.write(config_content)

        return True
    except Exception as e:
        print(f"[INSTALLATION_SETTINGS] Error writing installation settings: {e}")
        return False




def write_server_settings(settings):
    """Write server settings to JSON file."""
    try:
        os.makedirs(os.path.dirname(SERVER_SETTINGS_PATH), exist_ok=True)
        with open(SERVER_SETTINGS_PATH, 'w', encoding='utf-8') as f:
            json.dump(settings, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error writing server settings: {e}")
        return False


def read_application_modules():
    """Read application modules settings."""
    defaults = {
        "dashboard": True,
        "planning": True,
        "todoLists": True,
        "tables": True,
        "importPrintTools": True,
        "collarettoOperations": True,
        "operatorsManagement": True,
        "subcontractorManagement": True
    }

    if not os.path.exists(APPLICATION_MODULES_SETTINGS_PATH):
        return defaults

    try:
        with open(APPLICATION_MODULES_SETTINGS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            print(f"[APPLICATION_MODULES] Loaded data: {data}")
            # Merge with defaults to ensure all keys exist
            return {**defaults, **data}

    except Exception as e:
        print(f"[APPLICATION_MODULES] Error reading application modules: {e}")
        return defaults


def write_application_modules(modules):
    """Write application modules settings to JSON file and generate React config."""
    try:
        os.makedirs(os.path.dirname(APPLICATION_MODULES_SETTINGS_PATH), exist_ok=True)
        with open(APPLICATION_MODULES_SETTINGS_PATH, 'w', encoding='utf-8') as f:
            json.dump(modules, f, indent=2, ensure_ascii=False)

        # Also regenerate the React config used by the frontend
        config_content = _generate_application_modules_config_file_content(modules)
        os.makedirs(os.path.dirname(APPLICATION_MODULES_CONFIG_PATH), exist_ok=True)
        with open(APPLICATION_MODULES_CONFIG_PATH, 'w', encoding='utf-8') as f:
            f.write(config_content)

        return True
    except Exception as e:
        print(f"[APPLICATION_MODULES] Error writing application modules: {e}")
        return False


def _generate_application_modules_config_file_content(modules):
    """Generate the JavaScript config file content for application modules."""
    def _escape_js_single_quotes(s):
        return s.replace("'", "\\'") if isinstance(s, str) else s

    lines = []
    lines.append("/**")
    lines.append(" * Application modules configuration.")
    lines.append(" * This file is auto-generated by the backend. Do not edit manually.")
    lines.append(" */")
    lines.append("")

    for key, value in modules.items():
        const_name = ''.join(['_' + c.upper() if c.isupper() else c.upper() for c in key]).lstrip('_')
        lines.append(f"export const {const_name}_ENABLED = {str(value).lower()};")

    lines.append("")

    return "\n".join(lines)


def _get_branding_asset_path(kind):
    """Return the absolute path to the branding asset of the given kind ('logo' or 'favicon')."""
    folder = _ensure_branding_folder()
    basename = 'logo' if kind == 'logo' else 'favicon'
    for ext in ALLOWED_BRANDING_IMAGE_EXTENSIONS:
        candidate = os.path.join(folder, f"{basename}{ext}")
        if os.path.exists(candidate):
            return candidate
    return None


def _delete_branding_asset(kind):
    """Delete all stored branding assets of the given kind ('logo' or 'favicon')."""
    folder = _ensure_branding_folder()
    basename = 'logo' if kind == 'logo' else 'favicon'
    deleted = False
    for ext in ALLOWED_BRANDING_IMAGE_EXTENSIONS:
        candidate = os.path.join(folder, f"{basename}{ext}")
        if os.path.exists(candidate):
            os.remove(candidate)
            deleted = True
    return deleted



def read_branding_config():
    """Read branding configuration (logo, Power BI URL, languages, and assets) from JS file."""
    defaults = {
        "logoVariant": "default",
        "consumptionAnalyticsPowerBiUrl": "",
        "enabledLanguages": ["en", "bg"],
        "customLogoUrl": "",
        "customFaviconUrl": "",
    }

    if not os.path.exists(BRANDING_CONFIG_PATH):
        return defaults

    with open(BRANDING_CONFIG_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    # LOGO_VARIANT
    logo_match = re.search(r"export const LOGO_VARIANT\s*=\s*'([^']+)'", content)
    # CONSUMPTION_ANALYTICS_POWER_BI_URL
    url_match = re.search(
        r"export const CONSUMPTION_ANALYTICS_POWER_BI_URL\s*=\s*'([^']*)'",
        content,
        re.DOTALL,
    )
    # ENABLED_LANGUAGES
    languages_match = re.search(
        r"export const ENABLED_LANGUAGES\s*=\s*\[([^\]]*)\]",
        content,
        re.DOTALL,
    )
    # CUSTOM_LOGO_URL
    custom_logo_match = re.search(
        r"export const CUSTOM_LOGO_URL\s*=\s*'([^']*)'",
        content,
        re.DOTALL,
    )
    # CUSTOM_FAVICON_URL
    custom_favicon_match = re.search(
        r"export const CUSTOM_FAVICON_URL\s*=\s*'([^']*)'",
        content,
        re.DOTALL,
    )

    logo_variant = logo_match.group(1) if logo_match else defaults["logoVariant"]
    power_bi_url = (
        url_match.group(1)
        if url_match
        else defaults["consumptionAnalyticsPowerBiUrl"]
    )
    enabled_languages = defaults["enabledLanguages"]
    custom_logo_url = (
        custom_logo_match.group(1)
        if custom_logo_match
        else defaults["customLogoUrl"]
    )
    custom_favicon_url = (
        custom_favicon_match.group(1)
        if custom_favicon_match
        else defaults["customFaviconUrl"]
    )

    if languages_match:
        inner = languages_match.group(1).strip()
        if inner:
            items = [item.strip() for item in inner.split(',') if item.strip()]
            parsed = []
            for item in items:
                if (item[0] == item[-1]) and item[0] in ("'", '"'):
                    item = item[1:-1]
                item = item.strip()
                if item:
                    parsed.append(item)
            if parsed:
                enabled_languages = parsed

    return {
        "logoVariant": logo_variant,
        "consumptionAnalyticsPowerBiUrl": power_bi_url,
        "enabledLanguages": enabled_languages,
        "customLogoUrl": custom_logo_url,
        "customFaviconUrl": custom_favicon_url,
    }


def generate_branding_config_file_content(data):
    """Generate the JavaScript config file content for app branding."""
    logo_variant = data.get("logoVariant", "default") or "default"
    power_bi_url = data.get("consumptionAnalyticsPowerBiUrl", "") or ""

    enabled_languages = data.get("enabledLanguages")
    if isinstance(enabled_languages, str):
        enabled_languages = [enabled_languages]
    if not isinstance(enabled_languages, list):
        enabled_languages = []
    enabled_languages = [str(code).strip() for code in enabled_languages if str(code).strip()]
    if not enabled_languages:
        enabled_languages = ["en", "bg"]

    custom_logo_url = data.get("customLogoUrl", "") or ""
    custom_favicon_url = data.get("customFaviconUrl", "") or ""

    logo_variant_escaped = _escape_js_single_quotes(logo_variant)
    power_bi_url_escaped = _escape_js_single_quotes(power_bi_url)
    enabled_languages_js_values = ", ".join(
        f"'{_escape_js_single_quotes(code)}'" for code in enabled_languages
    )
    custom_logo_url_escaped = _escape_js_single_quotes(custom_logo_url)
    custom_favicon_url_escaped = _escape_js_single_quotes(custom_favicon_url)

    lines = [
        "/**",
        " * Application branding & analytics configuration",
        " * Store values here to control the logo, BI links, and language options.",
        " */",
        "",
        "// Logo variant used by the <Logo /> component",
        "// Allowed values: 'default', 'zalli', 'dark'",
        f"export const LOGO_VARIANT = '{logo_variant_escaped}';",
        "",
        "// Power BI URL used on the \"Consumption Analytics\" page",
        "export const CONSUMPTION_ANALYTICS_POWER_BI_URL =",
        f"  '{power_bi_url_escaped}';",
        "",
        "// Languages enabled in the profile language selector",
        "// Only these languages will be shown when users open the profile menu",
        f"export const ENABLED_LANGUAGES = [{enabled_languages_js_values}];",
        "",
        "// Optional custom logo URL for the header logo. If empty, the variant-based logo is used.",
        f"export const CUSTOM_LOGO_URL = '{custom_logo_url_escaped}';",
        "",
        "// Optional custom favicon URL for the browser tab icon.",
        f"export const CUSTOM_FAVICON_URL = '{custom_favicon_url_escaped}';",
        "",
    ]

    return "\n".join(lines)


@config_management_api.route('/get')
class GetConfiguration(Resource):
    def get(self):
        """Get the current production center configuration"""
        try:
            if not os.path.exists(REACT_CONFIG_PATH):
                return {"success": False, "msg": "Configuration file not found"}, 404

            with open(REACT_CONFIG_PATH, 'r', encoding='utf-8') as f:
                content = f.read()

            # Parse all configuration sections
            production_centers = parse_js_object(content, 'PRODUCTION_CENTERS')
            cutting_rooms = parse_js_object(content, 'CUTTING_ROOMS')
            destinations = parse_js_object(content, 'DESTINATIONS')
            production_center_cutting_rooms = parse_js_array_object(content, 'PRODUCTION_CENTER_CUTTING_ROOMS')
            cutting_room_destinations = parse_js_array_object(content, 'CUTTING_ROOM_DESTINATIONS')
            combination_keys = parse_combination_keys(content)
            cutting_room_colors = parse_cutting_room_colors(content)
            machine_specifications = parse_machine_specifications(content)

            return {
                "success": True,
                "data": {
                    "productionCenters": production_centers,
                    "cuttingRooms": cutting_rooms,
                    "destinations": destinations,
                    "productionCenterCuttingRooms": production_center_cutting_rooms,
                    "cuttingRoomDestinations": cutting_room_destinations,
                    "combinationKeys": combination_keys,
                    "cuttingRoomColors": cutting_room_colors,
                    "machineSpecifications": machine_specifications
                }
            }, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

@config_management_api.route('/save')
class SaveConfiguration(Resource):
    def post(self):
        """Save the production center configuration"""
        try:
            data = request.get_json()

            # Generate the new config file content
            config_content = self.generate_config_file(data)

            # Write to file
            with open(REACT_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(config_content)

            return {"success": True, "msg": "Configuration saved successfully"}, 200

        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def generate_config_file(self, data):
        """Generate the JavaScript config file content"""
        lines = []

        # Header
        lines.append("/**")
        lines.append(" * Production Center Configuration Dictionary")
        lines.append(" * This utility provides configuration for production centers, cutting rooms, destinations,")
        lines.append(" * and their valid combinations with corresponding keys.")
        lines.append(" */")
        lines.append("")

        # Production Centers
        lines.append("// Production Center Options")
        lines.append("export const PRODUCTION_CENTERS = {")
        for key, value in data.get('productionCenters', {}).items():
            lines.append(f"  {key}: '{value}',")
        lines.append("};")
        lines.append("")

        # Cutting Rooms
        lines.append("// Cutting Room Options")
        lines.append("export const CUTTING_ROOMS = {")
        for key, value in data.get('cuttingRooms', {}).items():
            lines.append(f"  {key}: '{value}',")
        lines.append("};")
        lines.append("")

        # Destinations
        lines.append("// Destination Options")
        lines.append("export const DESTINATIONS = {")
        for key, value in data.get('destinations', {}).items():
            lines.append(f"  {key}: '{value}',")
        lines.append("};")
        lines.append("")

        # Production Center to Cutting Room mapping
        lines.append("// Production Center to Cutting Room mapping")
        lines.append("export const PRODUCTION_CENTER_CUTTING_ROOMS = {")
        for pc, rooms in data.get('productionCenterCuttingRooms', {}).items():
            lines.append(f"  [PRODUCTION_CENTERS.{pc}]: [")
            for room in rooms:
                lines.append(f"    CUTTING_ROOMS.{room},")
            lines.append("  ],")
        lines.append("};")
        lines.append("")

        # Cutting Room to Destination mapping
        lines.append("// Cutting Room to Destination mapping")
        lines.append("export const CUTTING_ROOM_DESTINATIONS = {")
        for room, dests in data.get('cuttingRoomDestinations', {}).items():
            lines.append(f"  [CUTTING_ROOMS.{room}]: [")
            for dest in dests:
                lines.append(f"    DESTINATIONS.{dest},")
            lines.append("  ],")
        lines.append("};")
        lines.append("")

        # Combination Keys
        lines.append("// Cutting Room + Destination combination keys")
        lines.append("export const COMBINATION_KEYS = {")
        for combo, key in data.get('combinationKeys', {}).items():
            parts = combo.split('+')
            if len(parts) == 2:
                lines.append(f"  [`${{CUTTING_ROOMS.{parts[0]}}}+${{DESTINATIONS.{parts[1]}}}`]: '{key}',")
        lines.append("};")
        lines.append("")

        # Cutting Room Colors
        lines.append("// Cutting Room Color Configuration")
        lines.append("export const CUTTING_ROOM_COLORS = {")
        for room, color in data.get('cuttingRoomColors', {}).items():
            lines.append(f"  [CUTTING_ROOMS.{room}]: '{color}',")
        lines.append("};")
        lines.append("")

        # Machine Specifications
        lines.append("// Cutting Room Machine Specifications")
        lines.append("// Each cutting room can have multiple machines with different capacities")
        lines.append("// percentage: % of total capacity, length: max length in meters, width: max width in cm")
        lines.append("export const CUTTING_ROOM_MACHINES = {")
        for room, machines in data.get('machineSpecifications', {}).items():
            lines.append(f"  [CUTTING_ROOMS.{room}]: [")
            for machine in machines:
                percentage = machine.get('percentage', 100)
                length = machine.get('length', 12)
                width = machine.get('width', 220)
                lines.append(f"    {{ percentage: {percentage}, length: {length}, width: {width} }},")
            lines.append("  ],")
        lines.append("};")
        lines.append("")

        # Add utility functions (keep them as-is from original file)
        lines.extend(self.get_utility_functions())

        return '\n'.join(lines)

    def get_utility_functions(self):
        """Return the utility functions to append to the config file"""
        return [
            "/**",
            " * Get the color for a cutting room",
            " * @param {string} cuttingRoom - The cutting room name",
            " * @returns {string} The hex color code for the cutting room",
            " */",
            "export const getCuttingRoomColor = (cuttingRoom) => {",
            "  return CUTTING_ROOM_COLORS[cuttingRoom] || '#9e9e9e'; // Default grey if not found",
            "};",
            "",
            "/**",
            " * Get machine specifications for a cutting room",
            " * @param {string} cuttingRoom - The cutting room name",
            " * @returns {Array} Array of machine specs with {percentage, length, width}",
            " */",
            "export const getMachineSpecs = (cuttingRoom) => {",
            "  return CUTTING_ROOM_MACHINES[cuttingRoom] || [];",
            "};",
            "",
            "/**",
            " * Get the maximum length available for a cutting room",
            " * @param {string} cuttingRoom - The cutting room name",
            " * @returns {number} Maximum length in meters",
            " */",
            "export const getMaxLength = (cuttingRoom) => {",
            "  const machines = getMachineSpecs(cuttingRoom);",
            "  if (machines.length === 0) return 0;",
            "  return Math.max(...machines.map(m => m.length));",
            "};",
            "",
            "/**",
            " * Get the maximum width available for a cutting room",
            " * @param {string} cuttingRoom - The cutting room name",
            " * @returns {number} Maximum width in cm",
            " */",
            "export const getMaxWidth = (cuttingRoom) => {",
            "  const machines = getMachineSpecs(cuttingRoom);",
            "  if (machines.length === 0) return 0;",
            "  return Math.max(...machines.map(m => m.width));",
            "};",
            "",
            "/**",
            " * Check if a marker fits any machine in the cutting room",
            " * @param {string} cuttingRoom - The cutting room name",
            " * @param {number} markerLength - Marker length in meters",
            " * @param {number} markerWidth - Marker width in cm",
            " * @returns {boolean} True if marker fits at least one machine",
            " */",
            "export const markerFitsMachine = (cuttingRoom, markerLength, markerWidth) => {",
            "  const machines = getMachineSpecs(cuttingRoom);",
            "  return machines.some(m => markerLength <= m.length && markerWidth <= m.width);",
            "};",
            "",
            "// Utility Functions",
            "",
            "/**",
            " * Get available cutting rooms for a production center",
            " * @param {string} productionCenter - The production center (PXE1 or PXE3)",
            " * @returns {string[]} Array of available cutting rooms",
            " */",
            "export const getCuttingRoomsForProductionCenter = (productionCenter) => {",
            "  return PRODUCTION_CENTER_CUTTING_ROOMS[productionCenter] || [];",
            "};",
            "",
            "/**",
            " * Get available destinations for a cutting room",
            " * @param {string} cuttingRoom - The cutting room",
            " * @returns {string[]} Array of available destinations",
            " */",
            "export const getDestinationsForCuttingRoom = (cuttingRoom) => {",
            "  return CUTTING_ROOM_DESTINATIONS[cuttingRoom] || [];",
            "};",
            "",
            "/**",
            " * Get the combination key for cutting room + destination",
            " * @param {string} cuttingRoom - The cutting room",
            " * @param {string} destination - The destination",
            " * @returns {string|null} The combination key or null if not found",
            " */",
            "export const getCombinationKey = (cuttingRoom, destination) => {",
            "  const key = `${cuttingRoom}+${destination}`;",
            "  return COMBINATION_KEYS[key] || null;",
            "};",
            "",
            "/**",
            " * Check if a cutting room and destination combination is valid",
            " * @param {string} cuttingRoom - The cutting room",
            " * @param {string} destination - The destination",
            " * @returns {boolean} True if the combination is valid",
            " */",
            "export const isValidCombination = (cuttingRoom, destination) => {",
            "  const availableDestinations = getDestinationsForCuttingRoom(cuttingRoom);",
            "  return availableDestinations.includes(destination);",
            "};",
            "",
            "/**",
            " * Get all production center options as array for dropdowns",
            " * @returns {Array} Array of {value, label} objects",
            " */",
            "export const getProductionCenterOptions = () => {",
            "  return Object.values(PRODUCTION_CENTERS).map(pc => ({",
            "    value: pc,",
            "    label: pc",
            "  }));",
            "};",
            "",
            "/**",
            " * Get cutting room options for dropdown based on production center",
            " * @param {string} productionCenter - The selected production center",




            " * @returns {Array} Array of {value, label} objects",
            " */",
            "export const getCuttingRoomOptions = (productionCenter) => {",
            "  const cuttingRooms = getCuttingRoomsForProductionCenter(productionCenter);",
            "  return cuttingRooms.map(cr => ({",
            "    value: cr,",
            "    label: cr",
            "  }));",
            "};",
            "",
            "/**",
            " * Get destination options for dropdown based on cutting room",
            " * @param {string} cuttingRoom - The selected cutting room",
            " * @returns {Array} Array of {value, label} objects",
            " */",
            "export const getDestinationOptions = (cuttingRoom) => {",
            "  const destinations = getDestinationsForCuttingRoom(cuttingRoom);",
            "  return destinations.map(dest => ({",
            "    value: dest,",
            "    label: dest",
            "  }));",
            "};",
            "",
            "/**",
            " * Check if a cutting room has only one possible destination",
            " * @param {string} cuttingRoom - The cutting room",
            " * @returns {boolean} True if the cutting room has exactly one destination",
            " */",
            "export const hasOnlyOneDestination = (cuttingRoom) => {",
            "  const destinations = getDestinationsForCuttingRoom(cuttingRoom);",
            "  return destinations.length === 1;",
            "};",
            "",
            "/**",
            " * Get the auto-selected destination for a cutting room (if it has only one)",
            " * @param {string} cuttingRoom - The cutting room",
            " * @returns {string|null} The destination value if only one exists, null otherwise",
            " */",
            "export const getAutoSelectedDestination = (cuttingRoom) => {",
            "  if (hasOnlyOneDestination(cuttingRoom)) {",
            "    const destinations = getDestinationsForCuttingRoom(cuttingRoom);",
            "    return destinations[0];",
            "  }",
            "  return null;",
            "};",
            "",
            "/**",
            " * Extract the base cutting room from username",
            " * Handles cases like \"DELICIA2\" -> \"DELICIA\", \"SINASTYLE_D\" -> \"SINA STYLE\"",
            " * @param {string} username - The username to extract cutting room from",
            " * @returns {string|null} The cutting room name or username if no match found",
            " */",
            "export const getCuttingRoomFromUsername = (username) => {",
            "  if (!username) return null;",
            "",
            "  const usernameUpper = username.toUpperCase();",
            "  const cuttingRoomNames = Object.values(CUTTING_ROOMS);",
            "",
            "  for (const roomName of cuttingRoomNames) {",
            "    const roomNameUpper = roomName.toUpperCase();",
            "",
            "    // First try exact prefix match (handles cases like \"DELICIA2\" -> \"DELICIA\")",
            "    if (usernameUpper.startsWith(roomNameUpper)) {",
            "      return roomName;",
            "    }",
            "",
            "    // Then try normalized match (remove spaces and check if username starts with it)",
            "    // This handles cases like \"SINASTYLE_D\" -> \"SINA STYLE\"",
            "    const normalizedRoomName = roomNameUpper.replace(/\\s+/g, '');",
            "    if (usernameUpper.startsWith(normalizedRoomName)) {",
            "      return roomName;",
            "    }",
            "  }",
            "",
            "  // If no match found, return the username as-is (backward compatibility)",
            "  return username;",
            "};",
            ""
        ]






@config_management_bp.route('/branding-assets/<path:filename>')
def get_branding_asset(filename):
    """Serve uploaded branding assets (logo, favicon) as static files."""
    folder = _ensure_branding_folder()
    return send_from_directory(folder, filename)



@config_management_api.route('/branding/logo/upload')
class BrandingLogoUpload(Resource):
    """Upload a custom logo image used in the application header."""

    def post(self):
        try:
            if 'file' not in request.files:
                return {"success": False, "msg": "No file part in the request"}, 400

            file = request.files['file']
            if not file or file.filename == '':
                return {"success": False, "msg": "No file selected"}, 400

            if not _allowed_branding_extension(file.filename):
                return {"success": False, "msg": "Unsupported file type"}, 400

            filename = secure_filename(file.filename)
            _, ext = os.path.splitext(filename)
            ext = ext.lower()

            # Ensure folder exists and remove previous logo files
            _delete_branding_asset('logo')
            folder = _ensure_branding_folder()

            stored_name = f"logo{ext}"
            file_path = os.path.join(folder, stored_name)
            file.save(file_path)

            public_url = f"/api/config/branding-assets/{stored_name}"

            # Update branding config with new custom logo URL
            current = read_branding_config()
            current['customLogoUrl'] = public_url
            file_content = generate_branding_config_file_content(current)

            os.makedirs(os.path.dirname(BRANDING_CONFIG_PATH), exist_ok=True)
            with open(BRANDING_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(file_content)

            return {"success": True, "url": public_url}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/branding/favicon/upload')
class BrandingFaviconUpload(Resource):
    """Upload a custom favicon image used in the browser tab."""

    def post(self):
        try:
            if 'file' not in request.files:
                return {"success": False, "msg": "No file part in the request"}, 400

            file = request.files['file']
            if not file or file.filename == '':
                return {"success": False, "msg": "No file selected"}, 400

            if not _allowed_branding_extension(file.filename):
                return {"success": False, "msg": "Unsupported file type"}, 400

            filename = secure_filename(file.filename)
            _, ext = os.path.splitext(filename)
            ext = ext.lower()

            # Ensure folder exists and remove previous favicon files
            _delete_branding_asset('favicon')
            folder = _ensure_branding_folder()

            stored_name = f"favicon{ext}"
            file_path = os.path.join(folder, stored_name)
            file.save(file_path)

            public_url = f"/api/config/branding-assets/{stored_name}"

            # Update branding config with new custom favicon URL
            current = read_branding_config()
            current['customFaviconUrl'] = public_url
            file_content = generate_branding_config_file_content(current)

            os.makedirs(os.path.dirname(BRANDING_CONFIG_PATH), exist_ok=True)
            with open(BRANDING_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(file_content)

            return {"success": True, "url": public_url}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/branding/logo')
class BrandingLogoDelete(Resource):
    """Delete the custom logo and revert to the default one."""

    def delete(self):
        try:
            _delete_branding_asset('logo')

            current = read_branding_config()
            current['customLogoUrl'] = ""
            file_content = generate_branding_config_file_content(current)

            os.makedirs(os.path.dirname(BRANDING_CONFIG_PATH), exist_ok=True)
            with open(BRANDING_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(file_content)

            return {"success": True, "msg": "Logo deleted successfully"}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/branding/favicon')
class BrandingFaviconDelete(Resource):
    """Delete the custom favicon and revert to the default one."""

    def delete(self):
        try:
            _delete_branding_asset('favicon')

            current = read_branding_config()
            current['customFaviconUrl'] = ""
            file_content = generate_branding_config_file_content(current)

            os.makedirs(os.path.dirname(BRANDING_CONFIG_PATH), exist_ok=True)
            with open(BRANDING_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(file_content)

            return {"success": True, "msg": "Favicon deleted successfully"}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/branding')
class BrandingConfiguration(Resource):
    """Manage application branding configuration (logo + Power BI link)."""

    def get(self):
        """Get the current branding configuration."""
        try:
            data = read_branding_config()
            return {"success": True, "data": data}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Save the branding configuration."""
        try:
            payload = request.get_json() or {}

            # Start from the current config so we preserve custom logo/favicon URLs
            current = read_branding_config()

            merged = {
                "logoVariant": payload.get("logoVariant", current.get("logoVariant")),
                "consumptionAnalyticsPowerBiUrl": payload.get(
                    "consumptionAnalyticsPowerBiUrl",
                    current.get("consumptionAnalyticsPowerBiUrl"),
                ),
                "enabledLanguages": payload.get("enabledLanguages", current.get("enabledLanguages")),
                "customLogoUrl": current.get("customLogoUrl", ""),
                "customFaviconUrl": current.get("customFaviconUrl", ""),
            }

            file_content = generate_branding_config_file_content(merged)

            # Ensure directory exists
            os.makedirs(os.path.dirname(BRANDING_CONFIG_PATH), exist_ok=True)

            with open(BRANDING_CONFIG_PATH, 'w', encoding='utf-8') as f:
                f.write(file_content)

            return {"success": True, "msg": "Branding configuration saved successfully"}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


# ======================== USER ROLES MANAGEMENT ========================

@config_management_api.route('/users')
class UserRolesResource(Resource):
    def get(self):
        """Get all users with their roles"""
        try:
            users = Users.query.all()
            users_data = [
                {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role or 'Planner'
                }
                for user in users
            ]
            return {"success": True, "data": users_data}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Update a user's role"""
        try:
            payload = request.get_json() or {}
            user_id = payload.get('id')
            new_role = payload.get('role')

            if not user_id or not new_role:
                return {"success": False, "msg": "User ID and role are required"}, 400

            user = Users.query.get(user_id)
            if not user:
                return {"success": False, "msg": "User not found"}, 404

            user.role = new_role
            user.save()

            return {
                "success": True,
                "msg": f"User {user.username} role updated to {new_role}",
                "data": {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user.role
                }
            }, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/roles')
class AvailableRolesResource(Resource):
    def get(self):
        """Get all available roles in the system"""
        try:
            roles = [
                'Administrator',
                'Project Admin',
                'Manager',
                'Shift Manager',
                'Planner',
                'Spreader',
                'Cutter',
                'Subcontractor',
                'Logistic'
            ]
            return {"success": True, "data": roles}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500




# ======================== INSTALLATION SETTINGS MANAGEMENT ========================


@config_management_api.route('/installation-settings')
class InstallationSettingsResource(Resource):
    def get(self):
        """Get installation settings for cutting room / Kanban devices."""
        try:
            settings = read_installation_settings()
            return {"success": True, "data": settings}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Update installation settings for cutting room / Kanban devices."""
        try:
            payload = request.get_json() or {}

            def _to_int(value, default):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    return default

            spreader_count = _to_int(payload.get("spreaderLineCount"), 3)
            cutter_count = _to_int(payload.get("cutterLineCount"), 2)

            # Ensure non-negative counts
            spreader_count = max(spreader_count, 0)
            cutter_count = max(cutter_count, 0)

            internal_cutting_room = (
                payload.get("internalCuttingRoom")
                or payload.get("installationCuttingRoom")
                or "ZALLI"
            )

            raw_assignments = payload.get("cutterAssignments") or {}

            # Build list of valid spreader devices based on current spreader count
            valid_spreaders = {f"SP{i}" for i in range(1, spreader_count + 1)}

            cutter_assignments = {}
            for i in range(1, cutter_count + 1):
                cutter_key = f"CT{i}"
                devices = raw_assignments.get(cutter_key) or []
                cleaned_devices = []
                if isinstance(devices, list):
                    for device in devices:
                        if isinstance(device, str):
                            device = device.strip()
                            # Only keep device if it's non-empty AND is a valid spreader
                            if device and device in valid_spreaders:
                                cleaned_devices.append(device)
                cutter_assignments[cutter_key] = cleaned_devices

            settings = {
                "internalCuttingRoom": internal_cutting_room,
                "spreaderLineCount": spreader_count,
                "cutterLineCount": cutter_count,
                "cutterAssignments": cutter_assignments,
            }

            if write_installation_settings(settings):
                return {
                    "success": True,
                    "msg": "Installation settings updated successfully",
                }, 200
            else:
                return {
                    "success": False,
                    "msg": "Failed to write installation settings",
                }, 500
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

# ======================== SERVER SETTINGS MANAGEMENT ========================

@config_management_api.route('/server-settings')
class ServerSettingsResource(Resource):
    def get(self):
        """Get server settings (database credentials, Power BI URL, etc.)"""
        try:
            settings = read_server_settings()
            return {"success": True, "data": settings}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Update server settings"""
        try:
            payload = request.get_json() or {}

            # Prepare settings object
            settings = {
                'databaseHost': payload.get('databaseHost', ''),
                'databasePort': payload.get('databasePort', ''),
                'databaseName': payload.get('databaseName', ''),
                'databaseUser': payload.get('databaseUser', ''),
                'databasePassword': payload.get('databasePassword', ''),
                'odbcDriver': payload.get('odbcDriver', 'ODBC Driver 18 for SQL Server'),
                'consumptionAnalyticsPowerBiUrl': payload.get('consumptionAnalyticsPowerBiUrl', '')
            }

            # Write to file
            if write_server_settings(settings):
                return {
                    "success": True,
                    "msg": "Server settings updated successfully"
                }, 200
            else:
                return {
                    "success": False,
                    "msg": "Failed to write server settings"
                }, 500
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/test-connection')
class TestConnectionResource(Resource):
    def post(self):
        """Test database connection with provided credentials"""
        try:
            payload = request.get_json() or {}

            host = payload.get('databaseHost', '')
            port = payload.get('databasePort', '')
            database = payload.get('databaseName', '')
            user = payload.get('databaseUser', '')
            password = payload.get('databasePassword', '')
            odbc_driver = payload.get('odbcDriver', 'ODBC Driver 18 for SQL Server')

            # Validate required fields
            if not all([host, port, database, user]):
                return {
                    "success": False,
                    "msg": "Missing required fields: host, port, database, and user are required"
                }, 400

            # Build connection string - try with TrustServerCertificate=yes first
            # This matches the existing application connection behavior
            connection_string = (
                f'Driver={{{odbc_driver}}};'
                f'Server={host},{port};'
                f'Database={database};'
                f'UID={user};'
                f'PWD={password};'
                f'Encrypt=yes;'
                f'TrustServerCertificate=yes;'
                f'Connection Timeout=5;'
            )

            # Attempt connection
            conn = pyodbc.connect(connection_string)
            conn.close()

            return {
                "success": True,
                "msg": "Connection successful!"
            }, 200

        except pyodbc.Error as e:
            # Extract meaningful error message from pyodbc
            error_msg = str(e)
            if 'Login failed' in error_msg or 'Invalid login' in error_msg:
                return {
                    "success": False,
                    "msg": f"Login failed: Invalid credentials for user '{user}'"
                }, 400
            elif 'Cannot open database' in error_msg:
                return {
                    "success": False,
                    "msg": f"Cannot open database '{database}'. Check database name."
                }, 400
            elif 'Connection timeout' in error_msg or 'timeout' in error_msg.lower():
                return {
                    "success": False,
                    "msg": f"Connection timeout: Cannot reach server '{host}:{port}'. Check host and port."
                }, 400
            else:
                return {
                    "success": False,
                    "msg": f"Connection failed: {error_msg}"
                }, 400
        except Exception as e:
            return {
                "success": False,
                "msg": f"Connection test failed: {str(e)}"
            }, 500


# ======================== APPLICATION MODULES MANAGEMENT ========================

@config_management_api.route('/application-modules')
class ApplicationModulesResource(Resource):
    def get(self):
        """Get application modules settings"""
        try:
            modules = read_application_modules()
            return {"success": True, "data": modules}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Update application modules settings"""
        try:
            payload = request.get_json() or {}

            # Prepare modules object with defaults
            modules = {
                'dashboard': payload.get('dashboard', True),
                'planning': payload.get('planning', True),
                'todoLists': payload.get('todoLists', True),
                'tables': payload.get('tables', True),
                'importPrintTools': payload.get('importPrintTools', True),
                'collarettoOperations': payload.get('collarettoOperations', True),
                'operatorsManagement': payload.get('operatorsManagement', True)
            }

            # Write to file
            if write_application_modules(modules):
                return {
                    "success": True,
                    "msg": "Application modules updated successfully"
                }, 200
            else:
                return {
                    "success": False,
                    "msg": "Failed to write application modules"
                }, 500
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


# ===================== Email Settings =====================
@config_management_api.route('/email-settings')
class EmailSettingsResource(Resource):
    """Manage email settings for notifications"""

    def get(self):
        """Get all email settings. If no settings exist, pre-populate from users table."""
        try:
            settings = EmailSettings.query.filter_by(is_active=True).all()

            # Separate main recipients and subcontractor emails
            main_recipients = []
            subcontractor_emails = {}

            for setting in settings:
                if setting.setting_type == 'MAIN':
                    main_recipients.append({
                        'id': setting.id,
                        'email': setting.email,
                        'description': setting.description
                    })
                elif setting.setting_type == 'SUBCONTRACTOR':
                    if setting.cutting_room:
                        subcontractor_emails[setting.cutting_room] = {
                            'id': setting.id,
                            'email': setting.email,
                            'description': setting.description
                        }

            # If no subcontractor emails configured yet, pre-populate from users table
            if not subcontractor_emails:
                subcontractor_users = Users.query.filter_by(role='Subcontractor').all()
                for user in subcontractor_users:
                    if user.username and user.email:
                        subcontractor_emails[user.username] = {
                            'id': None,  # Not yet saved to email_settings
                            'email': user.email,
                            'description': f'From users table ({user.username})'
                        }

            return {
                "success": True,
                "data": {
                    "mainRecipients": main_recipients,
                    "subcontractorEmails": subcontractor_emails
                }
            }, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500

    def post(self):
        """Update email settings"""
        try:
            payload = request.get_json() or {}
            main_recipients = payload.get('mainRecipients', [])
            subcontractor_emails = payload.get('subcontractorEmails', {})

            # Deactivate all existing settings (soft delete)
            EmailSettings.query.update({EmailSettings.is_active: False})

            # Add/update main recipients
            for recipient in main_recipients:
                email = recipient.get('email', '').strip()
                if email:
                    setting = EmailSettings(
                        setting_type='MAIN',
                        email=email,
                        description=recipient.get('description', '').strip() or None,
                        is_active=True
                    )
                    db.session.add(setting)

            # Add/update subcontractor emails
            for cutting_room, email_data in subcontractor_emails.items():
                email = email_data.get('email', '').strip() if isinstance(email_data, dict) else email_data.strip()
                if email:
                    description = email_data.get('description', '').strip() if isinstance(email_data, dict) else None
                    setting = EmailSettings(
                        setting_type='SUBCONTRACTOR',
                        cutting_room=cutting_room,
                        email=email,
                        description=description,
                        is_active=True
                    )
                    db.session.add(setting)

            db.session.commit()

            return {
                "success": True,
                "msg": "Email settings saved successfully"
            }, 200
        except Exception as e:
            db.session.rollback()
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/email-settings/subcontractor/<string:cutting_room>')
class SubcontractorEmailResource(Resource):
    """Get email for a specific subcontractor cutting room"""

    def get(self, cutting_room):
        """Get email for a subcontractor by cutting room name. Falls back to users table if not configured."""
        try:
            # First check email_settings table
            setting = EmailSettings.query.filter_by(
                setting_type='SUBCONTRACTOR',
                cutting_room=cutting_room,
                is_active=True
            ).first()

            if setting:
                return {"success": True, "email": setting.email}, 200

            # Fallback to users table for subcontractor email
            user = Users.query.filter_by(username=cutting_room, role='Subcontractor').first()
            if user and user.email:
                return {"success": True, "email": user.email}, 200

            return {"success": True, "email": None}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500


@config_management_api.route('/email-settings/main-recipients')
class MainRecipientsResource(Resource):
    """Get all main email recipients"""

    def get(self):
        """Get all active main email recipients"""
        try:
            settings = EmailSettings.query.filter_by(
                setting_type='MAIN',
                is_active=True
            ).all()

            emails = [setting.email for setting in settings]

            return {"success": True, "emails": emails}, 200
        except Exception as e:
            return {"success": False, "msg": str(e)}, 500
