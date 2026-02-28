# GHL India Ventures — Email DNS Configuration

## Domain: ghlindiaventures.com
## Email From: noreply@ghlindiaventures.com

---

## Step 1: Verify Domain in Resend

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `ghlindiaventures.com`
4. Resend will provide specific DNS records to add

---

## Step 2: Add DNS Records at Domain Registrar

Add these records at your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

### SPF Record (Prevents email spoofing)
| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` |

### DKIM Record (Email authentication)
| Type | Host/Name | Value |
|------|-----------|-------|
| CNAME | `resend._domainkey` | *(Provided by Resend dashboard after domain verification)* |

### DMARC Record (Policy enforcement)
| Type | Host/Name | Value |
|------|-----------|-------|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@ghlindiaventures.com` |

### Resend Verification Record
| Type | Host/Name | Value |
|------|-----------|-------|
| TXT or CNAME | *(Provided by Resend)* | *(Provided by Resend)* |

---

## Step 3: Set Environment Variable on Netlify

1. Go to https://app.netlify.com/projects/ghl-india-ventures-2025/configuration/env
2. Add: `RESEND_API_KEY` = *(your Resend API key from https://resend.com/api-keys)*

---

## Step 4: Verify

After DNS propagation (up to 48 hours):
1. Check Resend dashboard — domain should show "Verified"
2. Submit a test form on the website
3. Verify email arrives from `noreply@ghlindiaventures.com`

---

## Current Email Templates

Located in `netlify/functions/lead-notification.ts`:

1. **Team Notification** — Sent to admin team when new lead arrives
2. **Client Confirmation** — Sent to visitor after form submission

### Recipients:
- `ghlindiaventures@gmail.com`
- `leads@ghlindiaventures.com`
- `aby777333@gmail.com`
