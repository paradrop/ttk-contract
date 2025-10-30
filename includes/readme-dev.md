# Developer Documentation

## Overview

This WordPress plugin provides REST API endpoints for generating contract documents. This document outlines the development setup, usage examples, and future work items.

---

## Installation & Setup

### WordPress Version Requirements

- **Minimum WordPress Version:** 5.6 or higher
- **Recommended WordPress Version:** 6.0 or higher
- **PHP Version:** 7.4 or higher (8.0+ recommended)

### Plugin Activation Steps

1. **Clone or Download the Plugin**
   ```bash
   cd /path/to/wordpress/wp-content/plugins/
   git clone <repository-url> wp-contract-generator
   # Or extract the plugin ZIP file to wp-content/plugins/
   ```

2. **Plugin Placement**
   
   The plugin must be placed in the WordPress plugins directory:
   ```
   wp-content/
   └── plugins/
       └── wp-contract-generator/
           ├── includes/
           │   └── readme-dev.md (this file)
           ├── plugin-main.php
           └── ... (other plugin files)
   ```

3. **Activate the Plugin**
   
   Via WordPress Admin:
   - Navigate to **Plugins > Installed Plugins**
   - Locate "WP Contract Generator" (or the plugin name)
   - Click **Activate**
   
   Via WP-CLI:
   ```bash
   wp plugin activate wp-contract-generator
   ```

4. **Verify Activation**
   
   Check that the plugin is active:
   ```bash
   wp plugin list --status=active
   ```

---

## REST API Usage

### Authentication

The plugin uses WordPress nonce-based authentication for REST API requests. You must obtain a valid nonce before making API calls.

#### Obtaining a Nonce

**Method 1: Via Logged-in Browser Session**

Open your browser's developer console while logged into WordPress and run:
```javascript
fetch('/wp-admin/admin-ajax.php?action=rest-nonce')
  .then(response => response.json())
  .then(data => console.log('Nonce:', data.nonce));
```

**Method 2: Via WordPress Frontend (if exposed)**

Add a nonce to your frontend JavaScript using `wp_localize_script`:
```php
wp_localize_script('your-script', 'wpApiSettings', array(
    'nonce' => wp_create_nonce('wp_rest')
));
```

**Method 3: Via WP-CLI (for testing)**

You can temporarily add a test endpoint or use WordPress authentication cookies.

---

### Example: Generate Contract Document

#### Request Headers

All REST API requests must include the following headers:

- `Content-Type: application/json` - Indicates JSON payload
- `X-WP-Nonce: <your-nonce-here>` - WordPress REST API nonce for authentication

#### Sample cURL Command

```bash
curl -X POST https://your-wordpress-site.com/wp-json/contract-generator/v1/generate \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: abc123def456ghi789" \
  -d '{
    "contract_type": "service_agreement",
    "parties": {
      "provider": {
        "name": "María García López",
        "company": "Soluciones Tecnológicas S.A.",
        "address": "Calle Principal 123, Madrid, España",
        "tax_id": "B12345678"
      },
      "client": {
        "name": "François Dubois",
        "company": "Innovatech SARL",
        "address": "15 Rue de la Paix, Paris, France",
        "tax_id": "FR98765432101"
      }
    },
    "terms": {
      "start_date": "2024-01-15",
      "end_date": "2025-01-14",
      "payment_amount": "5000.00",
      "currency": "EUR",
      "payment_schedule": "monthly",
      "services_description": "Consultoría de desarrollo de software y mantenimiento de sistemas"
    },
    "metadata": {
      "created_by": "admin",
      "department": "Legal",
      "reference_number": "CONTRACT-2024-001"
    }
  }'
```

#### Sample Response

```json
{
  "success": true,
  "contract_id": "contract_67890abcdef",
  "generated_at": "2024-01-10T14:30:00Z",
  "generated_document": "UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAAC...",
  "document_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "filename": "service_agreement_2024-01-10.docx",
  "metadata": {
    "contract_type": "service_agreement",
    "parties_count": 2,
    "generated_by": "WP Contract Generator v1.0",
    "schema_version": "1.0"
  }
}
```

#### Response Fields

- `success` (boolean): Indicates if the contract generation was successful
- `contract_id` (string): Unique identifier for this contract
- `generated_at` (string): ISO 8601 timestamp of generation
- `generated_document` (string): Base64-encoded document content
- `document_type` (string): MIME type of the generated document
- `filename` (string): Suggested filename for the document
- `metadata` (object): Additional metadata about the generated contract

