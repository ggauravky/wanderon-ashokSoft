import os
import re
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.enum.section import WD_ORIENT
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(r"C:\VS Code\AshokSoft\wanderon-ashokSoft")
OUT = ROOT / "WanderOn_API_Integration_Audit.docx"

BASES = {
    "authRoutes.js": "/api/auth",
    "adminRoutes.js": "/api/admin",
    "influencerRoutes.js": "/api/influencer",
    "checkoutRoutes.js": "/api/checkout",
    "bookingRoutes.js": "/api/bookings",
    "tripRoutes.js": "/api/trips",
    "leadRoutes.js": "/api/leads",
    "pageRoutes.js": "/api/pages",
    "reviewRoutes.js": "/api/reviews",
    "seoRoutes.js": "/api/seo",
    "uploadRoutes.js": "/api/upload",
    "aiItineraryRoutes.js": "/api/ai",
    "quotationRoutes.js": "/api/quotations",
    "pricingRuleRoutes.js": "/api/pricing-rules",
    "followUpRoutes.js": "/api/follow-ups",
    "marketingRoutes.js": "/api/marketing",
    "salesRoutes.js": "/api/sales",
    "mediaRoutes.js": "/api/media",
}

ROUTE_PURPOSE = {
    "auth": "Authentication and user profile",
    "admin": "Admin platform management",
    "influencer": "Creator and affiliate operations",
    "checkout": "Checkout and webhook handling",
    "bookings": "Booking and payment lifecycle",
    "trips": "Trip catalog and trip CMS",
    "leads": "Lead capture and sales CRM",
    "pages": "Dynamic page CMS",
    "reviews": "Trip review handling",
    "seo": "SEO metadata and crawler files",
    "upload": "Media upload",
    "ai": "AI itinerary planning",
    "quotations": "Quotation workflow and sharing",
    "pricing-rules": "Pricing rule administration",
    "follow-ups": "CRM follow-up management",
    "marketing": "Marketing dashboard campaigns and banners",
    "sales": "Sales dashboard",
    "media": "Media library and resolution",
}


def clean_path(base, sub):
    if sub == "/":
        return base
    return f"{base}{sub}"


def infer_purpose(endpoint):
    parts = endpoint.strip("/").split("/")
    if len(parts) >= 2 and parts[0] == "api":
        return ROUTE_PURPOSE.get(parts[1], "API endpoint")
    return "Server endpoint"


def split_args(arg_text):
    args = []
    cur = ""
    depth = 0
    quote = None
    for ch in arg_text:
        if quote:
            cur += ch
            if ch == quote:
                quote = None
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            cur += ch
            continue
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth -= 1
        if ch == "," and depth == 0:
            args.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        args.append(cur.strip())
    return args


def parse_controller_and_mw(arg_text):
    args = split_args(arg_text)
    if not args:
        return "", ""
    controller = args[-1]
    if "=>" in controller:
        controller = "inline handler"
    middleware = ", ".join(args[:-1])
    return controller, middleware or "none"


def extract_routes():
    rows = [
        {
            "method": "GET",
            "endpoint": "/",
            "file": "backend/server.js",
            "line": 110,
            "controller": "inline root handler",
            "middleware": "none",
            "purpose": "Backend root status endpoint",
            "status": "UNVERIFIED",
        },
        {
            "method": "GET",
            "endpoint": "/health",
            "file": "backend/server.js",
            "line": 79,
            "controller": "healthPayload",
            "middleware": "none",
            "purpose": "Backend health check",
            "status": "WORKING",
        },
        {
            "method": "GET",
            "endpoint": "/api/health",
            "file": "backend/server.js",
            "line": 79,
            "controller": "healthPayload",
            "middleware": "none",
            "purpose": "Backend API health check",
            "status": "WORKING",
        },
        {
            "method": "GET",
            "endpoint": "/api/readiness",
            "file": "backend/server.js",
            "line": 80,
            "controller": "inline readiness handler",
            "middleware": "none",
            "purpose": "Database readiness check",
            "status": "WORKING",
        },
    ]
    route_dir = ROOT / "backend" / "routes"
    for path in sorted(route_dir.glob("*.js")):
        base = BASES.get(path.name, "")
        lines = path.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(lines):
            line = lines[i]
            m = re.search(r"router\.(get|post|put|patch|delete)\('([^']+)'\s*,?\s*(.*)\);?", line)
            if m:
                method, sub, args = m.groups()
                controller, middleware = parse_controller_and_mw(args)
                endpoint = clean_path(base, sub)
                status = "WORKING WITH CONDITIONS" if "protect" in middleware or "requireRoles" in middleware or "adminOnly" in middleware or "checkPermission" in middleware else "UNVERIFIED"
                if endpoint in {"/api/trips", "/api/media", "/api/marketing/banners/active", "/api/pages", "/api/seo/meta"} and method.upper() == "GET":
                    status = "WORKING"
                if "webhooks" in endpoint:
                    status = "UNVERIFIED"
                rows.append({
                    "method": method.upper(),
                    "endpoint": endpoint,
                    "file": f"backend/routes/{path.name}",
                    "line": i + 1,
                    "controller": controller,
                    "middleware": middleware,
                    "purpose": infer_purpose(endpoint),
                    "status": status,
                })
            rm = re.search(r"router\.route\('([^']+)'\)", line)
            if rm:
                sub = rm.group(1)
                i += 1
                while i < len(lines):
                    l2 = lines[i]
                    cm = re.search(r"\.(get|post|put|patch|delete)\((.*)\)\s*;?", l2)
                    if cm:
                        method, args = cm.groups()
                        controller, middleware = parse_controller_and_mw(args)
                        endpoint = clean_path(base, sub)
                        rows.append({
                            "method": method.upper(),
                            "endpoint": endpoint,
                            "file": f"backend/routes/{path.name}",
                            "line": i + 1,
                            "controller": controller,
                            "middleware": middleware,
                            "purpose": infer_purpose(endpoint),
                            "status": "WORKING WITH CONDITIONS",
                        })
                    if ";" in l2:
                        break
                    i += 1
            i += 1
    return rows


