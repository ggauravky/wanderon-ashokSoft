# QUOTATION PRICING ENGINE & RBAC CONCESSION ARCHITECTURE REPORT (PHASE 3)

**Document Version:** 3.0.0  
**Status:** IMPLEMENTED & FULLY VERIFIED  
**System Area:** Quotation Builder • Authoritative Dynamic Pricing Engine • Multi-City Stays • RBAC Concessions  

---

## 1. Executive Summary

Phase 3 implements an authoritative, deterministic **Travel Dynamic Pricing Engine** combined with **Role-Based Commercial Concession Controls** and **Immutable Proposal Versioning**.

### Key Architectural Pillars:
1. **Server-Authoritative Anti-Tamper Engine**: The backend never accepts client-computed `subtotal`, `taxableAmount`, or `finalTotal`. Prices are calculated deterministically on the server from raw line items.
2. **Multi-Segment Hotel Grouping**: Supports multi-city journeys (e.g., Manali 2 Nights + Kasol 2 Nights), where alternative hotel tiers (Standard / Deluxe / Luxury) can be compared per city, and only the selected hotel per segment contributes to the package price.
3. **Structured Age-Based Pax Costing**:
   - **Adults (12+ yrs)**: $100\%$ base multiplier.
   - **Children (5–11 yrs)**: $70\%$ multiplier on per-person items (`childMultiplier: 0.70`).
   - **Infants (<5 yrs)**: $0\%$ rate (`infantMultiplier: 0.0`).
4. **Structured Fleet & Add-ons Engine**: Multi-mode pricing across `PER_PERSON`, `PER_NIGHT`, `PER_VEHICLE`, and `FIXED` units.
5. **RBAC Sales Concession Policy**:
   - `sales` role: Hard limit of **10% maximum discount** (or ₹10,000 flat) and **30% maximum markup**. Violations trigger `403 Forbidden` with manager elevation requirements.
   - `admin`, `super_admin`, `operations`: Unrestricted.
6. **Immutable Price Snapshots & Revisions**:
   - Transition to `SENT` freezes an immutable `priceSnapshot`.
   - Modifying a sent quote requires explicit revision creation (`/create-revision`), archiving the historical snapshot and incrementing the version ($v1 \rightarrow v2$).
7. **Zero-Leakage Customer Proposal Sanitization**: Unconditionally strips internal supplier costs, vendor identities, margins, and audit trails before delivery to travelers.

---

## 2. Canonical Pricing Mathematical Formulas

### 2.1 Effective Paying Travelers Calculation
$$\text{EffectivePax} = (\text{Adults} \times 1.0) + (\text{Children} \times 0.70) + (\text{Infants} \times 0.0)$$

### 2.2 Component Totals

#### Hotel Total ($P_{\text{hotel}}$)
For each stay segment $s \in S$:
$$P_{\text{hotel}, s} = \text{Rooms}_s \times \text{Nights}_s \times \text{PricePerNight}_s$$
$$P_{\text{hotel}} = \sum_{s \in S} P_{\text{hotel}, s} \quad (\text{for selected options only})$$

#### Transport Total ($P_{\text{transport}}$)
$$P_{\text{transport}} = \sum_{t \in T_{\text{selected}}} (\text{Quantity}_t \times \text{UnitPrice}_t)$$

#### Activities Total ($P_{\text{activities}}$)
For each selected activity $a \in A$:
$$P_{a} = \begin{cases} 
\text{UnitPrice}_a \times \text{EffectivePax} \times \text{Quantity}_a & \text{if } \text{pricingType} = \text{PER\_PERSON} \\
\text{UnitPrice}_a \times \text{Quantity}_a & \text{if } \text{pricingType} \in \{\text{PER\_VEHICLE}, \text{FIXED}\}
\end{cases}$$
$$P_{\text{activities}} = \sum_{a \in A_{\text{selected}}} P_{a}$$

