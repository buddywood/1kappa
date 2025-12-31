# Vercel Wildcard Subdomains Configuration

## Issue
Seller subdomains in preview environment (e.g., `kappa-gear.preview.one-kappa.com`) are throwing 443 errors.

## Root Cause
Wildcard subdomains require DNS and Vercel domain configuration to work properly.

## Solution

### 1. DNS Configuration

Add a wildcard DNS record for preview subdomains:

**DNS Record Type:** `CNAME` or `A` (depending on your DNS provider)

**For Preview Environment:**
- **Name/Host:** `*.preview` (or `*.preview.one-kappa.com` depending on DNS provider)
- **Value/Target:** Vercel's domain (usually `cname.vercel-dns.com` or similar)
- **TTL:** 3600 (or default)

**Example DNS Records:**
```
*.preview.one-kappa.com  CNAME  cname.vercel-dns.com
preview.one-kappa.com    CNAME  cname.vercel-dns.com
```

### 2. Vercel Domain Configuration

1. Go to **Vercel Dashboard** → **Your Project** → **Settings** → **Domains**
2. Add the wildcard domain:
   - Click **Add Domain**
   - Enter: `*.preview.one-kappa.com`
   - Vercel will verify DNS configuration
3. Ensure SSL certificate is provisioned (automatic for verified domains)

### 3. Verify Domain Setup

Check that Vercel recognizes the domain:
```bash
cd frontend
vercel domains ls
```

### 4. Test DNS Resolution

```bash
# Test if DNS resolves correctly
dig kappa-gear.preview.one-kappa.com
nslookup kappa-gear.preview.one-kappa.com
```

Expected: Should resolve to Vercel's IP addresses or CNAME target.

## Middleware Configuration

The middleware has been updated to handle nested subdomains:
- `kappa-gear.preview.one-kappa.com` → extracts `kappa-gear` as the subdomain
- Routes to `/collections/slug/kappa-gear`

## Troubleshooting

### 443 Error (SSL/TLS)
- **Cause:** DNS not configured or SSL certificate not provisioned
- **Fix:** 
  1. Verify DNS wildcard record exists
  2. Wait for DNS propagation (can take up to 48 hours)
  3. Check Vercel domain status shows "Valid Configuration"
  4. Ensure SSL certificate is active in Vercel dashboard

### 404 Error (Not Found)
- **Cause:** Middleware not routing correctly
- **Fix:** Check middleware logs in Vercel function logs
- Look for: `[Middleware] Host: ...` log messages

### Domain Not Resolving
- **Cause:** DNS record not created or incorrect
- **Fix:**
  1. Verify DNS record exists in your DNS provider
  2. Check record type (CNAME vs A)
  3. Verify TTL has expired (or wait for propagation)

## Production vs Preview

**Production:**
- Subdomains: `seller.one-kappa.com`
- DNS: `*.one-kappa.com` → Vercel

**Preview:**
- Subdomains: `seller.preview.one-kappa.com`
- DNS: `*.preview.one-kappa.com` → Vercel

Both need separate wildcard DNS records.

## Quick Checklist

- [ ] DNS wildcard record `*.preview.one-kappa.com` created
- [ ] DNS record points to Vercel (CNAME or A record)
- [ ] Domain added in Vercel dashboard: `*.preview.one-kappa.com`
- [ ] SSL certificate provisioned (check Vercel dashboard)
- [ ] DNS propagation complete (test with `dig` or `nslookup`)
- [ ] Middleware updated (already done in code)
- [ ] Test subdomain: `https://kappa-gear.preview.one-kappa.com`

## Testing

Once DNS is configured:

1. **Test DNS:**
   ```bash
   dig kappa-gear.preview.one-kappa.com +short
   ```

2. **Test HTTPS:**
   ```bash
   curl -I https://kappa-gear.preview.one-kappa.com
   ```

3. **Check Vercel Logs:**
   - Vercel Dashboard → Project → Functions → View Logs
   - Look for middleware log messages

## Notes

- DNS propagation can take 24-48 hours
- Vercel automatically provisions SSL certificates for verified domains
- Wildcard subdomains require wildcard DNS records
- The middleware code handles the routing once DNS/SSL is configured

