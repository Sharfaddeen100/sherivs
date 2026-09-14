# Cloud Fabric — Credentials Walkthrough (step by step)

> Companion to `CREDENTIALS.md` (what is needed and why) and
> `architecture/cloud-fabric-migration-plan.md` (when it is needed).
>
> **Rule zero:** these values go into a **secret store**, never into this chat,
> an issue, a commit, an IaC file or a screenshot. If a provider shows a value
> once and you lose it, revoke and regenerate — never paste it into a text channel
> to "save" it.

## What is safe to share (identifiers, not secrets)

You can share these openly; they are configuration, not credentials:

| Safe to share | Example |
| --- | --- |
| OCI region identifier | `eu-frankfurt-1`, `uk-london-1`, `af-johannesburg-1` |
| Availability domain names | `Uocm:EU-FRANKFURT-1-AD-1` |
| Compartment **name** (not OCID) | `coregrid-fabric` |
| Object storage namespace (your tenant's) | *treat as semi-private; fine to state verbally* |
| Root domain and hostnames | your domain, `app.<domain>`, LB hostname |
| Operator CIDR | your office/VPN egress range |
| State bucket name + region | `coregrid-tfstate`, `auto` |
| n8n hostname | `automation.<domain>` |

| **Never** share (secrets) | Where it lives |
| --- | --- |
| OCI API **private key** (PEM), fingerprint is fine | GitHub Environment / vault |
| Hetzner / Vultr / Cloudflare API tokens | GitHub Environment / vault |
| Supabase access token, service-role key, DB password | GitHub Environment / vault |
| n8n encryption key, state-bucket secret access key | GitHub Environment / vault |

## Where the values are stored

Recommended: **GitHub Environments** in this repository, because the apply
workflow reads them from there and required reviewers gate the apply.

1. Repository → **Settings** → **Environments** → **New environment**:
   - `infrastructure-plan` (no reviewers; read-only identities)
   - `infrastructure-apply` (**add required reviewers** — this is the approval gate)
2. In each environment → **Add secret**. Names must match exactly:
```
TF_STATE_BUCKET                 state bucket name (S3-compatible)
TF_STATE_REGION                 state bucket region ("auto" for Cloudflare R2)
TF_STATE_ACCESS_KEY_ID          S3 access key id
TF_STATE_SECRET_ACCESS_KEY      S3 secret access key
OCI_PRIVATE_KEY_PEM             contents of the OCI API private key (multi-line PEM)
TF_VAR_oci_tenancy_ocid         OCI tenancy OCID
TF_VAR_oci_user_ocid            OCI automation user OCID
TF_VAR_oci_fingerprint          OCI API key fingerprint
TF_VAR_oci_compartment_ocid     dedicated compartment OCID
TF_VAR_hetzner_token            Hetzner project token            (CF-5)
TF_VAR_hetzner_ssh_public_key   worker public key                (CF-5)
TF_VAR_vultr_api_key            Vultr API key                    (CF-6)
TF_VAR_cloudflare_api_token     scoped Cloudflare token          (traffic layer)
TF_VAR_cloudflare_zone_id       Cloudflare zone id
TF_VAR_cloudflare_account_id    Cloudflare account id
TF_VAR_supabase_project_ref     Supabase project reference       (CF-7)
TF_VAR_supabase_access_token    Supabase management token        (CF-7)
SUPABASE_DB_URL                 Postgres connection string       (CF-7)
N8N_DOMAIN / N8N_ENCRYPTION_KEY n8n hostname + encryption key    (CF-8)
```

Non-secret decisions live in `terraform.tfvars` (owner identifiers), **not** in
environment secrets: `lb_hostname`, `origin_hostname`, `operator_cidrs`,
`oci_region`, `oci_compartment_ocid`, `oci_object_storage_namespace`,
`oci_availability_domains`, `cloudflare_account_id`, `cloudflare_zone_id`,
`supabase_project_ref`, `edge_regions`.

---

## 1. Supabase — CF-7 (do this first; ~10 minutes)

Log in at <https://supabase.com/dashboard> and select the production project.

1. **Project reference** (`TF_VAR_supabase_project_ref`)
   - Project Settings → **General** → *Reference ID* (a 20-char id), or read it
     from the dashboard URL: `https://supabase.com/dashboard/project/<REF>`.
2. **Management access token** (`TF_VAR_supabase_access_token`)
   - Account menu (top-right avatar) → **Access Tokens** → **Generate new token**
     → name it `coregrid-terraform` → copy it once.
   - Scope note: this token is account-level and can administer your projects.
     Treat it as high-value; rotate it after the CF-7 wave if you prefer
     single-use tokens.
   - CLI alternative: `supabase login` (stores a token locally) — but Terraform
     needs the value in the environment, so generate a token anyway.
3. **Database connection string** (`SUPABASE_DB_URL`)
   - Project Settings → **Database** → *Connection string* → **URI**.
   - Use the **direct/session** form (port `5432`) for migrations and restore
     drills. The **transaction pooler** (port `6543`) is for application traffic,
     not for DDL/pg_dump — do not use it here.
   - Replace `[YOUR-PASSWORD]` with the database password (Project Settings →
     Database → *Database password*; reset it if you do not have it).
   - Ensure `?sslmode=require` is present.
4. **Service-role key** (`SUPABASE_SERVICE_ROLE_KEY`) — only if the app's server
   functions still need it: Project Settings → **API** → *Project API keys* →
   `service_role`. **Never** prefix it with `VITE_`.
5. **Publishable/anon key** (`SUPABASE_PUBLISHABLE_KEY`) — same page, `anon` /
   `publishable` key.
6. **Backups/PITR entitlement check** — Project Settings → **Database** →
   *Backups*: note the plan's retention and whether **PITR** is available. If PITR
   is not on your plan, say so: CF-7 will then assert *daily backups + a logical
   restore drill* instead, and record PITR as a plan gap rather than pretending.


## 2. Oracle Cloud Infrastructure — CF-4 (the backbone)

Console: <https://cloud.oracle.com>. Have these ready before you start: the region
you will use, and a name for the automation user.

1. **Tenancy OCID** (`TF_VAR_oci_tenancy_ocid`)
   - Profile menu (top-right) → **Tenancy: <your-tenancy>`** → *OCID* → **Copy**.
   - CLI: `oci iam tenancy get --tenancy-id <ocid>` (or `oci setup config` prints it).
2. **Dedicated compartment** (do this — do not deploy into the root compartment)
   - **Identity & Security → Compartments → Create compartment**, name it
     `coregrid-fabric`, description "CoreGrid Cloud Fabric (Phase 21)".
   - Open it and copy the **compartment OCID** (`TF_VAR_oci_compartment_ocid`).
3. **Automation user** (`TF_VAR_oci_user_ocid`)
   - Identity & Security → **Domains → Default → Users → Create user**,
     e.g. `coregrid-terraform`, with a real email you control.
   - Copy the user **OCID**.
   - (Federated/identity-domain users work too; an API key on a dedicated
     automation user is the simplest auditable option.)
4. **API key** (`OCI_PRIVATE_KEY_PEM`, `TF_VAR_oci_fingerprint`)
   - Open the user → **API keys → Add API key → Generate API key pair**.
   - **Download the private key** (PEM). It is shown once; store it in your secret
     manager as `OCI_PRIVATE_KEY_PEM` (the whole file contents).
   - Copy the **fingerprint** shown after the download.
   - If you prefer local use: `oci setup config` generates `~/.oci/config` and the
     key pair for you.
5. **Group + least-privilege policy**
   - Identity & Security → **Domains → Default → Groups → Create group**
     `CoreGridAutomation`; add the automation user to it.
   - Identity & Security → **Policies → Create policy** in your **tenancy**:
     `CoreGridFabricAutomation`, description "Phase 21 fabric provisioning".
     Paste (replace `<compartment>` with `coregrid-fabric`):
     ```
     Allow group CoreGridAutomation to read compartments in tenancy
     Allow group CoreGridAutomation to manage virtual-network-family in compartment <compartment>
     Allow group CoreGridAutomation to manage cluster-family in compartment <compartment>
     Allow group CoreGridAutomation to manage instance-family in compartment <compartment>
     Allow group CoreGridAutomation to manage compute-management-family in compartment <compartment>
     Allow group CoreGridAutomation to manage volume-family in compartment <compartment>
     Allow group CoreGridAutomation to manage object-family in compartment <compartment>
     Allow group CoreGridAutomation to read metrics in compartment <compartment>
     Allow group CoreGridAutomation to use tag-namespaces in compartment <compartment>
     ```
     - Everything is confined to the one compartment — no tenancy-wide admin.
     - If a plan later reports a missing permission, we add **one scoped
       statement** and record it; we never widen to `manage all-resources in tenancy`.
     - Optional (customer-managed keys): create a vault in **Key Management**, add
       `Allow group CoreGridAutomation to manage keys in compartment <compartment>`
       and `... to manage vaults in compartment <compartment>`, then give me the key OCID.
6. **Region** (`oci_region`)
   - Top-right region selector shows the current region; the identifier form is
     e.g. `eu-frankfurt-1`. Confirm which region you want as primary.
7. **Availability domains** (`oci_availability_domains`)
   - Console → **Governance → Availability Domains** (or `oci iam availability-domain list`).
   - Usually three per region, e.g. `Uocm:EU-FRANKFURT-1-AD-1`, `-AD-2`, `-AD-3`.
     I need at least two for HA placement.
8. **Object storage namespace** (`oci_object_storage_namespace`)
   - Console → **Storage → Buckets** (the namespace is shown above the bucket
     list), or `oci os ns get`.
9. **Remote state credentials** (`TF_STATE_*`)
   - Create a bucket for Terraform state, e.g. **Storage → Buckets → Create bucket**
     `coregrid-tfstate` (private, versioning **enabled**).
   - Enable S3 compatibility for the automation user:
     **Identity → Users → coregrid-terraform → Customer secret keys → Generate secret key**
     → copy the **Access key** and **Secret key**.
   - Endpoint for the backend: `https://<NAMESPACE>.compat.objectstorage.<REGION>.oraclecloud.com`
     (see `backend.hcl.example` for the required `skip_*` and `use_path_style` flags).
   - Alternative: Cloudflare **R2** (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`,
     region `auto`) if you prefer to keep state next to your DNS.


## 3. Cloudflare — global traffic layer

Dashboard: <https://dash.cloudflare.com>.

1. **Zone ID** (`TF_VAR_cloudflare_zone_id`) — select your domain → **Overview**
   → right sidebar → *API* → **Zone ID**.
2. **Account ID** (`TF_VAR_cloudflare_account_id`) — same sidebar → **Account ID**
   (also shown on the account home).
3. **Scoped API token** (`TF_VAR_cloudflare_api_token`)
   - Profile menu → **My Profile → API Tokens → Create Token → Create Custom Token**.
   - Permissions (add only what the traffic layer needs):
     - `Zone → DNS → Edit`
     - `Zone → Zone Settings → Edit`
     - `Account → Load Balancing → Edit` *(only if your plan includes Load Balancing)*
     - optional: `Zone → Zone WAF → Edit`
   - Zone Resources: **Include → Specific zone → your domain**.
   - Account Resources: **Include → your account**.
   - **Continue to summary → Create Token** → copy once.
   - Never use the Global API Key, and never grant `Zone → Zone → Edit`
     (it can delete the zone).
4. **Load Balancing entitlement** — please confirm whether your plan includes Load
   Balancing. If it does not, I will keep the traffic layer on **DNS + proxy +
   cache + WAF rules + health checks via DNS failover**, mark LB as plan-gated, and
   the managed origin pool becomes a documented follow-up rather than a silent failure.

## 4. Hetzner — elastic compute fabric (CF-5, after CF-4)

1. Cloud Console: <https://console.hetzner.cloud> → **New Project** (`coregrid`).
2. Project → **Security → API tokens → Generate API token**:
   - name `coregrid-terraform`, permission **Read & Write** (project-scoped).
   - Copy it once. It cannot see other projects — verify that claim in the UI.
3. **Worker SSH key** (`TF_VAR_hetzner_ssh_public_key`)
   - Locally: `ssh-keygen -t ed25519 -C coregrid-worker -f ~/.ssh/coregrid_worker`
   - Paste the **public** key (`~/.ssh/coregrid_worker.pub`) into the secret.
     The private key never leaves your machine (it is only needed if you ever want
     to log into a worker manually).

## 5. Vultr — global edge fabric (CF-6)

1. <https://my.vultr.com> → **Account → API** → enable the API.
2. Copy the **Personal Access Token**, or (better) **Add API Key** with an IP
   allowlist and only these permissions: `Instances` (read/write), `Firewall`
   (read/write), `DNS` (read/write only if you want Vultr DNS — Cloudflare is the
   DNS authority, so this can stay off).
3. Confirm which regions you want enabled: `jnb` (Johannesburg), `ams` (Amsterdam),
   `sgp` (Singapore) are my defaults.

## 6. n8n — automation executor (CF-8, after the cluster exists)

1. Choose the hostname (e.g. `automation.<domain>`) — DNS is created by Terraform
   through the Cloudflare token above, so no separate action is needed.
2. Generate the encryption key locally and store it as `N8N_ENCRYPTION_KEY`:
   ```bash
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   # or: openssl rand -hex 32
   ```
   - Losing this key invalidates every credential n8n has stored — back it up in
     the same secret manager as the rest.
3. Its PostgreSQL and Redis are **provisioned in-cluster by Terraform** (isolated
   from tenant data), so they are outputs — you do not need to supply them.

## 7. Optional layers — Hermes / Jarvis (only if you choose to run them)

- Provide `HERMES_ENDPOINT` + `HERMES_API_KEY` and/or
  `JARVIS_ENDPOINT` + `JARVIS_API_KEY`, **or say "skip"**.
- If you skip them, nothing changes functionally: the fabric and the runtimes keep
  running, and the degraded-mode obligation in the blueprint stays satisfied.
- If you provide them, they are wired as **adapters behind health-gated routing**,
  never as a dependency.

## 8. Verify before we apply (no secrets leave your machine/vault)

Local operator machine (PowerShell shown; bash equivalent works):

```powershell
$env:TF_VAR_supabase_project_ref="<ref>"
$env:TF_VAR_supabase_access_token="<token>"
$env:SUPABASE_DB_URL="postgresql://postgres:<pw>@db.<ref>.supabase.co:5432/postgres?sslmode=require"

npm run preflight:infrastructure -- --wave=cf7      # live, read-only probe
npm run preflight:infrastructure                    # all waves, names the blockers
```

Expected: `OK presence:cf7 …`, `OK live:cf7:supabase-project …`,
`OK live:cf7:database-url-shape …`. The proof lands in
`architecture/proofs/infrastructure-preflight.proof.json`.

For the OCI/Hetzner/Vultr/Cloudflare waves, set the corresponding `TF_VAR_*`
names the same way, then:

```powershell
npm run preflight:infrastructure -- --wave=cf4
```

## 9. Rotation and revocation (do this as a habit)

| Secret | Rotate | Revoke path |
| --- | --- | --- |
| Supabase access token | after CF-7, and quarterly | Account → Access Tokens → revoke |
| OCI API key | 90 days | User → API keys → delete key |
| Hetzner token | 90 days | Project → Security → API tokens → delete |
| Vultr API key | 90 days | Account → API → delete key |
| Cloudflare token | 90 days | My Profile → API Tokens → roll/delete |
| `SUPABASE_DB_URL` password | on personnel change | Database → Reset password |
| `N8N_ENCRYPTION_KEY` | only with a re-encryption plan | n/a (back it up) |
| State access keys | 90 days | OCI Customer secret keys / R2 token → delete |

After any rotation, re-run `npm run preflight:infrastructure` — the doctor will
tell you immediately whether the new value still authenticates and still has the
right scope.