#### Add-ons Total ($P_{\text{addons}}$)
For each selected add-on $o \in O$:
$$P_{o} = \begin{cases} 
\text{UnitPrice}_o \times \text{EffectivePax} \times \text{Quantity}_o & \text{if } \text{pricingType} = \text{PER\_PERSON} \\
\text{UnitPrice}_o \times \text{Nights} \times \text{Quantity}_o & \text{if } \text{pricingType} = \text{PER\_NIGHT} \\
\text{UnitPrice}_o \times \text{Quantity}_o & \text{if } \text{pricingType} \in \{\text{PER\_VEHICLE}, \text{FIXED}\}
\end{cases}$$
$$P_{\text{addons}} = \sum_{o \in O_{\text{selected}}} P_{o}$$

### 2.3 Gross Subtotal ($S$)
$$S = P_{\text{base}} + P_{\text{hotel}} + P_{\text{transport}} + P_{\text{activities}} + P_{\text{addons}}$$

### 2.4 Markups ($M$) & Commercial Discounts ($D$)
$$M = \begin{cases} 
S \times \left(\frac{\text{MarkupPercent}}{100}\right) & \text{if } \text{markupType} = \text{percentage} \\
\text{MarkupValue} & \text{if } \text{markupType} = \text{fixed} \\
0 & \text{otherwise}
\end{cases}$$

$$D = \begin{cases} 
(S + M) \times \left(\frac{\text{DiscountValue}}{100}\right) & \text{if } \text{discountType} = \text{percentage} \\
\min(\text{DiscountValue}, S + M) & \text{if } \text{discountType} = \text{flat} \\
0 & \text{otherwise}
\end{cases}$$

### 2.5 Taxable Base ($T$) & Tour Operator Taxes
$$T = \max(0, S + M - D)$$
$$\text{GST Amount} = \text{round}\left(T \times \frac{\text{GSTPercent}}{100}\right) \quad (\text{Default } 5\% \text{ for Tour Packages})$$
$$\text{TCS Amount} = \text{round}\left(T \times \frac{\text{TCSPercent}}{100}\right) \quad (\text{For International / Applicable Outbound})$$

### 2.6 Final Customer Total & Payment Terms
$$\text{FinalTotal} = T + \text{GST Amount} + \text{TCS Amount}$$
$$\text{DepositRequired} = \text{round}\left(\text{FinalTotal} \times \frac{\text{DepositPercent}}{100}\right) \quad (\text{Default } 10\%)$$
$$\text{BalanceAmount} = \text{FinalTotal} - \text{DepositRequired} \quad (\text{Due } 6 \text{ days prior})$$

### 2.7 Traveler Age Breakdown
$$\text{AdultPrice} = \text{round}\left(\frac{\text{FinalTotal}}{\text{EffectivePax}}\right)$$
$$\text{ChildPrice} = \text{round}(\text{AdultPrice} \times 0.70)$$
$$\text{InfantPrice} = 0$$
$$\text{AdultTotal} = \text{AdultPrice} \times \text{Adults}$$
$$\text{ChildTotal} = \text{ChildPrice} \times \text{Children}$$
$$\text{InfantTotal} = 0$$

### 2.8 Staff-Only Profitability & Margin
$$\text{TotalInternalCost} = C_{\text{base}} + C_{\text{hotel}} + C_{\text{transport}} + C_{\text{activities}} + C_{\text{addons}}$$
$$\text{ProjectedMargin} = T - \text{TotalInternalCost}$$
$$\text{ProjectedMarginPercent} = \begin{cases} 
\text{round}\left(\left(\frac{\text{ProjectedMargin}}{T}\right) \times 100, 2\right) & \text{if } T > 0 \\
0 & \text{otherwise}
\end{cases}$$

---

## 3. RBAC Commercial Concession Policy Table

| User Role | Max Discount % | Max Flat Discount | Max Markup % | Excess Concession Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Specialist (`sales`)** | **10.0%** | **₹10,000** | **30.0%** | `403 Forbidden` ("Concession exceeds sales threshold; Manager approval required") |
| **Operations (`operations`)** | Unrestricted | Unrestricted | Unrestricted | Allowed |
| **Admin (`admin`)** | Unrestricted | Unrestricted | Unrestricted | Allowed |
| **Super Admin (`super_admin`)** | Unrestricted | Unrestricted | Unrestricted | Allowed |

---

## 4. Multi-Segment Hotel Stay Grouping Data Structure

