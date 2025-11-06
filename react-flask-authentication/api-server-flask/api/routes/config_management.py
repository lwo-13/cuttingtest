from flask import Blueprint, request, jsonify
from flask_restx import Api, Resource, fields
import os
import json
import re

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