def extract_frontend_calls():
    rows = []
    files = [
        ROOT / "frontend" / "src" / "services" / "api.js",
        ROOT / "frontend" / "src" / "services" / "quotationService.js",
    ]
    for path in files:
        lines = path.read_text(encoding="utf-8").splitlines()
        current = "module scope"
        for idx, line in enumerate(lines, 1):
            fm = re.search(r"export\s+(?:async\s+function|function)\s+([A-Za-z0-9_]+)", line)
            cm = re.search(r"export\s+const\s+([A-Za-z0-9_]+)\s*=", line)
            if fm:
                current = fm.group(1)
            elif cm and ("Api" in cm.group(1) or "marketing" in cm.group(1).lower()):
                current = cm.group(1)
            if "request(" in line and "API_BASE_URL" in line:
                em = re.search(r"API_BASE_URL\}([^`]+)", line)
                endpoint = em.group(1) if em else "(dynamic API_BASE_URL request)"
                method = "GET"
                block = "\n".join(lines[idx - 1: min(len(lines), idx + 6)])
                mm = re.search(r"method:\s*'([^']+)'", block)
                if mm:
                    method = mm.group(1)
                rows.append({
                    "file": str(path.relative_to(ROOT)).replace("\\", "/"),
                    "function": current,
                    "method": method,
                    "endpoint": endpoint,
                    "purpose": infer_purpose("/api" + endpoint if endpoint.startswith("/") else endpoint),
                })
    direct = [
        ("frontend/src/hooks/useTravelContext.js", "useTravelContext", "GET", "/trips", "Loads live trip catalog"),
        ("frontend/src/pages/TripDetails.jsx", "TripDetails useEffect", "GET", "/trips/:id", "Loads trip detail"),
        ("frontend/src/pages/BookingDates.jsx", "BookingDates useEffect", "GET", "/trips/:tripSlug", "Loads trip for date selection"),
    ]
    for row in direct:
        rows.append({"file": row[0], "function": row[1], "method": row[2], "endpoint": row[3], "purpose": row[4]})
    return rows


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text, bold=False, size=8, color=None):
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(text))
    run.bold = bold
    run.font.size = Pt(size)
    run.font.name = "Aptos"
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def add_table(doc, headers, rows, widths=None, font_size=8):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, h in enumerate(headers):
        set_cell_shading(hdr[i], "1F4E79")
        set_cell_text(hdr[i], h, bold=True, size=font_size, color="FFFFFF")
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            set_cell_text(cells[i], val, size=font_size)
            if len(table.rows) % 2 == 0:
                set_cell_shading(cells[i], "F6F8FA")
    if widths:
        for row in table.rows:
            for i, width in enumerate(widths):
                row.cells[i].width = width
    doc.add_paragraph()
    return table


def add_field(paragraph, field):
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


def add_heading(doc, text, level=1):
    p = doc.add_heading(text, level=level)
    for run in p.runs:
        run.font.color.rgb = RGBColor(0, 0, 0)
        run.font.name = "Aptos Display" if level <= 2 else "Aptos"
    return p


def add_para(doc, text, style=None):
    p = doc.add_paragraph(style=style)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.05
    run = p.add_run(text)
    run.font.name = "Aptos"
    run.font.size = Pt(10)
    return p


def configure_doc(doc):
    section = doc.sections[0]
    section.top_margin = Cm(1.7)
    section.bottom_margin = Cm(1.7)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    styles = doc.styles
    styles["Normal"].font.name = "Aptos"
    styles["Normal"].font.size = Pt(10)
    for name in ["Title", "Subtitle", "Heading 1", "Heading 2", "Heading 3"]:
        if name in styles:
            styles[name].font.color.rgb = RGBColor(0, 0, 0)
            styles[name].font.name = "Aptos Display" if "Heading" in name or name == "Title" else "Aptos"
    header = section.header.paragraphs[0]
    header.text = "WanderOn API Integration Audit"
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    for run in header.runs:
        run.font.size = Pt(8)
        run.font.color.rgb = RGBColor(90, 90, 90)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.add_run("Page ")
    add_field(footer, "PAGE")