---

### Decoding the Generated Document

The `generated_document` field contains a Base64-encoded document (typically a DOCX file). You can decode and save it using command-line utilities.

#### Using `base64` Command (Linux/macOS)

**Option 1: Direct pipe to file**
```bash
echo "UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAAC..." | base64 --decode > contract.docx
```

**Option 2: Extract from JSON response**
```bash
curl -X POST https://your-wordpress-site.com/wp-json/contract-generator/v1/generate \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: abc123def456ghi789" \
  -d @contract-request.json \
  | jq -r '.generated_document' \
  | base64 --decode > contract.docx
```

**Option 3: Using a complete script**
```bash
#!/bin/bash
# Save this as generate-contract.sh

NONCE="your-nonce-here"
API_URL="https://your-wordpress-site.com/wp-json/contract-generator/v1/generate"
OUTPUT_FILE="contract_$(date +%Y%m%d_%H%M%S).docx"

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" \
  -d @contract-request.json)

echo "$RESPONSE" | jq -r '.generated_document' | base64 --decode > "$OUTPUT_FILE"

echo "Contract saved to: $OUTPUT_FILE"
```

#### Using PowerShell (Windows)

```powershell
$base64String = "UEsDBBQABgAIAAAAIQDfpNJsWgEAACAFAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAAC..."
$bytes = [Convert]::FromBase64String($base64String)
[IO.File]::WriteAllBytes("contract.docx", $bytes)
```

#### Using Python

```python
import base64
import json

# From API response
with open('response.json', 'r') as f:
    response = json.load(f)

document_data = base64.b64decode(response['generated_document'])

with open('contract.docx', 'wb') as f:
    f.write(document_data)

print("Contract saved to contract.docx")
```

---

## Development Cautions

### Nonce Retrieval

⚠️ **Important Security Considerations:**

- Nonces are user-specific and expire after 24 hours (by default)
- Never hardcode nonces in production code
- In development, you must obtain a fresh nonce for each testing session
- For automated testing, consider using WordPress Application Passwords (WordPress 5.6+)

**Obtaining Nonces Programmatically:**

```php
// In your theme or plugin
function get_rest_nonce() {
    return wp_create_nonce('wp_rest');
}
```

### WP_DEBUG Logging Policy

When developing with `WP_DEBUG` enabled:

```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Logging Guidelines:**

- ✅ **DO:** Log validation errors, API failures, and system warnings
- ✅ **DO:** Use `error_log()` for debugging information
- ❌ **DON'T:** Log sensitive user data (PII, passwords, tokens)
- ❌ **DON'T:** Log full document contents (large payloads)
- ❌ **DON'T:** Leave verbose logging enabled in production

**Example Logging:**

```php
// Good - logs error context without PII
error_log('Contract generation failed: Invalid party data structure');

// Bad - logs sensitive data
error_log('Contract generation failed for user: ' . $user_email);
```

### No Composer Dependencies

⚠️ **Dependency Management:**

This plugin is designed to work **without Composer dependencies** to ensure:
- Easy deployment to shared hosting environments
- No conflicts with other plugins' dependencies
- Minimal installation complexity
- Compatibility with WordPress.org plugin directory requirements

**Implications:**

- All functionality must use WordPress core APIs or pure PHP
- No external libraries for document generation (use native PHP approaches)
- JSON schema validation must be implemented using native PHP
- Any required utilities should be included directly in the plugin

**If you need external functionality:**

1. Check if WordPress core provides an equivalent API
2. Implement it using native PHP if complexity is low
3. Consider including a standalone, single-file library (with proper licensing)
4. Document any manual file inclusions in this readme

---

## Testing the API

### Quick Test Script

Create a file `test-api.sh` for rapid testing:

```bash
#!/bin/bash

# Configuration
WP_URL="http://localhost/wordpress"
NONCE="your-nonce-here"

# Test 1: Health check (if implemented)
echo "=== Testing Health Endpoint ==="
curl -X GET "$WP_URL/wp-json/contract-generator/v1/health"
echo -e "\n"

