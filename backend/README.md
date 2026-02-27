# flux-energy-audit-
A web-based home energy audit toolkit focused on energy literacy and sustainable consumption.

## Cost estimation with tariff sources

The endpoint `POST /api/costs/estimate` supports two tariff sources:

- `external`: third-party tariff API response
- `local`: built-in local slab table
- `local_fallback`: third-party API attempted but failed, so local tariff used

### Optional environment variables for third-party tariff API

- `USE_TARIFF_API=true`
- `TARIFF_API_URL=https://your-provider.example.com`
- `TARIFF_API_KEY=your_api_key` (optional)