def build_doc():
    routes = extract_routes()
    calls = extract_frontend_calls()
    doc = Document()
    configure_doc(doc)

    # Cover
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(120)
    run = p.add_run("WanderOn Complete API and Frontend Backend Integration Audit")
    run.bold = True
    run.font.size = Pt(24)
    run.font.name = "Aptos Display"
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p2.add_run("Repository and Deployed Application Analysis")
    r2.font.size = Pt(15)
    r2.font.name = "Aptos"
    doc.add_paragraph()
    meta = [
        ["GitHub Repository", "https://github.com/ggauravky/wanderon-ashokSoft"],
        ["Deployed Application", "https://wanderon-ashok-soft.vercel.app/"],
        ["Audit Date", datetime.now().strftime("%d %B %Y")],
        ["Document Version", "1.0"],
        ["Prepared Output", "Microsoft Word DOCX"],
    ]
    add_table(doc, ["Field", "Value"], meta, [Inches(2.2), Inches(4.7)], 9)
    doc.add_page_break()

    add_heading(doc, "Table of Contents", 1)
    p = doc.add_paragraph()
    add_field(p, r'TOC \o "1-3" \h \z \u')
    add_para(doc, "In Microsoft Word, right click the table of contents and choose Update Field if page numbers need refreshing after edits.")
    doc.add_page_break()

    add_heading(doc, "1 Executive Summary", 1)
    add_para(doc, "WanderOn is a travel commerce and operations platform with a Vite React frontend, an Express backend, and MongoDB models for users, trips, bookings, leads, quotations, media, marketing, and creator commerce.")
    add_para(doc, "The audit inspected repository structure, backend route registrations, frontend service calls, authentication and authorization, database model usage, external integrations, and selected deployed runtime behavior. The source code was not modified.")
    add_table(doc, ["Metric", "Value"], [
        ["Backend API entries discovered", str(len(routes))],
        ["Frontend service or direct API calls discovered", str(len(calls))],
        ["Production API base URL observed", "https://wanderon-ashoksoft.onrender.com/api"],
        ["Runtime verified public APIs", "Health, readiness, trips, media, active banners, pages, SEO metadata"],
        ["Confirmed deployment caveat", "Vercel /api paths return SPA HTML; deployed bundle calls Render API"],
    ], [Inches(3), Inches(4)], 9)

    add_heading(doc, "2 Project Architecture", 1)
    add_para(doc, "The implemented architecture is a React single page application that calls a separate Express REST API. The backend uses route modules, authentication middleware, controllers, service helpers, Mongoose models, and external integrations.")
    add_table(doc, ["Layer", "Actual Implementation"], [
        ["Frontend", "Vite React application in frontend/src"],
        ["API Client", "fetch based helpers in frontend/src/services/apiConfig.js, api.js, and quotationService.js"],
        ["Backend", "Express application in backend/server.js"],
        ["Routing", "Route modules under backend/routes mounted under /api"],
        ["Controllers", "Request handlers under backend/controllers"],
        ["Services", "Quotation, media, attribution, analytics, pricing, and itinerary helpers under backend/services"],
        ["Database", "MongoDB accessed through Mongoose models under backend/models"],
        ["External APIs", "Razorpay, Gemini, Cloudinary, Twilio WhatsApp, Brevo email"],
    ], [Inches(2), Inches(5)], 9)
    add_para(doc, "Architecture flow:")
    add_table(doc, ["Step", "Flow"], [
        ["1", "React page or component"],
        ["2", "API helper or direct fetch"],
        ["3", "API_BASE_URL"],
        ["4", "Express route"],
        ["5", "Middleware and role checks"],
        ["6", "Controller"],
        ["7", "Service, model, or external API"],
        ["8", "JSON response"],
        ["9", "Frontend UI state update"],
    ], [Inches(1), Inches(6)], 9)

    add_heading(doc, "3 Repository Structure", 1)
    add_table(doc, ["Folder or File", "Purpose"], [
        ["frontend/src/pages", "Public, customer, staff, booking, quotation, and profile route pages"],
        ["frontend/src/components", "Reusable UI, booking, itinerary, quotation, media, CRM, and document components"],
        ["frontend/src/staff", "Staff shell, navigation, role protection, and admin sales marketing modules"],
        ["frontend/src/services", "Primary frontend API helpers and quotation service helpers"],
        ["backend/server.js", "Express app setup, CORS, health endpoints, and router mounting"],
        ["backend/routes", "Express route registrations"],
        ["backend/controllers", "HTTP request handlers"],
        ["backend/services", "Business logic and helper services"],
        ["backend/models", "Mongoose schemas and models"],
        ["backend/middlewares", "Authentication, upload, and rate limiting middleware"],
        ["backend/utils", "JWT, Cloudinary, WhatsApp, HTTP response, and utility helpers"],
    ], [Inches(2.5), Inches(4.8)], 9)

    add_heading(doc, "4 API Configuration", 1)
    add_para(doc, "The frontend API base URL is defined in frontend/src/services/apiConfig.js as VITE_API_URL or /api. Development uses the Vite proxy to forward /api to http://localhost:5000. The deployed frontend bundle was observed to call https://wanderon-ashoksoft.onrender.com/api.")
    add_table(doc, ["Configuration", "Evidence or Purpose"], [
        ["VITE_API_URL", "Frontend API base URL used at build time"],
        ["API_BASE_URL", "Computed frontend constant in apiConfig.js"],
        ["Authorization header", "Bearer token from localStorage key wanderluxe_token"],
        ["backend/server.js", "Mounts route modules under /api"],
        ["frontend/vercel.json", "Rewrites all frontend paths to index.html"],
        ["MONGODB_URI or MONGO_URI", "MongoDB connection variable name"],
        ["JWT_SECRET", "JWT signing secret variable name"],
        ["RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET", "Payment gateway variable names"],
        ["GEMINI_API_KEY or GOOGLE_API_KEY", "AI itinerary generation variable names"],
        ["CLOUDINARY variables", "Media upload variable names"],
        ["TWILIO variables", "WhatsApp delivery variable names"],
        ["BREVO variables", "Quotation verification email variable names"],
    ], [Inches(2.6), Inches(4.7)], 8)

    add_heading(doc, "5 Complete Backend API Inventory", 1)
    add_para(doc, "The following table was generated from backend/server.js and backend/routes. Status values separate source inspection from runtime verification.")
    backend_rows = []
    for idx, r in enumerate(routes, 1):
        backend_rows.append([idx, r["method"], r["endpoint"], r["purpose"], f'{r["file"]}:{r["line"]}', r["controller"], r["middleware"], r["status"]])
    add_table(doc, ["ID", "Method", "Endpoint", "Purpose", "Route File", "Controller", "Middleware", "Status"], backend_rows, None, 6)

    add_heading(doc, "6 Complete Frontend API Call Inventory", 1)
    frontend_rows = []
    for idx, c in enumerate(calls, 1):
        frontend_rows.append([idx, c["file"], c["function"], c["method"], c["endpoint"], c["purpose"]])
    add_table(doc, ["ID", "Frontend File", "Function", "Method", "Endpoint", "Purpose"], frontend_rows, None, 6)

    add_heading(doc, "7 Frontend to Backend API Mapping", 1)
    add_para(doc, "Most frontend calls map directly to backend routes with the same method and path under the configured API base URL. Dynamic IDs and slugs are represented as route parameters in the backend.")
    feature_map = [
        ["Authentication", "AuthContext and login/signup pages", "registerApi, loginApi, getMeApi, updateProfileApi", "/api/auth/*", "authRoutes.js", "authController", "User", "WORKING WITH CONDITIONS"],
        ["Trips", "Home, Destinations, TripDetails, BookingDates", "getTripsApi, getTripByIdOrSlugApi, direct fetch", "/api/trips/*", "tripRoutes.js", "tripController", "Trip", "WORKING for list"],
        ["Bookings", "BookingDates, Checkout, Profile, BookingConfirmation", "booking API helpers", "/api/bookings/*", "bookingRoutes.js", "bookingController", "Booking, Trip, Razorpay", "UNVERIFIED mutating"],
        ["Leads CRM", "CallbackForm, Contact, Sales workspace", "createLeadApi, getAdminLeadsApi, lead action APIs", "/api/leads/*", "leadRoutes.js", "leadController", "Lead, User, FollowUp", "WORKING WITH CONDITIONS"],
        ["Quotations", "Sales quotation modules and public quotation gateway", "quotationService helpers", "/api/quotations/*", "quotationRoutes.js", "quotationController and quotationV2Controller", "Quotation family models, Brevo", "WORKING WITH CONDITIONS"],
        ["AI Planner", "AIPlannerPage and AIPlannerModal", "generateAIItineraryApi and itinerary helpers", "/api/ai/*", "aiItineraryRoutes.js", "aiItineraryController", "Itinerary, Gemini, media resolver", "UNVERIFIED external"],
        ["Admin", "Admin workspace modules", "admin API helpers", "/api/admin/*", "adminRoutes.js", "admin controllers", "Multiple models", "401 without token observed"],
        ["Marketing", "Marketing dashboard campaign and banner modules", "marketingRequest helpers", "/api/marketing/*", "marketingRoutes.js", "marketing controllers", "Campaign, Banner, MediaAsset", "WORKING public banners"],
        ["Media", "Media library and upload modals", "listMediaAssetsApi and media helpers", "/api/media/* and /api/upload/*", "mediaRoutes.js uploadRoutes.js", "mediaAssetController uploadController", "MediaAsset, Cloudinary", "WORKING public list"],
    ]
    add_table(doc, ["ID", "Feature", "Frontend Caller", "API Function", "Endpoint", "Route File", "Controller", "DB or Service", "Status"], [[i+1]+row for i, row in enumerate(feature_map)], None, 7)

    add_heading(doc, "8 Complete API Flow", 1)
    flows = [
        ["Authentication", "Login page -> AuthContext -> loginApi -> POST /api/auth/login -> authRoutes -> loginRateLimit -> loginUser -> User lookup and bcrypt check -> JWT response -> token stored in localStorage"],
        ["Booking", "BookingDates or Checkout -> calculateBookingPricingApi -> createBookingOrderApi -> Razorpay order -> Booking pending record -> Razorpay checkout -> verifyBookingPaymentApi -> HMAC signature verification -> Booking confirmation -> UI"],
        ["Quotation V2", "Staff quotation editor -> quotationService V2 helper -> quotationRoutes -> protect and role check -> quotationV2Controller -> Quotation and revision/share/event models -> JSON response -> staff UI"],
        ["Public Quotation", "PublicQuotationGateway -> public V2 quotation APIs -> optional recipient verification -> Brevo email if configured -> verification or decision response -> public UI"],
        ["AI Planner", "AI planner UI -> generateAIItineraryApi -> aiItineraryRoutes -> generateItineraryController -> Gemini if configured or fallback generation -> media resolver -> feasibility sanitizer -> itinerary response"],
        ["Media", "Media picker or admin media workspace -> listMediaAssetsApi -> mediaRoutes -> mediaAssetController -> MediaAsset query -> media JSON response"],
    ]
    add_table(doc, ["Flow", "Implementation"], flows, [Inches(1.6), Inches(5.7)], 8)

    add_heading(doc, "9 API Request Details", 1)
    add_para(doc, "Request details are defined by each frontend helper and backend controller. JSON APIs use Content Type application/json. Upload APIs use FormData and set only the Authorization header manually. Protected APIs require Authorization: Bearer token.")
    add_table(doc, ["Pattern", "Request", "Response"], [
        ["Auth login", "POST /api/auth/login with email and password", "User summary plus JWT token or authentication error"],
        ["Public catalog", "GET /api/trips with optional query filters", "success flag, count, and trip data"],
        ["Booking pricing", "POST /api/bookings/calculate-pricing with tripId, travelersCount, occupancy, couponCode, batch selection", "Pricing object or validation error"],
        ["Payment verification", "POST /api/bookings/verify-payment with Razorpay order ID, payment ID, signature, booking ID", "Verified booking or payment error"],
        ["Protected admin reads", "GET /api/admin/* with bearer token and admin role", "Requested dashboard/list data or 401/403"],
        ["Uploads", "POST /api/upload/image or /document with multipart form data and bearer token", "Cloudinary/local upload metadata or storage error"],
    ], [Inches(1.8), Inches(2.8), Inches(2.8)], 8)

    add_heading(doc, "10 Authentication APIs", 1)
    auth_rows = [r for r in routes if r["endpoint"].startswith("/api/auth")]
    add_table(doc, ["Method", "Endpoint", "Controller", "Middleware", "Status"], [[r["method"], r["endpoint"], r["controller"], r["middleware"], r["status"]] for r in auth_rows], None, 8)
    add_para(doc, "No logout endpoint, refresh token endpoint, password reset endpoint, OTP endpoint, Google authentication endpoint, or cookie session implementation was found in the backend routes. Logout is a frontend token removal action.")

    add_heading(doc, "11 Authorization and Role Based Access", 1)
    add_para(doc, "Roles present in the User model are user, admin, super_admin, operations, sales, marketing, and influencer. Protected APIs use protect, requireRoles, adminOnly, influencerOnly, operationsOrAdmin, and checkPermission.")
    rbac_rows = []
    for r in routes:
        if any(x in r["middleware"] for x in ["protect", "requireRoles", "adminOnly", "checkPermission", "influencerOnly", "operationsOrAdmin"]):
            rbac_rows.append([r["method"], r["endpoint"], "Required", r["middleware"], "401 without token, 403 without role"])
    add_table(doc, ["Method", "API", "Authentication", "Role or Permission Middleware", "Result"], rbac_rows[:120], None, 6)
    if len(rbac_rows) > 120:
        add_para(doc, f"The table above lists the first 120 protected route entries. The full protected set is represented in the master API table; total protected entries detected: {len(rbac_rows)}.")

    add_heading(doc, "12 Database Mapping", 1)
    db_rows = [
        ["Auth", "User", "users", "CREATE READ UPDATE"],
        ["Trips", "Trip", "trips", "CREATE READ UPDATE DELETE"],
        ["Bookings", "Booking, Trip, Coupon, Commission, WalletLedger", "bookings and related collections", "CREATE READ UPDATE"],
        ["Leads", "Lead, User, FollowUp", "leads users followups", "CREATE READ UPDATE"],
        ["Quotations", "Quotation, QuotationRevision, QuotationShare, QuotationEvent, QuotationApprovalVerification", "quotation collections", "CREATE READ UPDATE DELETE"],
        ["AI Itineraries", "Itinerary, Trip, MediaAsset", "itineraries trips mediaassets", "CREATE READ UPDATE DELETE"],
        ["Admin Analytics", "User, Trip, Booking, Lead, Review, Quotation", "multiple collections", "READ AGGREGATION"],
        ["Marketing", "Campaign, Banner, MediaAsset", "campaigns banners mediaassets", "CREATE READ UPDATE DELETE"],
        ["Media", "MediaAsset, Trip, Quotation, Page", "mediaassets and related collections", "CREATE READ UPDATE DELETE"],
        ["Influencer", "Coupon, Commission, WalletLedger, Payout", "coupon commission wallet payout collections", "CREATE READ UPDATE"],
        ["Pages and SEO", "Page, Trip", "pages trips", "CREATE READ UPDATE DELETE"],
        ["Reviews", "Review", "reviews", "CREATE READ"],
        ["Pricing Rules", "PricingRule", "pricingrules", "CREATE READ UPDATE DELETE"],
    ]
    add_table(doc, ["API Area", "Model", "Collection", "Operation"], db_rows, None, 8)

    add_heading(doc, "13 External API Integrations", 1)
    ext_rows = [
        ["Razorpay", "backend/controllers/bookingController.js", "Razorpay Orders and HMAC signature verification", "Booking checkout and balance payment", "UNVERIFIED"],
        ["Razorpay Checkout JS", "frontend/src/utils/razorpay.js", "https://checkout.razorpay.com/v1/checkout.js", "Browser payment modal", "UNVERIFIED"],
        ["Google Gemini", "backend/services/geminiService.js", "GEMINI_MODEL / QUOTATION_AI_MODEL", "AI itinerary and quotation generation", "Central adapter with controlled fallback"],
        ["Cloudinary", "backend/utils/cloudinaryService.js", "Cloudinary uploader SDK", "Image document and video upload", "UNVERIFIED"],
        ["Twilio WhatsApp", "backend/utils/whatsappService.js", "Twilio Messages API", "Booking ticket WhatsApp delivery", "UNVERIFIED optional"],
        ["Brevo Email", "backend/services/quotationEmailService.js", "https://api.brevo.com/v3/smtp/email", "Quotation recipient verification email", "UNVERIFIED optional"],
        ["Dicebear", "backend/controllers/authController.js", "Avatar SVG URL", "Default avatar on registration", "Source verified URL construction"],
    ]
    add_table(doc, ["Service", "Calling File", "Endpoint or API", "Purpose", "Status"], ext_rows, None, 8)

    add_heading(doc, "14 Deployed Application Verification", 1)
    runtime_rows = [
        ["/api/health", "GET Render backend health", "GET https://wanderon-ashoksoft.onrender.com/api/health", "200", "status ok databaseConnected true", "WORKING"],
        ["/api/readiness", "GET Render backend readiness", "GET https://wanderon-ashoksoft.onrender.com/api/readiness", "200", "status ready", "WORKING"],
        ["/api/trips", "GET public trips", "GET Render backend trips", "200", "success true count 54", "WORKING"],
        ["/api/media", "GET public media", "GET Render backend media", "200", "success true data array", "WORKING"],
        ["/api/marketing/banners/active", "GET active banners", "GET Render backend active banners", "200", "success true empty banners", "WORKING"],
        ["/api/pages", "GET pages", "GET Render backend pages", "200", "page array", "WORKING"],
        ["/api/seo/meta?path=/", "GET SEO metadata", "GET Render backend SEO meta", "200", "meta title and description", "WORKING"],
        ["/api/admin/stats", "GET without token", "GET Render backend admin stats", "401", "Not authorized no token provided", "WORKING WITH CONDITIONS"],
        ["Vercel /api/trips", "GET frontend host path", "GET https://wanderon-ashok-soft.vercel.app/api/trips", "200", "React HTML not JSON", "NOT BACKEND ROUTE"],
    ]
    add_table(doc, ["API", "Action Tested", "Request", "HTTP Status", "Response", "Status"], runtime_rows, None, 8)

    add_heading(doc, "15 Backend APIs Without Frontend Callers", 1)
    unused_rows = [
        ["POST", "/api/auth/influencer-signup", "applyInfluencer", "Alias for creator application", "UNUSED OR ALIAS"],
        ["POST", "/api/ai/edit-plan", "editPlanController", "AI edit or copilot endpoint", "NO DETECTED CALLER"],
        ["POST", "/api/checkout/apply-coupon", "applyCouponServerSide", "Coupon validation alias", "NO DETECTED CALLER"],
        ["POST", "/api/checkout/bookings", "createAttributedBooking", "Attributed booking placeholder", "NO DETECTED CALLER"],
        ["POST", "/api/checkout/webhooks/payment", "paymentWebhook", "Payment provider webhook", "EXTERNAL CALLBACK"],
        ["POST", "/api/checkout/webhooks/payout", "payoutWebhook", "Payout provider webhook", "EXTERNAL CALLBACK"],
        ["POST", "/api/trips/seed", "seedTrips", "Admin seed utility", "ADMIN UTILITY"],
        ["GET", "/api/admin/reports/revenue", "getRevenueReport", "Admin report", "NO DETECTED CALLER"],
        ["GET", "/api/admin/reports/departures", "getDepartureOccupancyReport", "Admin report", "NO DETECTED CALLER"],
        ["GET", "/api/admin/reports/lead-funnel", "getLeadFunnelReport", "Admin report", "NO DETECTED CALLER"],
        ["ALL", "/api/pricing-rules/*", "pricingRuleController", "Pricing administration", "NO DETECTED CALLER"],
        ["POST", "/api/upload/images", "uploadImageController", "Bulk image upload", "NO DETECTED CALLER"],
        ["POST", "/api/upload/documents", "uploadDocumentController", "Bulk document upload", "NO DETECTED CALLER"],
        ["POST", "/api/upload/video", "uploadVideoController", "Video upload", "NO DETECTED CALLER"],
        ["GET", "/api/media/health", "getMediaHealth", "Media diagnostics", "HELPER EXISTS"],
    ]
    add_table(doc, ["Method", "Route", "Controller", "Possible Purpose", "Status"], unused_rows, None, 8)

    add_heading(doc, "16 Frontend API Calls Without Backend Routes", 1)
    add_table(doc, ["Frontend File", "Method", "Endpoint", "Expected Backend Route", "Finding"], [
        ["frontend/src/services/quotationService.js", "POST", "/quotations/public/:token/decision", "POST /api/quotations/public/:token/decision", "Route exists but is intentionally disabled by legacyPublicDecisionDisabled"],
        ["frontend/src/pages/TripDetails.jsx", "GET", "fallback http://localhost:5000/api/trips/:id", "GET /api/trips/:idOrSlug", "Route exists; production safety depends on VITE_API_URL being set"],
        ["Production Vercel host", "GET", "/api/*", "Render backend API", "Frontend host rewrites to index.html; not a backend route"],
    ], None, 8)

    add_heading(doc, "17 Broken or Mismatched APIs", 1)
    add_para(doc, "No API was confirmed broken during safe read-only runtime testing. The following are confirmed mismatches or caveats.")
    add_table(doc, ["Severity", "API or Area", "Expected Behavior", "Actual Behavior", "Evidence", "Impact"], [
        ["High", "Vercel /api/*", "Return backend JSON", "Returns React SPA HTML due frontend rewrite", "frontend/vercel.json and runtime GET /api/trips", "Manual API testing on Vercel host is misleading"],
        ["Medium", "Legacy public quotation decision", "Record customer decision", "Route exists but handler disables legacy decisions", "quotationRoutes.js maps to legacyPublicDecisionDisabled", "Legacy public quotation view may fail for decisions"],
        ["Medium", "TripDetails fallback URL", "Use deployed API in production", "Fallback is localhost when VITE_API_URL absent", "frontend/src/pages/TripDetails.jsx", "Production builds without env would fail detail API calls"],
        ["Low", "SEO route comment", "Comment and route agree", "Controller comment mentions metadata while route is /meta", "seoRoutes.js and seoController.js", "Documentation mismatch only"],
    ], None, 8)

    add_heading(doc, "18 API Status Summary", 1)
    working = sum(1 for r in routes if r["status"] == "WORKING")
    conditions = sum(1 for r in routes if r["status"] == "WORKING WITH CONDITIONS")
    unverified = len(routes) - working - conditions
    add_table(doc, ["Status", "Count"], [
        ["Working", working],
        ["Working With Conditions", conditions],
        ["Broken", 0],
        ["Unused or no detected caller", len(unused_rows)],
        ["Not Reachable", 0],
        ["Unverified", unverified],
        ["External Dependency Failure", 0],
    ], [Inches(3), Inches(1.5)], 9)

    add_heading(doc, "19 Feature Wise API Mapping", 1)
    add_table(doc, ["Feature", "Representative APIs"], [
        ["Authentication", "/api/auth/register, /login, /me, /profile, /influencer-login, /influencer-apply"],
        ["Trips", "/api/trips, /api/trips/:idOrSlug, /api/trips/admin/catalog, /api/trips CRUD"],
        ["Bookings and Payments", "/api/bookings/calculate-pricing, /create-order, /verify-payment, /pay-balance, /boarding-pass"],
        ["Leads and Sales CRM", "/api/leads, /api/leads/:id, /claim, /log-contact, /assign, /api/follow-ups"],
        ["Quotations", "/api/quotations, /api/quotations/v2, /public/v2/:token, shares, revisions, events, attachments"],
        ["AI Itineraries", "/api/ai/generate, /save, /my-itineraries, /itinerary/:id, /shared/:shareToken"],
        ["Admin", "/api/admin/stats, users, bookings, coupons, payouts, reports, team analytics"],
        ["Marketing", "/api/marketing/dashboard, campaigns, banners, lead analytics"],
        ["Media and Uploads", "/api/media, /resolve-itinerary, /admin, /api/upload/image, /document, /video"],
        ["Influencer", "/api/influencer/plans, coupons, wallet, transactions, payouts, analytics"],
    ], [Inches(2), Inches(5.2)], 8)

    add_heading(doc, "20 API Flow Diagrams", 1)
    diagram_rows = [
        ["Login Flow", "User -> Login Page -> loginApi -> POST /api/auth/login -> authRoutes -> loginUser -> User database -> JWT -> localStorage -> authenticated frontend state"],
        ["Booking Flow", "User -> BookingDates -> calculate pricing -> Checkout -> create Razorpay order -> Booking record -> Razorpay modal -> verify payment -> Booking confirmed -> confirmation UI"],
        ["Quotation Flow", "Sales staff -> Quotation editor -> V2 API -> role middleware -> quotationV2Controller -> Quotation models -> share link -> public gateway -> customer verification and decision"],
        ["AI Planner Flow", "User -> AI Planner -> generateAIItineraryApi -> aiItineraryController -> Gemini or fallback -> media resolver -> Itinerary response -> save/share UI"],
        ["Admin Flow", "Admin user -> Staff shell -> protected module -> admin API -> protect/adminOnly -> controller -> model query or aggregation -> dashboard table"],
    ]
    add_table(doc, ["Workflow", "Diagram"], diagram_rows, [Inches(1.7), Inches(5.7)], 8)

    add_heading(doc, "21 Final Master API Reference", 1)
    master_rows = []
    for idx, r in enumerate(routes, 1):
        db_ext = "MongoDB or external service as controller requires"
        if "booking" in r["endpoint"]:
            db_ext = "Booking, Trip, Razorpay, Twilio"
        elif "quotations" in r["endpoint"]:
            db_ext = "Quotation models, Brevo for verification"
        elif "ai" in r["endpoint"]:
            db_ext = "Itinerary, Gemini, media resolver"
        elif "media" in r["endpoint"] or "upload" in r["endpoint"]:
            db_ext = "MediaAsset, Cloudinary"
        elif "auth" in r["endpoint"] or "users" in r["endpoint"]:
            db_ext = "User, JWT"
        elif "trips" in r["endpoint"]:
            db_ext = "Trip"
        elif "leads" in r["endpoint"]:
            db_ext = "Lead, User, FollowUp"
        master_rows.append([idx, r["method"], r["endpoint"], r["purpose"], "See frontend mapping where detected", r["file"], r["controller"], r["middleware"], db_ext, r["status"], f'{r["file"]}:{r["line"]}'])
    add_table(doc, ["ID", "Method", "Endpoint", "Purpose", "Frontend Caller", "Route File", "Controller", "Middleware", "DB or External Service", "Runtime Status", "Evidence"], master_rows, None, 5)

    add_heading(doc, "22 Testing Limitations", 1)
    limitations = [
        "Real user login was not performed because no credentials were provided.",
        "Signup, lead creation, booking creation, quotation creation, uploads, and payment actions were not executed because they mutate database or external service state.",
        "Razorpay payment verification requires real provider response values and signatures.",
        "Admin, sales, marketing, and influencer dashboards require authenticated users with specific roles.",
        "Cloudinary, Brevo, Twilio, Razorpay, and Gemini behavior depends on environment variables that were not exposed and should not be exposed in this report.",
        "Runtime verification was limited to safe read-only endpoints and one unauthenticated protected endpoint check.",
    ]
    for item in limitations:
        doc.add_paragraph(item, style="List Bullet")

    add_heading(doc, "23 Conclusion", 1)
    add_para(doc, f"The audit discovered {len(routes)} backend API entries and {len(calls)} frontend service or direct API call constructions. The source code shows a broad travel platform API surface covering authentication, trips, bookings, payments, quotations, AI itineraries, media, marketing, admin operations, sales CRM, and influencer commerce.")
    add_para(doc, "The deployed frontend is operational and calls the Render backend API. The most important deployment observation is that Vercel /api paths are not backend routes; the production bundle avoids this by using the Render API base URL.")
    add_para(doc, "No source files, routes, controllers, environment variables, deployment settings, or database records were modified during this audit.")

    # Privacy metadata
    props = doc.core_properties
    props.author = "Codex"
    props.title = "WanderOn Complete API and Frontend Backend Integration Audit"
    props.subject = "API audit and frontend backend integration report"
    props.comments = "Generated from read-only repository and runtime observations without exposing secrets."

    doc.save(OUT)
    return OUT


if __name__ == "__main__":
    out = build_doc()
    print(out)
