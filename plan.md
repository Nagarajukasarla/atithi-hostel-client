# Atithi Frontend AWS Deployment — Master Architectural & Execution Plan

> **Note**: This master plan is maintained in [`terraform/plan.md`](file:///d:/resource/Projects/Hostel%20Management/atithi/terraform/plan.md).

Please refer to the full document at:
[Atithi Frontend Terraform Master Plan](file:///d:/resource/Projects/Hostel%20Management/atithi/terraform/plan.md)

---

## Master Implementation Checklist

| Step | Action Item | Assigned To | Status | Details |
| :---: | :--- | :---: | :---: | :--- |
| **1** | **Update AWS IAM OIDC Trust Policy** | 👤 **USER** | ✅ **DONE** | Authorized `atithi-hostel-client` in `atithi-github-actions-role` trust policy. |
| **2** | **Frontend Code Auto-Config & Dev Proxy (`pnpm`)** | 🤖 **AGENT** | ✅ **DONE** | Updated `axiosInstance.ts` (`/api/v1` fallback), `vite.config.ts` (dev proxy), verified `pnpm run build` succeeds (31s, 0 errors). |
| **3** | **Backend ALB Protection & Secret Verification** | 🤖 **AGENT** | ✅ **DONE & VERIFIED** | Deployed listener rules (Rules 10, 20, 500). Direct `/api/*` blocked with `403 Forbidden`; header `X-Origin-Verify` forwards to Spring Boot. |
| **4** | **Frontend Terraform Infrastructure (`atithi/terraform/`)** | 🤖 **AGENT** | ✅ **DONE & LIVE** | Provisioned S3 (`atithi-frontend-551626543871`) & CloudFront (`d2dk2x85a04vx5.cloudfront.net`, Dist ID: `E3IJXZS95HCP8S`). |
| **5** | **GitHub Actions Workflows (Strictly `pnpm`)** | 🤖 **AGENT** | ✅ **DONE** | Created `.github/workflows/frontend-ci.yml` and `frontend-cd.yml` with `pnpm/action-setup@v4`. |
| **6** | **Set GitHub Repository Variables** | 👤 **USER** | ⏳ **ACTION REQUIRED NOW** | In GitHub `atithi-hostel-client` Settings, add `AWS_ROLE_ARN` (`arn:aws:iam::551626543871:role/atithi-github-actions-role`). |
| **7** | **Push to GitHub & Live Verification** | 👤 + 🤖 | ⏳ **UPCOMING** | Push to `master`, monitor workflow, verify live CloudFront HTTPS site, and verify direct ALB 403 block. |

---

### Step 1 Detail for the USER:
**Where**: AWS IAM Console ➔ Roles ➔ [`atithi-github-actions-role`](https://console.aws.amazon.com/iam/home#/roles/atithi-github-actions-role)  
**Tab**: **Trust relationships** ➔ Click **Edit trust policy**  
**Action**: Replace the policy with this JSON to authorize both backend and frontend repositories:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::551626543871:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": [
                        "repo:Nagarajukasarla/atithi-hostel-server:*",
                        "repo:Nagarajukasarla/atithi-hostel-client:*"
                    ]
                }
            }
        }
    ]
}
```
