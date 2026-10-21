/**
 * Sherivs Scholar — space model: buildings, blocks, rooms (Phase-04 §60–62).
 *
 * An administrator may define buildings and blocks with identity, purpose,
 * capacity, facilities, rooms, devices and environmental conditions (§61);
 * rooms may declare capacity, type, equipment, devices, environmental sensors
 * and assigned activities (§62). §60's building model is represented as the
 * container above blocks — all pure configuration.
 */

export interface Building {
  id: string;
  name: string;
  campus?: string | null;
  blockIds?: string[];
}

export interface Block {
  id: string;
  name: string;
  purpose?: string | null;
  campus?: string | null;
  capacity?: number | null;
  buildingId?: string | null;
  facilityIds?: string[];
  roomIds?: string[];
  deviceIds?: string[];
}

export interface Room {
  id: string;
  name: string;
  type: string;
  capacity?: number | null;
  blockId?: string | null;
  equipmentIds?: string[];
  deviceIds?: string[];
  environmentSensorRefs?: string[];
  assignedActivityIds?: string[];
}

export interface SpaceModel {
  buildings: Building[];
  blocks: Block[];
  rooms: Room[];
}

export function validateSpaceModel(model: SpaceModel): string[] {
  const issues: string[] = [];
  const buildingIds = new Set<string>();
  const blockIds = new Set<string>();
  const roomIds = new Set<string>();

  for (const building of model.buildings) {
    if (!building.id.trim()) issues.push("a building requires an id");
    else if (buildingIds.has(building.id)) issues.push(`duplicate building id "${building.id}"`);
    buildingIds.add(building.id);
    if (!building.name.trim()) issues.push(`building "${building.id}": name is required`);
  }
  for (const block of model.blocks) {
    if (!block.id.trim()) issues.push("a block requires an id");
    else if (blockIds.has(block.id)) issues.push(`duplicate block id "${block.id}"`);
    blockIds.add(block.id);
    if (!block.name.trim()) issues.push(`block "${block.id}": name is required`);
    if (block.buildingId && !buildingIds.has(block.buildingId)) {
      issues.push(`block "${block.id}": unknown building "${block.buildingId}"`);
    }
    if (block.capacity != null && (!Number.isInteger(block.capacity) || block.capacity < 1)) {
      issues.push(`block "${block.id}": capacity must be a positive integer when provided`);
    }
  }
  for (const room of model.rooms) {
    if (!room.id.trim()) issues.push("a room requires an id");
    else if (roomIds.has(room.id)) issues.push(`duplicate room id "${room.id}"`);
    roomIds.add(room.id);
    if (!room.name.trim()) issues.push(`room "${room.id}": name is required`);
    if (!room.type.trim()) issues.push(`room "${room.id}": type is required`);
    if (room.blockId && !blockIds.has(room.blockId)) {
      issues.push(`room "${room.id}": unknown block "${room.blockId}"`);
    }
    if (room.capacity != null && (!Number.isInteger(room.capacity) || room.capacity < 1)) {
      issues.push(`room "${room.id}": capacity must be a positive integer when provided`);
    }
  }

  // Blocks reference rooms that exist; buildings reference blocks that exist.
  for (const block of model.blocks) {
    for (const roomId of block.roomIds ?? []) {
      if (!roomIds.has(roomId))
        issues.push(`block "${block.id}" references unknown room "${roomId}"`);
    }
  }
  for (const building of model.buildings) {
    for (const blockId of building.blockIds ?? []) {
      if (!blockIds.has(blockId))
        issues.push(`building "${building.id}" references unknown block "${blockId}"`);
    }
  }

  return issues;
}