```json
{
  "hotelOptions": [
    {
      "optionId": "manali_opt_a",
      "segmentId": "seg_manali",
      "segmentName": "Manali Stay",
      "segmentOrder": 1,
      "tier": "Deluxe",
      "hotelName": "Grand Himalayan Resort & Spa",
      "city": "Manali",
      "roomType": "Deluxe Valley View Room",
      "mealPlan": "MAP (Breakfast + Dinner)",
      "rooms": 1,
      "nights": 2,
      "pricePerNight": 5000,
      "costPerNight": 3500,
      "totalPrice": 10000,
      "selected": true
    },
    {
      "optionId": "manali_opt_b",
      "segmentId": "seg_manali",
      "segmentName": "Manali Stay",
      "segmentOrder": 1,
      "tier": "Luxury",
      "hotelName": "The Imperial Heights & Spa",
      "city": "Manali",
      "pricePerNight": 10500,
      "totalPrice": 21000,
      "selected": false
    },
    {
      "optionId": "kasol_opt_a",
      "segmentId": "seg_kasol",
      "segmentName": "Kasol Riverside Stay",
      "segmentOrder": 2,
      "tier": "Deluxe",
      "hotelName": "Parvati Valley Boutique Camp",
      "city": "Kasol",
      "rooms": 1,
      "nights": 2,
      "pricePerNight": 4000,
      "totalPrice": 8000,
      "selected": true
    }
  ]
}
```

---

## 5. Security Sanitization Matrix

The function `sanitizeForCustomer(quotationDoc)` enforces a zero-leakage security boundary:

| Schema Field | Internal Staff View | Customer View (`/quotation/:token`) |
| :--- | :--- | :--- |
| `pricing.internalBaseCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.internalHotelCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.internalTransportCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.internalActivityCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.internalAddOnCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.totalInternalCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.projectedMargin` | Visible | **STRIPPED (`undefined`)** |
| `pricing.projectedMarginPercent`| Visible | **STRIPPED (`undefined`)** |
| `pricing.markupPercent` | Visible | **STRIPPED (`undefined`)** |
| `hotelOptions[].costPerNight` | Visible (Admin/Ops) | **STRIPPED (`undefined`)** |
| `transportOptions[].unitCost` | Visible (Admin/Ops) | **STRIPPED (`undefined`)** |
| `transportOptions[].provider` | Visible | **STRIPPED (`undefined`)** |
| `activities[].unitCost` | Visible (Admin/Ops) | **STRIPPED (`undefined`)** |
| `addOns[].unitCost` | Visible (Admin/Ops) | **STRIPPED (`undefined`)** |
| `auditTrail` | Visible | **STRIPPED (`undefined`)** |
| `revisions[].priceSnapshot.totalInternalCost` | Visible | **STRIPPED (`undefined`)** |
| `pricing.finalTotal` | Visible | **Visible (Exact Authoritative Value)** |
| `pricing.depositRequired` | Visible | **Visible (10% Advance Deposit)** |

---

## 6. Verification Results

All deterministic unit tests, HTTP integration tests, and build verifications have passed with 100% success:

```
Test Suite Execution Summary:
-----------------------------------------------------------------------------------------
1. Phase 3 Dynamic Pricing & RBAC Concessions : 41 / 41 PASSED (0 FAILED)
2. Phase 2 Admin Wizard & CRM Leads Linkage   : 35 / 35 PASSED (0 FAILED)
3. Phase 1 Architecture & State Transitions   : 45 / 45 PASSED (0 FAILED)
4. HTTP API Quotations REST Endpoints         : 28 / 28 PASSED (0 FAILED)
5. Comprehensive System Regression Suite      : 82 / 82 PASSED (0 FAILED)
-----------------------------------------------------------------------------------------
TOTAL PASSED ASSERTIONS: 231 / 231 PASSED (100% GREEN)
Frontend Production Build: SUCCESS (0 errors, 2.77s build time)
```

---

## 7. Next Steps (Phase 4 Roadmap)

1. **Customer Decision Direct Conversion**: When customer approves on `/quotation/:token`, immediately emit a webhook / notification to assigned Sales Specialist and generate pending reservation order.
2. **Dynamic PDF Generation Polish**: Add customized cover pages, destination photo collage, and QR code linking directly to customer payment checkout.