# Test 2: Generate contract
echo "=== Testing Contract Generation ==="
curl -X POST "$WP_URL/wp-json/contract-generator/v1/generate" \
  -H "Content-Type: application/json" \
  -H "X-WP-Nonce: $NONCE" \
  -d '{
    "contract_type": "service_agreement",
    "parties": {
      "provider": {
        "name": "Ángela Müller",
        "company": "TechConsult GmbH"
      },
      "client": {
        "name": "Håkan Svensson",
        "company": "Nordic Solutions AB"
      }
    }
  }' | jq '.'

echo -e "\n"
```

### UTF-8 Testing

Ensure your API handles international characters correctly by testing with various UTF-8 names:

- **Spanish:** María García, José Hernández
- **French:** François Dubois, Amélie Rousseau
- **German:** Jürgen Müller, Björn Schmidt
- **Swedish:** Håkan Svensson, Åsa Lindström
- **Chinese:** 王伟 (Wáng Wěi), 李娜 (Lǐ Nà)
- **Arabic:** محمد أحمد (Muhammad Ahmad)
- **Cyrillic:** Александр Иванов (Aleksandr Ivanov)

**Sample UTF-8 Test Request:**

```bash
curl -X POST https://your-wordpress-site.com/wp-json/contract-generator/v1/generate \
  -H "Content-Type: application/json; charset=utf-8" \
  -H "X-WP-Nonce: abc123def456ghi789" \
  -d '{
    "contract_type": "service_agreement",
    "parties": {
      "provider": {
        "name": "Ángela Müller-Søndergård",
        "company": "Интернациональные Решения Oy"
      },
      "client": {
        "name": "王伟",
        "company": "上海科技有限公司"
      }
    }
  }'
