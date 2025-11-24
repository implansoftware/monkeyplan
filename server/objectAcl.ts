// FILEPATH: server/objectAcl.ts
// Reference: blueprint:javascript_object_storage
import { File } from "@google-cloud/storage";
import { db } from "./db";
import { repairOrders, users } from "@shared/schema";
import { eq } from "drizzle-orm";

const ACL_POLICY_METADATA_KEY = "custom:aclPolicy";

export enum ObjectAccessGroupType {
  REPAIR_ORDER = "repair_order",
  CUSTOMER = "customer",
  REPAIR_CENTER = "repair_center",
}

export interface ObjectAccessGroup {
  type: ObjectAccessGroupType;
  id: string;
}

export enum ObjectPermission {
  READ = "read",
  WRITE = "write",
}

export interface ObjectAclRule {
  group: ObjectAccessGroup;
  permission: ObjectPermission;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
  aclRules?: Array<ObjectAclRule>;
}

function isPermissionAllowed(
  requested: ObjectPermission,
  granted: ObjectPermission,
): boolean {
  if (requested === ObjectPermission.READ) {
    return [ObjectPermission.READ, ObjectPermission.WRITE].includes(granted);
  }
  return granted === ObjectPermission.WRITE;
}

abstract class BaseObjectAccessGroup implements ObjectAccessGroup {
  constructor(
    public readonly type: ObjectAccessGroupType,
    public readonly id: string,
  ) {}

  public abstract hasMember(userId: string): Promise<boolean>;
}

class RepairOrderAccessGroup extends BaseObjectAccessGroup {
  constructor(repairOrderId: string) {
    super(ObjectAccessGroupType.REPAIR_ORDER, repairOrderId);
  }

  async hasMember(userId: string): Promise<boolean> {
    const [repairOrder] = await db
      .select()
      .from(repairOrders)
      .where(eq(repairOrders.id, this.id));
    
    if (!repairOrder) return false;
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return false;
    
    return (
      repairOrder.customerId === userId ||
      repairOrder.resellerId === userId ||
      (user.repairCenterId && repairOrder.repairCenterId === user.repairCenterId) ||
      user.role === 'admin'
    );
  }
}

class CustomerAccessGroup extends BaseObjectAccessGroup {
  constructor(customerId: string) {
    super(ObjectAccessGroupType.CUSTOMER, customerId);
  }

  async hasMember(userId: string): Promise<boolean> {
    return userId === this.id;
  }
}

class RepairCenterAccessGroup extends BaseObjectAccessGroup {
  constructor(repairCenterId: string) {
    super(ObjectAccessGroupType.REPAIR_CENTER, repairCenterId);
  }

  async hasMember(userId: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) return false;
    
    return (
      (user.repairCenterId && user.repairCenterId === this.id) ||
      user.role === 'admin'
    );
  }
}

function createObjectAccessGroup(
  group: ObjectAccessGroup,
): BaseObjectAccessGroup {
  switch (group.type) {
    case ObjectAccessGroupType.REPAIR_ORDER:
      return new RepairOrderAccessGroup(group.id);
    case ObjectAccessGroupType.CUSTOMER:
      return new CustomerAccessGroup(group.id);
    case ObjectAccessGroupType.REPAIR_CENTER:
      return new RepairCenterAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}

export async function setObjectAclPolicy(
  objectFile: File,
  aclPolicy: ObjectAclPolicy,
): Promise<void> {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }

  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy),
    },
  });
}

export async function getObjectAclPolicy(
  objectFile: File,
): Promise<ObjectAclPolicy | null> {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy as string);
}

export async function canAccessObject({
  userId,
  objectFile,
  requestedPermission,
}: {
  userId?: string;
  objectFile: File;
  requestedPermission: ObjectPermission;
}): Promise<boolean> {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }

  if (
    aclPolicy.visibility === "public" &&
    requestedPermission === ObjectPermission.READ
  ) {
    return true;
  }

  if (!userId) {
    return false;
  }

  if (aclPolicy.owner === userId) {
    return true;
  }

  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (
      (await accessGroup.hasMember(userId)) &&
      isPermissionAllowed(requestedPermission, rule.permission)
    ) {
      return true;
    }
  }

  return false;
}
