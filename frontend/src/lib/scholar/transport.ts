/**
 * Sherivs Scholar — transport model (Phase-04 §58, upgrade target of the
 * legacy bus-tracking/driver surface).
 *
 * Routes, buses, drivers, stops, student assignments, schedules and vehicle
 * capacity are configuration. Enforced here: a learner has one active transport
 * assignment, stops are ordered uniquely per route, and a route never exceeds
 * its vehicle's declared capacity.
 */

export interface TransportVehicle {
  id: string;
  plate?: string | null;
  capacity: number;
}

export interface TransportStop {
  id: string;
  name: string;
  order: number;
}

export interface TransportRoute {
  id: string;
  name: string;
  vehicleId?: string | null;
  driverId?: string | null;
  stops: TransportStop[];
}

export interface TransportAssignment {
  routeId: string;
  stopId?: string | null;
  studentId: string;
  active?: boolean;
}

export function validateTransport(
  vehicles: readonly TransportVehicle[],
  routes: readonly TransportRoute[],
  assignments: readonly TransportAssignment[],
): string[] {
  const issues: string[] = [];
  const vehicleIds = new Set(vehicles.map((v) => v.id));
  const routeIds = new Set<string>();

  for (const vehicle of vehicles) {
    if (!vehicle.id.trim()) issues.push("a vehicle requires an id");
    if (!Number.isInteger(vehicle.capacity) || vehicle.capacity < 1) {
      issues.push(`vehicle "${vehicle.id}": capacity must be a positive integer`);
    }
  }
  for (const route of routes) {
    const id = route.id.trim();
    if (!id) {
      issues.push("a route requires an id");
      continue;
    }
    if (routeIds.has(id)) issues.push(`duplicate route id "${id}"`);
    routeIds.add(id);
    if (!route.name.trim()) issues.push(`route "${id}": name is required`);
    if (route.vehicleId && !vehicleIds.has(route.vehicleId)) {
      issues.push(`route "${id}": unknown vehicle "${route.vehicleId}"`);
    }
    const stopIds = new Set<string>();
    const orders = new Set<number>();
    for (const stop of route.stops) {
      if (!stop.id.trim()) issues.push(`route "${id}": a stop requires an id`);
      else if (stopIds.has(stop.id)) issues.push(`route "${id}": duplicate stop "${stop.id}"`);
      stopIds.add(stop.id);
      if (!stop.name.trim()) issues.push(`route "${id}": stop "${stop.id}" requires a name`);
      if (orders.has(stop.order)) issues.push(`route "${id}": duplicate stop order ${stop.order}`);
      orders.add(stop.order);
    }
  }

  const activeByStudent = new Set<string>();
  const countByRoute = new Map<string, number>();
  for (const assignment of assignments) {
    if (!assignment.routeId.trim() || !assignment.studentId.trim()) {
      issues.push("a transport assignment requires routeId and studentId");
      continue;
    }
    if (!routeIds.has(assignment.routeId)) {
      issues.push(`transport assignment references unknown route "${assignment.routeId}"`);
    }
    if (assignment.active !== false) {
      if (activeByStudent.has(assignment.studentId)) {
        issues.push(
          `student "${assignment.studentId}" has more than one active transport assignment`,
        );
      }
      activeByStudent.add(assignment.studentId);
      countByRoute.set(assignment.routeId, (countByRoute.get(assignment.routeId) ?? 0) + 1);
    }
  }
  for (const route of routes) {
    if (!route.vehicleId) continue;
    const vehicle = vehicles.find((v) => v.id === route.vehicleId);
    if (!vehicle) continue;
    const assigned = countByRoute.get(route.id) ?? 0;
    if (assigned > vehicle.capacity) {
      issues.push(
        `route "${route.id}" exceeds vehicle capacity: ${assigned} assigned for ${vehicle.capacity}`,
      );
    }
  }

  return issues;
}