```

---

## TODO: Future Work Items

### High Priority

- [ ] **Real DOCX Generation**
  - Implement native PHP DOCX generation (without Composer dependencies)
  - Support for headers, footers, and custom styling
  - Template system for different contract types
  - Table support for complex data layouts
  - Signature field placeholders

- [ ] **Data Persistence**
  - Create custom database tables for contract storage
  - Implement contract history and versioning
  - Add contract status tracking (draft, pending, signed, expired)
  - Store document metadata separately from binary data
  - Implement contract search and filtering

- [ ] **Security Hardening**
  - Input sanitization for all fields (prevent XSS, SQL injection)
  - Implement capability checks (e.g., `manage_contracts` capability)
  - Rate limiting per user/IP address
  - CSRF protection beyond nonces
  - Validate file uploads if template system is added
  - Implement content security policies
  - Add audit logging for sensitive operations

### Medium Priority

- [ ] **Rate Limiting**
  - Implement per-user rate limits (e.g., 10 requests/minute)
  - IP-based rate limiting for unauthenticated requests
  - Configurable limits via plugin settings
  - Graceful degradation with informative error messages
  - Admin dashboard for monitoring API usage

- [ ] **Enhanced Validation**
  - JSON schema validation for request payloads
  - Custom validation rules per contract type
  - Date range validation
  - Currency and amount format validation
  - Tax ID format validation per country

- [ ] **Error Handling & Logging**
  - Structured error responses with error codes
  - Detailed error messages for development mode
  - Generic error messages for production
  - Comprehensive logging system (without PII)
  - Integration with WordPress error monitoring

- [ ] **Admin Dashboard**
  - Settings page for plugin configuration
  - Contract management interface
  - Usage statistics and analytics
  - Bulk operations (export, delete, archive)
  - User permissions management

### Low Priority

- [ ] **Document Features**
  - PDF export option
  - Digital signature integration
  - E-signature API integration (DocuSign, Adobe Sign)
  - Multi-language contract templates
  - Custom branding/logo support

- [ ] **API Enhancements**
  - Batch contract generation endpoint
  - Contract template management API
  - Webhook notifications for contract events
  - GraphQL endpoint (alternative to REST)
  - API versioning strategy

- [ ] **Developer Experience**
  - WP-CLI commands for contract management
  - PHPUnit test suite
  - Integration test examples
  - Postman/Insomnia collection
  - OpenAPI/Swagger documentation
  - Developer sandbox environment

- [ ] **Performance Optimization**
  - Caching layer for frequently generated contracts
  - Async job processing for large contracts
  - Database query optimization
  - CDN integration for document delivery
  - Lazy loading for admin interface

- [ ] **Compliance & Legal**
  - GDPR compliance tools (data export, deletion)
  - Retention policy configuration
  - Legal disclaimer templates
  - Jurisdiction-specific contract templates
  - Electronic signature compliance (eIDAS, ESIGN)

### Nice to Have

- [ ] **Internationalization (i18n)**
  - Translate plugin UI to multiple languages
  - RTL (right-to-left) language support
  - Locale-specific date/number formatting

- [ ] **Integration Points**
  - CRM integration (Salesforce, HubSpot)
  - Cloud storage integration (Google Drive, Dropbox)
  - Email service integration (SendGrid, Mailgun)
  - Calendar integration for contract dates

- [ ] **Mobile Support**
  - Responsive admin interface
  - Mobile-friendly contract preview
  - Progressive Web App (PWA) capabilities

---

## Development Workflow

### Local Development Setup

1. **Install WordPress locally** using one of:
   - [Local by Flywheel](https://localwp.com/)
   - [XAMPP](https://www.apachefriends.org/)
   - [Docker](https://hub.docker.com/_/wordpress)

2. **Clone the plugin** to `wp-content/plugins/`

3. **Enable debugging** in `wp-config.php`:
   ```php
   define('WP_DEBUG', true);
   define('WP_DEBUG_LOG', true);
   define('WP_DEBUG_DISPLAY', false);
   define('SCRIPT_DEBUG', true);
   ```

4. **Activate the plugin** and test the endpoints

### Code Style Guidelines

- Follow [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/)
- Use proper PHPDoc comments for all functions
- Sanitize all inputs: `sanitize_text_field()`, `sanitize_email()`, etc.
- Escape all outputs: `esc_html()`, `esc_url()`, `esc_attr()`
- Use WordPress core functions whenever possible

### Testing Checklist

Before committing changes:

- [ ] Test with `WP_DEBUG` enabled
- [ ] Test with UTF-8 characters in all fields
- [ ] Test with invalid/malicious inputs
- [ ] Test with different user roles (admin, editor, subscriber)
- [ ] Test with expired nonces
- [ ] Verify no PHP warnings or notices
- [ ] Check debug.log for unexpected errors

---

## Troubleshooting

### Common Issues

**Issue: "nonce verification failed"**
- **Cause:** Expired or invalid nonce
- **Solution:** Generate a fresh nonce from a logged-in WordPress session

**Issue: "REST API is disabled"**
- **Cause:** REST API is disabled by another plugin or theme
- **Solution:** Check for plugins/themes that modify REST API functionality

**Issue: "Insufficient permissions"**
- **Cause:** User doesn't have required capabilities
- **Solution:** Ensure user is logged in with appropriate role (admin/editor)

**Issue: "Invalid JSON"**
- **Cause:** Malformed JSON in request body
- **Solution:** Validate JSON using `jq` or online validators

**Issue: "Generated document is corrupted"**
- **Cause:** Base64 encoding/decoding issues
- **Solution:** Ensure no extra whitespace in base64 string, use `--decode` flag

---

## Resources

### WordPress Developer References

- [REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Plugin Handbook](https://developer.wordpress.org/plugins/)
- [Coding Standards](https://developer.wordpress.org/coding-standards/)
- [Common APIs](https://codex.wordpress.org/WordPress_APIs)

### Tools & Utilities

- [WP-CLI](https://wp-cli.org/) - Command-line interface for WordPress
- [Query Monitor](https://wordpress.org/plugins/query-monitor/) - Debugging plugin
- [Postman](https://www.postman.com/) - API testing tool
- [jq](https://stedolan.github.io/jq/) - JSON processor

---

## Support & Contributing

### Getting Help

- Check the debug log: `wp-content/debug.log`
- Enable `WP_DEBUG` for detailed error messages
- Review WordPress REST API documentation
- Test endpoints using browser DevTools

### Contributing

When contributing code:

1. Follow WordPress coding standards
2. Include PHPDoc comments
3. Add validation for all inputs
4. Test with various user roles and permissions
5. Update this documentation for new features
6. Do not introduce Composer dependencies

---

## License

[Specify your license here - GPL v2 or later is common for WordPress plugins]

---

## Changelog

### Version 1.0.0
- Initial development version
- Basic REST API endpoint structure
- Nonce-based authentication

---

**Last Updated:** 2024-01-10  
**Maintained By:** Development Team  
**Contact:** [Your contact information]
