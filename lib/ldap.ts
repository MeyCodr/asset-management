import { Client, InvalidCredentialsError } from "ldapts";

export interface ADConfig {
  host: string;
  port: number;
  baseDN: string;
  bindDN: string;
  bindPassword: string;
  userSearchBase?: string;
  userFilter?: string;
  useTLS?: boolean;
}

export interface ADUser {
  dn: string;
  sAMAccountName: string;
  displayName: string;
  email: string;
  jobTitle: string;
  department: string;
  phone: string;
  manager: string;
  office: string;
  description: string;
  assignedDevices: string[]; // computer names from AD managedBy
}

function attr(entry: Record<string, string | string[]>, key: string): string {
  const val = entry[key];
  if (!val) return "";
  return Array.isArray(val) ? val[0] : val;
}

function createClient(config: ADConfig) {
  return new Client({
    url: `${config.useTLS ? "ldaps" : "ldap"}://${config.host}:${config.port}`,
    timeout: 15000,
    connectTimeout: 8000,
    tlsOptions: config.useTLS ? { rejectUnauthorized: false } : undefined,
  });
}

export async function testADConnection(
  config: ADConfig
): Promise<{ ok: boolean; message: string }> {
  const client = new Client({
    url: `${config.useTLS ? "ldaps" : "ldap"}://${config.host}:${config.port}`,
    timeout: 5000,
    connectTimeout: 5000,
    tlsOptions: config.useTLS ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.bind(config.bindDN, config.bindPassword);
    await client.unbind();
    return { ok: true, message: "Connection successful." };
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return { ok: false, message: "Invalid bind credentials." };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Connection failed.",
    };
  }
}

/**
 * Fetch computer objects and build a map of userDN → computer names[].
 * AD stores the assigned manager/owner of a computer in the `managedBy` attribute.
 */
async function fetchDeviceMap(
  client: Client,
  baseDN: string
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();

  try {
    const { searchEntries } = await client.search(baseDN, {
      scope: "sub",
      filter: "(&(objectClass=computer)(managedBy=*))",
      attributes: ["cn", "dNSHostName", "managedBy", "operatingSystem"],
      timeLimit: 30,
      sizeLimit: 2000,
    });

    for (const entry of searchEntries) {
      const e = entry as unknown as Record<string, string | string[]>;
      const managedBy = attr(e, "managedBy").toLowerCase();
      const computerName = attr(e, "cn") || attr(e, "dNSHostName");
      if (!managedBy || !computerName) continue;

      const existing = map.get(managedBy) ?? [];
      existing.push(computerName);
      map.set(managedBy, existing);
    }
  } catch {
    // Device lookup is best-effort — don't fail the whole sync if this errors
  }

  return map;
}

export async function fetchADUsers(config: ADConfig): Promise<ADUser[]> {
  const client = createClient(config);

  try {
    await client.bind(config.bindDN, config.bindPassword);

    const searchBase = config.userSearchBase || config.baseDN;
    const filter =
      config.userFilter ||
      "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(mail=*))";

    // Fetch users and device map in parallel
    const [{ searchEntries }, deviceMap] = await Promise.all([
      client.search(searchBase, {
        scope: "sub",
        filter,
        attributes: [
          "sAMAccountName",
          "displayName",
          "cn",
          "mail",
          "userPrincipalName",
          "title",
          "department",
          "telephoneNumber",
          "mobile",
          "manager",
          "description",
          "physicalDeliveryOfficeName",
        ],
        timeLimit: 30,
        sizeLimit: 1000,
      }),
      fetchDeviceMap(client, config.baseDN),
    ]);

    const seenEmails = new Set<string>();
    const users: ADUser[] = searchEntries
      .map((entry) => {
        const e = entry as unknown as Record<string, string | string[]>;
        const name = attr(e, "displayName") || attr(e, "cn");
        const email = attr(e, "mail") || attr(e, "userPrincipalName");
        const dn = String(entry.dn).toLowerCase();

        // Resolve manager DN to display name (the manager attribute holds a DN)
        const managerDN = attr(e, "manager");
        const managerCN = managerDN
          ? managerDN.split(",")[0].replace(/^cn=/i, "")
          : "";

        return {
          dn: String(entry.dn),
          sAMAccountName: attr(e, "sAMAccountName"),
          displayName: name,
          email,
          jobTitle: attr(e, "title"),
          department: attr(e, "department"),
          phone: attr(e, "telephoneNumber") || attr(e, "mobile"),
          manager: managerCN,
          office: attr(e, "physicalDeliveryOfficeName"),
          description: attr(e, "description"),
          assignedDevices: deviceMap.get(dn) ?? [],
        };
      })
      .filter((u) => {
        if (!u.displayName || !u.email) return false;
        const key = u.email.toLowerCase();
        if (seenEmails.has(key)) return false;
        seenEmails.add(key);
        return true;
      });

    await client.unbind();
    return users;
  } catch (err) {
    try {
      await client.unbind();
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}
